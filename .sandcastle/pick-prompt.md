# Context

## Open issues

!`gh issue list --state open --label Sandcastle --limit 100 --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`

The list above has already been filtered to issues ready for work and is the sole source of truth for what work exists. Do not run your own unfiltered query to find more issues.

## Open PRs (issues already in flight)

!`gh pr list --state open --json number,title,body --jq '[.[] | {number, title, body}]'`

## Recent RALPH commits (last 10)

!`git log --oneline --grep="RALPH" -10`

# Task

You are selecting the next issue for RALPH, an autonomous coding agent, to implement. This
phase only picks — do not modify the repo, comment on issues, or run anything beyond read-only
`gh`/`git` inspection.

## Priority order

Work through issues in this order:

1. **Bug fixes** — broken behaviour affecting users
2. **Tracer bullets** — thin end-to-end slices that prove an approach works
3. **Polish** — improving existing functionality (error messages, UX, docs)
4. **Refactors** — internal cleanups with no user-visible change

Pick the highest-priority open issue that:

- is not blocked by another open issue, and
- is not already referenced by an open PR (check each open PR's body for `#<number>` or
  `Closes #<number>` against the issue list above) — that issue already has implementation in
  flight awaiting human review/merge, so skip it.

# Output

Output the chosen issue's number and title as:

<issue>NUMBER|TITLE</issue>

For example: `<issue>42|Fix login redirect loop</issue>`

If the open-issues list above is empty, or every issue in it is blocked or already has an open
PR, output:

<issue></issue>
