export interface AXLMessage {
  type: string;
  [key: string]: unknown;
}

export interface AXLEnvelope {
  fromPeerId: string;
  body: AXLMessage;
}

export interface AXLTopologyPeer {
  peerId: string;
  addr: string;
  latency: number;
}

export async function send(baseUrl: string, destinationPeerId: string, message: AXLMessage): Promise<void> {
  const response = await fetch(`${baseUrl}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Destination-Peer-Id': destinationPeerId,
    },
    body: JSON.stringify(message),
  });
  if (!response.ok) {
    throw new Error(`AXL send failed [${response.status}]: ${response.statusText}`);
  }
}

export async function recv(baseUrl: string): Promise<AXLEnvelope[]> {
  const response = await fetch(`${baseUrl}/recv`);
  if (!response.ok) {
    throw new Error(`AXL recv failed [${response.status}]: ${response.statusText}`);
  }
  return response.json() as Promise<AXLEnvelope[]>;
}

export async function getTopology(baseUrl: string): Promise<AXLTopologyPeer[]> {
  const response = await fetch(`${baseUrl}/topology`);
  if (!response.ok) {
    throw new Error(`AXL topology failed [${response.status}]: ${response.statusText}`);
  }
  return response.json() as Promise<AXLTopologyPeer[]>;
}
