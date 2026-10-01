# 次のCodexへの短い引継ぎ

最初に [CURRENT](../CURRENT.md) を読む。系統とIssueを選び、関係資料だけ読む。
管理方式は [PROJECT_MANAGEMENT](workflow/PROJECT_MANAGEMENT.md)。現在は入口整備（navigation）、Projectへの状態移行は未実施。

## 本体

DESIGN / D90。v0.4.1設計と実装計画は準備済み・未承認。
製品作業や段階変更の前に PROJECT_STATE、REVIEW_BUNDLE、対象仕様と計画を読む。
一式をレビュー後の実際の「実装を始めて」発言・対象hash・native/sequential方式を記録してBUILD/B10へ。
管理整理の指示、Issue close、PR mergeは本体承認ではない。実家庭公開・ライブ児童AIは別条件。

## 募集／LP

D59は受付条件とフォーム実環境確認待ち。LP完成は面談募集の必須条件にしない。
D66-LPはv1.10、質問票v1.4。次は保存済みAI役割説明計画。別SiteプロジェクトがLPソース正本。
実保護者の理解は未確認。期限切れのVercel URLを現在有効な募集先にしない。

## 顧客検証と発表

募集正本v2と面談票v2を優先（ファイル名の「3問」は旧名称）。まず保護者5家庭、可能なら10家庭。
2026-10-16までの中心成果は聞き取りと仮説修正。7日記録・有料販売・PoCを同じ必須成果にしない。
実面談は未実施。回答や連絡先を公開GitHubへ保存しない。
発表デモはPR #2のブランチ。開始前に最新PRとそのCODEX_CONTINUEを読む。

## 更新と履歴

元のタスク／状態は影響部分のみ更新し、CURRENTを再生成する。引継ぎへの毎回の追記は不要。
`python3 scripts/render_current.py` → `python3 scripts/check_design_handoff.py`。
この検査は文書整合であり製品・家庭試用の検証ではない。
[2026-10-01までの引継ぎ全文](CODEX_HANDOFF_HISTORY_20261001.md) は履歴。最新版はCURRENTの参照先を優先。
