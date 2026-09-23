# Yattemi Quest Implementation Plan v0.4.1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Native/sequential execution is the proposed default for this handoff. Use superpowers:subagent-driven-development only if the user selects delegation. Steps use checkbox syntax.

## 最小修正 v0.4.1

必読：`docs/design/ai-engine-review-v0.4.1.md` と `docs/workflow/CODEX_PREFLIGHT.md`。既存のv0.4追補を各Taskに移した。該当箇所は古い手順より優先。共同レビュー・DESIGN段階を維持する。

Task番号1〜7とB10〜B70は対応する。`task-start`には数値、状態ファイルにはB番号を使う。固定版の順番は1→2→3→4→5→7、AIを含める場合のみ5→6→7。setupでは共通制約とSpecも読む。必要スキルの導入・worktree・最終レビューと進捗保持はCODEX_PREFLIGHTに従う。

**Goal:** 子の問い・選択・体験・記録→任意共有と親確認→家族の任意返信→本人が選ぶ次の体験がつながるWeb製品を、合成D0から安全なM1へ実装する。新聞は任意のまとめ方。

**Architecture:** React/TypeScriptの役割別画面は共通のdomain型とportに依存する。D0はメモリadapter、M1は認証済みFastAPI adapterに切り替える。教材、見た目、AI、保存先を分離し、認可と共有の意味は共通に保つ。

**Tech Stack:** Node22.12以上の22系または24系、React19、Vite8、TypeScript5、Vitest、Testing Library、Playwright、Python3.12、FastAPI、SQLAlchemy2、Alembic、PostgreSQL16。CSSの動きを第一選択にする。

**Spec:** `docs/design/FEATURE_REVIEW.md`, `role-experience-v0.3.md`, `extensibility-v0.3.md`, `ai-harness-design-v0.2.md`（すべてdocs/design内）。製品の基礎はproduct-design-v0.1.md。詳細が違う場合は各Task内の追補とai-engine-review-v0.4.1／personas-cycle-review-v0.4／ai-action-assistance-v0.4を優先する。

## Global Constraints

- 現在は設計・計画のレビュー待ち。下のコードは実装時に書く仕様例で、実行済みコードではない。
- D0は合成データのみ、再読込でリセットされるデモであることを常に表示する。M1の保存・認可と同一視しない。
- ogenkiは機能参照。既存コード・DB・稼働環境は変更しない。
- 子ども・親本文16px以上、祖父母20px以上、タッチ48px以上、祖父母主操作56px以上。
- 動きはM01〜M07。OSまたは本人の動き抑制設定で装飾を止め、成功演出は保存ACK後だけ。
- 実家庭への公開、外部AIへの児童情報送信、決済、外部通知、既存DB移行はこの開始指示に含めない。
- AIは初期OFF。AI評価・提供元契約とデータ条件を満たす前にONにしない。
- exact dependency versionsはB10初回に上記範囲内で解決しlockへ保存。以降npm ci／uv sync --frozen。依存のインストール自体が拒否されたら抜け道を探さず不足を報告する。

## Review Focus

1. 通信後に遅れて届く結果：取消済み・撤回済みの状態を成功へ戻さない（B20/B40）。
2. 共有端末の親子切替：親の内容や承認権限を子セッションへ持ち越さない（B30）。
3. 教材の版変更：途中の回答と過去カードを別の問題へ紐付け直さない（B10/B50）。
4. 祖父母が複数家庭にいる：新聞・既読・近況を家庭間で混ぜない（B30/B40）。
5. 動き抑制・200%文字・二重タップ：情報や操作が欠けず、保存／送信回数が増えない（B10/B20/B70）。

## 開始条件と実行順

レビュー入口は `docs/review/index.html` とFEATURE_REVIEW。ユーザーが一式をレビューし「実装を始めて」と指示した場合、提示済みの一式への承認と、この計画のnative/sequential実行の選択として記録する（今回のユーザー指定による一括レビュー方式）。指示が修正やレビュー継続だけなら承認済みにしない。

開始時に `current/REVIEW_BUNDLE.json` のファイルhashを照合し、承認対象が別の版に変わっていないか確認。実際のユーザー発言・対象hash・実行方式をstateへ記録し、BUILD/B10へ進む。新たに同じ計画を書く工程は不要。

B10→B20でD0完成。D0の表示確認を報告してからB30→B40→B50でM1のローカル検証版、B70で統合検査。B60のAI追加は任意分岐で、固定版M1の完成を妨げない。実家庭PILOTは別承認。

## 共通インターフェース

`apps/web/src/ports/QuestPort.ts` で下記の契約を定義する。IDはopaque string、revisionは正整数、日時はUTC ISO文字列、金額は整数円。HTTP adapterの権限はsession由来で、UIからactorを送って権限を決めない。

