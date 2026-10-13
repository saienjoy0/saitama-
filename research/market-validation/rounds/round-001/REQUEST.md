# 第1ラウンド｜ChatGPT Work実行依頼

これは**Work上のChatGPTが自分で遂行する調査**であり、DeepSeek CLI/APIに処理を任せない。

1. `research/market-validation/WORK_START.md` と `WORK_DESIGN_REVIEW_20261010.md` に従う。
2. 既存 `reports/48_passes_20261010.md` を**仮説・反論チェックリスト**として使う。48回の実証とは見なさず、既存順位も守らない。
3. 2026-10-09の顧客正本R/O/F/B、既存10家庭R1〜R4、最新PR #10〜21の製品機能/設計の状態を確認。
4. 4つの訴求 S1裁量、S2相談、S3夕飯/生活実践、S4祖父母ギフトを全4家庭仮説に当て、16セルの顧客・非顧客判断を再評価。P4は祖父母関与軸であり独立市場ではない。
5. 必ず一次資料をソースの時点・国・母数・対象で監査し、競合（無料口頭会話/LINE/ChatGPT/みてね/金融アプリ）を比較。AI回答は購入率ではない。
6. 親と子、祖父母の具体的な操作・現実の行動・共有許可の境界、初回→2回目→4週¥980仮価格→更新/解約を具体的に分析。
7. Researcher→Critic→Strategist→Auditor の順に1回以上、改善を加える。
8. `reports/evidence-audit.md`, `reports/work-decision-memo.md`, `reports/experiment-plan.md`, `rounds/round-001/RESULT.json` をGitHub PR #23ブランチへ保存。機械的validate + 人手で読める出典と検討経路の監査を通す。
9. 初回は新証拠が増えなくても上記成果物までは完成。**証拠不足のため二回目は止めてもよい**。実課金・実家族の使用・面談が存在しなければ正直に未観察と記録する。

### スキーマv1.1の注意
各`cells`に`source_ids`（ソースに紐づくID配列、根拠がなければ[]）、`counterfactual`、`next_test`を必須。各`sources`に`id,title,url,claim,checked_on,limitations,source_status`を必須。`evidence_delta`の要素は`source_id,new_fact`を持つ辞書のみ。3点のレポートを保存してから`verify`。数を埋めただけの合格を目的にしない。

本体の製品コード、親子の個人データ、外部への送信、広告、決済、公開、マージはしない。
