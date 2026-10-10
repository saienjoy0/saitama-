# ChatGPT Work引継ぎ｜DeepSeek公式Harness×4売り方の反復検証

## 現状（2026-10-10）
- GitHubブランチ: research/deepseek-market-harness-20261010（本体は変更なし）。
- 調査基盤: research/market-validation/{README.md,AGENTS.md,config.json,harness.py,state.json,reports,rounds}。
- 第0ラウンドの初期レポートは書き込み済み。16条件の初期反論と、10月9日最新顧客像の整合性チェックが完了。
- 第1ラウンドの依頼書は準備済み。**公式DSHでの実行・仮想顧客インタビュー・実顧客検証は未実施**（MODEL_NOT_STARTED）。
- 公式ランタイムはMITのDeepSeek Harness 0.2.0-rc.2。正規npm依存を固定して使用。sourceを製品に丸写ししないのは、preview版の追跡・セキュリティ・保守性のため。
- 現在のPROJECT_STATEはDESIGN/D90で、本番製品実装・実家族通信の許可を意味しない。

## Workへの具体的依頼
1. このブランチとPRをcheckoutし、research/market-validation/README.md と AGENTS.md を読む。
2. Python標準ライブラリのみのオフラインテストとdoctor/statusを実行して、まず環境を検証する。
3. research/market-validation/{checkout-upstream.sh,install-marketing-skills.sh} と両lockを確認し、MIT原本・固定commitの上流ソースとマーケティング4スキルを取り込む。既存同名スキルは上書きしない。
4. DeepSeek公式のタグ dsh-v0.2.0-rc.2 とMIT/注意事項を確認し、利用規約・credential・workspace-writeの範囲をチェック。APIキーが未設定なら人間に設定を求め、キーを記録しない。
4. research/market-validation/harness.py の run を実行し、初回実行の出力 RESULT.json があることを検証する。失敗時はモデル呼出し成功と偽らず原因を記録。
5. 最大3ラウンドで Researcher→Critic→Designer を反復し、各回について16セル・引用根拠・対抗仮説・実家庭テストを保存。証拠が更新されなければ停止。
6. 実顧客検証の欠落が分かったら、10家庭R1-R4の募集正本を変更せず、面談・無料体験・有料提示で何を測るべきかを優先順で報告。
7. PRをレビューに残す。合成顧客や架空の数値を根拠とした本番のマーケティング支出・公開をしない。

## 安全境界
顧客情報（特に未成年）、リアルな面談音声、健康・家庭財務情報はこの公開/共有レポジトリへ投入しない。外部AIモデルへ送信する前に出典/同意/権限を確認。実際の購入率・無料体験完了率・祖父母参加効果は現在未知。料金980円は従来製品書の実験案。

## 受入条件
- Offline CI green.
- 16/16セルの仮説と反論を保持。
- 参照URLとその主張が対応し、鮮度・母数・限界を明記。
- 実顧客なしの自律ループは "NEEDS_REAL_CUSTOMERS" で停止。
- どの顧客に何を売るべきかに加え、具体的な反証条件と、親/子/祖父母それぞれの利用ストレスを説明する。
