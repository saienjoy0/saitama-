# 次のCodexの着手確認 v0.4.1

2026-09-23確認。今はDESIGN/D90。この手順を読んだだけでBUILDへ進めない。提示一式への実装開始指示後、準備済み計画を実行するための確認表。

## スキルの導入を迷わないために

1. 対象リポジトリをGit履歴付きで開き、AGENTS→state→HANDOFF→当該taskを読む。作業コピーに`.git`がない場合、ホストの正規のcheckout機能／認証済みcloneを使う。文書コピーを`git init`して既存履歴の代わりにしない。
2. `.agents/skills/`のプロジェクト2件は取得したrepoに同梱済み。公式仕様ではrepo内の同ディレクトリがローカルCodexの検出対象。`/skills`または`$`で存在を確認し、本文も読む。検出されない環境ではAGENTSが指定するファイルを直接読む。個人版と同名でも混ぜず、当repo版を優先する。
3. 現環境はSuperpowers 6.4.1／Vercel 0.21.4がインストール済み。移行先でも同じとは仮定しない。Codex AppではPluginsで、CLIでは`/plugins`でSuperpowersを検索し、未導入ならInstall Plugin。Vercelも対象環境のPlugins一覧で確認する。現在のカタログ別名`e16`等やキャッシュ絶対パスを、移行先のインストールコマンドに使わない。
4. `$skill-installer`は公式に案内されたローカルスキル導入経路。対象環境で存在を確認してから、正式な配布元・必要なパスを指定する。第三者配布元の最新版を無確認で実行せず、導入した版と本文を記録。プラグイン一式に付く相対参照・補助スクリプトが必要なSuperpowersは一式を利用し、SKILL.mdだけを抜き出さない。
5. 自動導入できないホストや接続操作が必要な場合は、その事実と必要な一操作を報告。これは未導入であり「準備済み」と偽らない。すでに導入済みなら再インストールしない。導入権限の回避はしない。

公式：https://learn.chatgpt.com/docs/build-skills 。SuperpowersのCodex操作はインストール済み6.4.1 READMEで照合。今回は導入先の別CLIがないため、別環境の新規インストール実行は未検証。

保存前の差分確認で、別作業の `prototype/gakusta/index.html` と `.agents/skills/gakusta-ui-prototype/` が追加されていた。既存の2つの必須スキルは維持し、この追加資料はプロトタイプの参考指示として扱う。確認したSKILL.mdにはname/descriptionのYAML frontmatterがないため、自動検出可能なスキルとして数えない。本文は必要時に直接読める。役割別UIの正式な作業入口は引き続きyattemi-role-based-ui-designであり、同じ目的のスキルを重複導入しない。追加プロトタイプの操作・描画検証は今回の対象外。

## 工程別の必要最小限

| 工程 | 読むスキル・依存 | 作るもの／迷わない判断 |
|---|---|---|
| DESIGN修正 | workflow、UI、brainstorming、計画修正ならwriting-plans | active_specsと計画だけ。再レビューのたびに全体を作り直さない |
| B10〜B50 | workflow、UI、executing-plans、TDD、React作業時react-best-practices | 固定版の三役体験→家族循環→認証保存。ReactスキルのNext.js専用項目をViteへ適用しない |
| BUILD準備 | using-git-worktrees（executing-plansの依存） | 既存の隔離checkoutを優先。なければnative worktree、さらに無ければ`.worktrees/`をgitignoreして作る。ユーザーへ場所を毎回尋ねない |
| B60任意 | 上記＋AI仕様v0.4／v0.4.1、提供元公式API資料 | 候補検索と課題分解の比較。開発用SKILL.mdを製品のsystem promptへ送らない |
| 完了・B70 | verification-before-completion、requesting-code-review、finishing-a-development-branch | 実行結果で検証し、スキルに従い最後に全体review。native/sequentialはタスクごとの実装委譲をしない方式。最終reviewの委譲は適用される権限・スキル指示に従う |
| 具体的な失敗 | systematic-debugging | 再現→原因→必要な修正。関連しない再設計をしない |

FastAPI/PostgreSQL専用スキルの未導入は、このプロジェクトの必須スキル欠落ではない。B30/B40の認可・migration・DBテストと各公式資料で担保する。ブラウザー描画、子どもの体験、学習支援の有効性はスキルの存在だけでは検証できない。Playwright実行体はB10の準備対象。Next.js／Vercel AI SDK／Supabaseは選択しておらず導入しない。

## 実行スキルとの接続

計画見出しは`Task 1: B10`〜`Task 7: B70`。補助スクリプトへは数値1〜7を渡し、PROJECT_STATE/TASKSではB10〜B70を使う。各taskに追補を収めたため、抽出したbriefだけでも追加要件を失わない。共通制約・Specはsetup時に別途読む。

`<executing-plansの実際の配置先>/scripts/task-start <plan> 1`でbriefとBASEを取得する。これはテンプレートであり、このパスをそのままシェルへ貼らない。完了時は同スキルのtask-doneへ実際の検査コマンドを渡す。task-start/task-doneはGit checkoutが必要。gitがない文書コピーで実行できたと扱わない。

順番は1→2→3→4→5→7が固定版、任意AIを含める時だけ5→6→7。Task 6を選ばない場合はTASKSとledgerに`not_selected`と残し、完了や成功としない。PILOT／外部公開はこの7taskに含めない。finish時は成果をブランチに保持し、未承認のmerge/publishをしない。

各タスク終了時に、スキルの一時ledgerから根拠の要点（commit、コマンド、結果、判断、未達）をversion管理するTASKSとVERIFICATIONへ転記する。これらとGit履歴が再開の正本。スキルの一時workspaceを片付けても進捗を失わない。

着手時の合格は「必須スキル本文と相対参照が読める」「当該briefに必要事項がある」「利用する実行系が起動する」「現在の権限で作業できる」。今回実施したのは文書・配置・brief抽出の確認まで。製品のnpm/uv/browser/DB起動はまだ実施していない。
