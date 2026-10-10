# Work開始指示｜やってみクエスト 4×4販売検証（API不要）

**このWorkタスクをあなた自身（ChatGPT Work内のモデル）で最後まで実行してください。** DeepSeekはモデルとして使用しません。DeepSeek HarnessそのもののCLI/APIも起動せず、`research/market-validation/HARNESS_PORT.md`に記載のワークフロー原理のみを使います。OpenAI API、DeepSeek API、APIキーは不要です。

対象GitHub: `saienjoy0/saitama-` のPR #23 / branch `research/deepseek-market-harness-20261010`。
既存の最新製品PR #10〜#21を含め、`research/market-validation/README.md`、`AGENTS.md`、`config.json`、`state.json`、`rounds/round-001/REQUEST.md`、2026-10-09の顧客正本と10家庭募集正本v2を確認。

**成果物**: 4つの詳細な初期顧客像、4つの販売訴求の16条件比較、競合と既存代替、購入/非購入のトリガー、親・子・祖父母の操作負担、4週間980円の仮価格、初回無料体験→有料→次月継続→離脱の具体場面、失敗条件、実顧客検証の優先順位。証拠の出所と日付を必ず明記。

**方法**: 自分で1)一次資料調査 2)架空顧客の反論シミュレーション（必ずSYNTHETICと表記） 3)厳しい反証 4)提案修正 5)根拠監査を実行。最初から結論ありきにしない。最大3ラウンド、1ラウンド最大3レビュー。新証拠がないならループしない。必要なら行動ベースの10家庭検証計画で停止。

**レポジトリ更新**: 第1ラウンドの `research/market-validation/rounds/round-001/RESULT.json` と分かりやすい `reports/round-001.md` を作成し、 `python3 research/market-validation/harness.py verify` を実行して状態を記録。コード実行が不可能なら同じスキーマを手動確認し、その限界を書く。ラウンド継続条件に達した場合のみ次へ進む。PR #23に記録しmainへ自動マージしない。

本番アプリの実装、外部への顧客連絡、子どもの機微データの公開、広告出稿、課金、自動マージは禁止。**私がモデルなので外部DeepSeekの実行環境やAPIキーの設定を求めず、現在利用できるWorkの手段で実行してください。**
