# KeeperHub Integration Feedback

Builder feedback for the KeeperHub Builder Feedback Bounty.
All entries are real integration findings from building the `aegis.execute_remedy` workflow.

---

## MCP Tools Discovered

After installing via `/plugin marketplace add KeeperHub/claude-plugins`:

| Tool Name                    | Parameters                   | Notes                         |
| ---------------------------- | ---------------------------- | ----------------------------- |
| `keeperhub.create_workflow`  | `name`, `trigger`, `steps[]` | Core workflow definition tool |
| `keeperhub.trigger_workflow` | `workflowId`, `payload`      | Manual trigger for testing    |
| `keeperhub.get_workflow_run` | `runId`                      | Poll run status               |
| `keeperhub.list_runs`        | `workflowId`, `limit`        | Audit trail retrieval         |
| `keeperhub.get_workflow`     | `workflowId`                 | Inspect existing workflow     |
| `keeperhub.delete_workflow`  | `workflowId`                 | Cleanup stale workflows       |

---

## Workflow Built: `aegis.execute_remedy`

Trigger: `onchain:AegisCourtVerdictEmitted`

Steps:

1. `aegis.fetch_verdict` — reads verdict from AegisCourt.sol
2. `aegis.notify_agent_owner` — notifies iNFT owner wallet
3. `aegis.execute_remedy_tx` (if: `verdict===FLAGGED`) — fires onchain remedy
4. `aegis.update_ens_reputation` — updates ENS text records after verdict
5. `aegis.update_reputation` — writes updated score to 0G KV

---

## Issues Encountered

### 1. Onchain trigger format underdocumented

**Finding:** The `onchain:EventName` trigger format is mentioned in docs but the exact ABI
specification for filtering on specific contracts is not documented. We had to infer that
the contract address goes in a separate `contractAddress` field in the workflow definition.

**Impact:** ~1 hour of trial and error. A working example in the docs would save this time.

**Suggestion:** Add one complete onchain trigger example with contract address, event name,
and ABI fragment to the workflow creation docs.

### 2. No dry-run or simulation mode

**Finding:** The only way to test a workflow is to trigger it against a real payload.
There is no sandbox trigger that validates the step configuration without executing it.

**Impact:** During development, we unintentionally sent test transactions to the 0G testnet
because there was no way to validate the workflow shape without firing it.

**Suggestion:** Add a `keeperhub.simulate_workflow` tool that validates step structure and
returns expected execution paths without hitting any external systems.

### 3. Step `if` condition syntax not documented

**Finding:** The `if` field in step definitions accepts a condition string
(e.g. `"verdict===FLAGGED"`) but the allowed operators, variables, and evaluation context
are not documented anywhere.

**Impact:** We guessed `===` based on JavaScript convention. Other teams may use `==` or SQL
syntax and get silent failures.

**Suggestion:** Document the condition DSL explicitly: allowed variables, operators, and
type coercion rules.

### 4. Audit trail `gasUsed` field is sometimes null

**Finding:** `WorkflowRun.gasUsed` is null for runs that completed within a single retry.
The demo script shows "Gas saved 28%" but there is no baseline to compare against when
`gasUsed` is absent.

**Impact:** Cannot display meaningful gas optimization metrics in the dashboard.

**Suggestion:** Always populate `gasUsed` with the actual gas consumed, and add a separate
`baselineGasEstimate` field for comparison.

### 5. No webhook/push notification for run completion

**Finding:** The only way to know a workflow run has completed is to poll `get_workflow_run`.
For a live demo showing KeeperHub firing a remedy in real time, polling every 500ms creates
unnecessary API load.

**Suggestion:** Add a webhook callback URL to the workflow definition so the orchestrator
can receive a push notification when a run completes.

---

## What Worked Well

- Workflow creation is fast — under 30 seconds from definition to registered workflow.
- The `trigger_workflow` tool is useful for manual testing without needing an onchain event.
- The step-based model maps cleanly to the Aegis court flow — each accountability action
  is naturally one step.
- API response shapes are consistent and easy to type in TypeScript.
