# 募集LPの品質レビュー — 2026-10-01

最新版 review-v1.9-buying / 質問票20261001-v1.4 / D66-LP in_progress。本体DESIGN/D90は変更なし。

電気代0.15円/時間では小さすぎて逆効果、使用量の単位も分かりにくいという指摘を受け、中心を「欲しいゲーム、どう買おう？」へ変更。新品6,000円・中古3,500円・差2,500円を同じゲームの説明用の仮価格として大きく並べた。実在の販売価格や実際の節約額ではない。値段から動作・付属品を確かめ、親と相談する。動作を確認できなかったので、今回は買わずに待つ、という判断も見せる。

任天堂の公式商品ページで税込希望小売価格6,578円の例を確認したことは数千円という規模の参考であり、LPの仮価格の出典ではない。J-FLECの小学校高学年向け教材でお小遣いと買い物の扱いを確認。ゲームの例が保護者・子どもに通じるという設計仮説は、実家庭で未検証。公式参照先：

- https://www.nintendo.com/jp/switch/acbaa/products/soft.html
- https://www.j-flec.go.jp/materials/standard_primaryschool_3/
- https://www.j-flec.go.jp/materials/okozukai/

同じゲームの二つのケースを比べる子どもと、親が聞く場面を内蔵画像生成で作成。若葉色・生成り・水彩を維持。原本public/images/hero-game-compare-v1.pngと六つのWebPをSiteソースに保存。数値は画像に埋め込まず正確なHTMLで表示した。冒頭にも価格を並べ、後半を読まなくても題材が分かるようにした。

主要説明の五種類のブロックは前版846→800文字、5.4％減。6場面の説明は369→307文字。質問・画面を含むLP全体の削減率や読み時間ではない。質問の意味・選択肢・必須条件、五つの体験評価は変更していない。題材は変わったためLP版を識別し、旧版の評価と混ぜない。

最終ソースでbuildとnpm run check成功。Astro91ファイルにエラー・警告・ヒント0、ESLintとPrettier成功。合成DOM138件成功、実行時エラー0・fetch/XHR/beacon 0はmocked jsdom内の結果。

公開ブラウザーでは架空の小5保護者役で、未回答なら質問票を開いてQ02へフォーカス→出来事なし→独立した方法なし→離れた家族は当てはまらない→案を編集→五評価は判断できない→懸念不明と短い理由→回答のみ→中央・見出しフォーカス・scrollTop0の確認→戻って回答とフォーカス保持→明示的な未送信完了を確認。最終390/320pxのCSS iframeはhtmlのscrollWidth/clientWidthが375/375・305/305px。価格カードも117/117・82/82pxで内部にはみ出さない。両方の価格と320pxの追加確認事項を目視確認。実際のスマホによる検証ではない。

公開入口：https://temporary-speedy-oboe-5ndzqq8.vercel.app/

画面・テーマ・案内役・動き・参加条件の確認一覧：https://temporary-speedy-oboe-5ndzqq8.vercel.app/review

Vercel公式CLI62、dpl_GLYTBKKZBs2A3BqVB8dBXX1g3huk READY、失効予定 2026-10-01T08:42:40.474Z。所有者の引き取りまで恒久公開ではない。引き取りURLと匿名認証情報はGitに保存しない。所有者限定Site https://yattemi-family-lp.mituki195.chatgpt.site の同じ保護を維持し、appgdep_6abe1204d5f4819197370fd16307fa34 succeeded、版 appgprj_6abd00b774cc8191b48baaedfbb0baf2~appgver_622c0438d968819194ef9abf36921966。

保存ソース 351be427ad9f471732480a80f3dee6c79dd85146。生成指定・詳細・確認結果は/workspace/sites/yattemi-family-lp/docs/REVIEW_V1.9.md、text-density-v1.9.json、verification-v1.9.json。画面証拠は同ソースdocs/browser-review/hero-v1.9.jpgとcomparison-mobile-v1.9.jpg。旧版の挿絵・質問照合・動きの検証はSiteソースのv1.6〜v1.8履歴に保持。Canvaはv1.4の履歴、Figmaは既存の編集権限エラーで未同期。最新の画面・文言はSiteのLPと確認一覧を正本とする。

実保護者が対象・子どもと親の役割・次の行動を説明できるか、回答時間、実機・読み上げ・読み込み速度、受賞水準は未判定。D66-LPを完了・受賞水準到達と自己認定しない。実家庭データ・回答受付・API/DB・ライブAI・外部通知は追加していない。
