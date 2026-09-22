---
description: Surgically load pre-generated, structured knowledge about a codebase (module ownership, entry points, business features, cross-service handoffs) before searching source code from scratch. Use whenever a task needs to understand what a codebase does, which files implement something, or how services hand off to each other — check here first, before grepping the repo blind. Silently reports NOT_FOUND if no knowledge base exists for this workspace, so it's always safe to try.
user-invocable: true
---

# Skill: knowledge-query

You are answering the question "what do we already know about this?" for whatever task is in front of you right now, by reading a pre-generated Knowledge repo — never by re-reading an entire codebase. You are read-only. You never write, edit, or run git commands.

This skill is self-contained: it does not assume you have read anything else about Silver Surfer, Knowledge Priming, or any other framework. Everything you need to use a Knowledge repo correctly is defined below.

---

## When To Use This

Reach for this any time you're about to answer "how does X work", "what would I need to change to do Y", or "which service owns Z" for a codebase you haven't already fully read in this conversation. Try it before a broad Grep/Glob sweep of an unfamiliar repo — if a knowledge base exists, it'll get you to the right files faster and with less guessing; if it doesn't, you've lost nothing (see Step 0).

---

## Inputs

You determine these from the current task, not from a formal function call:

| Input | How to determine it |
|---|---|
| `task-text` | The task, question, or request currently in front of you — verbatim, not paraphrased |
| `mode` | `landscape`, `deep`, or `source` — see "Choosing a Mode" below. Default to `landscape` if you're unsure how deep you need to go; you can escalate to `deep` afterward. |
| `impacted-files` | Only for `source` mode — files you want to read, each with a reason. Must already appear in a knowledge file's `## Impacted Files` you loaded earlier in this task. |

---

## Step 0 — Locate the Knowledge Repo (self-discovery)

Look for a directory matching `*_Knowledge` next to the repository you're currently working in (i.e. a sibling directory, one level up from the current repo, at the same level as the current repo's own folder).

- **Found one, and it looks like a real Knowledge repo** (has an `index.md` and a `repo-map.md` at its root) → proceed to Step 1.
- **Found more than one** → ask whoever you're helping which one applies, or pick the one whose `repo-map.md` lists the current repo, if only one does.
- **Found none** → stop here and report:

  ```
  KNOWLEDGE_QUERY_RESULT: NOT_FOUND
  No Knowledge repo exists for this workspace. Proceed with your own
  code-search approach — this is expected and not an error; it just
  means no knowledge base has been generated here yet.
  ```

  This is a normal, silent outcome — not a failure. Whatever you're doing that called this skill should just fall back to reading source directly.

---

## The Knowledge Repo File Format (primer)

A Knowledge repo has this shape:

```
[knowledge-repo]/
├── index.md                        <- team/project-level index
├── features/                       <- cross-service feature flow files
├── repo-map.md                     <- service name -> source repo path
├── [Service_Name]_Knowledge/       <- one subtree per source repo ("service")
│   ├── index.md                    <- per-service index
│   ├── modules/[name].md           <- backend/database/infra: one file per module
│   ├── features/[name].md          <- frontend: one file per feature
│   ├── submodules/[name]/          <- frontend: nested features under a submodule
│   └── infra/[name].md             <- infrastructure units (Terraform/Helm/K8s/etc.)
```

A "service" is one source repository. `repo-map.md` is a markdown table — `| Service | Source Repo Path (relative to workspace root) |` — mapping each service name to where its actual source code lives. You'll need this in `source` mode to know where to `Read` from.

**Required blocks, by file type.** Each is a markdown `## Heading` section. If a file you need to load is missing one of its required blocks, that's a sign the knowledge is stale or was never finished — halt and report it (see "Halt Behavior") rather than guessing at what the block would have said.

