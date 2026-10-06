# Yattemi Quest Feature Implementation Plan 2026-10-07

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, native/sequential. Each S-number is one development-and-review unit. Do not complete an entire B-group before reviewing its individual features.

**Goal:** 今日整理した本体機能を一機能ずつ実装し、本人の選択、簡単な記録、家族の新聞、お金と報酬、次に任せる範囲へつなぐ。

**Architecture:** React/TypeScriptの機能別UIはdomain型と用途別Portへ依存し、FastAPI・PostgreSQLで家族と権限、保存と履歴を扱う。教材・表示・入力・AI・保存先を分離する。合成fixtureは検査の入力として使い、機能ごとの実装を保存まで確認する。

**Tech Stack:** 既存設計のReact19／TypeScript5／Vite8、Node22.12以上の22系または24系、Vitest／Testing Library／Playwright、Python3.12／FastAPI／SQLAlchemy2／Alembic／PostgreSQL16を引き継ぐ。実装時に対応する具体版を解決しlockへ固定する。

**Spec:** `docs/design/やってみクエスト_機能全体と導線の設計順_20261006.md` v5を今回の範囲と実装順の入口にする。詳細は同フォルダの主要導線v2・アルバムと家庭のお金／報酬v1、既存の役割・権限・AI契約を参照する。

## 既存計画から変えたこと

旧B10〜B70のIDとTask番号1〜7は引継ぎのために残す。各Bは管理上の区分で、その中のS番号一つを実装・確認・修正してから次のS番号へ進む。今日の整理を優先し、最初から全導線のデモを完成させることを開発単位にしない。

今回の作業は設計・実装計画の整理。製品コードや実行結果を作成した扱いにはしない。現在の状態と実際の実装着手はPROJECT_STATEで管理する。

## Global Constraints

- 各変更にoperationIdとexpectedRevisionを持たせ、保存・公開・ポイント・受取を二重に確定しない。
- 公開対象は本文・素材・相手・版に結び付け、変更や撤回の後に古い承認で公開しない。
- 円、ポイントP、練習円と、見込み・約束・予約・消費・受取を区別する。
- 本人の原文と認識・整理・生成文を区別し、本人が話していない理解や理由を補わない。
- 祖父母の参加・毎日操作・返信を子の体験の必須条件にしない。
- 子ども・親の本文16px以上、祖父母20px以上、タッチ48px以上、祖父母主操作56px以上を既存設計から引き継ぐ。
- 実家庭データ、公開、決済、外部通知、ライブAIの条件は既存の実運用の境界に従う。ローカル検査には合成入力を使う。
- 日数とstory pointは未推定。機能の完成条件と依存から順番を決め、実作業の結果で範囲を調整する。

## Review Focus

1. S01/S07/S08：共有端末の親子切替、別家庭、変更後の承認で範囲が漏れないこと。
2. S04/S05/S06：音声誤認識・通信失敗・再開で原文と入力を失わず、未保存を成功扱いしないこと。
3. S09/S10/S11：新着なし・返信なし・祖父母不参加でも、それぞれの用事が成立すること。
4. S15/S17/S19：同時操作・取消・提供不可・ルール変更で二重付与、二重消費、未受取の先行計上をしないこと。
5. S18/S23/S24：記録不足・AI失敗・原文変更で能力認定や本人への未確認文章の表示へ進まないこと。

## 全機能に共通の進め方

各S番号で、仕様の完成条件に対応する状態・計算・権限・接続を確認する。重要な動作には失敗するテスト→最小実装→テスト・型・build→対象機能の操作確認→commitの順を使う。見た目だけの低影響な変更には実装を写すだけのテストを増やさない。

通常の確認：Webは`npm test -- <対象テスト>`、`npm run typecheck`、`npm run build`。APIは`uv run pytest <対象テスト> -q`。関連機能の接続時に`npm run test:e2e -- <対象spec>`を実行し、実際に行った結果を記録する。scriptとlockはB10で用意する。

