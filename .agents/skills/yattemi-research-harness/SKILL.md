---
name: yattemi-research-harness
description: やってみクエストの48テーマ外部市場調査・競合反証・価格/継続の仮説シミュレーションを、GitHubにインポートした専門スキルとWorkで統合するルーター。外部LLM API不要。
---

# やってみクエスト：調査＋反証＋仮想シミュレーションの統合スキル

## 必ず最初に読む
- `research/market-validation/WORK48_PUBLIC_RESEARCH_START.md`
- `research/market-validation/WORK_DEEP_RESEARCH_START_20261010.md`
- `research/market-validation/skill_registry.json`
- `.agents/product-marketing.md`（事実/推論/未確認を混ぜずに読む）
- `research/market-validation/WORK_DESIGN_REVIEW_20261010.md`
- `research/market-validation/work48_state.json`（既存の16セル`state.json`と区別）
- `research/market-validation/reports/evidence-audit.md`、`work-decision-memo.md`、`experiment-plan.md`

## スキル起動ルーティング
1. ユーザーがWorkモードでタスクを起動。CLIからモデルは呼べない。
2. リポジトリrootで `python3 research/market-validation/skill_router.py audit` を実行。**エラーならそのスキルを読んだと称さない**。第三者の文書とライセンスはピン留めSHAで検証する。
3. `python3 research/market-validation/work48.py next` で対象ラウンドを得る。
4. `python3 research/market-validation/skill_router.py route --round N` で**そのラウンドに指定されたSKILL.mdを全て開き、該当するreferencesを必要に応じて読む**。スキルは調査手法の指示であり、自動実行のサブモデルではない。
5. 外部一次資料を**本当に検索して本文を読む**。Researcher→Critic→Strategist→Auditorは同一ChatGPTの順次レビュー。元資料の出典・対象・日付・否定資料を保存。
6. 市場の判断を更新する度に、`old_claim→new_source→counterexample→decision_delta→next_observable_test`を残す。`WORK_DEEP_RESEARCH_START_20261010.md`の検証要件を守る。
7. 独立調査は`work48/results/round-NNN.json`と`work48_state.json`へ保存、`work48.py verify`。GitHub同一PRブランチにコミットし再取得して確認。6連続BLOCKEDは警告であって別の公開研究を妨げない。

## タスクごとに使うスキル
- SOURCE_AUDIT: customer-research / competitor-profiling / marketing-plan
- CUSTOMER_JOBS: customer-research / product-marketing / competitor-profiling
- FREE_SUBSTITUTES: competitor-profiling / competitors / pricing
- MESSAGING_CHANNELS: product-marketing / cro / ab-testing / analytics
- FIRST_USE: onboarding / customer-research / analytics
- RETENTION: onboarding / churn-prevention / analytics
- MONEY_AND_RISK: pricing / offers / marketing-plan / analytics
- DECISION_AND_HANDOFF: marketing-plan / customer-research / ab-testing / product-marketing

機械的な唯一の正本は`skill_registry.json`。上記表よりregistryを優先。

## シミュレーションは「顧客の架空発言」ではない
`research/market-validation/simulate.py`と`simulation/assumptions.example.json`は公開可能な仮定だけで実行する。 `python3 research/market-validation/simulate.py`。価格・運用費・最初の体験の人数・子の催促なし2回目率・その後の支払率・継続確率で**条件付き採算**を比較。実測を意味しない`SYNTHETIC_SCENARIO`の表示を保つ。
- 親子の実行、2回目、入金、契約の有無をAI架空ペルソナで代替しない。
- 一次資料から確認できるのは競合価格・公表原価等まで。購入率、継続率、当社CACは実証待ち。
- 大量生成した仮説を「調査数」「顧客数」「購入率」に換算しない。
- 子の未公開情報や実家庭のログをpublic GitHubへ入れない。

## 適用上の注意
第三者スキルの手法・例示は一般的なマーケティング向け。Web抽出、SEO API、レビュー取得、広告・送信・決済ツール等に触れていても**実際に接続され使えるツールにしか従わない**。子どもを焦らせる人工的希少性、強制的な報酬・共有、無許可の勧誘は適用しない。観測できない利用数や仮想A/B結果は作らない。PR #23のmainマージ、本番改修、広告・送信・支払いは許可なしに実行しない。
