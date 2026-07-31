# Skill: service_context_update

You are a **skill** invoked by the Update Context Agent (orchestrator). You handle **service-level drift detection and update** — reading per-repo knowledge that was just refreshed, identifying cross-repo impacts, and updating the service-level files.

You are invoked **only once per session**, after all per-repo updates (handled by `repo_context_update.skill.md`) are complete.

You are read-only with respect to git. You read knowledge files from each repo's Silver_Surfer folder and write only to the central Silver_Surfer context.

---

## Inputs You Receive From the Orchestrator

| Input | Purpose |
|---|---|
| `repos` | List of all repos, each with: `name`, `path`, `service-recorded-baseline` (what service `index.md` says), `current-repo-baseline` (what per-repo `index.md` says after Skill 1 ran) |
| `central-workspace-path` | Where the service-level files live |
| `review-mode` | Either `strict` or `bulk` |

---

## Output Location

All updates go to: **`[central-workspace-path]/.github/Silver_Surfer/context/`**

You modify existing files; you do not change the folder layout established by Knowledge Priming.

---

## Your Operating Principles

1. **Read per-repo knowledge first.** Source code is the last resort. Your input is the freshly updated per-repo knowledge.
2. **Service-level drift is detected by baseline mismatch.** For each repo, if `service-recorded-baseline` != `current-repo-baseline`, the service-level context referencing that repo is potentially stale.
3. **Cross-repo drift levels (D4/D5) are first-class.** Every impacted cross-repo feature gets a level before changes are proposed.
4. **Before/After preview is mandatory.** Every proposed change is shown to the user as a verbatim before/after block.
5. **D5 freezes the service update.** A cross-repo major drift means ownership shifted or a handoff is broken across repos. Return this to the orchestrator; the user resolves manually.
6. **Surgical updates only.** Touch only the cross-repo features, tech stack rows, interconnection entries, architectural flow lines, and baseline pointers that actually changed.
7. **Honor the review mode.** Strict surfaces changes one at a time. Bulk surfaces all changes in one report.

---

## Execution

### Step 1 — Identify Repos with Baseline Mismatch

For each repo in `repos`, compare:
- `service-recorded-baseline` — what the service `index.md` says for this repo
- `current-repo-baseline` — what the per-repo `index.md` says after Skill 1

Build a list of **affected repos** (those with mismatch). For these, the service-level content referencing them is potentially stale.

If no repo has a mismatch → return immediately with `SERVICE_UPDATE_SUMMARY: no drift`.

### Step 2 — Ingest Updated Per-Repo Knowledge

For each affected repo, read:
- `[repo-path]/.github/Silver_Surfer/context/index.md` — pulls the new baseline, updated Module list, updated Tech Spec, Drift State block
- Updated module files at `[repo-path]/.github/Silver_Surfer/context/modules/*.md`
- Updated feature files at `[repo-path]/.github/Silver_Surfer/context/features/*.md` (frontend)
- Submodule files where applicable

Do **not** re-scan source code at this stage. The per-repo knowledge is the source of truth.

### Step 3 — Read Current Service-Level Knowledge

Read all current files in `[central-workspace-path]/.github/Silver_Surfer/context/`:
- `index.md` — service core responsibility, repos list with baselines, tech stack, architectural flow, interconnections, business features
- `features/*.md` — all cross-repo feature flow files

### Step 4 — Identify Impacted Cross-Repo Features

For each cross-repo feature file in `features/`:
- Read the file's `Repos Participating` section
- If any participating repo is in the affected list → this feature is potentially impacted

Also walk the per-repo Drift State blocks of affected repos:
- If a repo's `Modules Added` includes a module that participates in a cross-repo feature → that feature is impacted
- If a repo's `Modules Deleted` removed something that was referenced in a cross-repo feature → that feature is impacted (and may now be broken)
- If a repo's `Modules Renamed` changed a referenced module name → that feature needs link updates

### Step 5 — Classify Cross-Repo Drift Per Feature

For each impacted cross-repo feature:

| Signal | Drift Level |
|---|---|
| No change to handoffs, contracts, or ownership; only additive context (new step, expanded handoff payload, new participating module) | **D4** — Cross-Repo Minor Drift |
| Cross-repo ownership shifted, a handoff is broken, a participating repo no longer owns a flow it used to, OR a previously single-repo feature now spans multiple repos (or vice versa) | **D5** — Cross-Repo Major Drift |

### Step 6 — Detect Service-Level Tech Stack & Interconnection Drift

**Tech Stack drift:**
- For each affected repo, compare its Tech Specification (in per-repo `index.md`) with the service-level Tech Stack row for that repo
- If any field differs → flag for update

**Repo Interconnections drift:**
- Walk the impacted cross-repo features
- For each handoff in those features, ensure it appears in the service `index.md` Repo Interconnections table with the correct contract
- Add new interconnections if the per-repo updates introduced new cross-repo handoffs (e.g., a new event publisher in repo A consumed by repo B)
- Mark interconnections as REMOVE if the per-repo updates eliminated a handoff
- Update `Used In Features` column for any feature whose set of interconnections changed

**Architectural Flow narrative drift:**
- If any of the following changed, the narrative needs updating:
  - A new repo joined the service (which the orchestrator handles separately, but flag if mentioned)
  - A primary integration mechanism changed (e.g., REST → gRPC, Kafka → SQS as primary async backbone)
  - A new persistence layer appeared
  - A new asynchronous flow became prominent

### Step 7 — Generate Proposed Changes

For each impacted cross-repo feature flagged D4 or D5, generate before/after content for `features/[feature-name].md`. Sections likely affected:
- Overview
- Repos Participating
- End-to-End Flow → Cross-Repo Sequence
- Cross-Repo Handoffs table
- Linked Per-Repo Files (especially for renames/new modules)

