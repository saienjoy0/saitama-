# やってみクエスト｜GAKU∞STA 2026

家庭の身近な判断を題材に、子どもが考え・選び・試し、家族と相談する体験を検討するプロジェクトです。

**[今の現在地を見る → CURRENT.md](CURRENT.md)**

今は顧客検証・募集準備・LP見本改善・本体設計レビュー・発表準備を並行しています。
2026-10-16の発表準備では、保護者の具体的な経験を聞き、仮説をどう変えたかを整理します。
まず5家庭、可能なら10家庭。人数は活動目標であり、公式最低要件と確認されたものではありません。

| 系統 | 作業入口 | 主な資料・正本 |
|---|---|---|
| 顧客検証 | [最初の5家庭 #6](https://github.com/saienjoy0/saitama-/issues/6) | CURRENTから募集正本・面談票へ |
| 募集／LP | [受付条件 #4](https://github.com/saienjoy0/saitama-/issues/4) / [AI説明 #3](https://github.com/saienjoy0/saitama-/issues/3) | LP正本は別Site。recruitment-siteは初期下書き |
| 本体製品 | [設計レビュー #5](https://github.com/saienjoy0/saitama-/issues/5) | [レビュー対象](current/REVIEW_BUNDLE.json) / [機能一覧](docs/design/FEATURE_REVIEW.md) |
| 発表 | [デモ確認 #7](https://github.com/saienjoy0/saitama-/issues/7) | [Draft PR #2](https://github.com/saienjoy0/saitama-/pull/2) |

本体はDESIGN/D90のレビュー待ち。LPの合成見本や資料の制作は本体BUILD開始と区別します。
詳しい状態はCURRENT、更新方法と移行範囲は[管理方式](docs/workflow/PROJECT_MANAGEMENT.md)へ。
GitHub Projectへの状態移行はまだ実施していません。

## Codexの入口

[AGENTS.md](AGENTS.md) → [CURRENT.md](CURRENT.md) → 対象Issueと関係資料。
本体作業は[状態](current/PROJECT_STATE.json)と承認対象も確認します。
[短い引継ぎ](docs/CODEX_HANDOFF.md) / [工程とスキル](docs/workflow/STAGES_AND_SKILLS.md)。
更新：`python3 scripts/render_current.py`。検査：`python3 scripts/check_design_handoff.py`。

## 現在の方針
北九州市向けに検討していた「キタキュークエスト」のうち、地域固有要素ではなく、家族向けサービスとしての核・原体験・競合仮説・実証設計を再利用し、GAKU∞STA向けに再構成します。

## ディレクトリ
- `current/` : GAKU∞STA向けの現行資料・応募設問・プロジェクト方針
- `legacy/` : 北九州市向けに作成した旧事業書・検討資料
- `research/` : 調査レポート
- `source_materials/` : 原案・元資料
- `archive/original-documents/` : 過去の完成申請書などの保存版・AI可読版

## 資料の使い分け

**[現行資料・過去版・ブランチの一覧](docs/workflow/MATERIALS_AND_BRANCHES.md)**。日常作業はCURRENT、根拠や履歴を探すときはこの一覧を使います。

GAKU∞STAの応募・事業化検討では、CURRENTと資料一覧が指す現行資料を優先します。`current/` 内にも時点ごとの仮説記録があり、ファイル名だけで最新版と判断しません。`legacy/`、`research/`、`source_materials/`、`archive/` は、サービスの核、原体験、利用フロー、競合仮説、実証方法など再利用できる素材を取り出すための資料です。北九州市固有の政策・地域資源・統計は、そのまま埼玉向けの根拠として使用しません。

## 公開状態

2026-10-02のGitHub metadataでは **Public** です。旧READMEのPrivate記載を訂正しました。
原資料の個人情報監査は未実施。実回答・連絡先・児童記録は保存しません。
