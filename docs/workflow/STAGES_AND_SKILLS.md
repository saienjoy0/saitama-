# 工程ごとの作業・スキル・完了条件

> v0.4：DESIGNでUIスキルの `references/evidence-led-family-design.md` を読む。B10は探索・比較と共通UI、B20/B30は本人の問いと家族循環、B60はnext_action_matchのAPI・固定版比較、B70はUX41〜45／AI41を検査する。各ファイルとコマンドは実装計画冒頭の追補に記載。Google／Amazonの公式資料をプロジェクト用に適用したもので、公式Codexスキルを導入したとの意味ではない。

状態の唯一の機械可読入口は `current/PROJECT_STATE.json`。現状はDESIGN。スキルは作業方法、ハーネスは状態・入力・権限・評価を管理する仕組みであり、導入するだけで安全が保証されるものではない。

> 2026-09-23更新（下記の標準工程より優先）：ユーザー指定でwriting-plansをDESIGN中に使い、設計と実装計画P10を事前作成済み。現在D90でREVIEW_BUNDLE一式のレビュー待ち。提示済み一式への「実装を始めて」で実発言・hash・native/sequential方式を記録しBUILD/B10へ進む。PLANの再作成は不要。BUILDではexecuting-plans＋TDD＋UIスキル＋React実装レビューを使用する。

| 段階 | 最初に使うもの | 作業と成果物 | 次へ進む条件 |
|---|---|---|---|
| DESIGN（現在） | yattemi-codex-workflow、brainstorming、画面ならyattemi-role-based-ui-design | 製品・役割画面・AI契約・データ権限・判断記録・合成評価例 | 対象仕様一式のレビューと明示的承認 |
| PLAN | writing-plans | 採用技術と版、ファイル別タスク、要件→テスト対応、実行コマンド、切戻し | 計画と実行方法を確認。仕様承認を再要求しない |
| BUILD | test-driven-development、選択した技術に該当するスキル | 一つの家族体験を端から端まで実装。テストが必要な権限・状態遷移を先に扱う | 受入条件を実行し証拠を保存 |
| VERIFY | verification-before-completion、故障時systematic-debugging | 三役E2E、家庭間分離、共有撤回、AI障害、実機表示の結果 | 重大失敗0、未達の開示、試用範囲の承認 |
| PILOT | yattemi-codex-workflow、実証設計書 | まず合成、次に同意した家庭。親の工数と本人の判断を計測 | 継続・停止・修正を実測で決める |

全工程でworkflowを読み、画面変更時はUIスキルを追加する。採用案はReact/TypeScript＋Vite、FastAPI＋PostgreSQL。React作業にはreact-best-practices。Next.js／Vercel AI SDK／Supabaseは現計画では不採用。

## 先に準備するもの

- プロジェクト固有2スキルは `.agents/skills/` に完全な本文を同梱する。ChatGPT内の個人スキルにも保存するが、別Codex環境に同じプラグインがあるとは仮定しない。
- 汎用・技術スキルは `current/SKILLS.json` に提供元・パッケージ・発火条件を登録。このセッションで利用可能なものと、別環境で確認が必要なものを区別する。
- 新環境では一覧を確認し、対象工程の必要本文を読み込む。欠落している必須スキルは同じ公式提供元から導入できる場合に導入する。機能不明の自称スキルを代用品にしない。インストール権限・提供元がない場合は、その作業だけ不足として記録する。
- FastAPI等に専用スキルがないことを、存在しないスキル名で隠さない。採用後は公式ドキュメントと実行テストで補う。固定バージョンを推測で書かない。

## 開発ハーネスの一巡

1. 状態、差分、未完了タスク、依存を確認。
2. 当該スキルと対象仕様を読む。
3. 作業範囲を短く記録し、許可された成果物を作る。
4. 記載済みの検査を実行。失敗時は原因と影響を記録。
5. 検査の種類（文書／合成／製品／実利用）を区別して報告。
6. `TASKS.json` の成果物と証拠、`PROJECT_STATE.json` の次作業、HANDOFFを同じ変更で更新。

AGENTS/JSONはCodexへの制御契約であり、強制的なアクセス制御ではない。PLANでCIの変更範囲チェック、実行権限、ブランチ保護を具体化する。現在は文書チェッカーだけを用意している。

## 承認の扱い

承認対象はREVIEW_BUNDLEの設計と計画一式。準備依頼なのでwritten_spec/implementation_planはfalse。提示一式をレビュー後の実装開始指示でBUILD/B10へ進む。修正・沈黙は承認ではない。今後の重大変更への包括承認や、実家庭公開の承認とは解釈しない。
