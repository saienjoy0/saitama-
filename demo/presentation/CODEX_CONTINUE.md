# Codexへの引き継ぎ：最後のブラウザ確認と修正

目的は発表プレビューとして優秀なこと。新規実装は完了し、ここから作り直さない。
ブランチ `codex/presentation-demo-20260923` の `demo/presentation/` を使う。
最初にルートAGENTSと状態・本READMEを読む。本体のDESIGN/D90は維持。既存 `prototype/gakusta/index.html` は変更しない。

## 次に行うこと

1. `cd demo/presentation && npm ci && npm run build && npm test`。
2. この環境に実際にあるブラウザ能力/スキルの本文を読み、利用可否を確認。ローカルURLが利用可能なら `npx playwright install chromium && npm run test:browser`。ポリシーで拒否された場合は回避しない。前セッションはCloud Browserのlocalhost/file URL制限でここまで未実施。
3. 1280×720と390×844の画面キャプチャを実際に開いて見る。子どもは探索・比較、親は確認、祖父母は紙面で明確に違うか。はみ出し、文字の小ささ、長いスクロール、紛らわしい主操作を直す。CSSの検査だけで済ませない。
4. READMEの約100秒のクリック順を実操作し、所要時間を測る。共有しない/保留/返信/無返信の全経路と、リセット・共有撤回を確認。
5. 文字200%、キーボード、OS reduced motion、固定ヒントと模擬AIの区別、AIなしの完走を確認。
6. 合格後、READMEの「未確認」を実測結果に更新し、画面バックアップをまとめる。`npm run build` を再実行し、`presentation-offline.html` をChrome/Edgeで単体確認。発表者へ起動手順と画面を渡す。
7. 同じ専用ブランチに変更を保存。mainへのマージ、製品BUILDへの遷移、公開、実AI接続は行わない。

## 注意すべき具体点

- 一般的な管理画面テーマへ置き換えない。子どもは単なる長文フォームにしない。
- 全役割は同じreducerの同じ版を参照。拒否・保留を見た目だけで実装しない。
- Playwrightテストは準備・列挙済みだが未実行。失敗をアプリの不具合とテストの指定間違いに切り分ける。
- `npm run build` は型検査とオフラインHTML生成を含む。依存はlockfileで固定。
- ブラウザ試験結果・スクリーンショットを捏造しない。教育効果や子どもの楽しさは実利用者には未検証。
