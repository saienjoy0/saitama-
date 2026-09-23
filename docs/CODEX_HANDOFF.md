# 次のCodexへの引き継ぎ

## 最新の発表デモ指示：計画のみ（2026-09-23追補）

ユーザーは写真任意の発見→ポイント→おこづかい、新聞とアルバム、祖父母の歩数計とワンタップ安否確認を補う計画を依頼。写真なしでも全経路を完走する。親は子の申請を承認し、祖父母が押した日時と本人が共有した歩数の更新日時を別々に確認する。発表用歩数は模擬データ、本番の端末連携は未決定。`demo/presentation/PREVIEW_V2_PLAN.md` を先に読む。実装未承認・未着手。旧「ブラウザ仕上げを継続」だけを根拠に実装しない。本体DESIGN/D90は維持。

現在はDESIGN / D90。設計と実装計画v0.4.1は準備済み、ユーザーレビュー待ち。本体実装未開始。

## 読む順番

AGENTS → PROJECT_STATE → TASKS → 工程表と当該スキル → REVIEW_BUNDLEとactive_specs → 状態が指す実装計画。
`python3 scripts/check_design_handoff.py` を実行する。

レビュー入口は `docs/review/index.html`（保存・通信なしの見本）と `docs/design/FEATURE_REVIEW.md`（F01〜F21）。先にpersonas-cycle-review-v0.4とai-action-assistance-v0.4を読む。共通画面／動きはrole-experience-v0.3、変更境界はextensibility-v0.3。HTMLの操作例はv0.3の部分見本のまま、新しい探索・比較画面はこの見本に未反映。

着手前に `docs/workflow/CODEX_PREFLIGHT.md` を読む。課題分解AIの最小差分は `docs/design/ai-engine-review-v0.4.1.md`。Task 1〜7＝B10〜B70、v0.4の追補は各Task内へ移動済み。

## 次の指示への対応

ユーザー指定で、設計段階で実装計画P10も作成済み。準備済みと承認済みは違う。

- 修正：F番号・画面番号・M番号で影響範囲を確認。設計／見本／計画を同期しREVIEW_BUNDLEを再生成して変更を提示。
- 提示した一式への「実装を始めて」：hash整合を確認し実発言・bundle hash・native/sequential方式をapproval.evidenceへ記録。written_specとimplementation_planをtrue、implementation_allowedをtrue、stageをBUILD、next_task_idをB10、D90をdoneへ更新する。計画を再作成するPLAN待ちは不要。
- continueだけ：現段階を継続。未承認の本体実装へ進めない。

「次は何をするか」を一から聞かない。B10→B20で合成D0、B30→B40→B50でM1ローカル版、B70でVERIFY。B60のAIは任意、PILOTは別承認。ホストや有償契約の未定は合成D0開始の妨げではない。

## 守る境界

- ogenkiは写真・新聞・任意返信・本人発信の近況を取り入れる参考。コード統合・旧DB移行ではない。
- 子は問い・予想・比較と選択、親は少ない確認と成長の把握、祖父母は読んで任意に経験を返す。返信→本人の焦点→たね→新しい体験記録まで追跡する。採用結果を祖父母へ自動共有しない。未返信・中断・共有辞退は正常。
- 教材・UIトークン・AI提供元・保存adapterは差し替え可。家庭分離・共有意思・版と宛先の承認検査は無効化不可。
- AI初期OFF、固定版が通常動作。第一評価はnext_action_match（監修済みIDだけ）、新聞下書きは第二候補。子の自由文を外部へ送る投影は版ごとに親確認が必要。未確認の公開・通知・報酬・健康判定なし。実児童データは提供元条件確認前に送らない。
- 文書／見本の検査、製品テスト、モデル評価、家庭の効果は別。証拠は `docs/workflow/VERIFICATION.md`。

## 独立した発表デモ（2026-09-23）

ユーザーの明示依頼で `demo/presentation/` に新規React/TypeScript/Viteアプリを作成。本体はDESIGN/D90のまま、既存prototypeは未変更。
実装・ビルド/型検査・状態テスト6件・HTTP起動確認まで完了。Cloud Browserのlocalhost/file制限でブラウザ検証は未完了。
次の担当は `demo/presentation/CODEX_CONTINUE.md` と `DEMO_STATE.json` を読み、14個の用意済みブラウザケース、PC/スマホ画面の目視、約100秒の台本実測を行う。デモの制作や検査を本体BUILD/B10の承認にしない。
