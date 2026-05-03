import { Injectable, NotFoundException } from '@nestjs/common';
import { ethers } from 'ethers';
import { triggerWorkflow } from '@aegis/keeper-client';
import { AttestationsService } from '../attestations/attestations.service';
import type { VerifyResponse, Verdict } from '@aegis/types';

const AEGIS_COURT_ABI = [
  'function submitDispute(bytes32 rootHash, string agentId, string reason)',
  'function recordVerdict(bytes32 rootHash, uint8 verdict, bytes teeProof)',
  'function getDispute(bytes32 rootHash) view returns (tuple(bytes32 rootHash, string agentId, address disputedBy, string reason, uint256 timestamp, uint8 verdict, bytes teeProof, bool exists, uint256 frozenAt, uint256 dataDeadline) dispute)',
  'function submitHistoricalData(bytes32 rootHash, bytes attestations)',
  'function getDisputeCount() view returns (uint256)',
];

const VERDICT_TO_UINT: Record<Verdict, number> = {
  PENDING: 0,
  CLEARED: 1,
  FLAGGED: 2,
  PENDING_DATA: 3,
};
const UINT_TO_VERDICT: Verdict[] = ['PENDING', 'CLEARED', 'FLAGGED', 'PENDING_DATA'];

const HIGH_RISK_ACTIONS = new Set([
  'emergency_liquidation',
  'drain',
  'full_withdrawal',
  'unauthorized_transfer',
  'rug',
  'self_destruct',
]);

const AMOUNT_LIMIT = parseFloat(process.env.AGENT_AMOUNT_LIMIT ?? '100');

function ruleBasedVerdict(action: Record<string, unknown>): Verdict {
  const type = String(action.type ?? '')
    .toLowerCase()
    .replace(/[- ]/g, '_');
  if (HIGH_RISK_ACTIONS.has(type)) return 'FLAGGED';
  const amount = parseFloat(String(action.amount ?? '0'));
  if (!isNaN(amount) && amount > AMOUNT_LIMIT) return 'FLAGGED';
  return 'CLEARED';
}

const ZG_EXPLORER = 'https://chainscan-galileo.0g.ai';

export interface FileDisputeDto {
  rootHash: string;
  agentId: string;
  reason: string;
}

export interface DisputeRecord {
  rootHash: string;
  agentId: string;
  reason: string;
  verdict: Verdict;
  teeProof: string;
  timestamp: number;
  submitTxHash?: string;
  recordTxHash?: string;
  explorerUrl?: string;
}

@Injectable()
export class DisputesService {
  private _court: ethers.Contract | null = null;
  private readonly verifierUrl: string;
  private readonly disputeLog: DisputeRecord[] = [];

  constructor(private readonly attestationsService: AttestationsService) {
    const verifierAxlPort = parseInt(process.env.AXL_VERIFIER_PORT ?? '9012', 10);
    this.verifierUrl =
      process.env.VERIFIER_MGMT_URL || `http://localhost:${verifierAxlPort + 1000}`;
  }

