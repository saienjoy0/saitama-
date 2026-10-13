# シミュレーション開始：保存・検査・再開記録

2026-10-10／S1・S2。主成果：[9テストカード](sim-test-cards-20261010.md)、[採算境界](sim-economics-boundaries-20261010.md)、[Codex受入条件](../SIMULATION_CODEX_ACCEPTANCE_20261010.md)。

## GitHub保存を実際に確認した範囲

- PR #23、研究ブランチ `research/deepseek-market-harness-20261010`。
- 開始SHA：`5bf75dd5089364e63cea34c7cb796f7eef5fcf4e`。保存前に新しいOSS採用レビューを取り込み、最新 `cec8cbf032a934e958358aa9f8493db377a50f9d` を親にした。
- 成果の保存コミット：[b8f7fed22207a9303df20e2474f074bd3d1081a0](https://github.com/saienjoy0/saitama-/commit/b8f7fed22207a9303df20e2474f074bd3d1081a0)。
- 非force・expected_sha付きで研究ブランチを更新し成功。変更11ファイルを上記コミット指定でGitHubから再取得し、作成した内容とすべて完全一致。
- 本記録はこの照合後に追加した。自身の保存確認コミットはGit履歴と最終回答を参照する。記録があるだけで別Workの再開成功を意味しない。

| 再取得して一致したファイル | SHA-256 |
|---|---|
| research/market-validation/README.md | `a0662ff3a29ed6c714c294454615badf673a4848a15b934fd4b9b55754bbc02f` |
| research/market-validation/WORK_HANDOFF.md | `21a95dd6bb55bae13d2dba7cadacff50f1f5b420a2ce85cc1d81919e4424d9be` |
| research/market-validation/simulation/README.md | `f9032cd69246a94d26c34a9993d48be3bfd4fd55c97ade2d377b5e5ddc9d9a5e` |
| research/market-validation/SIMULATION_CODEX_ACCEPTANCE_20261010.md | `675ce04563690c316e6125bd1d82e21e7847c5d7473ec8e050a4694df43f23f2` |
| research/market-validation/reports/sim-test-cards-20261010.md | `82d5992e6d46aa0eb04efdef15fb03632a41097729399099fa4c4c3551d02b6a` |
| research/market-validation/reports/sim-economics-boundaries-20261010.md | `c85f0bc81968244e593903ef7603708c1f5d1e43359167d81cd419e496506b18` |
| research/market-validation/simulation/run-fixed-demo-probes-20261010.mjs | `25bad2e90557e26b9579204b2a6a92164493b76b6a479ec38dfed09aad05e519` |
| research/market-validation/simulation/verify-economics-boundaries-20261010.py | `7814a91c5c429347a0f95c9e8f4803ebf26f6254c11af4f6fdd2c0ff7e7a205e` |
| research/market-validation/simulation/sim-case-fixtures-20261010.json | `49f5d34691b80d663251ebe637bb34c0dde5116179284ec46140f08ddce00b0c` |
| research/market-validation/simulation/sim-function-results-20261010.json | `b1e5a20c3cc0451ff83423e92957795dc4c5ce75a00a8ffce95f35f41614c352` |
| research/market-validation/simulation/sim-economics-results-20261010.json | `d9615f86096405e8fea58206b97a139aec23d29f18ebbd686f65ccbeb7903be8` |

## 実行済み／未実行

| 検査 | 結果と限界 |
|---|---|
| 固定デモ部品検査 | PR #14固定SHAの既存関数を9合成入力で実行。拒否・不要の正の希望への分類、NO専用分岐の欠落、文具・趣味費の範囲差を記録。全部品/全画面のE2Eではない |
| 画面検査 | Playwright Chromium起動を試み、実行ファイル不足でBLOCKED_ENVIRONMENT。UI実行0件。製品不具合の判定ではない |
| 紙・競合 | 同条件の仕様／作業案比較。家庭での実作業と競合アプリの操作は未実行 |
| 汎用AI | 親が入力する共通条件・期待動作を準備。実ChatGPT製品の操作や外部APIは未実行 |
| 旧収益コード診断 | 単発も2回目後購入に限定される挙動を実行再現。null率は拒否された。前払モデルの代わりに使用しない |
| 採算再検算 | 共通仮条件で支援時間・技術費・CAC・更新の符号と分岐を算術確認。予測なし |
| 既存オフライン検査 | `python3 -m unittest discover -s research/market-validation -p 'test_*.py' -v`：29件PASS。V2回帰条件の実装や実家庭成果を証明しない |
| GitHub CI（成果コミット） | b8f7fedのMarket validation harness run99とVendored upstream regression run10はcompleted/success。UI・家庭・V2の実行証拠ではない |
| 文書検査 | render_current、check_design_handoff、git diff --check通過。CURRENTは元と一致。本体テストは未実行 |
| カードの整合 | 9固有ID、各4対照、固定入力・期待・観測・未知・出典・失敗・家庭測定の項目、ローカル参照を確認 |

## 維持した正本・状態

保存前にHEADとのbyte一致を確認したもの：CURRENT、本体PROJECT_STATE/REVIEW_BUNDLE、10家庭募集正本、問題面談票、方法論、simulate.py、state.json、work48_state.json、追加OSS採用レビュー。商品コード・既存顧客選定・旧成果・40件eval仕様を改変していない。DESIGN/D90、実装ゲート、work48の0/48を維持。

今回の外部家庭の面談・実利用・支払は未観測。架空の顧客の声・購入率・継続率を追加していない。旧創業家庭alphaの履歴とは別。顧客連絡、決済、広告、外部LLM、本番変更、mainマージなし。

## 次回の入口

1. 9カード→Codex受入条件→部品と算術のJSONログを読む。未実行列を保持し、単なる文章再生成で検証件数を増やさない。
2. 実装許可の範囲で拒否・不要・親のNO・家計制約・範囲外をUIの入口から下流まで検査。修正後ログを別ファイルで残す。一般化や実LLMが未接続なら提供範囲を限定する。
3. S3は既存10家庭計画に従い、説明前の問題面談、子本人の任意参加、紙との現実の比較、条件確定後の実支払を別工程で進める。今回のカードは問いを決める材料であり家庭の代理ではない。

A/B/Cの需要順位は合成結果から変更していない。前進した判断は「A/B向け一般買い物支援は現デモでは未対応」「拒否・不要の受入を先に確認する」「支援時間・CAC・無料原価・実更新を測らないと採算を確定できない」の三つ。
