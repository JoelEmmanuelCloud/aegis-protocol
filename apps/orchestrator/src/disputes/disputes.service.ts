import { Injectable, NotFoundException, BadGatewayException } from '@nestjs/common';
import { ethers } from 'ethers';
import { triggerWorkflow } from '@aegis/keeper-client';
import type { VerifyResponse, Verdict } from '@aegis/types';

const AEGIS_COURT_ABI = [
  'function submitDispute(bytes32 rootHash, string agentId, string reason)',
  'function recordVerdict(bytes32 rootHash, uint8 verdict, bytes teeProof)',
  'function getDispute(bytes32 rootHash) view returns (tuple(bytes32 rootHash, string agentId, address disputedBy, string reason, uint256 timestamp, uint8 verdict, bytes teeProof, bool exists) dispute)',
  'function getDisputeCount() view returns (uint256)',
];

const VERDICT_TO_UINT: Record<Verdict, number> = {
  PENDING: 0,
  CLEARED: 1,
  FLAGGED: 2,
};

const UINT_TO_VERDICT: Verdict[] = ['PENDING', 'CLEARED', 'FLAGGED'];

export interface FileDisputeDto {
  rootHash: string;
  agentId: string;
  reason: string;
}

@Injectable()
export class DisputesService {
  private readonly court: ethers.Contract;
  private readonly verifierUrl: string;

  constructor() {
    const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL!);
    const signer = new ethers.Wallet(process.env.ZG_PRIVATE_KEY!, provider);
    this.court = new ethers.Contract(process.env.AEGIS_COURT_ADDRESS!, AEGIS_COURT_ABI, signer);
    const verifierAxlPort = parseInt(process.env.AXL_VERIFIER_PORT ?? '9012', 10);
    this.verifierUrl = `http://127.0.0.1:${verifierAxlPort + 1000}`;
  }

  async file(dto: FileDisputeDto): Promise<Record<string, unknown>> {
    const rootHashBytes = ethers.zeroPadValue(
      ethers.hexlify(ethers.toUtf8Bytes(dto.rootHash).slice(0, 32)),
      32
    );
    const rootHash32 =
      dto.rootHash.startsWith('0x') && dto.rootHash.length === 66 ? dto.rootHash : rootHashBytes;

    const submitTx = await this.court.submitDispute(rootHash32, dto.agentId, dto.reason);
    await submitTx.wait();

    const verifyResponse = await fetch(`${this.verifierUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'VERIFY_DECISION',
        rootHash: dto.rootHash,
        agentId: dto.agentId,
      }),
    });

    if (!verifyResponse.ok) {
      throw new BadGatewayException(`Verifier error: ${await verifyResponse.text()}`);
    }

    const verification = (await verifyResponse.json()) as VerifyResponse;
    const verdictUint = VERDICT_TO_UINT[verification.verdict];
    const teeProofBytes = ethers.toUtf8Bytes(verification.teeProof ?? '');

    const recordTx = await this.court.recordVerdict(rootHash32, verdictUint, teeProofBytes);
    await recordTx.wait();

    if (verification.verdict === 'FLAGGED' && process.env.KEEPERHUB_WORKFLOW_ID) {
      await triggerWorkflow(process.env.KEEPERHUB_WORKFLOW_ID, {
        rootHash: dto.rootHash,
        agentId: dto.agentId,
        verdict: verification.verdict,
      }).catch(() => {});
    }

    return {
      rootHash: dto.rootHash,
      agentId: dto.agentId,
      verdict: verification.verdict,
      teeProof: verification.teeProof,
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
    };
  }

  async count(): Promise<number> {
    const n: bigint = await this.court.getDisputeCount();
    return Number(n);
  }
}