## 対象外にせず、後の機能として残すもの

S20銀行、S21借入、S22銘柄・利回り、S25歩数、S26日記、S27印刷は全体の枠と依存に残す。着手する時に当該機能だけの入力・保存・例と検査を具体化し、現在の機能へ一括で詰め込まない。実装の開始条件に、これら全ての細部を確定することを加えない。

### Task 1: B10 — 共通基盤と体験

**Files:** `apps/web/package.json`、`apps/web/src/main.tsx`、`apps/web/src/App.tsx`、`apps/web/src/design/tokens.css`、`apps/web/src/design/components/RoleHome.tsx`、`apps/web/src/ports/ExperiencePort.ts`、`apps/web/src/features/experience/ConditionsCard.tsx`、`apps/web/src/features/experience/CompareChoices.tsx`、`apps/web/src/features/experience/FixedHelp.tsx`、`apps/api/pyproject.toml`、`apps/api/app/main.py`、`apps/api/app/db.py`、`apps/api/app/modules/identity/models.py`、`apps/api/app/modules/identity/session.py`、`apps/api/app/modules/identity/oidc.py`、`apps/api/app/modules/identity/routes.py`、`apps/api/app/modules/family/models.py`、`apps/api/app/modules/experience/models.py`、`apps/api/app/modules/experience/routes.py`、`compose.yaml`、`content/templates/shopping-v1.json`

**Interfaces:** FamilyAccessはfamilyId・memberId・role・managedChildIdsをサーバー側で決める。Experienceは目的・条件・templateId/version・revision・statusを持つ。saveExperience／pauseExperience／resumeExperienceは保存結果を返す。UIがroleを送って権限を決めない。

**Test:** family-access.test.ts／conditions.test.ts／test_tenant.py。対象Sの完成条件を対応付ける。

#### S01 家族・役割・保存・共通の入口

- [ ] 対象仕様と前提：なしを確認し、家族と役割、本人と親の閲覧範囲、再開、文字拡大、通常・空・失敗の表示をそろえる。
- [ ] 次の完成条件を対象機能で確認する：家族と役割を切り替えても別家庭・親の情報を子へ返さない。／保存が失敗した時は未保存と表示し、再開しても入力を失わない。／文字拡大・音声以外の入力・戻る操作から同じ用事を続けられる。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S02 今回の用事・目的・条件

- [ ] 対象仕様と前提：S01を確認し、夕飯の買い物を代表場面に、料理・人数・予算等を親子で決め、条件を保存する。
- [ ] 次の完成条件を対象機能で確認する：親子が決めた条件を表示し、変更・中断・再開できる。／買わない、待つ、別の用事にする選択を残す。／条件を決めることと、実際に使った額を記録することを分ける。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S03 比較・相談・必要時の支援

- [ ] 対象仕様と前提：S02を確認し、今買う・待つ・別の商品や店を見る等の選択肢を比べ、困った時だけ計算・知識・手順の助けを開く。
- [ ] 次の完成条件を対象機能で確認する：本人が比べる条件と選択を変えられ、支援を閉じて自分で続けられる。／買うことや一番安い商品を自動で正解にしない。／AIなしの固定の説明で用事を続けられる。商品検索・価格連携は別の拡張として扱う。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

B10のS01でworkspace・API起動・DB migration・session検査・Webのscriptと依存lockを用意する。役割切替fixtureはテスト用途とし、M1の認可はserver session由来。S02以後は保存済みの条件と本人の選択を使う。

### Task 2: B20 — 記録・アルバム・共有確認

**Files:** `apps/web/src/ports/RecordPort.ts`、`apps/web/src/ports/SharingPort.ts`、`apps/web/src/features/records/RecordCard.tsx`、`apps/web/src/features/records/VoiceInput.tsx`、`apps/web/src/features/records/PhotoAttachment.tsx`、`apps/web/src/features/records/Album.tsx`、`apps/web/src/features/sharing/ShareChoice.tsx`、`apps/web/src/features/sharing/ReviewInbox.tsx`、`apps/api/app/modules/records/models.py`、`apps/api/app/modules/records/routes.py`、`apps/api/app/modules/sharing/service.py`、`apps/api/app/modules/sharing/routes.py`、`apps/api/app/modules/media/service.py`

