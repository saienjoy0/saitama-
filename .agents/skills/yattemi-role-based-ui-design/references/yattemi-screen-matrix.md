# Screen matrix

| Flow | Child | Parent | Grandparent |
|---|---|---|---|
| First open | “今日見つける” and skip | “今日確認する” with consent status | “孫の新聞” with read later |
| Shared artifact | submit photo/guess | approve audience and edit caption | read, react, optional question |
| Family status | see only shared status | see user-entered status + timestamp | tap “元気だよ” or write reply |
| Learning | choose one question and reflect | see evidence, not a score-only grade | see the child’s discovery in plain language |
| Failure | retry/save later | understand what needs approval | retry or switch to paper/share fallback |

## Token invariants

- One color token per semantic status; never reuse alert color for ordinary unread content.
- One verb per action across roles: “送る”, “あとで”, “返す”, “取り消す”.
- Use the same artifact ID and timestamp in all views so the family can reconcile what happened.
- Do not expose private household amounts or child notes to grandparents unless explicitly approved.
