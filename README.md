# After Dark Calendar

This repository contains the website files for **After Dark Calendar**.

## Folder structure

- `index.html` - main web page
- `assets/` - CSS, JavaScript, images
- `data/` - month and shared data files
- `*.zip` - optional archive files (not required for runtime; excluded from this repo by default)

## Updating the repo with a new local version

1. Open PowerShell.
2. Run this command (copy/paste):

```powershell
$src="G:\My Drive\After Dark Calendar\After Dark Codes\July 26"
$dst="C:\Users\kasra\Documents\GitHub\after-dark-calendar"
robocopy $src $dst /MIR /XD .git /XF .git /R:1 /W:1 /NP
```

3. Open GitHub Desktop.
4. Review changed files.
5. Commit and push your branch.
6. Create a Pull Request to `main`.
7. Merge Pull Request and click **Confirm merge**.

## Notes

- `/MIR` mirrors the source exactly (including deletions).
- `.git` is excluded so Git history stays safe.
- ZIP archives are excluded by `.gitignore` to keep commits smaller and cleaner.
- Always review changes before merging.
