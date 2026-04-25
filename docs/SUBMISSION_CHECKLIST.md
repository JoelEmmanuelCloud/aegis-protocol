# Aegis Protocol — Submission Checklist

Per architecture §8.3. Check each item before submitting to any sponsor track.

---

## Universal (All Tracks)

- [ ] Public GitHub repo with clean README and setup instructions
- [ ] Contract addresses on 0G testnet documented
  - AegisCourt.sol: `0x3De27365b376D43422314899dA0E18042f0F734a`
  - AgentRegistry.sol: `0x65cB34BCc2941f842Eb5c290d8e8aC24aEa22bbc`
- [ ] Demo video under 3 minutes — full loop live, no hardcoded values
- [ ] Live demo link — all 4 AXL nodes + dashboard accessible
- [ ] Architecture diagram in /docs
- [ ] Team names, Telegram handles, X handles added to README

---

## 0G

- [ ] Explain how 4 AXL nodes communicate and coordinate (in README)
- [ ] Link to minted iNFT on 0G explorer + proof intelligence embedded in 0G Storage
- [ ] Working example: external agent integrating with Aegis in one AXL call

---

## Gensyn — Critical

- [ ] Demo MUST show 4 distinct AXL peer IDs visible in terminal output
  - Witness:    `23fb5c412a421117459c2160906f26ccf260cc38cb9e3407fc159ab79e5752b1`
  - Verifier:   `7c60360ef2c5e4d236d56c413db50054bbc3dcfecb190968d0324a1a40a7f0f1`
  - Propagator: `946df8c688343d09d1600388a08582b4fa6cf8b30a01d493851428f03e78bc6f`
  - Memory:     `87a69f086122c7232d9dbca90797d5d47836c2c83869cf4a93f5148b962aa6c4`
- [ ] Show propagation: attestation broadcast reaches peer Aegis instance within one round
- [ ] No centralised message broker replacing what AXL provides

---

## KeeperHub

- [ ] Write-up explaining `aegis.execute_remedy` workflow design
- [ ] Live demo: Court verdict triggers workflow, shows audit trail
- [ ] FEEDBACK.md in repo root — specific, actionable, real integration experience
- [ ] Project name, team members, contact info

---

## ENS

- [ ] Demo shows ENS subname auto-issued on iNFT mint — no hardcoded values
- [ ] Show ENS text records updating live after attestation and verdict
- [ ] Demonstrate ENSIP-25 verification: resolve `.aegis.eth` name, confirm `agent.registry` + `agent.id`
- [ ] Show ENS profile card: any app resolves `.aegis.eth` and gets live accountability data

---

## Demo Script (3 min)

| Time | Scene | What judges see |
|------|-------|-----------------|
| 0:00–0:20 | Problem | "No accountability layer for AI agents" |
| 0:20–0:50 | Register | Wallet connect → mint iNFT → `trading-bot.aegis.eth` auto-issued, ENSIP-25 written |
| 0:50–1:20 | Attestation | Agent POSTs decision → attestation card appears → 0G StorageScan committed |
| 1:20–1:50 | AXL Propagation | 4 terminals, 4 peer IDs, propagator broadcasts within one round |
| 1:50–2:20 | Dispute + Verdict | Dispute by ENS name → TEE replay → FLAGGED → AegisCourt onchain |
| 2:20–2:45 | KeeperHub | `aegis.execute_remedy` fires → tx lands → audit trail visible |
| 2:45–3:00 | ENS Oracle | Resolve `.aegis.eth` → live text records → "ENS is the trust signal" |