```ts
export type Role = 'child' | 'parent' | 'grandparent';
export type Step = {id:string; kind:'predict'|'compare'|'choose'|'reflect'; prompt:string; hints:string[]};
export type Template = {id:string; version:number; title:string; band:string; steps:Step[]};
export type Experience = {id:string; templateId:string; templateVersion:number; revision:number; status:'active'|'paused'|'declined'|'completed'; answers:Record<string,string>};
export type Card = {id:string; revision:number; text:string; childChoice:'yes'|'no'; recipients:string[]; status:'draft'|'review'|'published'|'revoked'};
export type Operation = {operationId:string; expectedRevision:number};
export interface QuestPort {
  templates(): Promise<Template[]>;
  start(templateId:string, version:number): Promise<Experience>;
  saveExperience(value:Experience, op:Operation): Promise<Experience>;
  saveCard(value:Card, op:Operation): Promise<Card>;
  publishCard(id:string, recipients:string[], op:Operation): Promise<Card>;
  revokeCard(id:string, op:Operation): Promise<Card>;
  listCards(): Promise<Card[]>;
  getCard(id:string): Promise<Card>;
  createSeed(cardId:string, text:string, operationId:string): Promise<{id:string;status:'candidate'}>;
  draftNewspaper(materials:{cardId:string;revision:number}[], recipients:string[], operationId:string): Promise<{id:string;revision:number;status:'draft'}>;
  publishNewspaper(id:string, op:Operation): Promise<{id:string;revision:number;status:'published'}>;
  reply(cardId:string, text:string, operationId:string): Promise<{id:string}>;
  checkin(recipients:string[], operationId:string): Promise<{id:string;receivedAt:string}>;
}
```

API側は同じフィールドをPydanticで定義する。error bodyは `{code, message, request_id}`。401未認証、404対象なし／非許可、409版競合、422入力不正、429上限。例外メッセージに他人のID・内容を含めない。

### Task 1: B10 — 三役の入口・共通デザイン・交換できる体験

#### v0.4追補（このTaskの必須範囲）

Create `apps/web/src/design/components/ChoiceGroup.tsx`, `ArtifactStatus.tsx`, `SourceLabel.tsx`, `SuggestionPanel.tsx`, `apps/web/src/features/experience/ExploreHome.tsx`, `CompareChoices.tsx`, `compare.ts`, `compare.test.ts`, `apps/web/src/design/components/role-variants.test.tsx`。

- [ ] C01を水／店／家の仕事の探索と「これ、なんで？」の入口にする。C02は予想を先に残し、比較軸と候補を自分で変えられる。選択入力と主ボタンを分け、何も選ばない／今回は買わない／後でを残す。
- [ ] `remainingYen(budget:number, price:number):number`と`yenPer100ml(price:number, ml:number):number`のテストを先に書く。300-180=120、300-260=40、180/200*100=90、260/400*100=65、ml<=0は拒否。例の価格は合成と表示する。計算関数は候補を勝手に選ばない。
- [ ] `npm test -- compare.test.ts role-variants.test.tsx`を実行し未実装を確認。共通トークン→role variant→部品に分けて実装し再実行。ChoiceGroupはキーボードとタップで同じ選択が可能、ドラッグだけに依存しない。
- [ ] UX41/UX45の表示と操作をPlaywrightで検査。ヒントは閉じた状態から任意に使え、減らしても呼び戻せる。発見の記録以外で保存成功演出を使わない。実利用者の楽しさはこのテストから断定しない。


**Files:** Create `apps/web/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/ports/QuestPort.ts`, `src/adapters/demo/MemoryQuestPort.ts`, `src/design/tokens.css`, `src/design/motion.ts`, `src/design/motion.css`, `src/features/experience/ExperienceFlow.tsx`, `src/features/experience/flow.ts`, `src/features/family/RoleHome.tsx`, `content/templates/water-v1.json`, `content/templates/shopping-v1.json`, `content/manifest.json`.

**Test:** `apps/web/src/features/experience/flow.test.ts`, `ExperienceFlow.test.tsx`, `src/design/motion.test.ts`, `tests/e2e/d0-entry.spec.ts`.

**Interfaces:** Consumes Step/Template/Experience/QuestPort above. Produces `nextStep(template:Template, currentId:string):Step|null`, `motionDuration(event:'step'|'save'|'complete', osReduce:boolean, userReduce:boolean):number`, `MemoryQuestPort` implementing QuestPort; sharing methods become functional in B20, and before that explicitly reject with `not_available_in_this_slice`.

- [ ] Prepare the workspace and dependency lock as part of this slice; do not scaffold into the repository root or overwrite docs.

