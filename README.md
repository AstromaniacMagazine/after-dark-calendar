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
4. Save four standard high-resolution full-page release snapshots in `G:\My Drive\After Dark Calendar\Snapshots`:
   - `ADC_LIGHT_<VERSION>.png`
   - `ADC_DARK_<VERSION>.png`
   - `ADC_RED_<VERSION>.png`
   - `ADC_TEAL_<VERSION>.png`
   Use `scripts/capture-release-snapshots.mjs` to produce full-page, 2x-resolution PNG files and verify their PNG signatures and dimensions. Do not generate 3D, perspective or depth-of-field variants.
5. Review the diff, commit only the intended release files and push the branch.
6. Open a pull request to `main`, merge it, and verify the GitHub Pages build.
7. Confirm the embedded calendar at `https://www.astromaniacmagazine.com/after-dark-calendar` is serving the new version.

## Notes

- Do not copy `.git` or local archive folders into a release.
- ZIP archives and historical working folders are ignored to keep production commits clean.
- Month data must cite its sources and pass the validation script before release.
- Full Moon entries must include a popular traditional name in `Name (Full Moon)` form, cite the naming source, and retain the exact astronomical phase time when available.
- The public “Current version” panel must contain only the latest three release entries.
- Always review the exact staged diff before committing or merging.

## Version numbering

- Use a new tenth-level beta (`Beta0.6`, `Beta0.7`) for substantial features, data-model changes or meaningful performance and UX work.
- Use a letter suffix (`Beta0.6a`, `Beta0.6b`) for smaller follow-up fixes to the same release.
- Do not change the public version for routine source checks that produce no material user-facing change.
- The validator checks that the root data attribute, visible badge, version panel and structured data all identify the same release.
