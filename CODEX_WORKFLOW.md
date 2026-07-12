# Codex Workflow Guide - How to Review & Merge Code Updates

## The Process (Step-by-Step)

### 1. **Codex Creates Changes**
- I create a new session and work on a feature branch
- I make code changes, test them, and commit to the branch
- I create a **Pull Request (PR)** on GitHub

### 2. **You Review the PR**
Go to: `https://github.com/AstromaniacMagazine/after-dark-calendar/pulls`

- Look at the **"Files changed"** tab
- Read the code changes I made
- Check if they look correct and complete
- Ask questions in comments if needed

### 3. **You Approve & Merge**
- Click the green **"Approve"** button if the changes look good
- Click **"Merge pull request"** to merge to `main`
- Delete the branch after merging (optional but recommended)
- Done! ✅

## What You'll See in a PR

```
Title: "Add dark mode support to calendar"
Description:
- Changed files: src/theme.ts, src/calendar.tsx, styles/dark.css
- What I changed: Added dark mode toggle and styling
- How to test: Open settings, toggle dark mode
- Breaking changes: None
```

## Key Points

✅ **Review before merging** - Never merge without checking the changes
✅ **Ask questions** - If anything looks wrong, comment on the PR
✅ **Run locally** (optional) - You can pull the branch and test it locally
✅ **One PR per task** - Each update gets its own PR

## Shortcuts

- **Quick approval**: Click "Approve" → "Merge pull request"
- **Request changes**: Click "Request changes" if something needs fixing
- **Comment on code**: Hover over a line and click the comment icon

---

**Questions?** Let me know and I can explain any part in more detail.
