import { useState, useEffect, useCallback } from 'react';

const SLIDES = [
  {
    id: 1,
    label: 'The Problem',
    content: (
      <SlideLayout>
        <BigEmoji>🤖</BigEmoji>
        <Headline>AI agents are making real decisions with your money.</Headline>
        <SubText>Swaps. Trades. Liquidations. Transfers.</SubText>
        <Gap />
        <Row>
          <ProblemBox>No receipt of what it did</ProblemBox>
          <ProblemBox>No proof of why it did it</ProblemBox>
          <ProblemBox>No way to appeal if it was wrong</ProblemBox>
        </Row>
        <Gap />
        <Muted>
          Every other agent framework solves how agents decide. None solve what happens after.
        </Muted>
      </SlideLayout>
    ),
  },
  {
    id: 2,
    label: 'The Analogy',
    content: (
      <SlideLayout>
        <Headline>
          Think of Aegis like a store receipt, a court, and a reputation board — all in one.
        </Headline>
        <Gap />
        <BigAnalogy>
          <AnalogBox
            icon="🧾"
            title="The Receipt"
            desc="Every decision the bot makes gets a permanent, unforgeable receipt"
          />
          <Arrow />
          <AnalogBox
            icon="⚖️"
            title="The Court"
            desc="Anyone can challenge a decision. A neutral judge reviews the exact recording"
          />
          <Arrow />
          <AnalogBox
            icon="⭐"
            title="The Reputation"
            desc="The verdict updates the bot's public score — visible to everyone, forever"
          />
        </BigAnalogy>
        <Gap />
        <Muted>No trust required. Every step is on-chain.</Muted>
      </SlideLayout>
    ),
  },
  {
    id: 3,
    label: 'Step 1 — Witness',
    content: (
      <SlideLayout>
        <StepBadge>Step 1</StepBadge>
        <Headline>The bot acts. Aegis writes it down — permanently.</Headline>
        <Gap />
        <CenterDiagram>
          <DiagramBox accent>
            <DiagramIcon>🤖</DiagramIcon>
            <DiagramLabel>Your Bot</DiagramLabel>
            <DiagramSub>makes a decision</DiagramSub>
          </DiagramBox>
          <DiagramArrow label="one AXL call" />
          <DiagramBox>
            <DiagramIcon>📸</DiagramIcon>
            <DiagramLabel>Witness Node</DiagramLabel>
            <DiagramSub>records it forever</DiagramSub>
          </DiagramBox>
          <DiagramArrow label="0G Storage" />
          <DiagramBox>
            <DiagramIcon>🧾</DiagramIcon>
            <DiagramLabel>Root Hash</DiagramLabel>
            <DiagramSub>unforgeable receipt</DiagramSub>
          </DiagramBox>
        </CenterDiagram>
        <Gap />
        <CodeSnippet>{`await fetch('witness:9002/send', {
  body: JSON.stringify({ type: 'ATTEST_DECISION', agentId, inputs, reasoning, action })
})`}</CodeSnippet>
        <Muted>One line. Any framework. Any bot.</Muted>
      </SlideLayout>
    ),
  },
  {
    id: 4,
    label: 'Step 2 — Dispute',
    content: (
      <SlideLayout>
        <StepBadge>Step 2</StepBadge>
        <Headline>Something looks wrong. You challenge it.</Headline>
        <Gap />
        <CenterDiagram>
          <DiagramBox>
            <DiagramIcon>😤</DiagramIcon>
            <DiagramLabel>You</DiagramLabel>
            <DiagramSub>file a dispute</DiagramSub>
          </DiagramBox>
          <DiagramArrow label="root hash" />
          <DiagramBox>
            <DiagramIcon>🔬</DiagramIcon>
            <DiagramLabel>Verifier Node</DiagramLabel>
            <DiagramSub>replays the exact decision in a TEE</DiagramSub>
          </DiagramBox>
          <DiagramArrow label="verdict" />
          <DiagramBox accent>
            <DiagramIcon>📜</DiagramIcon>
            <DiagramLabel>AegisCourt.sol</DiagramLabel>
            <DiagramSub>records it on-chain permanently</DiagramSub>
          </DiagramBox>
        </CenterDiagram>
        <Gap />
        <VerdictRow>
          <VerdictCard type="cleared">CLEARED — bot acted correctly</VerdictCard>
          <VerdictCard type="flagged">FLAGGED — bot violated mandate</VerdictCard>
        </VerdictRow>
        <Muted>The verdict is objective. It does not depend on who filed the dispute.</Muted>
      </SlideLayout>
    ),
  },
  {
    id: 5,
    label: 'Step 3 — Remedy',
    content: (
      <SlideLayout>
        <StepBadge>Step 3</StepBadge>
        <Headline>Verdict lands. Consequences execute automatically.</Headline>
        <Gap />
        <RemedyFlow>
          <RemedyStep icon="✅" label="Fetch verdict" done />
          <RemedyLine />
          <RemedyStep icon="📣" label="Notify agent owner" done />
          <RemedyLine />
          <RemedyStep icon="⚡" label="Execute remedy transaction" flaggedOnly />
          <RemedyLine />
          <RemedyStep icon="🏷️" label="Update ENS reputation" done />
          <RemedyLine />
          <RemedyStep icon="📊" label="Update reputation score" done />
        </RemedyFlow>
        <Gap />
        <Muted>
          Powered by KeeperHub. Zero manual steps. Fires automatically on every verdict.
        </Muted>
      </SlideLayout>
    ),
  },
  {
    id: 6,
    label: 'Step 4 — Reputation',
    content: (
      <SlideLayout>
        <StepBadge>Step 4</StepBadge>
        <Headline>
          The bot's score is public. Anyone can read it. No Aegis API call needed.
        </Headline>
        <Gap />
        <ENSCard>
          <ENSName>trading-bot.aegis.eth</ENSName>
          <ENSRecords>
            <ENSRow>
              <ENSKey>aegis.reputation</ENSKey>
              <ENSVal score>81</ENSVal>
            </ENSRow>
            <ENSRow>
              <ENSKey>aegis.lastVerdict</ENSKey>
              <ENSVal flagged>FLAGGED</ENSVal>
            </ENSRow>
            <ENSRow>
              <ENSKey>aegis.totalDecisions</ENSKey>
              <ENSVal>847</ENSVal>
            </ENSRow>
            <ENSRow>
              <ENSKey>aegis.flaggedCount</ENSKey>
              <ENSVal>2</ENSVal>
            </ENSRow>
          </ENSRecords>
        </ENSCard>
        <Gap />
        <Muted>
          Stored on 0G chain. Readable from Ethereum via EIP-3668 CCIP-read. ENS is the trust
          signal.
        </Muted>
      </SlideLayout>
    ),
  },
  {
    id: 7,
    label: 'Powered By',
    content: (
      <SlideLayout>
        <Headline>Built on the primitives that make trust verifiable.</Headline>
        <Gap />
        <SponsorGrid>
          <SponsorCard>
            <SponsorIcon>⬡</SponsorIcon>
            <SponsorName>0G Network</SponsorName>
            <SponsorDesc>Storage · Compute TEE · KV · Chain</SponsorDesc>
          </SponsorCard>
          <SponsorCard>
            <SponsorIcon>◎</SponsorIcon>
            <SponsorName>Gensyn AXL</SponsorName>
            <SponsorDesc>4-node P2P mesh · ed25519 identity · Yggdrasil</SponsorDesc>
          </SponsorCard>
          <SponsorCard>
            <SponsorIcon>◈</SponsorIcon>
            <SponsorName>ENS</SponsorName>
            <SponsorDesc>ENSIP-25 · EIP-3668 CCIP-read · Live oracle</SponsorDesc>
          </SponsorCard>
          <SponsorCard>
            <SponsorIcon>⟳</SponsorIcon>
            <SponsorName>KeeperHub</SponsorName>
            <SponsorDesc>Automated remedy · 5-step workflow · Audit trail</SponsorDesc>
          </SponsorCard>
        </SponsorGrid>
        <Gap />
        <FinalTagline>Any agent. Any framework. One call. Accountability built in.</FinalTagline>
      </SlideLayout>
    ),
  },
];

