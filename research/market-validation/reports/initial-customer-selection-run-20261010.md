# 初期販売対象選定：今回の作業記録

2026-10-10 / ChatGPT Work / PR #23。

## 作業範囲
顧客検証系統 VAL-01、研究専用。成果物は初期販売対象の経営判断、出典監査、候補別条件付き採算、最大3つの実家庭仮説。完了条件は同一基準による3〜5候補比較、暫定第一〜第三候補と撤回条件、研究ブランチへの保存と再取得。

## 改変前の参照と対象
- WORK_DESIGN_REVIEW_20261010.md / reports/work-decision-memo.md：既存P1×S1を維持するためでなく再検証する。新規判断報告へ差分を保存し旧総括を保持。
- 10家庭募集正本：R1〜R4を保持。P1〜P3は課題、R/O/F/Bは面談後条件、祖父母は別軸。
- simulate.py：現行は購入を自発的2回目の後に限定。単発前払との比較に制約。V2境界を確認して修正指示を残す。
- 今回検索・本文確認する競合、親調査、学術研究、埼玉の窓口：候補別価値・反証・販売経路の判断へ使用。競合価格を当社支払意思の証拠にしない。

## 保存経路検証
このファイル作成と同じrefでの再取得を最小のGitHub読み書き検証とする。外部LLM API、連絡、決済、広告、本番変更、mainマージは実施しない。

作業開始時点の需要・価格・継続は未実証。進行記録を完成した判断報告と混同しない。

## 今回の完了成果

- [経営判断](initial-customer-selection-20261010.md)：5候補を同じ基準で比較し、A裁量拡大の移行期（単発）／B反復する例外相談／C学習後の家庭実践停止を暫定第一〜第三へ。課題・無料代替・本人目的・購入時点・経路・撤回条件を明示。
- [原典と反証](initial-customer-evidence-20261010.md)：公開一次資料E01〜12、閲覧失敗、既存事実と新確認を分離。
- [採算条件](initial-customer-economics-20261010.md)：候補共通の30感度ケース、人数条件8ケース、無料試用後8ケース。全てSYNTHETIC、需要予測なし。
- [実家庭検証](initial-customer-validation-20261010.md)：既存10家庭の募集・面談正本を維持しH-A/B/Cの三仮説へ接続。
- [Codex修正指示](../INITIAL_CUSTOMER_CODEX_HANDOFF_20261010.md)：既存の購入タイミング制約を再現、販売方式別式とV2の受入試験を明記。コード修正未実施。

## 実施した検査（ローカル、2026-10-10）

| 検査 | 結果／限界 |
|---|---|
| `python3 -m unittest discover -s research/market-validation -p 'test_*.py' -v` | 既存29試験PASS。合成fixtureの構造・算術・互換であり顧客需要の実証ではない |
| `skill_router.py audit` | 12スキル・57ファイルの固定blob照合PASS。上流commit 1efedbc5148b54b2f0f6c6c9fe0be62e151c7fff |
| `harness.py doctor/status`、`work48.py doctor/status` | 非LLM制御を確認、BLOCKED_REAL_CUSTOMERS維持、work48はnext=1/reviewed=0/blocked=0。verifyで次へ進めていない |
| 既存コードcompile、bootstrap shell syntax、既存simulate例の実行 | PASS。旧結果はscratchの一時出力で需要証拠として保存しない |
| `scripts/render_current.py`→`scripts/check_design_handoff.py` | PASS。CURRENT・本体状態は元の内容と一致。製品テスト・家族PoCは未実施 |
| 新計算のDecimal独立再計算 | 30感度＋8人数＋8試用条件の式・分岐を確認。分岐人数とその1人前の利益符号を検査 |
| ローカル文書リンク・保護対象・diff | 相対リンク存在、募集正本・面談票・simulate・両state・PROJECT_STATE・CURRENTの7ファイル不変、diff空白検査PASS |

## GitHub保存・次回入口

開始時headは `c271694916971637e25c3c0131f2fc27b07d37ed`。最小read/write/readbackのprobeは `924dd0f24f64b6ae579dd12a4ca90fa652160418` で成功。成果一式はexpected head照合・非forceの一コミットで研究refへ保存する。最終コミット指定再取得・内容一致とCIの観測は、完了後にこの欄へ追記する。

次回は経営判断→出典→検証接続→採算→Codex指示。最優先は同意済み実家庭の残存・無料代替差・自己資金支払と原価。既存stateは変更していないため、統合成果はこの記録とGitHubコミット履歴から再開する。V2の新RESULT専用CI・可変順序・別Work再開E2Eは未実装／未受入。48回完了を宣言しない。