```sh
node --version
npm create vite@8 apps/web -- --template react-ts --no-interactive
cd apps/web
npm install
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

Pin the resolved dependencies in package-lock.json. Set scripts `test: vitest run`, `typecheck: tsc -b`, `build: tsc -b && vite build`, `test:e2e: playwright test`. Add the JSX test environment setup importing jest-dom/vitest. Keep the generated ESLint config and run lint in B70.

- [ ] Write the failing test with a concrete second template. `water` and `shopping` fixtures must each define the four Step kinds above.

```ts
import {expect, it} from 'vitest';
import {motionDuration} from '../../design/motion';
import {nextStep} from './flow';
const t = {id:'shopping',version:1,title:'予算で選ぶ',band:'grade4-6',steps:[
 {id:'p',kind:'predict' as const,prompt:'何を選ぶ？',hints:[]},
 {id:'c',kind:'compare' as const,prompt:'比べる軸は？',hints:[]}
]};
it('uses template steps, not water-specific routes', () => {
 expect(nextStep(t,'p')?.id).toBe('c');
 expect(nextStep(t,'c')).toBeNull();
});
it('respects either reduced-motion preference', () => {
 expect(motionDuration('save',true,false)).toBe(0);
 expect(motionDuration('save',false,true)).toBe(0);
 expect(motionDuration('save',false,false)).toBe(260);
});
```

- [ ] Run `npm test -- flow.test.ts motion.test.ts`; expect missing-module failures before implementation, not dependency or syntax failures.
- [ ] Implement the pure rules and compose screens C01/C02/P01/G01 against the demo port. Supply a visible demo banner, no network calls, and theme choices from manifest rather than route branching.

```ts
export function nextStep(t:Template, id:string):Step|null {
 const index=t.steps.findIndex(s=>s.id===id);
 if(index<0) throw new Error('unknown_step');
 return t.steps[index+1] ?? null;
}
export function motionDuration(e:'step'|'save'|'complete',os:boolean,user:boolean):number {
 return os||user ? 0 : {step:180,save:260,complete:420}[e];
}
```

- [ ] React test: choose shopping, enter a prediction, pause, reopen the same Experience in the same demo session and see the original text. Choose another template and confirm the first Experience retains its templateVersion. Test unknown template version as visible non-destructive error.
- [ ] Playwright: 360px layout, OS reduced motion, keyboard focus after Next, 200% text, and “あとで” returns to home without penalty. Navigation buttons must all work or be explicitly absent from this slice.
- [ ] Run test/typecheck/build. Record actual commands and errors. Commit only this slice's files with `feat: add role homes and versioned experience flow`.

### Task 2: B20 — 合成データでカード→親確認→新聞→任意の返信を一周

#### v0.4追補（このTaskの必須範囲）

Create `apps/web/src/features/experience/QuestionCapture.tsx`, `apps/web/src/features/family/ReplyToSeed.tsx`, `apps/web/src/features/experience/FixedNextActions.tsx`, `apps/api/app/modules/experience/questions.py`, `question_routes.py`, `apps/api/tests/test_question_cycle.py`。Extend QuestPort with `saveQuestion`, `createSeed`, `listEligibleActions`; HTTP endpoints `POST /questions`, `GET /questions/{id}/actions`。D0はmemory adapter、M1は同一契約のサーバー認可。

Questionはid, family_id, child_id, revision, original_text, focus_id, source_reply_ref|null, status。Seedはsource_question_id, source_reply_revision|null, child_selected_action_id|null, resulting_experience_id|null。送信用projectionとparent_reviewed_projection_revisionを原文から分離する。子の焦点変更・元返信撤回で派生候補を失効させる。

- [ ] 初回でexperienceなしの問いを作り、固定候補を選んで体験を開始するテストを先に書く。
- [ ] 返信→本人の焦点→たね→次の体験記録を追跡するE2Eを追加。「読んだ」「候補を選んだ」だけでは家族循環成立イベントを発行しない。
- [ ] 子が共有しなければ祖父母へ採用結果を表示しない。本人が新しいカードを共有した時だけ既存の親確認で届く。祖父母不参加／返信なしでも体験単体を完了できる。
- [ ] 新聞は任意の表示・まとめ方とし、家族が毎回編集して発行することを一周の必要条件にしない。
- [ ] `uv run pytest tests/test_question_cycle.py -q`とD0/M1家族循環E2Eを各工程で実行する。実装前は未実装による失敗、実装後に実経路での成功を記録する。


**Files:** Modify MemoryQuestPort. Create `src/features/sharing/approval.ts`, `CardEditor.tsx`, `ReviewInbox.tsx`, `Newspaper.tsx`, `ReplyForm.tsx`, `src/features/family/Checkin.tsx`, `src/adapters/demo/fixtures.ts`.

**Test:** `src/features/sharing/approval.test.ts`, `src/adapters/demo/MemoryQuestPort.test.ts`, `tests/e2e/d0-family-loop.spec.ts`.

**Interfaces:** Consumes Card/Operation/QuestPort. Produces `mayPublish(card:Card, reviewedRevision:number, reviewedRecipients:string[]):boolean`. Demo save/publish return Promise<Card> and can be configured to reject once with `network_unavailable`; this is not a real security implementation.

- [ ] Write failing tests before completing publishing.

```ts
import {it,expect} from 'vitest';
import {mayPublish} from './approval';
const card={id:'c1',revision:2,text:'予想と違った',childChoice:'yes' as const,recipients:['g1'],status:'review' as const};
it('invalidates stale approval and child refusal',()=>{
 expect(mayPublish(card,1,['g1'])).toBe(false);
 expect(mayPublish({...card,childChoice:'no'},2,['g1'])).toBe(false);
 expect(mayPublish(card,2,['g2'])).toBe(false);
 expect(mayPublish(card,2,['g1'])).toBe(true);
});
```

- [ ] Run `npm test -- approval.test.ts`; expect missing export first.
- [ ] Implement the invariant and route each screen through port results. Every substantive edit increments revision and returns to review. Choice=no is saved privately and cannot enter the parent publish list.

```ts
export function mayPublish(c:Card,v:number,recipients:string[]):boolean {
 const normalized=(xs:string[])=>JSON.stringify([...new Set(xs)].sort());
 return c.childChoice==='yes' && c.status==='review' && c.revision===v
   && normalized(c.recipients)===normalized(recipients) && recipients.length>0;
}
```

- [ ] Test double submit with same operationId returns the same result; different payload with reused key returns conflict. Test save rejection keeps typed text and does not play M03/M04. Cancelled component ignores late resolution. Demo role switch retains demo objects but never claims real identity.
- [ ] Implement the flow C03→P02→P04→G02→G03→C04; parent can combine up to6 approved cards, empty issue cannot publish. “元気だよ” records only a synthetic sender/time after simulated ACK. Shared absence does not block Experience completion.
- [ ] E2E one happy loop and three alternate paths: no grandparent, child declines sharing, failed checkin. All displayed saves must say simulation in the demo shell. Add simple in-memory photo illustration; real upload belongs to B40.
- [ ] Run test/typecheck/build/test:e2e. Commit `feat: complete synthetic family sharing loop`. Report D0 as demo, with screenshots and limitations. Do not publicly deploy D0 as M1.

### Task 3: B30 — 本人認証・家庭境界・保存を備えるM1土台

#### v0.4追補（このTaskの必須範囲）

Create `apps/web/src/features/experience/QuestionCapture.tsx`, `apps/web/src/features/family/ReplyToSeed.tsx`, `apps/web/src/features/experience/FixedNextActions.tsx`, `apps/api/app/modules/experience/questions.py`, `question_routes.py`, `apps/api/tests/test_question_cycle.py`。Extend QuestPort with `saveQuestion`, `createSeed`, `listEligibleActions`; HTTP endpoints `POST /questions`, `GET /questions/{id}/actions`。D0はmemory adapter、M1は同一契約のサーバー認可。

Questionはid, family_id, child_id, revision, original_text, focus_id, source_reply_ref|null, status。Seedはsource_question_id, source_reply_revision|null, child_selected_action_id|null, resulting_experience_id|null。送信用projectionとparent_reviewed_projection_revisionを原文から分離する。子の焦点変更・元返信撤回で派生候補を失効させる。

- [ ] 初回でexperienceなしの問いを作り、固定候補を選んで体験を開始するテストを先に書く。
- [ ] 返信→本人の焦点→たね→次の体験記録を追跡するE2Eを追加。「読んだ」「候補を選んだ」だけでは家族循環成立イベントを発行しない。
- [ ] 子が共有しなければ祖父母へ採用結果を表示しない。本人が新しいカードを共有した時だけ既存の親確認で届く。祖父母不参加／返信なしでも体験単体を完了できる。
- [ ] 新聞は任意の表示・まとめ方とし、家族が毎回編集して発行することを一周の必要条件にしない。
- [ ] `uv run pytest tests/test_question_cycle.py -q`とD0/M1家族循環E2Eを各工程で実行する。実装前は未実装による失敗、実装後に実経路での成功を記録する。


**Files:** Create `apps/api/pyproject.toml`, `uv.lock`, `app/main.py`, `app/settings.py`, `app/db.py`, `app/modules/identity/models.py`, `schemas.py`, `session.py`, `oidc.py`, `routes.py`, `app/modules/experience/models.py`, `service.py`, `routes.py`, `app/modules/sharing/models.py`, `service.py`, `routes.py`, `app/modules/family/models.py`, `service.py`, `routes.py`, `app/errors.py`, `migrations/versions/0001_family.py`, `compose.yaml`, `apps/web/src/adapters/http/HttpQuestPort.ts`.

**Test:** `apps/api/tests/conftest.py`, `test_identity.py`, `test_tenant.py`, `test_experience.py`, `test_sharing.py`, `tests/e2e/m1-mode.spec.ts`.

**Interfaces:** `create_app(settings:Settings)->FastAPI`; `current_actor(request:Request)->Actor` from opaque session cookie; `require_membership(actor:Actor,family_id:UUID)->Membership`; `authorize_child(actor:Actor,child_id:UUID)->ChildProfile`. Actor is `{identity_id, membership_id, role, family_id}` derived server-side. Pydantic uses camelCase aliases for the front-end contract. HttpQuestPort maps to endpoints below and never sends role/actor assertions.

| Method/path | Contract | Authorized party |
|---|---|---|
| GET /templates | published Template[] | active family member |
| POST /children/{id}/experiences | templateId,version→Experience | child or linked guardian |
| PATCH /experiences/{id} | answers,status,expectedRevision,operationId | same child scope |
| GET/POST /cards | permitted Card[] / draft Card | owner/linked guardian |
| GET /cards/{id} | current permitted Card | owner/linked guardian/current recipient; otherwise404 |
| PATCH /cards/{id} | text,childChoice,recipients,expectedRevision,operationId | author edits own text/choice; guardian edits draft text, never overrides child refusal |
| POST /cards/{id}/publish | recipients,expectedRevision,operationId | guardian with child consent, or adult's own card |
| POST /cards/{id}/revoke | expectedRevision,operationId | subject/linked guardian |
| POST /cards/{id}/replies | text,operationId | current recipient |
| POST /checkins | recipients,operationId | authenticated adult sender |
| POST /seeds | cardId,text,operationId→id,status=candidate | permitted card reader, not executable curriculum |

Identity routes: GET `/auth/login`→OIDC redirect, GET `/auth/callback`→opaque adult session, POST `/auth/logout`→204, POST `/families`→family ID, POST `/families/{id}/invitations`→one-time token, POST `/invitations/accept` with token→membership, POST `/session/family` with familyId→session rotated, POST `/session/child` with childId→restricted child session, POST `/session/parent`→fresh OIDC reauthentication/elevation. All mutations require CSRF; family/child changes require existing membership/GuardianLink. Client-selected family is only a request, not proof of membership.

Card approval must bind child-selected material revision and recipients, not just retain an old boolean. If parent changes the meaning, photo or audience after the child's selection, mark child consent pending and require a fresh child selection before publishing; parent approval is also invalidated. The server enforces the same material snapshot semantics for newspaper publication. Test that a parent cannot PATCH childChoice from no→yes or copy approval onto a new revision.

- [ ] Create `uv` project dependencies FastAPI, uvicorn, SQLAlchemy2, psycopg, Alembic, authlib, httpx, pydantic-settings, pytest. Resolve and lock versions. Compose Postgres16 binds localhost only. Create a test database; destructive tests refuse any non-test DB name.
- [ ] Conftest produces TestClient and a `world` fixture with child_a, guardian_a, grandparent_ab, unrelated_parent, card_a, family_a, family_b. Authenticated test clients are named world.child_a/client etc via dependency override only in test construction; test override code is not exported by production app.
- [ ] Write these failing endpoint tests; fixture values are UUIDs and property `.client` is a TestClient with the appropriate test session.

```python
def test_other_family_hidden(world):
    response = world.unrelated_parent.client.get(f'/cards/{world.card_a.id}')
    assert response.status_code == 404

