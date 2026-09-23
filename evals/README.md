# 合成評価シナリオ

v0.4追加：`next-action-cases.jsonl`は次の行動への対応付け16件（NA01〜12開発、NA13〜16保留）。既存24件と別に維持し、どちらも未実行。AIの第一比較対象はnext_action_matchへ変更。固定候補との有用性比較とAPI条件は `docs/design/ai-action-assistance-v0.4.md`。形式検査のPASSをモデル・サービスのPASSとしない。

24件は**テスト仕様**であり、製品やモデルに対して実行していない。`check_design_handoff.py` はファイル形式と契約の例を調べるだけ。

AI01〜16を開発用、AI17〜24を保留評価とする。保留例をプロンプトに埋め込まない。PLANで各caseのdriver、fixture、assertionを結び付け、`application` は実サービスの認可・状態・障害経路をテスト、`model` は同じ入力で3回生成し原文と比較する。スキーマ合格だけでモデル合格としない。

生の個人情報は使わない。評価結果の成果物は日時、case_id、モデル／プロンプト／教材／schema版、assertion結果、レビュー根拠、費用・所要時間を含める。重大項目の一件でも失敗すればライブ化を止める。全件合格も事故ゼロの保証ではない。

費用と運用、定型版との比較、提供元条件は `docs/design/ai-harness-design-v0.2.md` を参照。
