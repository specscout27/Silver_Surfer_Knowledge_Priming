---
description: Run the Update Context Agent to refresh the knowledge base for repos that have drifted since their last baseline. User-invoked only — this never fires automatically.
disable-model-invocation: true
user-invocable: true
---

Invoke the `update-context` subagent (via the Task/Agent tool) with scope: $ARGUMENTS

If no service was specified, this refreshes every service listed in the Knowledge repo's `repo-map.md` (global mode). If a service name was given, pass it through for a scoped refresh of just that service. Do not pass a `caller-agent` value — this is a direct, standalone user invocation.
