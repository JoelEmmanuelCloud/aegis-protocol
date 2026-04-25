import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ethers } from 'ethers';
import { readKVObject, writeKVObject } from '@aegis/0g-client';
import type { NetworkStats } from '@aegis/types';

const AGENT_REGISTRY_ABI = [
  'function mint(address agentOwner, address builderAddress, string label, uint8 userPercent, uint8 builderPercent) returns (uint256 tokenId)',
  'function getAgent(uint256 tokenId) view returns (tuple(string ensName, bytes32 ensNode, string storageRoot, address builderAddress, tuple(uint8 userPercent, uint8 builderPercent) split, bool active, uint256 mintedAt) record)',
  'function getTokenByEnsLabel(string label) view returns (uint256 tokenId)',
  'function updateReputation(uint256 tokenId, string reputation, string totalDecisions, string lastVerdict, string flaggedCount)',
  'function getOwnerTokenIds(address agentOwner) view returns (uint256[])',
];

export interface RegisterAgentDto {
  agentOwner: string;
  builderAddress: string;
  label: string;
  userPercent: number;
  builderPercent: number;
}

@Injectable()
export class AgentsService {
  private readonly registry: ethers.Contract;

  constructor() {
    const provider = new ethers.JsonRpcProvider(process.env.ZG_RPC_URL!);
    const signer = new ethers.Wallet(process.env.ZG_PRIVATE_KEY!, provider);
    this.registry = new ethers.Contract(
      process.env.AGENT_REGISTRY_ADDRESS!,
      AGENT_REGISTRY_ABI,
      signer
    );
  }

  async register(
    dto: RegisterAgentDto
  ): Promise<{ tokenId: string; ensName: string; txHash: string }> {
    if (dto.userPercent + dto.builderPercent !== 100) {
      throw new BadRequestException('userPercent + builderPercent must equal 100');
    }

    const tx = await this.registry.mint(
      dto.agentOwner,
      dto.builderAddress,
      dto.label,
      dto.userPercent,
      dto.builderPercent
    );
    const receipt = await tx.wait();

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

    const stats = await readKVObject<NetworkStats>('aegis:network:stats');
    await writeKVObject('aegis:network:stats', {
      totalAttestations: stats?.totalAttestations ?? 0,
      disputes: stats?.disputes ?? 0,
      activeAgents: (stats?.activeAgents ?? 0) + 1,
    }).catch(() => {});

    return { tokenId: tokenId.toString(), ensName, txHash: receipt.hash };
  }

  async getByLabel(label: string): Promise<Record<string, unknown>> {
    const tokenId: bigint = await this.registry.getTokenByEnsLabel(label);
    if (tokenId === 0n) throw new NotFoundException(`Agent '${label}' not found`);

    const record = await this.registry.getAgent(tokenId);
    return {
      tokenId: tokenId.toString(),
      ensName: record.ensName,
      storageRoot: record.storageRoot,
      builderAddress: record.builderAddress,
      userPercent: Number(record.split.userPercent),
      builderPercent: Number(record.split.builderPercent),
      active: record.active,
      mintedAt: Number(record.mintedAt),
    };
  }

  async getByOwner(ownerAddress: string): Promise<Record<string, unknown>[]> {
    const tokenIds: bigint[] = await this.registry.getOwnerTokenIds(ownerAddress);
    const agents = await Promise.all(
      tokenIds.map(async (id) => {
        const record = await this.registry.getAgent(id);
        return {
          tokenId: id.toString(),
          ensName: record.ensName,
          storageRoot: record.storageRoot,
          builderAddress: record.builderAddress,
          userPercent: Number(record.split.userPercent),
          builderPercent: Number(record.split.builderPercent),
          active: record.active,
          mintedAt: Number(record.mintedAt),
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
}