**Interfaces:** EventRecordはid・authorId・eventDate・revision・originalText・mediaIds・experienceIdを持つ。RecordPort.saveRecord/getRecord/listRecordsとSharingPort.requestShare/reviewShare/revokeShareを分ける。音声入力は文字の候補を返し、本人が確認してからsaveRecordへ渡す。

**Test:** record-card.test.tsx／sharing.test.ts／test_record_sharing.py。対象Sの完成条件を対応付ける。

#### S04 一言・音声の記録カード

- [ ] 対象仕様と前提：S02を確認し、話すか短く書き、同じカードで本人の言葉を確認・修正して残す。共有希望も同じカードから選べる。
- [ ] 次の完成条件を対象機能で確認する：音声の認識結果を本人が直してから保存し、使えない時は文字に切り替えられる。／話していない理由・理解・感情を補って本人の言葉にしない。／保存済み・未保存を区別し、共有しなくてもここで終われる。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S05 写真を付ける

- [ ] 対象仕様と前提：S04を確認し、同じ出来事へ写真を追加・差し替え・削除する。
- [ ] 次の完成条件を対象機能で確認する：写真なしでも記録を保存できる。／許可された人だけが写真を取得でき、撤回した素材を再取得できない。／アップロード失敗を保存成功と表示しない。位置情報とサイズは既存画像仕様に従う。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S06 アルバム・過去の出来事

- [ ] 対象仕様と前提：S04を確認し、日付・本人・写真または一言から開き、当時の選択と後日の追記を見返す。
- [ ] 次の完成条件を対象機能で確認する：保存した一件を再入力せず一覧と詳細で読める。／原文・後日の追記・家族の言葉の出所を区別する。／私的な予算・支援履歴を、家族向けの表示へ自動で含めない。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S07 見せる内容・相手の選択

- [ ] 対象仕様と前提：S04・S01を確認し、本文・写真・相手を選び、保存と公開を分ける。
- [ ] 次の完成条件を対象機能で確認する：共有の初期値は未選択で、見せない選択から終われる。／実際に送る文章と相手の名前を表示する。／変更・撤回に合わせて公開範囲を更新する。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S08 親の確認トレイ・一押し承認

- [ ] 対象仕様と前提：S07を確認し、内容・原文・相手を一枚にそろえ、承認・変更・保留を選ぶ。交換や任せ方の提案も同じ確認の入口へ置く。
- [ ] 次の完成条件を対象機能で確認する：何を誰に送るか見える状態で、一押しで確定できる。／内容や相手を変更したら、古い共有意思と承認を使わない。／日付・宛先候補・下書きの準備を自動化し、同じ確認を重ねない。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

### Task 3: B30 — 家族新聞・本人の近況・返信

**Files:** `apps/web/src/ports/FamilyFeedPort.ts`、`apps/web/src/features/family/Newspaper.tsx`、`apps/web/src/features/family/CheckinCard.tsx`、`apps/web/src/features/family/ReplyForm.tsx`、`apps/web/src/features/experience/ReplyToSeed.tsx`、`apps/api/app/modules/family/feed.py`、`apps/api/app/modules/family/checkins.py`、`apps/api/app/modules/family/replies.py`、`apps/api/app/modules/experience/seeds.py`

**Interfaces:** FamilyFeedPort.listFeed(date,author)は現在許可された記録だけを返す。postCheckin(text,recipients,operationId)、reply(recordId,text,operationId)、createSeed(sourceReplyRef,childFocus,operationId)は出所と版を保つ。成人自身の投稿と子素材の共有を分ける。

**Test:** family-feed.test.tsx／test_family_feed.py。対象Sの完成条件を対応付ける。

#### S09 家族新聞・日付別の閲覧

