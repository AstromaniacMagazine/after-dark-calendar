# After Dark Calendar

After Dark Calendar is a monthly sky calendar and astrophotography planner by Astromaniac Magazine. It shows moon phases, key celestial events, local dark-time windows, and planning tools for night-sky photography.

## Contents
- index.html — canonical site entry
- assets/ — JS & CSS
- data/ — month data and manifests

## Local testing
1. Open a local HTTP server in the project root (recommended):
   - Python: `python -m http.server 8000` then open http://localhost:8000
2. Open `index.html` in a browser (less reliable due to file:// script/load restrictions)

## Development workflow
- Feature branch + Pull Request (recommended): the repository uses a safe PR workflow.
- Commits should be small and include clear messages. Add the Co-authored-by trailer when work is automated by Copilot/agents.

## Automatic Codex sync (Watcher)
A watcher runs on the maintainer's machine and monitors: `G:\My Drive\After Dark Calendar\After Dark Codes & Repo`.
- On detected changes it creates a timestamped feature branch, copies `index.html`, `assets/`, and `data/` into the repo worktree, commits with a Co-authored-by trailer, pushes the branch, and opens a *draft* PR for review.
- Log file: `%TEMP%\codex_watcher.log`
- To stop the watcher: terminate the PowerShell process that runs `codex_watcher.ps1`.

## Merging
- Review the PR on GitHub, test locally, then "Approve" and merge. Delete the branch after merging if desired.

## Contact
If something looks wrong after an automated sync, please comment on the PR or ask the repository maintainer to revert.
