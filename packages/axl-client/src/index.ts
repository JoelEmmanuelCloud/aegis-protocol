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
}

export async function send(
  baseUrl: string,
  destinationPeerId: string,
  message: AXLMessage
): Promise<void> {
  const body = Buffer.from(JSON.stringify(message));
  const response = await fetch(`${baseUrl}/send`, {
    method: 'POST',
    headers: { 'X-Destination-Peer-Id': destinationPeerId },
    body,
  });
  if (!response.ok) {
    throw new Error(`AXL send failed [${response.status}]: ${response.statusText}`);
  }
}

export async function recv(baseUrl: string): Promise<AXLEnvelope[]> {
  const response = await fetch(`${baseUrl}/recv`);
  if (response.status === 204) return [];
  if (!response.ok) {
    throw new Error(`AXL recv failed [${response.status}]: ${response.statusText}`);
  }
  const fromPeerId = response.headers.get('X-From-Peer-Id') ?? '';
  const buf = await response.arrayBuffer();
  const body = JSON.parse(Buffer.from(buf).toString('utf-8')) as AXLMessage;
  return [{ fromPeerId, body }];
}

export async function getTopology(baseUrl: string): Promise<AXLTopologyPeer[]> {
  const response = await fetch(`${baseUrl}/topology`);
  if (!response.ok) {
    throw new Error(`AXL topology failed [${response.status}]: ${response.statusText}`);
  }
  const data = (await response.json()) as { peers?: Array<{ key: string; addr: string }> };
  return (data.peers ?? []).map((p) => ({ peerId: p.key, addr: p.addr }));
}