def test_child_cannot_publish(world):
    response = world.child_a.client.post(f'/cards/{world.card_a.id}/publish', json={
        'recipients':[str(world.grandparent_ab.id)], 'expectedRevision':1, 'operationId':'p1'})
    assert response.status_code == 404

def test_session_actor_not_taken_from_json(world):
    response = world.child_a.client.post('/checkins',json={
        'sender_id':str(world.guardian_a.id),'recipients':[], 'operationId':'c1'})
    assert response.status_code in (404,422)
```

- [ ] Run `uv run pytest tests/test_tenant.py -q` in apps/api and observe actual failures. Implement migrations with family_id in every family-owned row, foreign keys constrained to same family, GuardianLink for each child, unique operation key plus payload digest, and expectedRevision optimistic concurrency.
- [ ] Implement Google OIDC adult login using authlib, code flow+PKCE and discovery from allowlisted issuer. Validate state/nonce/signature/issuer/audience/expiry, store only server session token hash. Cookie HttpOnly/Secure/SameSite=Lax, CSRF token+Origin check for mutation, logout invalidates session. Reauthentication to parent mode uses a separate short-lived guardian elevation marker. Membership uses provider issuer+sub, not email matching. No password system.
- [ ] Integration tests use mock OIDC/JWKS and cover wrong state, nonce, audience, expired tokens, unknown issuer and key rotation. Production rejects mock issuer and demo mode; local synthetic OIDC is an explicit test-only setting. Child session cannot access adult role through URL/localStorage/header manipulation. Invitations: hash token, single-use, 7-day default, revocation and rate-limit20 attempts/identity/hour; expired/replayed tokens fail without membership creation.
- [ ] Implement APIs using select+authorize+revision validation in one transaction. The key invariant is checked server-side even if UI already checked:

```python
def guard_family(actor, record):
    if actor.family_id != record.family_id:
        raise HiddenResource()

