import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ServiceUnavailableException,
  OnModuleInit,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { readKVObject, writeKVObject } from '@aegis/0g-client';
import { setTextRecords } from '@aegis/ens-client';
import type { NetworkStats, AgentMandate } from '@aegis/types';

const AGENT_REGISTRY_ABI = [
  'function mint(address agentOwner, address builderAddress, string label, uint8 userPercent, uint8 builderPercent, tuple(string[] allowedActions, address[] allowedPairs, uint256 maxSingleTrade, uint256 maxDailyDrawdown, uint256 acceptableSlippage) mandate) returns (uint256 tokenId)',
  'function getAgent(uint256 tokenId) view returns (tuple(string ensName, bytes32 ensNode, string storageRoot, address builderAddress, tuple(uint8 userPercent, uint8 builderPercent) split, bool active, uint256 mintedAt, tuple(string[] allowedActions, address[] allowedPairs, uint256 maxSingleTrade, uint256 maxDailyDrawdown, uint256 acceptableSlippage) mandate) record)',
  'function getTokenByEnsLabel(string label) view returns (uint256 tokenId)',
  'function getMandate(uint256 tokenId) view returns (tuple(string[] allowedActions, address[] allowedPairs, uint256 maxSingleTrade, uint256 maxDailyDrawdown, uint256 acceptableSlippage) mandate)',
  'function updateReputation(uint256 tokenId, string reputation, string totalDecisions, string lastVerdict, string flaggedCount)',
  'function getOwnerTokenIds(address agentOwner) view returns (uint256[])',
  'event AgentMinted(uint256 indexed tokenId, address indexed owner, string ensName, bytes32 ensNode, uint8 userPercent, uint8 builderPercent)',
  'event AgentRegistered(uint256 indexed tokenId, address indexed owner, string ensName, bytes32 ensNode)',
  'error InvalidSplit()',
  'error EnsNameTaken()',
  'error TokenNotFound()',
];

export interface RegisterAgentDto {
  agentOwner: string;
  builderAddress: string;
  label: string;
  userPercent: number;
  builderPercent: number;
  signature: string;
  mandate?: {
    allowed_actions?: string[];
    allowed_pairs?: string[];
    max_single_trade?: number;
    max_daily_drawdown?: number;
    acceptable_slippage?: number;
  };
}

@Injectable()
export class AgentsService implements OnModuleInit {
  private _registry: ethers.Contract | null = null;
  private _readRegistry: ethers.Contract | null = null;
  private _activeAgentCount = 0;

