# UI設計レビュー v2

[設計判断・導線・状態](../../design/ui-review-20261007.md)を先に読む。

| 画面図 | そのまま見る | 編集用の原図 |
|---|---|---|
| 記録→親の確認→新聞 | [sharing.png](sharing.png) | [sharing.svg](sharing.svg) |
| お金・特典・任せ方 | [money.png](money.png) | [money.svg](money.svg) |
| 祖父母の近況・アルバム | [grandparent.png](grandparent.png) | [grandparent.svg](grandparent.svg) |

[操作と状態の合成見本](index.html)：ダウンロードしてブラウザーで開く。役割・画面・状態・文字サイズを変えて確認する。

12画面、320／360／390／768px × 文字100／200%の96配置、原文の引継ぎ・保存失敗・任意共有・成人本人の発信・ポイント予約、キーボードとaxeの検査が通過。[実行証拠と原図／PNGの照合情報](verification.json)／[CI実行](https://github.com/saienjoy0/saitama-/actions/runs/37512909078)。

架空の例。表示の変化は模擬であり、保存・送信・残高変更は実行しない。固定の例を実家庭の初期値にしない。写真・音声・AI・金融練習・印刷等は個別S機能の実装対象。製品実装・利用者理解・実端末は未検証。