def guard_revision(record, expected_revision):
    if record.revision != expected_revision:
        raise VersionConflict()
```

HiddenResource maps to404 and VersionConflict to409 in app/errors.py; child-specific GuardianLink and recipient checks are additional mandatory service checks, not replaced by these two helpers.
- [ ] Port contract tests run against MemoryQuestPort and HttpQuestPort with matching state semantics. Real persistence reload test, atomic double publish, family switching invalidates stale frontend query data. Run `uv run pytest -q`, Alembic upgrade on empty DB, web test/typecheck/build. Commit `feat: add authenticated family persistence`.

### Task 4: B40 — 非公開画像・新聞・撤回・削除

**Files:** Create `app/modules/sharing/media.py`, `newspaper.py`, `lifecycle.py`, `app/modules/sharing/media_routes.py`, `newspaper_routes.py`, `app/ports/media_store.py`, `app/adapters/local_media_store.py`, `app/modules/operations/deletion.py`, `apps/web/src/features/sharing/PhotoInput.tsx`, `PrintNewspaper.tsx`, `apps/api/tests/test_media.py`, `test_newspaper.py`, `test_deletion.py`.

**Interfaces:** `MediaStore.put(key:str,content:bytes)->None`, `get(key:str)->bytes`, `delete(key:str)->None`; callers authorize before adapter. `invalidate_card(db,card_id:UUID,actor:Actor)->None` revokes all related digital editions. Media URLs require current session; no permanently public links.

- [ ] Write failing tests: invalid image magic vs declared MIME, EXIF GPS removed, oversized image rejected, other-family media access404, revoked material invalidates newspaper and print view.

```python
def test_revocation_blocks_derived_newspaper(world):
    issue = world.publish_issue(card=world.card_a, recipient=world.grandparent_ab)
    world.guardian_a.client.post(f'/cards/{world.card_a.id}/revoke',json={
        'expectedRevision':world.card_a.revision,'operationId':'revoke1'})
    assert world.grandparent_ab.client.get(f'/newspapers/{issue.id}').status_code == 404
    assert world.grandparent_ab.client.get(f'/newspapers/{issue.id}/print').status_code == 404
