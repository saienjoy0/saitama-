# 変更と拡張の境界 v0.3

目標は「何でも設定で変えられる巨大エンジン」ではない。利用者の反応で替わりやすい教材・表示・配信・AIを分離し、同意と権限の意味は安定させる。

## 1. 変更の分類

| 変わりやすいもの | 変更場所 | 不変にするもの | 変更時の検査 |
|---|---|---|---|
| 最初の教材、水→買い物 | 教材ID・推薦順の設定 | 体験の保存形式と本人選択 | 同じrendererで双方を完了 |
| 基本／深掘り、年齢帯 | 版管理した教材JSON | 実施中は開始時の版 | 旧カードが新しい問いに化けない |
| 文字・間隔・動き | tokens.css / motion config | 状態名、権限、読み上げ | 全三役・reduced motion |
| 役割のホーム配置 | role view model / navigation | サーバーの認可 | 子に親操作を渡さない |
| 印刷・メール等の配信 | DeliveryPortのadapter | 公開承認・宛先・素材版 | 新経路でも送信直前検証 |
| AI提供元 | DraftProvider adapter | 許可された入出力、監査、予算 | 同じ24評価・年齢保持条件 |
| 画像保管サービス | MediaStore adapter | 非公開・認可・失効 | 撤回済み画像を再取得不可 |
| 新しい家族・兄弟 | Membership/GuardianLink | 家庭境界と対象児の関係 | 同じ親でも無関係の子へ拒否 |
| 将来の言語 | message key / 教材locale | 原文と翻訳の版の区別 | 欠落時は既存言語、誤訳で承認しない |

## 2. 採用構成と配置

実装は単一リポジトリのReact/TypeScript＋Vite、FastAPI、PostgreSQL、非公開画像保管。D0は同じ画面にメモリadapterをつなぐ。デモdataを本番DBに自動移行しない。React Native/Expoは採用しない。ogenkiのコード互換性を今回の前提にしない。

- `apps/web/src/design/`：tokens・motion・共通primitive。
- `apps/web/src/features/experience/`：共通の体験進行。教材文言を埋め込まない。
- `apps/web/src/features/sharing/`：カード、確認、新聞、返信。
- `apps/web/src/features/family/`：招待・役割・近況。
- `apps/web/src/features/allowance/`：記録のみの金額計算。
- `apps/web/src/ports/`：UIが依存する境界、`adapters/demo` と `adapters/http` は排他的。
- `apps/api/app/modules/`：identity、experience、sharing、family、allowance、ai、operationsの責務別。
- `content/templates/`：水・買い物・手伝いの審査済み教材版。`content/manifest.json` が推薦順。
- `contracts/`：共有型・JSON schema・OpenAPI生成結果。

グローバルstoreに家族全文を入れない。HTTPから取るview modelは権限で投影済み。UIの非表示はセキュリティ境界ではない。

## 3. 状態と履歴

Experienceはtemplate_id＋template_versionを固定して開始。Observationは問いID＋入力版＋操作主体を保存。終了後の教材改訂で回答を書き換えない。Shareは素材版＋宛先＋本人意思＋親承認。新聞は共有素材のsnapshot参照で、返信が来ても旧号を自動改稿しない。

教材の選択肢やステップを足すのはJSON編集で済むが、新しい入力型（録音・位置・決済など）は新機能設計になる。任意のJavaScript、HTML、外部URLの実行を教材JSONへ入れない。

schema_versionを上げる変更は明示的migrationを用意。未知versionは読めない説明と元データ保持、推測変換しない。移行はテストfixtureで旧→新、切戻し可能性、削除済みデータの扱いを確認してから。

## 4. フラグと可変設定

デモ設定は `mode=demo`。本番でdemo adapterを読めば起動失敗させる。ユーザーがURL queryで権限やモードを変更できる設計にしない。

変更可：initial_template_id（既定water-v1）、教材候補順、motion_reduced、文字サイズ、familyのAI opt-in、親確認後のAI job選択、新聞記事数（1〜6）。権限・子の共有意思・親再認証・家庭間分離はフラグで解除しない。

AI jobフラグは既定OFF。条件未確認のproviderをONにするとサーバー設定検証が失敗する。体験は固定版のまま動く。

## 5. 「ここではなかった」時の変更手順

1. 利用者がつまずいた機能ID・画面ID・状態を記録する。
2. 原因を内容／表示／頻度／権限／価値仮説に分類する。
3. 安全・契約に触れない教材・見た目の変更は対象版を更新して比較する。変更だけで全設計の再承認を要求しない。
4. データ共有範囲、収集情報、金銭、外部通知、AI権限が変わる場合はその差分をレビューする。
5. 親の負担・本人の選択・祖父母の任意性が悪化していないか見て、良い場合に次版へ。過去記録は元の版で読む。

## 6. 開発環境の選択

Node 22系（22.12以上）または24系、React19、Vite8、TypeScript5、Python3.12、FastAPI、SQLAlchemy2、Alembic、PostgreSQL16。初回BUILDで採用範囲内の具体版を解決しpackage-lock.json／uv.lockへ固定する。プラグインのpeer互換性を実行確認し、lockを作る前に導入済みと報告しない。後続はnpm ci／uv sync --frozen。

D0はNodeだけで開始でき、外部鍵・有料サービス・Docker不要。M1のローカル検証はDocker ComposeのPostgresとテストOIDC。実家庭ログインはGoogle OpenID Connectを初期adapterとする（adultだけ）。PKCE・state・nonce・issuer/audience/expiry/signatureを確認し、server sessionのHttpOnly cookieを発行。email文字列だけで家族に紐付けない。実クライアントIDや公開ドメインの設定は実家庭利用前に必要で、D0の開始条件ではない。

画像はローカル非公開volumeを初期adapter、認可endpoint経由で配信。外部公開は単一originのコンテナ配備を提案するが今回は行わない。公開運用のホスト・契約・backupの設定はPILOT gate。D0を本番として公開しない。

一次仕様：[Vite](https://vite.dev/guide/)、[FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/)、[Google OIDC](https://developers.google.com/identity/openid-connect/openid-connect)。確認日2026-09-23。技術選択はこのプロジェクトの提案であり、他の構成が不可能という主張ではない。
