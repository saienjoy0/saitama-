# Round 001｜ChatGPT Workの自分自身による販売検証（API不要）

最初に `research/market-validation/WORK_START.md` を読み、そのタスクを **Work内のChatGPT自身** が実施する。DeepSeek API/DSH CLIを使わない。

実行範囲: 販売訴求S1「任せる範囲」/S2「お金の相談」/S3「週末の夕飯」/S4「祖父母ギフト」を、候補家庭P1「裁量権」/P2「お金の相談摩擦」/P3「体験準備」/P4「祖父母参加」すべてに当てる16条件。

調査 → 想定顧客の反論を合成仮説として抽出 → ChatGPT自身が敵対的にレビュー → 改善 → ソースと事実の監査。

GitHubの2026-10-09顧客資料を優先し、mainだけでなく製品PR #10〜21を調べる。
R/O/F/Bは面談後分類。R1〜R4の10家庭募集条件は維持。共働き/投資経験/富裕層を無根拠に必須条件にしない。

必要: 親の購入動機、子どもの自発的二回目、現実の行動、親の新たな承認負担、祖父母の自分の近況投稿、既存無料代替、4週間980円の仮価格、辞める理由と反証条件。
世帯や購入率の推定をでっち上げない。親が相談しない家庭への無理な説得はしない。

出力: `research/market-validation/rounds/round-001/RESULT.json` （config.jsonの結果契約：16セル）
追加レポート: `research/market-validation/reports/round-001.md`
その後 `python3 research/market-validation/harness.py verify` （利用可能な環境の場合）。
新しい実在する証拠がないならNEEDS_REAL_CUSTOMERSで停止。Workでの結果保存ができなければそれを明示。