- [ ] 対象仕様と前提：S08・S06を確認し、公開された出来事を最新・日付別で読み、過去へ戻る。号の発行は任意のまとめ方にする。
- [ ] 次の完成条件を対象機能で確認する：同じ許可済み記録を新聞とアルバムで使う。／毎日、親が編集して発行しなくても読める。／新着がない時も過去を読め、撤回した素材は表示しない。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S10 祖父母本人の「元気だよ」・一言

- [ ] 対象仕様と前提：S01・S09を確認し、本人が日付・内容・相手を見て、一押しまたは短い入力で近況を届ける。
- [ ] 次の完成条件を対象機能で確認する：成人本人の投稿は本人が確定し、子世代の承認待ちにしない。／送信の成功と相手の閲覧・返信を区別する。／未操作の日から健康や安全を判定せず、子の記録や学習も止めない。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S11 読んだよ・経験・質問

- [ ] 対象仕様と前提：S09を確認し、記事へ任意の返事を残し、誰の言葉かを保つ。
- [ ] 次の完成条件を対象機能で確認する：返信しなくても記事を読め、子の体験が終われる。／経験・質問・応援を事実や正解へ置き換えない。／元の共有が撤回された時の閲覧範囲を守る。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S12 家族の言葉から次のたね

- [ ] 対象仕様と前提：S11・S02を確認し、家族の経験や質問を候補にし、子が次に試すことを選ぶ。
- [ ] 次の完成条件を対象機能で確認する：採用しない選択を残し、自動で体験を開始しない。／元の返信、本人の焦点、次の体験をたどれる。／元の返信が撤回されたら派生候補を見直す。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

### Task 4: B40 — 円の財布・家庭ルール・ポイント・交換

**Files:** `apps/web/src/ports/AllowancePort.ts`、`apps/web/src/ports/RewardPort.ts`、`apps/web/src/features/allowance/Wallet.tsx`、`apps/web/src/features/allowance/FamilyRules.tsx`、`apps/web/src/features/rewards/PointHistory.tsx`、`apps/web/src/features/rewards/RewardCatalog.tsx`、`apps/web/src/features/rewards/RedemptionCard.tsx`、`apps/api/app/modules/allowance/models.py`、`apps/api/app/modules/allowance/service.py`、`apps/api/app/modules/rewards/models.py`、`apps/api/app/modules/rewards/service.py`、`apps/api/app/modules/rewards/routes.py`

**Interfaces:** AllowancePort.recordReceipt/recordExpense/listEntriesは円の履歴を扱う。RewardPort.grantPoints/listRewards/requestRedemption/reviewRedemption/confirmReceipt/cancelRedemptionはPの履歴と約束を扱う。冪等なoperationIdとexpectedRevisionを各変更に付ける。

**Test:** wallet.test.ts／redemption.test.ts／test_reward_ledger.py。対象Sの完成条件を対応付ける。

#### S13 円の受取・支出・残り・目標

- [ ] 対象仕様と前提：S04・S01を確認し、家庭での受取と支払を記録し、残額と貯金目標を見せる。
- [ ] 次の完成条件を対象機能で確認する：入った・使った・残ったを整数円で記録する。／渡す予定・承認した追加額を受取済み残高へ先に加えない。／訂正は元の取引に対応する履歴を残す。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S14 金額・渡し方・用途の家庭設定

- [ ] 対象仕様と前提：S13を確認し、月・週・都度などの渡し方、金額、用途、相談する条件を親子で設定する。
- [ ] 次の完成条件を対象機能で確認する：親が選んだルールと次の受取予定を子が見られる。／周期と金額を別に変更でき、周期だけの変更で期間総額を混同しない。／変更の対象期間と版を残し、本人の希望を確認できる。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S15 家族ポイントの付与・残高

