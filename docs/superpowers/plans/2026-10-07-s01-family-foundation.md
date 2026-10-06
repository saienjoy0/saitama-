# S01 Family Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans, native/sequential. One S unit is one implementation/review deliverable. This file specifies the next implementation; this preparation does not execute it.

**Goal:** 同じ家庭の本人と管理する親の範囲を保ち、三者の入口と保存する表示設定を用意する。
**Architecture:** 認可はFastAPIの検証済みserver sessionとMembership/GuardianLinkから決める。WebはSessionPortの投影のみ受け取り、共通部品と役割別の入口へ渡す。入力や保存結果をUIだけで確定しない。
**Tech Stack:** React19、TypeScript5.9、Vite8、Python3.12、FastAPI、PostgreSQL16。環境準備のlockを参考に、製品依存は初回B10で別のpackage-lock／uv.lockに固定する。
**Spec:** `docs/design/やってみクエスト_機能全体と導線の設計順_20261006.md` S01、`docs/design/ui-consistency-20261007.md`、`docs/design/ui-system.json`、既存のidentity/tenant境界。

## Global Constraints
- FamilyAccessのfamilyId・memberId・role・managedChildIdsはサーバーが決める。UIの役割名、URL、bodyから昇格しない。
- 本体コードはこの計画を実装する時に作る。開発ツール用tools/developmentを製品アプリとして公開しない。
- 子・親16px以上、祖父母20px以上、タッチ48px以上、祖父母主操作56px以上。共通tokenと状態ラベルを使う。
- 保存失敗では未保存、入力保持。設定変更もexpectedRevisionとoperationIdを使う。
- 合成fixtureと検証用OIDCをローカル検査に使う。実家庭認証の公開設定・外部鍵は別の実運用条件。

## Review Focus
1. roleをparentへ書き換えてもserver session投影を変えられない（Task2 test_session_ignores_client_role）。
2. 家族Bのmember/settingsを家族Aから取得できない（Task2 test_cross_family_settings_denied）。
3. 親のmanagedChildIdsへ管理していない子を含めない（Task2 test_unmanaged_child_absent_from_access_projection）。
4. 設定保存の失敗／revision競合で画面の入力を失わない（Task3 display-settings.test.tsx）。
5. 戻る・文字200%・動き抑制で入口と設定の主要操作を使える（Task3 family-entry.spec.ts）。

### Task 1: Workspace and shared contract
**Files:** Create root `package.json`、`apps/web/package.json`、`apps/web/vite.config.ts`、`apps/api/pyproject.toml`、`apps/web/src/ports/SessionPort.ts`、`apps/web/src/design/tokens.css`、`apps/web/src/design/tokens.test.ts`。環境用lockを製品lockに無断コピーせず、必要な依存だけを解決する。

**Interfaces:**
```ts
type Role = 'child' | 'parent' | 'grandparent';
interface FamilyAccess { familyId: string; memberId: string; role: Role; managedChildIds: string[] }
interface DisplayPreferences { fontScale: 1 | 1.5 | 2; reducedMotion: boolean; revision: number }
interface SettingsCommand { value: Omit<DisplayPreferences, 'revision'>; expectedRevision: number; operationId: string }
interface SessionPort {
  getSession(): Promise<FamilyAccess | null>;
  getDisplayPreferences(): Promise<DisplayPreferences>;
  saveDisplayPreferences(input: SettingsCommand): Promise<DisplayPreferences>;
}
```
後続はこの名前と値を使う。SessionPortからID tokenや全家族のプロフィールを返さない。

- [ ] tokens.test.tsに `shared_tokens_match_design_contract` を書く。css変数のcanvas/primary/text、spacingとrole本文・touch最小値をJSONと照合する。
- [ ] `npm run test --workspace apps/web -- tokens.test.ts` を実行。未実装で失敗することを確認。
- [ ] token変数と型を指定ファイルに作り、同じ検査をPASS、`npm run typecheck --workspace apps/web` をPASSへ。Web用vitest、typecheck、buildのscriptをpackageへ定義する。
- [ ] commit。S02/S04の製品画面をこのTaskに含めない。

### Task 2: Server session and persisted display settings
**Files:** Create `apps/api/app/modules/identity/session.py`、`apps/api/app/modules/identity/oidc.py`、`apps/api/app/modules/family/models.py`、`apps/api/app/modules/family/settings.py`、`apps/api/app/modules/family/routes.py`、`apps/api/tests/test_family_access.py`、`apps/api/tests/test_display_settings.py`、初回Alembic migration。機能の起動に必要なmain/db設定とcomposeは既存B10の指定へ置く。

