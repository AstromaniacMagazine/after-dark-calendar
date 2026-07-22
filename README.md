# After Dark Calendar

This repository contains the production website files for **After Dark Calendar by Astromaniac Magazine**.

## Folder structure

- `index.html` - main web page
- `assets/` - CSS, JavaScript, images
- `data/` - month and shared data files
- `scripts/validate-calendar.mjs` - release-time source and data integrity checks
- `*.zip`, `archive/`, `July 26/` - local archives (not required at runtime and excluded from Git)

## Release workflow

The working production copy lives at:

`G:\My Drive\After Dark Calendar\After Dark Codes`

For each version:

1. Create a release branch from the latest `origin/main`.
2. Edit the production files directly in this repository root.
3. Run `node scripts/validate-calendar.mjs` and complete responsive browser checks.
4. Save three release snapshots in `G:\My Drive\After Dark Calendar\Snapshots`:
   - `ADC_LIGHT_<VERSION>.png`
   - `ADC_DARK_<VERSION>.png`
   - `ADC_RED_<VERSION>.png`
5. Review the diff, commit only the intended release files and push the branch.
6. Open a pull request to `main`, merge it, and verify the GitHub Pages build.
7. Confirm the embedded calendar at `https://www.astromaniacmagazine.com/after-dark-calendar` is serving the new version.

## Notes

- Do not copy `.git` or local archive folders into a release.
- ZIP archives and historical working folders are ignored to keep production commits clean.
- Month data must cite its sources and pass the validation script before release.
- Always review the exact staged diff before committing or merging.
