# Codex Runtime Contract

The Skill is interpreted by a root Codex agent; it is not a shell program.

- `spawn_agent`: create one fresh role. Always use `fork_turns: "none"` and include role, absolute inputs, absolute outputs, and validation command in the message.
- `list_agents`: count active children before every Scout wave. Root plus three children is the supported concurrency ceiling.
- `wait_agent`: wait no more than 60 seconds per call so the root can update the user and reconcile completed artifacts.
- `interrupt_agent`: stop a child after ten elapsed minutes or when it writes outside its assigned boundary.
- Codex web access: Scouts and Evaluator use search queries and open source pages. Planner and Writer do not browse.

Agent completion messages are advisory. File existence plus deterministic validation decides whether work is complete.
