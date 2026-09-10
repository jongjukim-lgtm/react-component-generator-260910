# PR body template (English)

Fill in the skeleton below to produce the PR body. Guidance comments (`<!-- -->`) exist to be **deleted** once filled — a PR that still carries them reads as unfinished.

Don't leave a section empty: **delete the section itself.** A body of bare headings is noise, not information. `## Why` and `## What changed` apply to every PR, so keep those.

Match the repository's voice. If its existing PRs and commits are terse one-liners, don't hand a reviewer six paragraphs; if they are detailed, don't hand them a fragment.

---

## Why

<!--
Why is this change needed? Two or three sentences.
Describe the problem or the situation, not the work — "X was broken", not "I fixed X".
Link the issue here if there is one (`#123`, or `Fixes #123` to auto-close it).
-->

## What changed

<!--
What changed and how. Three to six bullets.

Don't paste the commit list — the PR's Commits tab already shows it.
Group several commits into one bullet when they serve a single intent.
Mention file paths only when they tell the reviewer where to look.
-->

-

## Verification

<!--
**List only what was actually run.** Listing an unrun command tells the reviewer
this is verified when it isn't, and that is worse than admitting the gap.

If the repository's instructions (AGENTS.md / CLAUDE.md) name build, lint, or test
commands, use those exact commands and report their results.
If something could not be run, say so and why instead of omitting it.
-->

-

## Review notes

<!--
Optional. Use it only when you want to aim the reviewer's attention somewhere.

Worth including: design choices a reasonable reviewer might disagree with, and why;
what was deliberately left out of scope; what was deferred to follow-up work;
performance or security areas you'd like a second pair of eyes on.
Delete this section if there is nothing to flag.
-->

-

## Screenshots

<!--
Optional. Only for user-visible changes. Delete it otherwise.

If the UI changed but screenshots can't be attached here, leave one line saying so
("UI changed — screenshots to be attached by the author") rather than deleting the
section, so the gap stays visible instead of silently disappearing.
-->
