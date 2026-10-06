# 次の実装の入口：環境・UI・計画

2026-10-07。今回のユーザー指定は「実装ではなく環境を整える」。この準備は開発ツールとUIの取り決めに限定し、製品UI/API/DB migrationを作らない。

## 最初に開くもの
1. `CURRENT.md` と `current/PROJECT_STATE.json`、`current/REVIEW_BUNDLE.json`。
2. 今日の機能整理v5と `current/FEATURE_DELIVERY.json`。
3. [共通UIルール](../design/ui-consistency-20261007.md)と [UI設定](../design/ui-system.json)。
4. [S01の具体計画](../superpowers/plans/2026-10-07-s01-family-foundation.md)。全体B計画の最初のS01へ接続する。

## スキルの役割
| スキル | 使用する場面 | 準備状況 |
|---|---|---|
| yattemi-codex-workflow | 正しいブランチ・機能・証拠から再開 | repo内に同梱 |
| yattemi-role-based-ui-design | 三者の入口、共通UI、状態・動き・アクセシビリティ | repo内に同梱。ui-consistency参照を追加 |
| user-stories / sprint-plan / outcome-roadmap | 小さな機能、依存、完成条件、目的 | repo内に本文とMITライセンスを同梱 |
| Superpowers writing-plans | ファイル・入出力・検査が具体的な計画 | この環境で本文を確認、6.4.2。S01へ適用 |
| Superpowers executing-plans / TDD | native/sequentialで一機能の実装と失敗→成功の確認 | この環境で本文を確認。実装時の依存はCODEX_PREFLIGHT参照 |
| React best practices | Reactの構造、状態、描画、性能のレビュー | Vercel 0.21.4の本文を確認。ViteへNext.js専用項目を適用しない |
| verification-before-completion / systematic-debugging | 実行結果で完了確認、失敗の原因調査 | 登録済み。作業時に本文と必要な参照を読む |

移行先で外部pluginがない場合は公式の一式を導入して確認する。機能別スキルが重複する別の巨大UI systemは追加しない。

## 開発環境
`tools/development/`は開発道具の環境。React19、TS5.9、Vite8、Vitest4、Testing Library、Storybook10とa11y、Playwright/axeを確認する。Python3.12側はFastAPI、SQLAlchemy2、Alembic、pytest、psycopg、httpx、ruff。製品ソースとは分離している。

このブランチには検証済みpackage-lock.json／uv.lockを同梱。Node24/Python3.12/uv0.12.23を使える環境で、初回も固定版を使う：
```bash
python3 scripts/setup_dev_environment.py --frozen --with-browser
```

依存を更新する作業でだけ --frozen を外して再解決し、互換性を確認して二つのlockをcommitする。

VS Code/Codespacesは「Reopen in Container」で `.devcontainer/devcontainer.json`を利用できる。初回postCreateでuvと開発ツールを入れる。Docker自体はホスト側に必要。コンテナ環境の起動検証と、CI runnerの検証は別に記録する。

必要になった時だけ `--with-db`を付ける。Postgres16はローカル127.0.0.1:54329、テスト専用ユーザーとDB。実装のschema/migrationは作らない。通常の停止は `docker compose -f tools/development/compose.yaml stop`。volumeの削除を停止手順へ含めない。

実装時はapps/webとapps/apiの依存を必要範囲に絞って別にlockする。tools/developmentの広い検査依存を製品へそのまま持ち込まない。

## 準備の確認
GitHubの `Development preparation` workflowは次を実行する：
- 現在地・設計hash・navigation unittest、UIの値・文字コントラスト。
- Node/Pythonの依存解決、各toolの起動とimport。
- Chromiumの実起動、架空の検査HTMLで操作・keyboard・axe。
- テストDBの接続。製品テーブルを作らない。
- lockを使った二回目のsetup。lockをCIログとartifactへ出す。

このworkflowのPASSは環境の証拠。S01の実装完了、製品build、製品UIのa11y、実機・利用者理解の証拠にはしない。実行結果と保存済みlockの有無はPROJECT_STATEとVERIFICATIONで確認する。

## 最初の実装
S01で役割・保存・入口と共通部品を作り、確認してからS02の買い物条件へ進む。部品のStorybook状態と実ブラウザー検査をその機能へ含める。製品の全画面を先に一括実装する手順にはしない。

## 確認済みの結果
[Development preparationの実行結果](https://github.com/saienjoy0/saitama-/actions/runs/37506161907)で文書検査、navigation5件、UI契約、toolの起動、日本語の検査用HTMLの操作とaxe、Postgres16接続、frozen再インストールを確認した。検証対象commitは `63df99a983c0e598d6cc7c7c3825ff0db6d5e259`。React19.3.0、TS5.9.3、Vite8.3.3、Vitest4.1.11、Storybook10.6.1、Playwright1.63.0をlockへ保存。Dev Containerのローカル起動と、製品部品・画面・APIの実装検査は未実施。

生成した三者のUIイメージは外観の参考。画像内の追加文言は実装仕様として採用せず、実際のUIは原文と共通契約を使う。

## UI図から着手する

[UI見直しv2](../design/ui-review-20261007.md)と[レビュー見本](../review/ui-20261007/README.md)を確認する。UI01〜12はレビュー箇所、S01〜28は開発単位。図の固定幅や合成の状態変更を製品へコピーしない。子の新しい選択から記録を作る時、例の文章を自動入力しない。S01の初回設定と普段の入口を分け、各S機能の必要な状態をその機能と同時に実装・確認する。
