# UI system and role screens v0.1

Status: DESIGN / proposal, not implemented.

## Principle

One family story, three jobs. Visual consistency creates trust; role-specific hierarchy creates usefulness. We adopt selected Ogenki functions as product capabilities, not its screens or backend.

## Shared system

Use one semantic token set for surface, text, accent, success, warning, destructive, unread, and consent. Use the same artifact ID, timestamp, status labels, verbs (“送る”, “返す”, “あとで”, “取り消す”), back behavior, confirmation pattern, and plain-language error style across roles. All primary touch targets are large enough for the least dexterous user; text can scale; contrast and screen-reader labels are required. Never use a health-like red/green status unless the user explicitly entered it and its meaning is shown.

## Role surfaces

| Role | Home promise | Primary screen | Secondary screen | First success |
|---|---|---|---|---|
| Child | “今日、家の仕組みを一つ見つける” | Explore/quest card | My album + reflection | save a guess/photo and choose next action |
| Parent | “家族の共有と学びを整える” | Review inbox | Growth album + consent/settings | approve one artifact audience |
| Grandparent | “孫の今月が届く” | Family newspaper | Reply / 元気だよ | read one story and optionally respond |

## First-run flows

Child: choose 今日の発見 or あとで -> see one household question (water first candidate) -> make a guess -> optional photo/note -> save. Parent: explain sharing and record the child’s expressed choice, choose which fields may be shared, invite grandparent, preview first newspaper. Grandparent: open large-type newspaper -> read -> tap 元気だよ, reply, or later. No reply is a valid completion.

## Ogenki capability adoption

Adopt: photo capture/delivery, newspaper-like family update, optional reactions/questions, explicit 元気だよ, invite/member concept. Rebuild: authentication, tenant/group isolation, message ownership, read state, retry/error state, audit trail, deletion/withdrawal, and all health-adjacent wording. Do not reuse Ogenki’s global status inference, unauthenticated message/user routes, client-supplied sender identity, or failure UI that claims success.

## Screen inventory for design review

1. role-aware onboarding and consent
2. child explore
3. child quest detail / guess / submit
4. child reflection and album
5. parent review inbox
6. parent growth album
7. parent sharing/consent settings
8. grandparent newspaper
9. grandparent reply / 元気だよ
10. notification and offline/error states
11. operator delivery/audit view (not family-facing)

## Acceptance checks

A role identifies its next action within five seconds; every screen has skip/later; no child private note leaks to grandparent; a grandparent can complete without typing; parent can revoke future sharing; every send has an explicit approval and audit event; failure never displays success; the same artifact reconciles across all three views.

## Open decisions

The proposed defaults below resolve the initial numerical choices. Human review and actual device/usability checks remain outstanding.



## 実装へ渡す共通仕様の初期値（レビュー用）

- 本文はsystem-ui＋日本語システムフォント。子・親16px、祖父母20px、行間1.6。大きな文字に拡大しても操作を残す。
- 全役割の主要タッチ領域は48×48 CSS px以上。祖父母の主要ボタンは高さ56px以上。
- 色の初期値：背景#FFFDF7、本文#172B2A、主操作#176B5B＋白文字、補助背景#EAF4F0、注意#754B00、削除#A12828。色だけで状態を伝えない。実装時に実際の組合せのコントラストを検証。
- 共通の間隔単位は4/8/12/16/24/32px、カード角丸16px。装飾アニメーションを操作完了の条件にしない。
- 共通用語：下書き／確認待ち／共有済み／取り消し済み／未送信。AI生成には「AIの提案」、本人原文には「本人のことば」。
- 子：1画面1判断。「やってみる」「別のテーマ」「あとで」。予想→確かめる→記録するを明確に分ける。
- 親：確認待ちの件数・何を誰へ共有するかを優先。下書き原文と提案、写真の写り込み、宛先を同じ確認面で見られる。
- 祖父母：新聞の本文が先、返信は任意。大きな「読んだよ」「経験を返す」「あとで」。元気ボタンは新聞の既読操作と分離。
- 通知：M1はアプリ内新着のみ。祖父母の返事を催促する自動通知は作らない。紙は家庭で印刷できる補助。印刷後の撤回は回収を保証できない。
- 画面の内部識別子は検証用に保持するが、DB IDやトークンを製品画面の説明に露出しない。

## 最初の一周の画面と例外

| 画面 | 主操作／サンプル | 例外と戻り先 |
|---|---|---|
| 子のテーマ | 「同じコップで、水の量を比べてみよう」→選ぶ | 辞退はホーム。水を出し続ける課題にしない |
| 予想 | 「どちらが多いと思う？」→一言を保存 | わからない／写真なしを許容 |
| 確かめた記録 | 「予想と何が違った？」→記録を保存 | 通信失敗は未送信。再試行で二重登録しない |
| 子の共有選択 | 「この発見を家族に見せる？」 | 「見せない」で本人＋管理する親の記録に残る |
| 親の確認 | 原文、AI提案（利用可の時だけ）、写真、宛先→送る | 編集後は旧承認失効。本人の共有拒否は覆せない |
| 祖父母の新聞 | 一つの発見→読む | 返信なしでも完了。未参加でも子の体験は完了 |
| 家族の返信 | 「昔はどうしていたか」を任意入力 | AIが祖父母になりすまして書かない |
| 次のたね | 「次に確かめたいことは？」→選ぶ | 返答がなければ固定教材、または終了 |

上記は料金の一般化や厳密な水道料金の計算を目的にしない。量・使い方・暮らしの仕組みの発見として扱い、金額に進む時は確認済み教材値を使う。

## 端末・アクセシビリティの確認予定

スマホWebを第一候補、検証幅360/390/768 CSS px、縦横、文字200%拡大、キーボード、スクリーンリーダー、写真権限拒否、低速・オフラインをPLANでテストへ落とす。対象ブラウザー版はPLAN時に確定する。五秒で次操作が分かるかは利用者観察の目標であり、未測定。

## 入力の見え方

「非共有」は祖父母等へ公開されない意味。管理する親が子の未共有記録を読めることは開始時に子にも説明する。親にも見えない秘密の日記だとは表示しない。家庭間・子ども間の権限はサーバーで判定する。