export default function Slides() {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => setCurrent((n) => Math.max(0, n - 1)), []);
  const next = useCallback(() => setCurrent((n) => Math.min(SLIDES.length - 1, n + 1)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  const slide = SLIDES[current];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--app-bg)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 80px',
        }}
      >
        {slide.content}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 60px',
          borderTop: '1px solid var(--app-border)',
        }}
      >
        <button
          onClick={prev}
          disabled={current === 0}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            border: '1px solid var(--app-border)',
            background: 'var(--app-elevated)',
            color: current === 0 ? 'var(--app-text-muted)' : 'var(--app-text)',
            cursor: current === 0 ? 'default' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Back
        </button>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 28 : 8,
                height: 8,
                borderRadius: 4,
                border: 'none',
                background: i === current ? 'var(--app-accent)' : 'var(--app-border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: 0,
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--app-text-muted)' }}>
            {current + 1} / {SLIDES.length}
          </span>
          {current < SLIDES.length - 1 ? (
            <button
              onClick={next}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--app-accent)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Next
            </button>
          ) : (
            <a
              href="/"
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: '1px solid var(--app-border)',
                background: 'var(--app-elevated)',
                color: 'var(--app-text)',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Back to Home
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function SlideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}
    >
      {children}
    </div>
  );
}

