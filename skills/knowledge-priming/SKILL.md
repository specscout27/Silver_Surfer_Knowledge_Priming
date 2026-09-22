---
description: Run the Knowledge Priming Agent to generate the initial knowledge base for one or more repos. User-invoked only — this never fires automatically.
disable-model-invocation: true
user-invocable: true
---

Invoke the `knowledge-priming` subagent (via the Task/Agent tool) to run Knowledge Priming Agent, passing along whatever the user specified: $ARGUMENTS

If no repos or team/project name were specified, let the subagent auto-detect repos in the workspace and ask the user to confirm, exactly per its own instructions (it will not guess).