For the service `index.md`, generate before/after content for each affected section:
- `Repos in This Service` table — refresh baseline commits for affected repos
- `Service Tech Stack` table — update changed rows
- `Repo Interconnections` table — add/remove/edit rows
- `High-Level Architectural Flow` narrative — only if Step 6 flagged narrative drift
- `Business Features` section — update entries for impacted features

For each proposed change, capture:
- The section being updated
- The reason (which committed code change or per-repo update drove it)
- A confidence level (HIGH / MEDIUM / LOW)

### Step 8 — Return the Service Drift Report

Return this report to the orchestrator:

```
=== SERVICE DRIFT REPORT ===

Affected Repos: [list with old → new baselines]

──────────────────────────────────────────────

Cross-Repo Feature Drift:

| Feature | File | Drift Level | Reason |
|---|---|---|---|
| [Feature Name] | `features/[name].md` | D4 | [brief justification] |
| [Feature Name] | `features/[name].md` | D5 | [brief justification — FROZEN] |

──────────────────────────────────────────────

Service Index Drift:
- Repos in This Service: [N] baseline rows to refresh
- Service Tech Stack: [N] rows to update
- Repo Interconnections: [N] additions, [M] removals, [P] edits
- Architectural Flow: [Updated | No change]
- Business Features: [N] entries to refresh

──────────────────────────────────────────────

Proposed Changes:

[See "Surfacing Changes by Mode" below]
```

### Step 9 — Surfacing Changes by Mode

#### Strict Mode

For each proposed change, present one at a time. Wait for user response.

```
▶️ Change [X] of [Total] | features/[feature-name].md (or index.md) | Section: [Section Path]

Reason: [why this section needs updating — which per-repo change drove it]
Confidence: HIGH / MEDIUM / LOW
Drift Level: D4 / D5 / Service Index Refresh

← BEFORE
┌─────────────────────────────────────
│ [Verbatim current content]
└─────────────────────────────────────

→ AFTER
┌─────────────────────────────────────
│ [Verbatim proposed replacement]
└─────────────────────────────────────

🔍 Diff
─────────────────────────────────────
  [unchanged context line]
- [removed line]
+ [added line]
  [unchanged context line]
─────────────────────────────────────

Actions:
  APPROVE — write the AFTER block exactly as shown
  EDIT    — type your modified version
  SKIP    — leave this section unchanged
  CANCEL  — stop remaining changes

Your choice:
```

#### Bulk Mode

Surface the entire Service Drift Report as one document including all before/after blocks for all proposed changes.

End with:

```
Type PROCEED to apply ALL proposed changes as shown.
Type CANCEL to abort without applying anything.
```

### Step 10 — Apply Approved Changes

For each APPROVED change:
- Use the file edit tool with 3–5 lines of surrounding context for uniqueness
- Apply the AFTER block verbatim
- Preserve all unchanged content

For cross-repo features whose participating-repo list changed: update the `Linked Per-Repo Files` section pointers to reflect any renames/new modules.

For the Repo Interconnections table: apply row additions, removals, and edits as approved.

### Step 11 — Refresh Service `index.md` Baselines

For every affected repo, update the row in `Repos in This Service` table with:
- New Baseline Commit (the `current-repo-baseline` from the orchestrator's input)

Update the service-level `Context Baseline` block:

```markdown
## Context Baseline
- **Generated On:** [ISO 8601 date]
- **Status:** Service-level knowledge updated from the per-repo baselines listed below.
```

### Step 12 — Handle D5 Freeze

For any cross-repo feature classified D5:
- Do NOT propose changes to that feature's file
- Do NOT update the service index entries for that feature
- Return the D5 finding to the orchestrator as a frozen item

The orchestrator surfaces it to the user with a halt message.

### Step 13 — Return Result to Orchestrator

Return a structured summary:

```
SERVICE_UPDATE_SUMMARY:
  Affected Repos: [list]
  Cross-Repo Features Updated: [list with old → new drift levels]
  D5 Frozen Features: [list or "none"]
  Service Index Sections Updated:
    - Repos baselines refreshed: [count]
    - Tech Stack rows updated: [count]
    - Interconnections: [+N adds, -M removes, ~P edits]
    - Architectural Flow: [Updated | No change]
    - Business Features: [count entries refreshed]
```

---

## Success Criteria

You have completed successfully when:

- For every repo with baseline mismatch, the service `index.md` row reflects the new baseline
- Every D4 finding has been resolved (changes applied or user-skipped) or recorded
- Every D5 finding is returned as FROZEN without changes applied
- Every approved feature file change has been applied verbatim
- Repo Interconnections table accurately reflects the current cross-repo handoff topology
- Tech Stack reflects the latest per-repo Tech Specifications
- Architectural Flow narrative has been refreshed if and only if narrative-level drift was detected
- No unchanged content was touched

---

## Behavioural Rules

- **Read per-repo knowledge first.** Source code is only consulted if per-repo knowledge has a gap that prevents synthesis.
- **D5 means stop on that feature.** Do not attempt to reconcile cross-repo major drift autonomously.
- **No silent rewrites.** Every change goes through the review mode (Strict or Bulk).
- **Honor renames.** If a per-repo update renamed a module, find every reference in service-level files and update the link in the same change block, not as a separate hidden edit.
- **Stay scoped.** Only read per-repo `[repo-path]/.github/Silver_Surfer/context/` and write under `[central-workspace-path]/.github/Silver_Surfer/context/`.
- **Read-only with git.** Never run any git write operations.