function BigEmoji({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>{children}</div>;
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontSize: 32,
        fontWeight: 800,
        textAlign: 'center',
        color: 'var(--app-text)',
        letterSpacing: '-0.02em',
        lineHeight: 1.25,
        margin: 0,
      }}
    >
      {children}
    </h1>
  );
}

function SubText({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 20,
        color: 'var(--app-accent-light)',
        fontWeight: 600,
        marginTop: 12,
        textAlign: 'center',
      }}
    >
      {children}
    </p>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, color: 'var(--app-text-muted)', textAlign: 'center', margin: 0 }}>
      {children}
    </p>
  );
}

function Gap() {
  return <div style={{ height: 28 }} />;
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
      {children}
    </div>
  );
}

function ProblemBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '14px 20px',
        background: 'var(--app-red-dim)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 10,
        fontSize: 15,
        color: 'var(--app-red)',
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function BigAnalogy({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  );
}

function AnalogBox({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      style={{
        width: 220,
        padding: '20px 16px',
        background: 'var(--app-elevated)',
        border: '1px solid var(--app-border)',
        borderRadius: 14,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 40 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--app-text)' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--app-text-muted)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

function Arrow() {
  return <div style={{ fontSize: 28, color: 'var(--app-accent)', fontWeight: 700 }}>→</div>;
}

function StepBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--app-accent)',
        color: '#fff',
        padding: '4px 16px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 700,
        marginBottom: 16,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

function CenterDiagram({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  );
}

function DiagramBox({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      style={{
        width: 160,
        padding: '16px 12px',
        background: accent ? 'var(--app-accent-dim)' : 'var(--app-elevated)',
        border: `1px solid ${accent ? 'rgba(212,148,26,0.4)' : 'var(--app-border)'}`,
        borderRadius: 12,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {children}
    </div>
  );
}

function DiagramIcon({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 32 }}>{children}</div>;
}

function DiagramLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--app-text)' }}>{children}</div>;
}

function DiagramSub({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: 'var(--app-text-muted)', lineHeight: 1.4 }}>{children}</div>
  );
}

