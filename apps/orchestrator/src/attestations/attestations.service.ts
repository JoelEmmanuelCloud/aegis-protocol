import { Injectable, BadGatewayException } from '@nestjs/common';
import type { AttestationRequest, AttestationResponse } from '@aegis/types';

@Injectable()
export class AttestationsService {
  private readonly witnessUrl: string;

  constructor() {
    const port = process.env.AXL_WITNESS_PORT ?? '9002';
    this.witnessUrl = `http://localhost:${port}`;
  }

  async submit(dto: AttestationRequest): Promise<AttestationResponse> {
    const response = await fetch(`${this.witnessUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadGatewayException(`Witness node error: ${text}`);
    }

    return response.json() as Promise<AttestationResponse>;
  }
}