  private get registry(): ethers.Contract {
    if (!this._registry) {
      const address = process.env.AGENT_REGISTRY_ADDRESS;
      if (!address || !ethers.isAddress(address)) {
        throw new ServiceUnavailableException(
          'AGENT_REGISTRY_ADDRESS is not configured — run npm run deploy from the contracts directory'
        );
      }
      const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL!);
      const signer = new ethers.Wallet(process.env.ZG_PRIVATE_KEY!, provider);
      this._registry = new ethers.Contract(address, AGENT_REGISTRY_ABI, signer);
    }
    return this._registry;
  }

  private get readRegistry(): ethers.Contract {
    if (!this._readRegistry) {
      const address = process.env.AGENT_REGISTRY_ADDRESS;
      if (!address || !ethers.isAddress(address)) {
        throw new ServiceUnavailableException(
          'AGENT_REGISTRY_ADDRESS is not configured — run npm run deploy from the contracts directory'
        );
      }
      const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL!);
      this._readRegistry = new ethers.Contract(address, AGENT_REGISTRY_ABI, provider);
    }
    return this._readRegistry;
  }

  private _recentAgents: Array<{
    tokenId: string;
    ensName: string;
    owner: string;
    mintedAt: number;
  }> = [];

  async onModuleInit(): Promise<void> {
    try {
      const filter = this.readRegistry.filters.AgentMinted();
      const events = await this.readRegistry.queryFilter(filter, 0, 'latest');
      this._activeAgentCount = events.length;
      this._recentAgents = events
        .slice()
        .reverse()
        .slice(0, 50)
        .map((e) => {
          const parsed = this.readRegistry.interface.parseLog({
            topics: e.topics as string[],
            data: e.data,
          });
          return {
            tokenId: parsed?.args.tokenId?.toString() ?? '',
            ensName: parsed?.args.ensName ?? '',
            owner: parsed?.args.owner ?? '',
            mintedAt: 0,
          };
        })
        .filter((a) => a.ensName);
    } catch {
      this._activeAgentCount = 0;
      this._recentAgents = [];
    }
  }

  getActiveAgentCount(): number {
    return this._activeAgentCount;
  }

  getRecent(limit = 20) {
    return this._recentAgents.slice(0, limit);
  }

  async register(
    dto: RegisterAgentDto
  ): Promise<{ tokenId: string; ensName: string; txHash: string }> {
    const message = `Aegis Protocol: Register agent "${dto.label}" for ${dto.agentOwner}`;
    const recovered = ethers.verifyMessage(message, dto.signature);
    if (recovered.toLowerCase() !== dto.agentOwner.toLowerCase()) {
      throw new UnauthorizedException('Signature does not match agentOwner address');
    }

    if (dto.userPercent + dto.builderPercent !== 100) {
      throw new BadRequestException('userPercent + builderPercent must equal 100');
    }

    const mandate = {
      allowedActions: dto.mandate?.allowed_actions ?? ['trade', 'swap', 'buy', 'sell'],
      allowedPairs: dto.mandate?.allowed_pairs ?? [],
      maxSingleTrade: BigInt(Math.floor(dto.mandate?.max_single_trade ?? 1_000_000)),
      maxDailyDrawdown: BigInt(Math.floor(dto.mandate?.max_daily_drawdown ?? 10_000_000)),
      acceptableSlippage: BigInt(Math.floor(dto.mandate?.acceptable_slippage ?? 500)),
    };

    let tx: ethers.ContractTransactionResponse;
    try {
      tx = await this.registry.mint(
        dto.agentOwner,
        dto.builderAddress,
        dto.label,
        dto.userPercent,
        dto.builderPercent,
        mandate
      );
    } catch (err) {
      const decoded = this.decodeContractError(err);
      if (decoded === 'EnsNameTaken') {
        throw new ConflictException(`The label "${dto.label}" is already registered`);
      }
      throw err;
    }
    const receipt = await tx.wait();
    if (!receipt) throw new Error('Transaction dropped — no receipt returned');

    const log = receipt.logs
      .map((l: ethers.Log) => {
        try {
          return this.registry.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .find((e: ethers.LogDescription | null) => e?.name === 'AgentMinted');

    const tokenId: bigint = log?.args.tokenId ?? 0n;
    const ensName = `${dto.label}.aegis.eth`;

    this._activeAgentCount++;

    void (async () => {
      const stats = await readKVObject<NetworkStats>('aegis:network:stats').catch(() => null);
      writeKVObject('aegis:network:stats', {
        totalAttestations: stats?.totalAttestations ?? 0,
        disputes: stats?.disputes ?? 0,
        activeAgents: this._activeAgentCount,
      }).catch(() => {});
    })();

    setTextRecords(ensName, {
      'agent.registry': process.env.AGENT_REGISTRY_ADDRESS ?? '',
      'agent.id': tokenId.toString(),
      'aegis.reputation': '100',
      'aegis.totalDecisions': '0',
      'aegis.lastVerdict': 'CLEARED',
      'aegis.flaggedCount': '0',
    }).catch(() => {});

    return { tokenId: tokenId.toString(), ensName, txHash: receipt.hash };
  }

  async getByLabel(label: string): Promise<Record<string, unknown>> {
    const tokenId: bigint = await this.readRegistry.getTokenByEnsLabel(label);
    if (tokenId === 0n) throw new NotFoundException(`Agent '${label}' not found`);

    const record = await this.readRegistry.getAgent(tokenId);
    return {
      tokenId: tokenId.toString(),
      ensName: record.ensName,
      storageRoot: record.storageRoot,
      builderAddress: record.builderAddress,
      userPercent: Number(record.split.userPercent),
      builderPercent: Number(record.split.builderPercent),
      active: record.active,
      mintedAt: Number(record.mintedAt),
      mandate: {
        allowed_actions: Array.from(record.mandate.allowedActions as string[]),
        allowed_pairs: Array.from(record.mandate.allowedPairs as string[]),
        max_single_trade: Number(record.mandate.maxSingleTrade),
        max_daily_drawdown: Number(record.mandate.maxDailyDrawdown),
        acceptable_slippage: Number(record.mandate.acceptableSlippage),
      } as AgentMandate,
    };
  }

  async getByOwner(ownerAddress: string): Promise<Record<string, unknown>[]> {
    const tokenIds: bigint[] = await this.readRegistry.getOwnerTokenIds(ownerAddress);
    const agents = await Promise.all(
      tokenIds.map(async (id) => {
        const record = await this.readRegistry.getAgent(id);
        return {
          tokenId: id.toString(),
          ensName: record.ensName,
          storageRoot: record.storageRoot,
          builderAddress: record.builderAddress,
          userPercent: Number(record.split.userPercent),
          builderPercent: Number(record.split.builderPercent),
          active: record.active,
          mintedAt: Number(record.mintedAt),
          mandate: {
            allowed_actions: Array.from(record.mandate.allowedActions as string[]),
            allowed_pairs: Array.from(record.mandate.allowedPairs as string[]),
            max_single_trade: Number(record.mandate.maxSingleTrade),
            max_daily_drawdown: Number(record.mandate.maxDailyDrawdown),
            acceptable_slippage: Number(record.mandate.acceptableSlippage),
          } as AgentMandate,
        };
      })
    );
    return agents;
  }

  async updateReputation(
    label: string,
    reputation: string,
    totalDecisions: string,
    lastVerdict: string,
    flaggedCount: string
  ): Promise<void> {
    const tokenId: bigint = await this.registry.getTokenByEnsLabel(label);
    if (tokenId === 0n) throw new NotFoundException(`Agent '${label}' not found`);

    const tx = await this.registry.updateReputation(
      tokenId,
      reputation,
      totalDecisions,
      lastVerdict,
      flaggedCount
    );
    await tx.wait();
  }

  private decodeContractError(err: unknown): string | null {
    try {
      const data: string =
        (err as { data?: string })?.data ??
        (err as { error?: { data?: string } })?.error?.data ??
        '';
      if (!data) return null;
      return this.registry.interface.parseError(data)?.name ?? null;
    } catch {
      return null;
    }
  }
}