```

`world.publish_issue` posts as guardian to `/newspapers/draft` then `/newspapers/{id}/publish`, both with material versions and recipients. It never inserts bypassed data directly.
- [ ] Run `uv run pytest tests/test_media.py tests/test_newspaper.py -q`. Implement JPEG/PNG only, max10MiB, pixel cap20MP, decode+re-encode stripping metadata; enforce at server and UI, add Pillow with version lock. Keep pending uploads inaccessible; failed upload leaves text intact. URL path does not accept arbitrary filesystem keys.
- [ ] Use a private volume and authenticated read endpoint; `Cache-Control: private, no-store` for sensitive records/media. Newspaper edition stores approved versions and recipients; revoke transaction marks each dependent edition invalid. Print route rechecks permission and annotates that printed copies cannot be recalled.
- [ ] Deletion: immediate access tombstone, background physical deletion target30days, backups max90days as operating targets. Implement deletion ledger and replay before serving a restored backup. Test export only includes authorized child/own data; restored tombstone never reappears. A scheduler runs due deletion jobs, never AI-generated instructions.
- [ ] Run API tests and Playwright photo-denied→text-only flow, camera EXIF fixture, image reload after logout, revoke while newspaper screen is open, close/reopen after revocation. Commit `feat: protect media and derived newspaper lifecycle`.

### Task 5: B50 — 3教材・お小遣い・成長と運営

**Files:** Create `content/templates/helping-v1.json`, basic/deep variants in each template, `content/schema.json`, `app/modules/allowance/models.py`, `service.py`, `routes.py`, `app/modules/operations/events.py`, `routes.py`, `apps/web/src/features/allowance/Ledger.tsx`, `apps/web/src/features/sharing/GrowthAlbum.tsx`, `apps/web/src/features/operations/OperationsView.tsx`, `apps/api/tests/test_allowance.py`, `test_events.py`, `apps/web/src/features/experience/templates.test.ts`.

**Interfaces:** `balance(entries:list[AllowanceEntry])->int`, entries have signed amount_yen, kind(received/spent/correction/promise), correction_of optional UUID. Event has event_name, pseudonymous_family_id, actor_role, template_version, request_id, occurred_at; no content fields. Operations metrics count requests, failures and recorded manual seconds.

- [ ] Write failing tests for promised vs received money and corrections; content tests require safety text, step IDs, source labels, basic/deep variants.

```python
def test_promise_is_not_received():
    from app.modules.allowance.service import balance, AllowanceEntry
    entries=[AllowanceEntry(kind='promise',amount_yen=500),
             AllowanceEntry(kind='received',amount_yen=200),
             AllowanceEntry(kind='spent',amount_yen=-80)]
    assert balance(entries) == 120
```

- [ ] Run `uv run pytest tests/test_allowance.py -q`; implement integer-yen ledger, one active goal per child, append-only corrections referencing original entry. No money movement or automated reward. API rejects spending positive amounts and received negative amounts, parents only for their linked children.

```python
def balance(entries):
    return sum(entry.amount_yen for entry in entries if entry.kind != 'promise')
