# ChatGPT Work｜48の独立した検証ラウンドを進める（API不要）

**実行担当：このWorkモードで動いているChatGPT自身。DeepSeek/OpenAI API・DSH CLIの利用は禁止。**
対象: `saienjoy0/saitama-` / PR #23 / branch `research/deepseek-market-harness-20261010`。

## 最重要の制約
- **48ラウンド分の「作業・検証・再開」の設計**であり、Workが48回連続で動くことを保証するわけではない。
- 以前の `reports/48_passes_20261010.md` は16家庭×訴求セル×3視点の机上レビューであり、ここで定義する48ラウンドの実行済み結果ではない。
- **48ラウンドを埋めることが目的ではない。** 各ラウンドで原典/実装状態/事業判断を点検し、証拠がない場合はBLOCKEDを記録して次の独立したテーマに進む。6件連続でBLOCKEDなら停止する。
- 実顧客面談・課金・子の2回目は現時点ではゼロ。これらを実行済みと報告しない。

## 起動手順
1. `research/market-validation/WORK_DESIGN_REVIEW_20261010.md`, `WORK_START.md`, `AGENTS.md`, `config.json`, `work48_plan.json`, `work48_state.json`, `reports/48_passes_20261010.md` を読む。
2. 可能なら `python3 research/market-validation/work48.py doctor` と `status` で現在地を確認する。
3. `python3 research/market-validation/work48.py next` で**次の1ラウンドだけ**を取得。実行状態と各資料を踏まえ、ChatGPT自身が Researcher → Critic → Strategist → Auditor で調査・反論・改善・監査する。
4. `work48/results/round-NNN.json` を作成する。JSON必須：round, stage, title, status, model="ChatGPT Work", is_real_customer_experiment=false, finding, contrary_view, decision_update, next_real_world_test, remaining_uncertainty, sources, evidence_status, new_customer_evidence=false。
5. 出典の有る結果はREVIEWED、確証がない結果はBLOCKED_NO_SOURCE/ BLOCKED_NEEDS_CUSTOMER。**実顧客証拠のない有料成約率・継続率は出さない。** 事実の裏付けにはURL/ファイル/PRと、どの主張が支持されるかを書く。
6. `python3 research/market-validation/work48.py verify` で1ラウンドの成果物とstateを検証し、GitHubにコミットする。**実際にコミットできたことを確認してから次へ。**
7. 上記をWorkタスクが使える範囲で最大4ラウンドの小バッチとして進める。利用上限・ツール・時間で中断したら、最後のstateと次回の作業位置を報告し、安全に終了する。別のWorkタスクはstateを読み、最初から再作成せず次から開始する。
8. 6ラウンド連続で確認可能な根拠が見つからなければ自律ループ停止。**48を達成したふりをしない。** 48件終了でもREVIEWED数とBLOCKED数を分ける。
9. 48ラウンドまで進み、必要な出典・反証・実験案が揃った場合は`WORK_START.md`の3報告と16セル比較の意思決定メモを作成（すでに完成したものは再作成しない）。**途中で進めるべき実験が明白なら48に達する前でも止めてよい**。

## 業務上の禁止事項
本番製品改修、PRのmainへのマージ、広告・顧客への外部送信・決済、子ども/家族の非公開個人情報のGitHubへの掲載をしない。実家族の情報が必要なら面談設計の提案として残し、人間の同意を待つ。

## Workができない場合の扱い
- WorkはユーザーがChatGPT上で開始する。PythonスクリプトはLLMを自動起動しない。
- シェルが使えず `work48.py verify`を実行できない場合は、GitHub上の計画・結果JSONとstateを手動で検査し、**未検証**であることを報告する。
- GitHubへの書き込み権限が無ければ、会話で成果物を提示し「保存した」とは言わない。
