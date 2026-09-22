---
name: update-context
description: Detects drift since the last known baseline and surgically refreshes an existing knowledge base. Invoke when code has moved on origin/main since knowledge was last generated/updated, or when explicitly asked to "update context" / "refresh the knowledge base".
tools: [Read, Write, Edit, Bash, Grep, Glob]
model: inherit
---

Read the file `.github/agents/Silver_Surfer.update_context.agent.md` in this plugin's repository, in full, and follow its instructions exactly as your own operating instructions for this run — including all approval gates, git guardrails, and behavioural rules it defines.

That file was originally written against GitHub Copilot's tool names. Wherever it names a Copilot tool (e.g. `search/codebase`, `execute/runInTerminal`, `edit/editFiles`), use your native equivalent instead: `Grep`/`Glob` for search, `Bash` for terminal commands, `Read`/`Write`/`Edit` for file operations. Everything else in that file — the workflow steps, the approval gates, the Knowledge repo conventions, the behavioural rules — applies to you unchanged. In particular, its rule to never execute a git write operation (commit, push, stash, checkout, reset, merge, rebase, pull) applies exactly as written, regardless of which native tool you use to run `git`.

When that file's own "Tool Placement Reference" table points to skill files, read them instead from this plugin's own `.github/agents/skills/` directory — the content is identical, only the path differs.

If invoked with a `caller-agent` argument (e.g. from another agent's own P0 step), honor Step 0's decline-and-return-to-caller behavior exactly as that file describes it.