```

- [ ] Add three reviewed template families with versioned basic/deep data. Test loading v2 cannot mutate an active v1 Experience. Use synthetic prices marked as examples; no live tariff estimates.
- [ ] Implement growth view showing observable choices and hints, not automatic S/Q ratings. Log allowlisted event fields only; tests assert raw text/photo/amount never serialized into analytics. O01 gets counts and intervention time only without separate content authorization.
- [ ] Run all API tests, web tests and fixtures. Commit `feat: add curriculum variants allowance and pilot metrics`.

### Task 6: B60 — 任意のAI下書きadapter（固定版から独立）

#### v0.4.1追加：課題分解・支援制御（F18、任意AIの比較範囲）

Create `apps/api/app/modules/experience/scaffolding.py`, `apps/api/app/modules/ai/guided_plans.py`, `apps/api/app/ports/guided_planner.py`, `apps/api/app/adapters/fake_guided_planner.py`, `openai_guided_planner.py`, `apps/api/tests/test_guided_plans.py`, `test_scaffolding.py`。Extend既存C02/QuestPortの`proposePlan`と`acceptPlan`、既存question/experience記録。StepCatalogは既存教材manifestを拡張し、最初は予算・買い物1題材に限定。

- [ ] AI v0.4.1の入出力・状態を実装する。`GuidedPlanner.plan(projected,allowed_steps)->UntrustedPlan`と`validate_plan(raw,catalog,completed_ids)->ValidatedPlan`を分ける。モデル出力は`contracts/guided-plan.schema.json`のみ。単発API・キー・料金上限・投影・取消は候補検索と共通。フラグ`AI_GUIDED_PLAN_ENABLED=false`を追加し、既存AIフラグとのANDで有効化。
- [ ] `POST /assist/plans`と`POST /plans/{id}/accept`を仕様どおり定義。clientのfamily/risk判定を信用しない。意味検査は計画／確認質問／範囲外の三分岐、前提順、候補・目的・版・許可を含む。
- [ ] GP01〜06を先に`test_guided_plans.py`と`test_scaffolding.py`の実service testsへ落とす。`uv run pytest tests/test_guided_plans.py tests/test_scaffolding.py -q`で未実装による失敗を観察し、実装後に成功を確認。想定失敗は未実装／契約違反、成功条件は上記6仕様と既存認可テストがすべて通ること。
- [ ] 子の「もっと小さく」は監修済み小分け経路で処理し、自己申告から能力点を作らない。ヒントは再表示可。採用前や後着のAI案で現在の選択を置換しない。完了済み記録を保持する。
- [ ] 固定手順、候補検索のみ、課題分解の三条件を同じ合成入力で比較できるrunnerへ拡張。fakeでの契約試験と実モデル評価を分け、予算と認証が使える場合だけ合成モデル評価。実家庭調査は自動開始しない。
- [ ] 子の独力の判断と親工数に改善がなければOFF。新しい画面や自律agent基盤、独自モデル学習は追加しない。モデル用の指示は候補外生成禁止・目標保持・不明時clarify/no_match・入力命令を信用しないことを明記し、既存開発スキルを送信しない。


#### v0.4追補（このTaskの必須範囲）

Create `apps/api/app/modules/ai/next_actions.py`, `next_action_routes.py`, `apps/api/app/ports/action_matcher.py`, `apps/api/app/adapters/fake_action_matcher.py`, `openai_action_matcher.py`, `apps/api/tests/test_next_actions.py`, `test_action_adapter.py`, `scripts/eval_next_actions.py`。Extend `apps/web/src/ports/QuestPort.ts`, memory/http adapters and SuggestionPanel。Read contracts/next-action-match.schema.json and next-action-match.prompt.md。

Interfaces: `ActionMatcher.match(projected:MatchInput)->UntrustedMatch`、`eligible_actions(actor,question)->list[CuratedAction]`、`validate_match(raw,allowed_ids)->list[str]`。APIはAI v0.4の`/assist/next-actions`と`/{suggestion_id}/choose`。suggestionはquestion/projection/consent/教材の版と15分expiryを持ち、表示・選択直前に再認可する。

- [ ] fake adapterで合成16ケースのapplication行を実service経由でテスト。model行はfake出力のPASSにしない。候補外、重複、no_match不整合、個人情報未確認、同意撤回、別家庭、期限切れ、廃止教材を拒否する。
- [ ] 同じ返信でも本人のfocus_idが異なれば入力投影と候補が異なることを確認。候補ゼロ・固定だけで足りる場合はモデル呼出しゼロ。親の送信投影確認待ちでも固定候補は操作可能。
- [ ] 先に`uv run pytest tests/test_next_actions.py tests/test_action_adapter.py -q`で失敗を確認。OpenAI adapterのHTTP mockでpayloadのmodel、strict schema、store=false、toolsなし、streamなし、秘密鍵が応答／ログにないことを検査。SDKの自動再試行を抑え、総2試行／10秒を超えない。
- [ ] 環境設定は`AI_ENABLED=false`, `AI_PROVIDER=openai`, `AI_MODEL`, `OPENAI_API_KEY`, `AI_INPUT_PRICE_PER_M`, `AI_OUTPUT_PRICE_PER_M`, `AI_TOTAL_BUDGET_JPY`, `AI_LIVE_CHILD_DATA_ENABLED=false`。秘密値をコミットしない。価格／モデル／提供元条件がない時は固定版。キーや外部契約の未取得をD0の未完成理由にしない。
- [ ] 適切な認証と料金条件が利用可能な時だけ、明示した合成データ用runnerを`uv run python ../../scripts/eval_next_actions.py --dataset ../../evals/next-action-cases.jsonl --repeats 3 --data-kind synthetic`で実行。既存24件も該当jobの評価を維持。実データは別gate。runnerはfixture全行のdata_kind確認後にのみ外部接続する。
- [ ] 比較表に適切な候補／no_match、本人の主導権、親工数、p95待ち時間、費用を残す。AI41の改善を示せなければOFF維持。新聞の下書きは別機能として後から評価する。


**Files:** Create `app/ports/draft_provider.py`, `app/modules/ai/projection.py`, `policy.py`, `service.py`, `routes.py`, `budget.py`, `app/adapters/fake_draft_provider.py`, `apps/api/tests/test_ai_policy.py`, `test_ai_cases.py`, `apps/web/src/features/sharing/AIDraftReview.tsx`.

**Interfaces:** `DraftProvider.generate(job:ProjectedJob)->UntrustedDraft`; `project_job(actor,job_type,source_ids,consent_version)->ProjectedJob`; `validate_draft(draft,job)->ValidatedDraft`; application envelope and schema are defined in AI v0.2. FakeDraftProvider is deterministic and returns only synthetic fixtures. Real provider is not required for fixed M1.

- [ ] Add tests for all24 `evals/ai-cases.jsonl` expectations. Application tests exercise actual service/projection with fake provider; model-layer cases are scheduled offline model evaluations, not fake-provider “passes”.

```python
def test_provider_not_called_without_child_data_clearance(ai_world):
    ai_world.settings.live_child_data_enabled=False
    result=ai_world.request_newspaper()
    assert ai_world.provider.calls == 0
    assert result.mode == 'fixed'