function DiagramArrow({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ fontSize: 20, color: 'var(--app-accent)' }}>→</div>
      <div style={{ fontSize: 10, color: 'var(--app-text-muted)', fontFamily: 'monospace' }}>
        {label}
      </div>
    </div>
  );
}

function CodeSnippet({ children }: { children: React.ReactNode }) {
  return (
    <pre
      style={{
        background: 'var(--app-elevated)',
        border: '1px solid var(--app-border)',
        borderRadius: 10,
        padding: '14px 20px',
        fontSize: 12,
        fontFamily: 'monospace',
        color: 'var(--app-text-2)',
        margin: 0,
        textAlign: 'left',
        overflowX: 'auto',
        maxWidth: '100%',
      }}
    >
      {children}
    </pre>
  );
}

function VerdictRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
      {children}
    </div>
  );
}

function VerdictCard({
  children,
  type,
}: {
  children: React.ReactNode;
  type: 'cleared' | 'flagged';
}) {
  const isCleared = type === 'cleared';
  return (
    <div
      style={{
        padding: '16px 24px',
        background: isCleared ? 'var(--app-green-dim)' : 'var(--app-red-dim)',
        border: `1px solid ${isCleared ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        borderRadius: 10,
        fontSize: 15,
        fontWeight: 700,
        color: isCleared ? 'var(--app-green)' : 'var(--app-red)',
      }}
    >
      {children}
    </div>
  );
}

function RemedyFlow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  );
}

function RemedyStep({
  icon,
  label,
  flaggedOnly,
}: {
  icon: string;
  label: string;
  done?: boolean;
  flaggedOnly?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        minWidth: 110,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: flaggedOnly ? 'var(--app-red-dim)' : 'var(--app-green-dim)',
          border: `2px solid ${flaggedOnly ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 11,
          color: flaggedOnly ? 'var(--app-red)' : 'var(--app-text-2)',
          fontWeight: 600,
          textAlign: 'center',
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
      {flaggedOnly && (
        <div style={{ fontSize: 10, color: 'var(--app-text-muted)' }}>FLAGGED only</div>
      )}
    </div>
  );
}

function RemedyLine() {
  return <div style={{ width: 24, height: 2, background: 'var(--app-border)', flexShrink: 0 }} />;
}

function ENSCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: 480,
        padding: '20px 24px',
        background: 'var(--app-card)',
        border: '1px solid var(--app-border)',
        borderRadius: 14,
      }}
    >
      {children}
    </div>
  );
}

function ENSName({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 18,
        fontWeight: 700,
        fontFamily: 'monospace',
        color: 'var(--app-accent-light)',
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

function ENSRecords({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>;
}

function ENSRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      {children}
    </div>
  );
}

function ENSKey({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--app-text-muted)' }}>
      {children}
    </span>
  );
}

function ENSVal({
  children,
  score,
  flagged,
}: {
  children: React.ReactNode;
  score?: boolean;
  flagged?: boolean;
}) {
  return (
    <span
      style={{
        fontSize: 13,
        fontFamily: 'monospace',
        fontWeight: 700,
        color: score ? 'var(--app-green)' : flagged ? 'var(--app-red)' : 'var(--app-text-2)',
      }}
    >
      {children}
    </span>
  );
}

function SponsorGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, width: '100%' }}>
      {children}
    </div>
  );
}

function SponsorCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '20px 16px',
        background: 'var(--app-elevated)',
        border: '1px solid var(--app-border)',
        borderRadius: 14,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {children}
    </div>
  );
}

function SponsorIcon({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 28, color: 'var(--app-accent-light)' }}>{children}</div>;
}

function SponsorName({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--app-text)' }}>{children}</div>;
}

function SponsorDesc({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--app-text-muted)', lineHeight: 1.5 }}>{children}</div>
  );
}

function FinalTagline({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 22,
        fontWeight: 800,
        color: 'var(--app-accent-light)',
        textAlign: 'center',
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </div>
  );
}
