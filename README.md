# GAKU∞STA 2026 / Family Quest 事業化プロジェクト

GAKU∞STA 2026応募と、その後の事業化検証のための資料リポジトリです。

## Codexの入口

現在は **DESIGN**。最初に [AGENTS.md](AGENTS.md) と [引き継ぎ](docs/CODEX_HANDOFF.md) を読む。状態は [PROJECT_STATE.json](current/PROJECT_STATE.json)、次作業は [TASKS.json](current/TASKS.json)、段階ごとのスキルは [工程表](docs/workflow/STAGES_AND_SKILLS.md)。AI設計は [v0.2](docs/design/ai-harness-design-v0.2.md)。

チェック：`python3 scripts/check_design_handoff.py`。製品やAIの動作試験ではなく、引き継ぎ文書の検査。

## レビュー v0.3

- [画面と動きの見本](docs/review/index.html) — ブラウザーで開く合成レビューHTML。保存・通信なし。
- [21機能一覧](docs/design/FEATURE_REVIEW.md) — F番号で残す・変更・後回しを指定。
- [三役15画面・動き](docs/design/role-experience-v0.3.md)／[拡張境界](docs/design/extensibility-v0.3.md)。
- [Codex用ファイル別実装計画](docs/superpowers/plans/2026-09-23-yattemi-implementation.md)。

設計と計画は準備済み、まだ未承認。一式をレビュー後「実装を始めて」で計画を順番にB10から実装する方式です。本体実装・実家庭公開・ライブAIは未実施。

## 現在の方針
北九州市向けに検討していた「キタキュークエスト」のうち、地域固有要素ではなく、家族向けサービスとしての核・原体験・競合仮説・実証設計を再利用し、GAKU∞STA向けに再構成します。

## ディレクトリ
- `current/` : GAKU∞STA向けの現行資料・応募設問・プロジェクト方針
- `legacy/` : 北九州市向けに作成した旧事業書・検討資料
- `research/` : 調査レポート
- `source_materials/` : 原案・元資料
- `archive/original-documents/` : 過去の完成申請書などの保存版・AI可読版

## 資料の使い分け
GAKU∞STAの応募・事業化検討では `current/` を最優先します。`legacy/`、`research/`、`source_materials/`、`archive/` は、サービスの核、原体験、利用フロー、競合仮説、実証方法など再利用できる素材を取り出すための資料です。北九州市固有の政策・地域資源・統計は、そのまま埼玉向けの根拠として使用しません。

## 注意
このリポジトリはPrivateです。申請者情報を含む原資料を保存しているため、Publicへ変更する場合は、住所・電話番号・メールアドレス・生年月日などの個人情報を事前に除去してください。