**Interfaces:** `resolve_family_access(session_id: str, db: Session) -> FamilyAccess` は検証済みsessionからMembershipを照合し失効時401。HTTP `GET /api/session` はWebのFamilyAccessか401。`GET /api/me/display-preferences` と `PUT /api/me/display-preferences` は本人の設定のみ。PUTはSettingsCommandを受け、新revisionを返す。競合409、同じoperationId再送は同じ結果。管理する子の記録の読取は後続RecordPortでmanagedChildIdsを照合し、設定の書換権限と混同しない。

- [ ] test_family_access.pyへ上のReview Focus1〜3に加え `test_expired_session_returns_401` を書く。別家庭404/403、childから親権限へ昇格なし、無関係のchildへの拒否をassert。
- [ ] test_display_settings.pyへ `test_settings_survive_new_session`、`test_same_operation_does_not_increment_twice`、`test_stale_revision_returns_409` を書く。fontScale=2とreducedMotion=TrueがDB再読込後も同じ、二重再送のrevisionが同じ、旧revisionで変更なしをassert。
- [ ] `uv run --project apps/api pytest apps/api/tests/test_family_access.py apps/api/tests/test_display_settings.py -q` を実行。期待した未実装の失敗を確認。
- [ ] 上のsignatures、endpoint、DB制約を最小実装。OIDCのissuer/audience/expiry/signature/state/nonce/PKCEを既存仕様に沿って確認し、server cookieを発行。検査用providerと実運用adapterを混ぜない。
- [ ] 同コマンドとAPI全suiteをPASSへ。migrationの適用・再適用状態を確認しcommit。

### Task 3: Role entry, shared primitives and resilient settings
**Files:** Create `apps/web/src/design/components/ActionButton.tsx`、`Card.tsx`、`StatusLabel.tsx`（同design/components内）、`apps/web/src/design/components/ActionButton.stories.tsx`、`apps/web/src/features/family/RoleEntry.tsx`、`DisplaySettings.tsx`（同features/family内）、`apps/web/src/adapters/http/HttpSessionPort.ts`、`apps/web/src/features/family/display-settings.test.tsx`、`role-entry.test.tsx`（同フォルダ）、`apps/web/e2e/family-entry.spec.ts`、`apps/web/.storybook/main.ts`、`preview.ts`（同.storybook内）。

**Interfaces:** `RoleEntry({access,preferences}: {access:FamilyAccess;preferences:DisplayPreferences})` はJSONの役割入口を表示。`DisplaySettings({port}: {port:SessionPort})` は保存前のvalueをローカルstateで保持し、成功時にだけrevisionを更新。`ActionButton` はHTML button propsにvariantとroleSizeを加える。画面用のStatusLabelと権限判定を混ぜない。

- [ ] `role_entry_uses_server_projection` を書く。access.role=childで親の「確認」操作を出さず、祖父母は新聞／今日／過去の入口が同じ順序。
- [ ] `save_failure_keeps_entered_settings` を書く。保存拒否後も文字200%の入力値を保持し「未保存」、再試行でACK後に「保存済み」。
- [ ] `stale_revision_keeps_input_and_offers_reload` を書く。409で入力を保持し、最新版を読み直すか自分の変更を確かめられる。
- [ ] 対象vitestをRED→指定ファイルの最小実装→GREEN。Storybookにはbutton通常／実行中、設定保存成功／失敗の必要状態を置く。
- [ ] family-entry.spec.tsで320/390/768px、文字200%、keyboard、戻る、OSと本人のreduced motion、設定再読込を確認。横方向に重要情報を隠さず、祖父母本文20px・主操作56px、失敗後の入力保持をassert。
- [ ] `npm run test --workspace apps/web`、`npm run typecheck --workspace apps/web`、`npm run build --workspace apps/web`、`npm run test:e2e --workspace apps/web -- family-entry.spec.ts`、`npm run build-storybook --workspace apps/web` をPASSへ。画面を実際に読む。
- [ ] S01の完成条件を確認し証拠とcommitを残す。S02へ進み、条件カードを追加する。

初回の構成・名前の変更はspecと照合して既存の計画へ反映する。環境検査、権限検査、部品の見た目、利用者理解は別の証拠。
