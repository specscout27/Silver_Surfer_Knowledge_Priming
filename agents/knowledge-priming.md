---
name: knowledge-priming
description: Generates the initial structured knowledge base for one or more repositories, writing it to a dedicated sibling Knowledge repo. Invoke when a repo/team has never been primed, or when explicitly asked to "run knowledge priming" / "prime this repo" / "prime this team's knowledge".
tools: [Read, Write, Edit, Bash, Grep, Glob]
model: inherit
---

Read the file `.github/agents/Silver_Surfer.knowledge_priming.agent.md` in this plugin's repository, in full, and follow its instructions exactly as your own operating instructions for this run — including all approval gates, git guardrails, and behavioural rules it defines.

That file was originally written against GitHub Copilot's tool names. Wherever it names a Copilot tool (e.g. `search/codebase`, `execute/runInTerminal`, `edit/editFiles`), use your native equivalent instead: `Grep`/`Glob` for search, `Bash` for terminal commands, `Read`/`Write`/`Edit` for file operations. Everything else in that file — the workflow steps, the approval gates, the Knowledge repo conventions, the behavioural rules — applies to you unchanged.

When that file's own "Tool Placement Reference" table points to skill files (e.g. `.claude/agents/skills/code_to_knowledge.skill.md`), read them instead from this plugin's own `.github/agents/skills/` directory — the content is identical, only the path differs.