  private get court(): ethers.Contract {
    if (!this._court) {
      const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL!);
      const signer = new ethers.Wallet(process.env.ZG_PRIVATE_KEY!, provider);
      this._court = new ethers.Contract(process.env.AEGIS_COURT_ADDRESS!, AEGIS_COURT_ABI, signer);
    }
    return this._court;
  }

  async file(dto: FileDisputeDto): Promise<Record<string, unknown>> {
    const rootHashBytes = ethers.zeroPadValue(
      ethers.hexlify(ethers.toUtf8Bytes(dto.rootHash).slice(0, 32)),
      32
    );
    const rootHash32 =
      dto.rootHash.startsWith('0x') && dto.rootHash.length === 66 ? dto.rootHash : rootHashBytes;

    let submitTxHash = '';
    await this.court
      .submitDispute(rootHash32, dto.agentId, dto.reason)
      .then(async (tx: { hash: string; wait: () => Promise<unknown> }) => {
        submitTxHash = tx.hash;
        await tx.wait();
      })
      .catch(() => {});

    const knownItem = this.attestationsService.getLocalItem(dto.rootHash);

    let verification: VerifyResponse = {
      verdict: knownItem?.action ? ruleBasedVerdict(knownItem.action) : 'CLEARED',
      teeProof: '',
      rootHash: dto.rootHash,
    };

    try {
      const res = await fetch(`${this.verifierUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'VERIFY_DECISION',
          rootHash: dto.rootHash,
          agentId: dto.agentId,
        }),
      });
      if (res.ok) {
        const teeResult = (await res.json()) as VerifyResponse;
        if (teeResult.teeProof) {
          verification = teeResult;
        }
      }
    } catch {}

    let recordTxHash = '';
    if (verification.verdict !== 'PENDING') {
      const verdictUint = VERDICT_TO_UINT[verification.verdict];
      const teeProofBytes = ethers.toUtf8Bytes(verification.teeProof ?? '');
      await this.court
        .recordVerdict(rootHash32, verdictUint, teeProofBytes)
        .then(async (tx: { hash: string; wait: () => Promise<unknown> }) => {
          recordTxHash = tx.hash;
          await tx.wait();
        })
        .catch(() => {});
    }

    if ((verification.verdict === 'FLAGGED' || verification.verdict === 'CLEARED') && process.env.KEEPERHUB_WORKFLOW_ID) {
      await triggerWorkflow(process.env.KEEPERHUB_WORKFLOW_ID, {
        rootHash: dto.rootHash,
        agentId: dto.agentId,
        verdict: verification.verdict,
      }).catch(() => {});
    }

    const txHash = recordTxHash || submitTxHash;
    this.disputeLog.unshift({
      rootHash: dto.rootHash,
      agentId: dto.agentId,
      reason: dto.reason,
      verdict: verification.verdict,
      teeProof: verification.teeProof ?? '',
      timestamp: Date.now(),
      submitTxHash: submitTxHash || undefined,
      recordTxHash: recordTxHash || undefined,
      explorerUrl: txHash ? `${ZG_EXPLORER}/tx/${txHash}` : undefined,
    });
    if (this.disputeLog.length > 200) this.disputeLog.pop();

    return {
      rootHash: dto.rootHash,
      agentId: dto.agentId,
      verdict: verification.verdict,
      teeProof: verification.teeProof,
      submitTxHash: submitTxHash || undefined,
      recordTxHash: recordTxHash || undefined,
      explorerUrl: txHash ? `${ZG_EXPLORER}/tx/${txHash}` : undefined,
    };
  }

  listAll(): DisputeRecord[] {
    return this.disputeLog;
  }

  disputeCount(): number {
    return this.disputeLog.length;
  }

  getAgentReputation(agentId: string): {
    score: number;
    flaggedCount: number;
    clearedCount: number;
    lastVerdict: string;
  } {
    const relevant = this.disputeLog.filter((d) => d.agentId === agentId);
    const flagged = relevant.filter((d) => d.verdict === 'FLAGGED').length;
    const cleared = relevant.filter((d) => d.verdict === 'CLEARED').length;
    const score = Math.max(0, Math.min(100, 100 - flagged * 10 + cleared));
    return {
      score,
      flaggedCount: flagged,
      clearedCount: cleared,
      lastVerdict: relevant[0]?.verdict ?? 'PENDING',
    };
  }

  async get(rootHash: string): Promise<Record<string, unknown>> {
    const rootHash32 =
      rootHash.startsWith('0x') && rootHash.length === 66
        ? rootHash
        : ethers.zeroPadValue(ethers.hexlify(ethers.toUtf8Bytes(rootHash).slice(0, 32)), 32);

    let dispute: {
      exists: boolean;
      agentId: string;
      disputedBy: string;
      reason: string;
      timestamp: bigint;
      verdict: number;
      teeProof: string;
      frozenAt: bigint;
      dataDeadline: bigint;
    };
    try {
      dispute = await this.court.getDispute(rootHash32);
    } catch {
      throw new NotFoundException(`Dispute not found: ${rootHash}`);
    }

    if (!dispute.exists) throw new NotFoundException(`Dispute not found: ${rootHash}`);

    return {
      rootHash,
      agentId: dispute.agentId,
      disputedBy: dispute.disputedBy,
      reason: dispute.reason,
      timestamp: Number(dispute.timestamp),
      verdict: UINT_TO_VERDICT[dispute.verdict] ?? 'PENDING',
      teeProof: ethers.toUtf8String(dispute.teeProof),
      frozenAt: Number(dispute.frozenAt) || undefined,
      dataDeadline: Number(dispute.dataDeadline) || undefined,
    };
  }
}
