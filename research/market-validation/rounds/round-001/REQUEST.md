# Round 001｜DeepSeek Harnessによる初回市場検証の実行依頼（準備済み・モデル未実行）

目的: 4つの販売メッセージS1〜S4を、4つの家庭像P1〜P4すべてに交差させて、16条件の顧客導線と重大な反論を調査する。

モデルへの必読ファイル:
1. research/market-validation/AGENTS.md, README.md, config.json
2. research/market-validation/reports/first-pass-20261010.md
3. 10月9日更新の親子顧客正本R/O/F/B、H1/H2比較、祖父母効果研究
4. 10家庭募集正本R1-R4（募集を変更しない）
5. PR #10〜#21の製品/親向け気づきレポート/子供/祖父母/デモ設計

Researcher: 外部一次資料の確認可能な事実と、各セルの「なぜ今買うか」を整理する。
Critic: 親の手間増、二回目継続、LINE・ChatGPT・みてね・money ringなどの代替、祖父母の権限衝突、無課金の可能性を必ず批判する。
Designer: 保護者の訴求→体験→有料4週間980円の仮説提示→継続・離脱の実顧客検証手順を提案する。

必須16セル: P1×S1/S2/S3/S4、P2×S1/S2/S3/S4、P3×S1/S2/S3/S4、P4×S1/S2/S3/S4。
result_json_path: research/market-validation/rounds/round-001/RESULT.json

出力にはconfig.jsonの結果必須キーと各セル必須キーを満たすJSONを**実際に書き込む**。
実測データが増えなければstatus=NEEDS_REAL_CUSTOMERS。架空の購入率・継続率を捏造しない。
結果がなければ実行成功と報告しない。書き込み先は本ラウンドのみ。本番製品と顧客に触らない。
