---
name: yattemi-market-validation
description: ChatGPT Workが自分のモデルで4訴求×4候補家庭を反復検証するためのスキル。外部LLM/API不要。2026-10-09顧客正本と製品PR #10-21を優先。
---

# ChatGPT Work用 やってみクエスト市場検証

起点: `research/market-validation/WORK_START.md`、`README.md`、`AGENTS.md`。

あなた自身が**Work内のChatGPT**として根拠収集→仮想反論→第三者視点の批判→販売導線の改良→証拠監査を行う。DeepSeekを外部モデルに使わない。DeepSeek Harnessの設計上のGoal / rounds / handoff / gateのみ参考にし、DeepSeek実行を前提としない。OpenAI APIも不要。

1. 2026-10-09更新のR/O/F/Bは面談後の分類に使い、10家庭のR1-R4募集枠は変更しない。
2. mainのみで完結せず、PR #10〜#21の最新の子・親・祖父母の仕様を確認。製品実装とデモを区別する。
3. 4家庭P1〜P4に4訴求S1〜S4を交差させ、必ず16条件すべてを比較する。
4. 各セルで認知→初回現実体験→有料案内→4週間継続→中止を具体化する。価格980円は検証用の案。
5. お金を渡してくれる親と、実際に製品代金を払う親を混同しない。祖父母が契約するには親の参加許可が必要。
6. AIが本当に必要か？ LINE、ChatGPT、みてね、money ring、紙の記録、口頭の相談等の強い反論を作る。
7. 「子どもが自分から2回目を始めるか」と「親の確認負担」と「子のプライバシー」を最優先の検証軸にする。
8. 各ラウンドの`RESULT.json`を作り、`harness.py verify` で検証。新証拠がなければNEEDS_REAL_CUSTOMERSで停止。
9. 架空の利用者発言・確率・成果を実際の成約率と扱わない。
10. 調査ブランチ以外の本番変更、個人データ、広告、支払い、顧客連絡はしない。

## Work 2026-10-10版の品質ゲート
まず`research/market-validation/WORK_DESIGN_REVIEW_20261010.md`を確認する。既存48パスは仮説台帳であって実験結果ではない。P1〜P3は課題による重複層、P4は祖父母の参加/支払属性という別の軸。比較後は**根拠付きの第一候補＋その判定が覆る条件＋10家庭での具体的観察＋4週間¥980（仮価格）への実際の支払行動の必要性**まで書く。

Workの第一ラウンド成果物は`reports/evidence-audit.md`、`reports/work-decision-memo.md`、`reports/experiment-plan.md`、`rounds/round-001/RESULT.json`の4件。RESULTのsource_idsをsourcesの確認可能な出典IDに結びつけ、`harness.py verify`（機械的）＋原典読み合わせ（人間・Work）を通す。単に16行を埋めるだけで完了としない。

作業ができるのはユーザーが開始したWorkタスク内。スキルだけでWorkは自動起動・バックグラウンド実行されない。