| File | Required blocks | What they tell you |
|---|---|---|
| Team-level `index.md` | `## Context Baseline`, `## Services in This Team/Project`, `## Business Features` | Which repos (services) exist, what business capability each owns, the commit each was generated from |
| Cross-service feature file (`features/[name].md`, team level) | `## Services Participating`, `## End-to-End Flow`, `## Cross-Service Handoffs`, `## Linked Per-Service Files` | Which services jointly implement one business capability, and exactly how they hand off to each other (event, API, queue) |
| Per-service `index.md` | `## Context Baseline`, `## Organization Mode`, `## Layer Type` | Whether this service is organized by module (typical for backend/infra) or by feature (typical for frontend), and its baseline commit |
| Module file (`modules/[name].md`) | `## Module Ownership`, `## Entry Points` | What this module is responsible for, and where execution enters it — usually also lists an `## Impacted Files` section you'll use in `source` mode |
| Feature file, frontend (`features/[name].md`, per-service) | `## Pages Involved`, `## Backend API Dependencies`, `## Impact Surface`, `## Impacted Files` | What UI surface this feature touches, and the exact files that would need to change |
| Submodule index (frontend) | `## Module Ownership`, `## Features` | Same idea as a module index, one level down |

---

## Choosing a Mode

- **`landscape`** — cheap survey. Use when you need to know *what exists* — which services are involved, what business features are relevant — before deciding where to dig deeper. Loads only index-level files.
- **`deep`** — implementation-grounded. Use when you're about to reason about or change something specific and need the actual module/feature files, not just the index. Includes everything `landscape` loads, plus targeted module/feature files.
- **`source`** — last resort. Use only after a `deep` load, when you've reasoned over the loaded knowledge and it's genuinely insufficient. Reads real source files — but only ones already named in a loaded file's `## Impacted Files`.

Never jump straight to `source` without a `deep` load first in the same task — you won't have anything to validate the request against.

---

## Execution

### Mode: `landscape`

**LS1 — Load the team-level index.** Read `[knowledge-repo]/index.md`. Verify its required blocks are present (halt if not). Extract: the list of services with their layer types and organization modes, the list of business features, and the Service Interconnections table if present.

**LS2 — Extract keywords from `task-text`.** See "Keyword Extraction" below.

**LS3 — Match keywords to business features.** A feature matches if any keyword overlaps its name or summary (case-insensitive, substring containment).

**LS4 — Load matched cross-service feature files.** For each matched feature that has its own `features/[name].md` at the team level: read it, verify required blocks, extract `## Services Participating`.

**LS5 — Load per-service indexes for participating services.** Union the participating services from LS4 plus any single-service matches from LS3 (owner noted directly in the team index). For each: read `[knowledge-repo]/[Service_Name]_Knowledge/index.md`, verify required blocks, note its Organization Mode for a possible later `deep` load.

**LS6 — Report:**

```
KNOWLEDGE_QUERY_RESULT: LOADED (landscape)

Task (first 100 chars): "[truncated task-text]"
Keywords: [list]

Team-Level: [knowledge-repo]/index.md
Cross-Service Features Loaded: features/[name].md (matched: [keywords]), ...
Services Participating: [Service] (Layer: [x], Organization: [mode]), ...
Per-Service Indexes Loaded: [Service_Name]_Knowledge/index.md, ...
Skipped (no match): [service or feature] — [reason]

Files loaded: [count]
```

Return the loaded file contents alongside this report.

---

### Mode: `deep`

Run LS1–LS5 exactly as above, then:

**D6 — Load per-service module/feature files.** For each participating service, using its Organization Mode from LS5:

- **Module-centric** (backend/database/infra): read the per-service index's `## Modules` table and business-feature-to-module mapping. Load `[Service_Name]_Knowledge/modules/[module-name].md` for every module that owns a matched feature, or whose name/responsibility overlaps a keyword.
- **Feature-centric** (frontend): read the per-service index's feature lists. Load `[Service_Name]_Knowledge/features/[feature-name].md` (service-level) or `submodules/[submodule]/features/[feature-name].md` (submodule-level) for every match.

Verify required blocks on everything loaded; halt on a missing one.

