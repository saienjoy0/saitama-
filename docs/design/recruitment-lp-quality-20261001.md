# 挿絵と短い会話で伝えるLPのレビュー

2026-10-01 / review-v1.8-visual / 質問票20261001-v1.4 / D66-LP in_progress

ユーザーから「文字が多すぎる、見る気が失せる」と指摘があった。買い物・照明・貯め方を3枚の挿絵と短い会話で見せ、画面と重複する説明を削った。質問の意味・選択肢・必須条件は変えない。

## 根拠と適用

[NN/G](https://www.nngroup.com/articles/imagery-in-visual-design/)の情報を伝える画像・一貫したタッチ・軽量化、[GOV.UK](https://www.gov.uk/service-manual/design/designing-good-questions)の短い補助文と必要時の追加説明、[W3C](https://www.w3.org/WAI/tutorials/images/)のaltとHTMLの文字を2026-10-01に確認した。これらを本LPへ適用することは設計上の判断。保護者の理解や申込率が改善した証拠ではない。

## 変更

- 若葉色・生成り・水彩の家族で、買い物・電気代・ゲーム代の貯め方を表示。文字は絵に焼き込まず短い会話で添える。
- 6画面は短い見出し・説明・操作画面・質問の順。主要説明5種類のtextContent文字列長は1650から846、48.7％減。質問・画面・LP全体の削減率ではない。
- 短い例を残し、追加例と計算過程を開いて読む。最初の必須質問票は閉じて開始し、未回答の確認操作で開いて該当の選択肢へ戻す。
- スマホのカード余白、細切れの会話、説明の開閉記号の誤適用を修正。評価選択肢は2列。

## 検証

ビルド・Astro・ESLint・Prettier成功。合成DOM138件成功、実行時エラー0、fetch/XHR/beacon 0。前版との差9件は画像とsrcset確認。mocked jsdomの結果で、実ブラウザー・実機の証明ではない。

最終公開版を架空の小5家庭で、出来事なし→独立した方法なし→離れた家族なし→五つの評価は判断できない→案内は回答のみ→内容確認→戻る→完了見本まで操作。必要な回答へ戻り、内容確認は中央・見出しフォーカス・scrollTop0。回答とフォーカスを保持。ヒントの展開、計算過程、案を編集してメモを操作。すべて未送信。

390/320px iframeで本文幅375/305pxとscrollWidthが一致。3画像すべて読み込み成功、短い会話と回答ボタンを確認。実スマートフォンではない。六つの動き全体の前版手動記録は正本REVIEW_V1.7.md、今回の合成確認はverification-v1.8.json。実保護者の理解・回答時間・実機・文字拡大・読み上げ・読み込みは未確認。受賞水準を自己認定しない。

## 保存と公開

正本：/workspace/sites/yattemi-family-lp。ソースc45eb7925d486e03584d3f2da158c8aa4d2d7051。正本docsのREVIEW_V1.8.md、text-density-v1.8.json、verification-v1.8.json、browser-review/empathy-v1.8.jpg、mobile-examples-v1.8.jpgに調査・手順・画面証拠を保存。生成指定と原本3点、表示用380/760px WebPも保存。760px3点合計203004バイト、380px3点69678バイト。転送量・速度の実測ではない。

所有者限定Site https://yattemi-family-lp.mituki195.chatgpt.site 、appgdep_6abe05d7f49c81918d0584393f38174f、保存版appgprj_6abd00b774cc8191b48baaedfbb0baf2~appgver_0798ffc8f5e0819194393f1840135179、succeeded。保護を維持。

開いて確認した公開入口 https://temporary-swift-canyon-uxb99qp.vercel.app/ 、確認一覧 https://temporary-swift-canyon-uxb99qp.vercel.app/review 。Vercel公式CLI62一時公開、dpl_3gB9V76QLgjuTSWEHxW7K4ajDQZC、READY。2026-10-01T07:55:58.552Z（UTC+8で15:55、日本時間16:55）に失効予定。継続は所有者の引き取りが必要。引き取りURL・匿名認証情報はソースへ保存しない。Canvaはv1.4の履歴、Figmaは編集権限エラーで未同期。

本体DESIGN/D90とREVIEW_BUNDLEを維持。正式受付の期間・時間・費用・謝礼・管理者・窓口・保存先・保存期間・削除方法は未確定。実受付・実回答保存・外部通知・ライブAIを追加しない。
