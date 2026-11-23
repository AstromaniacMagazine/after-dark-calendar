# After Dark Calendar agent instructions

For any calendar release, keep `RELEASE_HANDOFF.md` current as work progresses. Record the target version, working branch and commit, completed changes, validation evidence, publication state, exact remaining steps, and blockers. Update it before ending a turn with unfinished release work, including a usage-limit interruption when possible. Never record credentials or private account data.

When asked to resume, read `RELEASE_HANDOFF.md`, inspect `git status`, and continue from the listed next step. Check whether external state (GitHub Pages, Squarespace, source data) changed while the task was paused. Avoid repeating completed work unless relevant files or dependencies changed. Do not claim publication until both deployment and live-site checks confirm it.

A usage reset does not itself start a new agent turn. Resume when the user returns to the chat or explicitly starts a new task pointing to this repository.