**D7 — Report:** same shape as LS6, plus a "Per-Service Module/Feature Files Loaded" section listing each file and why it was selected, and a closing line: `Source fallback: not invoked (use source mode if this is insufficient)`.

Return the loaded file contents alongside this report.

---

### Mode: `source`

**SRC1 — Validate.** You must provide `impacted-files`: a list of `{repo-path, file-path, why-needed}`. `repo-path` is the service's *source* repo (resolve via `repo-map.md`, not the Knowledge repo). Reject (do not read) any entry whose `file-path` doesn't appear in a `## Impacted Files` section you already loaded in `deep` mode earlier in this task:

```
KNOWLEDGE_QUERY_RESULT: SOURCE_REJECTED
Requested file: [path]
Not listed under any loaded knowledge file's Impacted Files. Either
your knowledge is stale (re-run Knowledge Priming's Update Context)
or this file genuinely isn't catalogued — in which case treat it as
a knowledge gap, not something to read around.
```

**SRC2 — Read.** For each validated entry, `Read` `[repo-path]/[file-path]`. Skip binaries, files over ~200KB, and build/vendor/lockfile paths — record as `SKIPPED`, not an error. Record unreadable files as `ERROR`, don't halt the batch for one failure.

**SRC3 — Report:**

```
KNOWLEDGE_QUERY_RESULT: LOADED (source)
Requested: [N] · Validated: [N] · Read: [N] · Errors: [N]

Loaded:
  - [repo-path]/[file-path] ([lines]) — [why-needed]
Errors/Skipped:
  - [repo-path]/[file-path] — [reason]
```

Return the file contents alongside this report.

---

## Keyword Extraction

- Tokenize on whitespace/punctuation, lowercase, deduplicate, drop stop words (a, the, of, with, for, to, can, should, is, are, ...).
- Keep multi-word phrases together when contiguous ("order processing", "kafka topic").
- Keep technical tokens verbatim: anything in backticks, API-path-shaped (`/foo/bar`), event-name-shaped (`foo.bar.baz`), CamelCase, or snake_case.
- Stem obvious variants: order/orders/ordering → order; process/processing/processed → process.
- If a keyword matches a business feature's name in the team index, also pull keywords from that feature's summary (one level of expansion, not recursive).
- Matching is case-insensitive, substring-containment (`order` matches `process-order`, `OrderProcessing`, `order.placed`).

---

## Halt Behavior

If any required block is missing from a file you must load, stop and report — don't return a partial result:

```
KNOWLEDGE_QUERY_RESULT: HALT
File: [path]
Missing required block: [block-name]
This usually means the knowledge base is stale or incomplete for this
file. If Knowledge Priming is installed here, its Update Context
capability can refresh it. Otherwise, treat this as a gap and fall
back to reading source directly for this part of the task.
```

If a file referenced by an index doesn't exist on disk, treat it the same way — the knowledge base is internally inconsistent, don't guess past it.

---

## Behavioral Rules

- **Stay surgical.** Never load a whole folder or glob everything in. Load specific files justified by a specific match.
- **Stay deterministic.** Same input text, same knowledge base → same files loaded.
- **Stay honest.** No keyword matches → say so plainly, don't force a result.
- **Stay read-only.** No writes, no edits, no git operations, ever.
- **Don't auto-escalate.** Never silently move from `landscape` to `deep` to `source` — each is a deliberate choice with its own report.
- **Report `NOT_FOUND` calmly.** No Knowledge repo existing is an expected, common outcome, not a failure — treat it exactly that way in your report and move on to whatever fallback makes sense.

---

## Relationship to `smart_context_loading.skill.md`

This repo also carries `.github/agents/skills/smart_context_loading.skill.md`, used internally by `Silver_Surfer_Workflow`'s Epic and User Story agents. That skill assumes its caller already built a `services` list and knows the Knowledge repo's path — true for those specific orchestrators, not true for an arbitrary agent. This skill exists because of that gap: same underlying idea (load knowledge surgically, never bulk), but self-locating and free of Silver-Surfer-specific vocabulary, so it works for any agent that picks it up.