- [ ] 対象仕様と前提：S13・S14を確認し、家庭が事前に合意した活動に、確定したポイントを付ける。
- [ ] 次の完成条件を対象機能で確認する：円とポイントを別の残高と履歴で見せる。／付与と訂正を記録し、再試行・二重操作で二重付与しない。／記録・公開・毎日ログインや能力点をポイント獲得の義務にしない。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S16 家庭の特典一覧

- [ ] 対象仕様と前提：S15を確認し、親が実現できる特典を設定し、子が必要ポイントと条件を比べる。
- [ ] 次の完成条件を対象機能で確認する：追加のお小遣い、プレゼント、お出かけ等を家庭が設定できる。／内容・対象期間・家族の負担を含む交換条件を示す。／全家庭共通のポイント換算やDisney等の提供をサービスが保証した表示にしない。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S17 交換・親確認・受取・取消

- [ ] 対象仕様と前提：S15・S16・S08を確認し、特典を選び、ポイントを予約し、親の確認、受取、取消まで一件として扱う。
- [ ] 次の完成条件を対象機能で確認する：申請時の予約、承認時の消費、実際の受取を別の状態にする。／親の確認トレイから内容と条件を見て判断できる。／却下・取消・提供不可では対応する返却を行い、二重消費・二重受取を防ぐ。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

S17の状態：requested（P予約）→approved（P消費・未受取）→received。rejected/cancelledは対応する予約解除または返却へ進む。提供できない時はreceivedにしない。台帳・状態変更は一つのtransactionと冪等キーで確定する。

### Task 5: B50 — 任せ方の提案・家庭内金利

**Files:** `apps/web/src/features/responsibility/ProposalCard.tsx`、`apps/web/src/features/responsibility/TrialReview.tsx`、`apps/web/src/features/allowance/InterestRule.tsx`、`apps/web/src/features/allowance/Allocation.tsx`、`apps/api/app/modules/responsibility/service.py`、`apps/api/app/modules/responsibility/routes.py`、`apps/api/app/modules/allowance/interest.py`

**Interfaces:** ProposalService.evaluate(recordRefs,ruleVersion)は根拠・未確認点・提案条件・保留理由を返す。approveTrialは親子の合意した金額・周期・用途・期間を保存する。InterestService.quote(ruleVersion,period,ledgerRefs)は見込み額を返し、実際の受取はS13の円履歴へ別に記録する。

**Test:** proposal.test.ts／interest.test.ts／test_interest.py。対象Sの完成条件を対応付ける。

#### S18 根拠付きのお小遣い・任せ方提案

- [ ] 対象仕様と前提：S03・S04・S13・S14を確認し、過去の選択・比較・相談等を参照し、次の金額・周期・用途を提案する。親が承認・変更・保留し、期間を決めて試す。
- [ ] 次の完成条件を対象機能で確認する：対象領域、根拠となる記録、未確認点、提案条件を同じカードに示す。／記録不足では保留し、単一の能力点や全面的な自立認定へ変換しない。／親の承認と子の希望、試した後の見直しを残す。判定方式は透明なルールから始める案。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S19 家庭内金利・使う／貯める配分

- [ ] 対象仕様と前提：S13・S14を確認し、親が負担する貯蓄ボーナスの期間・率・対象額・上限を設定し、使う・貯める配分と増える額を見る。
- [ ] 次の完成条件を対象機能で確認する：月率／年率、支払者、対象額、上限、未受取を示す。／途中の引出しとルールの版変更で対象額を再計算する。／増える見込み、支払の約束、受取済みを区別する。5%等の既存数値は説明例として扱う。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

S18は確認できる記録に基づくルール提案と手動の代替から始める。提案方式・閾値を能力保証にしない。S19の説明例は月率5%、500円→見込み25円、対象期間内で200円使い対象300円→見込み15円、次期525円×5%は整数円へ切り捨て26円。対象基準・上限・時点は家庭ルールの版と詳細案へ対応付け、受取履歴へ先に加えない。

### Task 6: B60 — 必要なAI補助

