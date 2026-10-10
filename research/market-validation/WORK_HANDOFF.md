# ChatGPT Work｜販売仮説を自分で検証するための引継ぎ

**このファイルを読んだChatGPT Work自身が担当者**。DeepSeekや他のモデルに処理を丸投げしない。DeepSeek API / OpenAI API / DSH CLI / Codex CLIは呼ばない。ChatGPT Workの通常のモデル能力とブラウザ・GitHubコネクタで進める。

- PR: https://github.com/saienjoy0/saitama-/pull/23
- branch: `research/deepseek-market-harness-20261010`
- **実作業の開始文は WORK_START.md**
- `reports/first-pass-20261010.md` は最初の机上検討済み。
- `reports/48_passes_20261010.md` と `rounds/48_desk_passes_20261010.json` は**この会話で実施した48分析パス**。Work実行や実顧客面談ではない。重複作成せず、実際の裏付けが増える点から始める。
- `rounds/round-001/REQUEST.md` は実際の調査を開始する依頼書。
- `RESULT.json` は現時点では未生成、ChatGPT Workによる第1ラウンドの調査結果はまだ未検証。
- 実顧客データ、料金決済、子どもの自発的再使用は未観察。
- 売る対象は最新2026-10-09顧客研究、4家庭×4売り方、10家庭の募集R1-R4を勝手に変更しない。

## Workで最初にすること
1. ブランチを読み、最新の外部情報とGitHubの製品PRを確認。
2. モデルを外部呼出ししない。自分自身で Researcher→Critic→Strategist→Auditor の順に分析。
3. 16条件の比較を埋める。購入しない理由と既存無料代替の方を優先して発見。
4. 事実、推論、合成ペルソナ、未検証を分離し、証拠リンクを残す。
5. 第1ラウンドのRESULT.jsonをGitHubにコミットして検証。`harness.py verify`または手動同等検証。
6. 新証拠が得られた場合のみ次ラウンドへ。実顧客の行動が必要なら提案で止まる。

## 運用上の誤解を避ける
- Workは独立したChatGPTモード。このチャットからWorkを直接起動したり、未実行のWork作業を「動かした」と報告してはいけない。
- DeepSeek Harnessの目標・ラウンド・handoff・停止条件は移植したが、**DeepSeekの本物のRalph実行機能をChatGPT Workで走らせているわけではない**。
- 深堀の順番と停止を管理するのはWorkの作業指示とGitHubに保存する状態。APIを使うプログラムではない。
- GitHubに書き込めない場合は成果物を会話に提示し、保存できたとは言わない。

## 完了条件
比較が16/16埋まり、誰が買うか・買わないか、生活での利用導線、親の負担、子の2回目、祖父母の追加価値、主要競合、反証条件と最小実験が説明できる。仮想シミュレーションの数字で「売れる」と断定しない。