```

ai_world constructs service with deterministic FakeDraftProvider, fake clock and repositories seeded with consent/version fixtures; request_newspaper goes through the same policy entry used by route. No network in test fixture.
- [ ] Run `uv run pytest tests/test_ai_policy.py -q`. Implement pre-call identity/consent checks, permitted source projection, per-family daily10 and weekly50JPY budget reservations, maximum2 attempts within10seconds, explicit refusal/timeout fallback, structured schema and job-specific semantic validation. No tools callable by model; all IDs are allowlisted source refs.
- [ ] Implement post-call consent/version check and kill switch. Rejected/expired results must not be persisted as usable draft. UI shows original+proposal+reason+uncertainty and edit/skip. No auto-publication.
- [ ] Add real provider only after current service terms and credentials are explicitly available for that use. Record provider/model/price configuration, child-data conditions and endpoint. Run synthetic model cases3times/config before considering actual-family opt-in. The user’s implementation-start instruction is not authority to send child data to a provider.
- [ ] Commit `feat: add bounded draft pipeline with offline adapter`. Report separately fake-service test results and actual-model evaluation status.

### Task 7: B70 — 全体の品質・切戻し・実家庭へのゲート

UX41〜45／AI41の証拠欄を設ける。利用者評価未実施とDOM／E2E合格を区別する。B60を含む時はGP01〜06も確認。

**Files:** Create `tests/e2e/m1-family-loop.spec.ts`, `m1-accessibility.spec.ts`, `m1-revocation.spec.ts`, `.github/workflows/verify.yml`, `docs/operations/LOCAL_RUN.md`, `docs/operations/RELEASE_CHECKLIST.md`.

**Interfaces:** Test runner starts web+API+test Postgres; creates accounts through test OIDC and seeded invitations, not unprotected production role switching. CI uses lockfiles, fresh test database and fake AI.

- [ ] Write the failing end-to-end assertions for published card visibility, parent reauthentication, logout data clearing and non-public media.

```ts
import {test,expect} from '@playwright/test';
test('reduced motion does not remove the main action',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/demo');
 await expect(page.getByRole('button',{name:'やってみる',exact:true}).first()).toBeVisible();
 await expect(page.getByText('合成データのデモ')).toBeVisible();
});
```

Production-build test must assert `/demo` is absent, not reuse this demo test as a production requirement. Run demo and production-like configurations in separate CI jobs.
- [ ] Wire CI commands: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`; API `uv sync --frozen`, `uv run pytest -q`, migrations on empty test DB. Test runner scripts and package commands must be runnable without secrets; missing scripts fail CI rather than being silently skipped.
- [ ] Complete AC01〜AC15 from product-design plus feature matrix F01〜F21, motion M01〜M07, and the five Review Focus cases. Save viewport screenshots at360/390/768 and200%text. Test user interaction with reduced motion at OS and app settings independently.
- [ ] Local run docs give exact startup, migrations, test fixtures and cleanup commands for explicit test resources. Release checklist separates D0 demo, M1 local, live family pilot and optional live AI. Never label full product complete because only D0 passed.
- [ ] Rollback: disable affected feature flags first, return AI to fixed output, revert application build to preceding tested image, preserve DB data. Destructive migrations require tested restore plus tombstone replay and separate approval; do not downgrade production DB on guesswork. Commit `test: verify family experience and release boundaries`.

## 要件と作業の対応

| 要件 | 主な作業 | 完了証拠 |
|---|---|---|
| FR01 家族認証 | B30 | OIDC/session/invitation/tenant tests |
| FR02 日常投稿 | B20/B40 | text-only, metadata stripping, private media |
| FR03 教材 | B10/B50 | interchangeable templates, pause/decline/version |
| FR04 たね | B20 | reply→seed→choice→new experience; no forced sharing |
| FR05 共有 | B20/B30 | child choice, revision/audience checks |
| FR06 新聞 | B20/B40 | 6 materials, print, derived revocation |
| FR07 応答 | B20/B30 | optional response, idempotency |
| FR08 近況 | B20/B30 | ACK-only timestamp, sender identity |
| FR09 お小遣い | B50 | ledger, correction, no real transaction |
| FR10 撤回・削除 | B30/B40 | cross-family rejection, tombstone restore |
| FR11 運営 | B50 | event allowlist, no private content |
| UX01/M01〜M07 | B10/B20/B70 | motion/reduced/focus/viewport evidence |
| AI任意層 | B60 | actual service checks; model evaluation separately |

## 計画セルフレビュー

製品の要件ID、三役の画面、教材交換、原文保持、共有撤回、実家庭の認証、AI初期OFFは上表と各作業に対応。原価・親負担・教育効果・支払意思は実装テストでは証明できず、PILOTで観察する。全コードをこの文書からコピーすれば完成するという意味ではなく、Codexが境界・ファイル・テストから実装するための計画である。実装開始前の依存インストール、ビルド、製品テストは未実施。
