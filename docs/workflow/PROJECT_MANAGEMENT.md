# プロジェクト管理の入口と移行

2026-10-02。対象は管理方式。製品設計v0.4.1の承認・本体BUILD開始とは別。

## 改変前に確認した根拠

| 出典・確認日 | 確認した箇所 | 適用と変更対象 | 確認方法 |
|---|---|---|---|
| GitHub公式 [Best practices for Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/best-practices-for-projects)、2026-10-02 | Single source of truth、views、README、sub-issues | CURRENTは既存JSONから生成。READMEを入口に。作業状態の二重手入力を避ける | 生成結果・差分検知・リンク確認 |
| GitHub公式 [Creating issue dependencies](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies)、同日 | blocked by / blocking | Issueに本当の依存と完了条件を記述。ネイティブ設定は次工程 | Issue読み戻し。文章中のリンクをネイティブ依存と呼ばない |
| GitHub公式 [Built-in automations](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations)、同日 | closed / merged → Done | 次工程のProject設定案。PRマージと家庭観察の完了を同一視しない | 設定前後と実際の遷移で確認する。今回は未設定 |
| 既存AGENTS・PROJECT_STATE・TASKS・REVIEW_BUNDLE、同日 | DESIGN/D90、27タスク、hash検査 | IDと本体ゲートを保持し専用スキル・検査を新入口へ対応 | 既存チェック、元の承認値と製品仕様hashの比較 |
| 顧客検証計画v4の優先追補・募集導線、同日 | 最初の5家庭、10家庭は活動目標、LP完成は必須でない | 4系統とIssue #3〜#7の完了条件 | 原典と作業入口を照合 |
| skill-creator、同日 | progressive disclosure、既存スキルの更新・保存 | yattemi-codex-workflowを更新。旧リポジトリへのfallbackを維持 | 個人スキルの形式検査・保存確認・新旧入口の利用レビュー |

## 現在の正本（authority_mode=navigation）

| 情報 | 正本 | 他の場所の役割 |
|---|---|---|
| 全体目的・焦点順・系統・作業入口 | current/WORKSTREAMS.json | CURRENTは自動生成。READMEは固定リンク |
| 既存タスクの状態・依存・証拠 | current/TASKS.json | Issue作成時の現在地は初期スナップショット。更新時は正本を読む |
| 本体段階・許可・承認対象 | current/PROJECT_STATE.json / REVIEW_BUNDLE.json | ProjectやIssueの操作で承認しない |
| 面談実施の有無 | PROJECT_STATEのresearch_review.recruitment_materials.interviews_conducted | 件数・匿名の学びはIssueへリンクする |
| 新規作業VAL-01 / PITCH-01の文脈と証拠 | Issue #6 / #7、発表デモPR #2 | CURRENTにオンライン状態を複製しない |
| LPソース | 別Siteプロジェクト（WORKSTREAMS参照） | recruitment-site/は初期下書き。期限切れ公開URLを案内しない |
| 製品判断 | docs/design/DECISIONS.md | 今回の管理判断は本書。製品判断を管理改修で書き換えない |

次作業の選択は明示されたユーザー指示を優先。指定がなければfocus_orderを見て実行できる範囲を確認する。next_task_id=D90は本体の列であり全作業を止めない。

## 毎回の更新

1. AGENTS → CURRENT → 選択したIssueと関係資料。製品作業は状態と承認対象も読む。
2. 作業後に、影響のあるタスク／状態だけ更新。Issueには証拠やPRをリンクし、毎回状態文を複製しない。
3. `python3 scripts/render_current.py`、`python3 scripts/check_design_handoff.py`。CURRENTの手編集は検査で拒否する。
4. 大きな変更以外は引継ぎへ追記しない。履歴は既存の検証資料やPRに残す。

公開Issueに回答・連絡先・児童記録を置かない。GitHubの現在のvisibilityはpublic、旧READMEのPrivate記載を修正した。元資料の個人情報監査、可視性変更、履歴の削除は今回は実施していない。

## 次の移行（未実施）

1. saienjoy0所有のProjectを確認し、重複がなければ作成・リポジトリへ関連付ける。Projectの可視性とrepoの可視性は別に確認する。
2. Status（Backlog / Ready / In progress / Blocked / Review / Done）、Workstream（Validation / Recruitment-LP / Product / Pitch）、Priority（P0/P1/P2）、Target dateを設定。
3. #3〜#7を追加。NOW、WORKSTREAMS、DATESの3ビュー。実際の締切だけ日付にする。
4. 受付・同意・予約の完了を分けた必要最小限のIssueを用意し、#6の真の依存だけ設定する。D59全完了やLP全完成を面談の必須依存にしない。
5. 標準自動化を確認。マージされたPRのDoneと、関連Issueの面談・理解確認の完了を別に扱う。
6. 読み書き権限と一方向同期を実行検証した後に、移行済み状態の正本をProjectへ切り替える。失敗時は最後の取得日時と同期失敗を表示し、自動でJSON正本へ戻さない。

利用可能なGitHub連携には今回Projects作成・フィールド・依存関係の書き込み機能がない。Projectが未作成なのにURLやStatusを捏造しない。必要な対応連携または承認されたUI操作で次工程を行う。未来のB10〜B70を大量にIssue化せず、旧IDと機能参照を保持する。

## 戻す場合

この管理変更のPRをrevertする。既存のタスクID・製品仕様・実装計画は保持している。Issue #3〜#7は削除せず、移行中断を記録して必要に応じnot_plannedで閉じる。スキルはCURRENTがない旧構造にも対応する。
