# 資料とブランチの使い分け

日常の作業は[CURRENT](../../CURRENT.md)から対象Issueへ。資料を探すときだけ本書を開く。
以下は2026-10-02（Asia/Shanghai、2026-10-01 UTC）に取得・確認した整理結果であり、オンライン状態の自動同期ではない。

## 先に確認した根拠と変更対象

| 確認した根拠 | 使う箇所 | 変更対象・確認方法 |
|---|---|---|
| AGENTS、PROJECT_STATEのactive_specs、REVIEW_BUNDLE | 資料の優先順位、DESIGN/D90、承認範囲 | 本書とREADMEの入口。仕様・承認対象のbyte一致を確認 |
| 募集正本v2、面談票v2、顧客検証計画v4の優先追補、release-checklist | 面談とPoCの分離、実受付の条件 | 現行資料表。リンク先と記載を照合 |
| LP品質レビュー20261001、AIの役割を伝える計画 | 別Siteのソース、初期LPとの区別 | LP資料表。公開済み・実装済みを推測しない |
| 外部調査の確認用索引、FEATURE_REVIEW、各設計書の冒頭追補 | 既存調査索引、設計書の版ごとの役割 | 既存の索引へリンク。元資料を移動せず既存参照を維持 |
| Gitの祖先関係、各ブランチの独自コミット・変更パス、旧スキル実行README | mainに残るものと別ブランチだけのもの | 下表を取得時SHAで固定。必要な資料が失われないことを確認 |
| PR #2と、同headのCODEX_CONTINUE / DEMO_STATE | 継続するデモの入口 | PR本文の古いv1説明よりブランチ内v2.2引継ぎを読む |

## 今の作業で使う資料