**Files:** `apps/web/src/features/experience/SuggestionPanel.tsx`、`apps/web/src/features/sharing/DraftReview.tsx`、`apps/api/app/modules/ai/jobs.py`、`apps/api/app/modules/ai/gates.py`、`contracts/next-action-match.schema.json`、`contracts/guided-plan.schema.json`、`contracts/ai-draft.schema.json`

**Interfaces:** 既存のnext_action_match／guided_plan／ai-draft契約を使う。監修済み候補の対応付けと新規文章を区別する。音声後の記録整理jobは新規契約を決めてから追加し、既存jobへ家庭金融履歴を無断で流さない。

**Test:** 既存のAI契約・拒否経路・fixtureの評価検査。対象Sの完成条件を対応付ける。

#### S23 困り所に合う候補・手順の補助

- [ ] 対象仕様と前提：S03を確認し、本人が選んだ困り所を、監修済み候補・手順へ対応付ける。
- [ ] 次の完成条件を対象機能で確認する：固定の支援へ戻れ、本人が採用・変更・見送りできる。／候補の出所と表示理由を示し、モデルに公開・お金・権限の変更を任せない。／現行AI契約で許された入出力と提供条件を満たす時だけ使う。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

#### S24 記録整理・新聞下書きの補助

- [ ] 対象仕様と前提：S04・S08を確認し、原文と数字の整理、新しい短文化案を分け、本人の言葉と生成文を区別する。
- [ ] 次の完成条件を対象機能で確認する：原文と整理した項目の対応を示し、未発言の事実を埋めない。／新しい文章は下書きとして原文との差分を示し、確認した内容だけを共有する。／音声認識・通常の計算・AI生成を別の作業として扱う。新しい記録整理jobは既存契約への追加検討が必要。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

### Task 7: B70 — 接続確認・運営とアクセシビリティ

**Files:** `apps/api/app/modules/operations/events.py`、`apps/web/tests/e2e/record-album-sharing.spec.ts`、`apps/web/tests/e2e/family-newspaper.spec.ts`、`apps/web/tests/e2e/allowance-rewards.spec.ts`、`apps/web/tests/e2e/responsibility-interest.spec.ts`、`docs/workflow/VERIFICATION.md`

**Interfaces:** 各Portから返る保存・公開・予約・消費・受取の状態を、関連する機能のE2Eで照合する。運営イベントは家族の全文を常時公開せず、実行した検査と未実施の確認を別に残す。

**Test:** tests/e2e/各specと運営記録の検査。対象Sの完成条件を対応付ける。

#### S28 機能をつないだ確認・運営記録

- [ ] 対象仕様と前提：S01を確認し、各機能の完了を確かめ、関連する機能の引継ぎを確認する。
- [ ] 次の完成条件を対象機能で確認する：保存・公開・金銭・受取を伴う変更に対応する検査を実行して証拠を残す。／返信なし・祖父母不参加・通信や音声やAIが使えない場合も主要な用事を続けられる。／操作できたこと、学習の改善、支払需要を別の成果として記録する。
- [ ] 重要な保存・状態・計算・権限のテストを書き、未実装で失敗することを確認する。
- [ ] 上の担当ファイルへ最小の実装を入れ、対象テスト・型・buildを確認する。
- [ ] 対象機能を操作して修正し、既存機能との接続を確認してからcommitする。次のSへ進む。

各Sの動作確認が済んだところで、関連する機能の引継ぎを検査する。製品の操作検査、実家庭での理解や学習、購入需要の確認を同じ完了として扱わない。

## スキルと進捗の引継ぎ

`.agents/skills/user-stories`で対象機能の完成条件を確認し、`sprint-plan`で依存と作業量を見直す。`outcome-roadmap`で目的を保つ。現在の区分は機能別開発であり、スキル例の2週間周期等は固定採用しない。

元の機能F01〜F21と既存のB10〜B70は保持する。新しいお金・報酬機能はS15〜S22で区別し、既存F14を実装しただけで完了扱いにしない。実装済みとする時はTASKSと対象機能の実行証拠を更新し、CURRENTは生成する。
