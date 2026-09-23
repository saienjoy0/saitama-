# 次のCodexへの引き継ぎ

現在はDESIGN / D90。設計と実装計画v0.3は準備済み、ユーザーレビュー待ち。本体実装未開始。

## 読む順番

AGENTS → PROJECT_STATE → TASKS → 工程表と当該スキル → REVIEW_BUNDLEとactive_specs → 状態が指す実装計画。
`python3 scripts/check_design_handoff.py` を実行する。

レビュー入口は `docs/review/index.html`（保存・通信なしの見本）と `docs/design/FEATURE_REVIEW.md`（F01〜F21）。画面／動きはrole-experience-v0.3、変更境界はextensibility-v0.3、AI詳細はv0.2。

## 次の指示への対応

ユーザー指定で、設計段階で実装計画P10も作成済み。準備済みと承認済みは違う。

- 修正：F番号・画面番号・M番号で影響範囲を確認。設計／見本／計画を同期しREVIEW_BUNDLEを再生成して変更を提示。
- 提示した一式への「実装を始めて」：hash整合を確認し実発言・bundle hash・native/sequential方式をapproval.evidenceへ記録。written_specとimplementation_planをtrue、implementation_allowedをtrue、stageをBUILD、next_task_idをB10、D90をdoneへ更新する。計画を再作成するPLAN待ちは不要。
- continueだけ：現段階を継続。未承認の本体実装へ進めない。

「次は何をするか」を一から聞かない。B10→B20で合成D0、B30→B40→B50でM1ローカル版、B70でVERIFY。B60のAIは任意、PILOTは別承認。ホストや有償契約の未定は合成D0開始の妨げではない。

## 守る境界

- ogenkiは写真・新聞・任意返信・本人発信の近況を取り入れる参考。コード統合・旧DB移行ではない。
- 子は発見と選択、親は確認と成長、祖父母は読む。未返信・中断・共有辞退は正常。
- 教材・UIトークン・AI提供元・保存adapterは差し替え可。家庭分離・共有意思・版と宛先の承認検査は無効化不可。
- AI初期OFF、限定下書き。未確認の公開・通知・報酬・健康判定なし。実児童データは提供元条件確認前に送らない。
- 文書／見本の検査、製品テスト、モデル評価、家庭の効果は別。証拠は `docs/workflow/VERIFICATION.md`。