| 用途 | 入口 | 読み方 |
|---|---|---|
| 募集対象・条件 | [募集正本v2](../../research/GAKUSTA_10家庭_募集対象_最終確定_20260925.md)、[開始前チェック](../../research/recruitment/release-checklist.md) | 古い属性人数枠より募集正本を優先。LP完成を面談の必須条件にしない |
| 保護者に聞く | [面談票v2](../../research/GAKUSTA_ProblemInterview_実施用_3問＋条件付1問_20260925.md)、[顧客検証計画](../../research/GAKUSTA_顧客検証_実施計画と判定表_20260925.md) | 計画の冒頭追補を優先。面談と子の観察・PoCを分ける |
| LPを改善する | [品質レビュー](../design/recruitment-lp-quality-20261001.md)、[AIの役割を伝える計画](../superpowers/plans/2026-10-01-lp-ai-role-expression.md) | ソースは別Site `appgprj_6abd00b774cc8191b48baaedfbb0baf2`。`recruitment-site/`は初期下書き |
| 製品の設計をレビューする | [承認対象一覧](../../current/REVIEW_BUNDLE.json)、[機能一覧](../design/FEATURE_REVIEW.md)、[判断履歴](../design/DECISIONS.md) | v0.4.1はF18の追加レビュー、v0.4は三者循環とAI支援、v0.3は共通UI、v0.2は下書き契約。併用範囲は各冒頭追補を読む |
| 実装順を確認する | [準備済み計画](../superpowers/plans/2026-09-23-yattemi-implementation.md) | D90のレビュー対象。計画の存在はBUILD開始の承認ではない |
| 外部調査を見返す | [既存の外部調査索引](../../research/00_外部調査_確認用索引_20260925.md) | 数値・対象・留保はリンク先で確認。外部調査を面談の実績として扱わない |
| 発表デモを続ける | [PR #2](https://github.com/saienjoy0/saitama-/pull/2)、[Issue #7](https://github.com/saienjoy0/saitama-/issues/7) | 開始前にPRのheadを取り直し、`demo/presentation/CODEX_CONTINUE.md`と`DEMO_STATE.json`を読む |

製品設計の優先関係は[AGENTS](../../AGENTS.md)に従う。`current/`というフォルダ名だけで最新版・承認済みと判断しない。

## 根拠や履歴が必要なときに読む資料

| 場所 | 位置づけ |
|---|---|
| [current/BUSINESS_DIRECTION_2026-09-09.md](../../current/BUSINESS_DIRECTION_2026-09-09.md) | その時点の事業仮説・進捗。最新の募集条件や製品仕様は上の現行資料へ |
| [legacy](../../legacy/) | 北九州市向けの旧案・申請準備。地域固有の根拠を埼玉向けにそのまま使わない |
| [source_materials](../../source_materials/) | 原案・元資料。`今のところの案.txt`はlegacy側とbyte一致を確認。元の保管場所を維持し、最新版の仕様として使わない |
| [archive/original-documents](../../archive/original-documents/) | 過去の完成申請書の保存版・AI可読版 |
| [旧引継ぎ全文](../CODEX_HANDOFF_HISTORY_20261001.md) | 2026-10-01までの詳細。再開は短い現行引継ぎから |
| [prototype/gakusta](../../prototype/gakusta/) | 旧プロトタイプ。発表デモの継続先はPR #2の`demo/presentation/` |
| AI設計v0.1、旧UI仕様、過去のLPプレビュー | 設計の経緯。現行active_specsと各追補の優先関係を確認する |

## ブランチを選ぶ

mainを通常の作業起点とする。発表デモだけは専用ブランチを使う。
基準main：[d1661cd](https://github.com/saienjoy0/saitama-/commit/d1661cd40e368dbc7ddbfcc71918d5c93fe2ac85)（PR #8取り込み後）。
「独自 / mainのみ」は、その時点の`main...branch`のコミット数。独自0は全コミットがmainの祖先に含まれることを確認した。
ブランチ名は残しており、以下の整理は参照先の区別。削除・タグ退避・未取り込み内容の一括マージは実施していない。

| ブランチ | 内容を保つ参照先 | 独自 / mainのみ | 扱い |
|---|---|---:|---|
| `add-final-legacy-application` | [取得時の版](https://github.com/saienjoy0/saitama-/tree/df2540470cbd8d44708a92f2b7c22f554ae0df9c) | 0 / 131 | 取り込み済み。旧申請書はarchive/original-documentsへ。 |
| `add-project-materials` | [取得時の版](https://github.com/saienjoy0/saitama-/tree/1eb1fd8b9876bd238953d2e62946515c48f24c6d) | 0 / 142 | 取り込み済み。現行の入口はmain。 |
| `add-source-materials` | [取得時の版](https://github.com/saienjoy0/saitama-/tree/92b5e6d7f6ac0e9e8805c7da4bd93b183660ecb2) | 0 / 141 | 取り込み済み。元資料はsource_materialsへ。 |
| `assemble-docx-pr` | [取得時の版](https://github.com/saienjoy0/saitama-/tree/ba84e3fbd89136cafeaf01f5486770aef1cf6046) | 1 / 129 | 履歴参照。独自変更は文書再構成の起動記録1件。完成申請書とは別。 |
| `chatgpt-transcribe-zonnama2-20260901` | [取得時の版](https://github.com/saienjoy0/saitama-/tree/13e211e861c4c72f788aca6b55442b42881f6646) | 7 / 126 | 履歴参照。独自変更は音声分割データの追加7件。現行仕様ではない。 |
| `add-existing-startup-skills` | [取得時の版](https://github.com/saienjoy0/saitama-/tree/2865a5915a86ba0d9d3d6eb7743e6ed6439682ba) | 48 / 126 | 履歴参照。旧スキルと2026-08-20〜21の実行記録48件。下の参照先へ。 |
| `chore/project-navigation-20261002` | [取得時の版](https://github.com/saienjoy0/saitama-/tree/10f449657defa8fe47ca571b0ef10ee29a7feca2) | 0 / 1 | PR #8で取り込み済み。管理変更の履歴。 |
| `codex/presentation-demo-20260923` | [取得時の版](https://github.com/saienjoy0/saitama-/tree/aca62612acf00ed63317b7330cf5912c98455bcb) | 4 / 97 | 継続作業。PR #2 / Issue #7。別ブランチのデモ検証を続ける。 |

### 別ブランチに残る旧スキル資料

[2026-08-21実行索引](https://github.com/saienjoy0/saitama-/blob/2865a5915a86ba0d9d3d6eb7743e6ed6439682ba/skill_runs/2026-08-21-latest-main/README.md)は当時の仮説検討。現在の顧客検証の順序を上書きするものではない。
第三者スキルとライセンスは同じコミットの`skills/vendor/`に残る。利用が必要になったときに原典・版・ライセンスを確認する。
現行Codexの必須スキルは[SKILLS](../../current/SKILLS.json)と[工程表](STAGES_AND_SKILLS.md)を使い、旧vendor資料があるだけで導入済みとしない。

ブランチを削除する場合は直前に再取得し、mainへの祖先関係、追加コミット、開いているPR、固有資料の保存先を再確認する。取り込み済みの判定は本書の取得時点の結果である。
