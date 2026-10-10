# ChatGPT Work｜48件の独立した公開・競合深掘り調査（入口）

**最初に[WORK_DEEP_RESEARCH_START_20261010.md](WORK_DEEP_RESEARCH_START_20261010.md)を読み、そこに記載された出典監査・反証・保存条件を優先する。**

対象: `saienjoy0/saitama-` PR #23 / `research/deepseek-market-harness-20261010`。DeepSeek/OpenAI等の外部モデルAPIは使わず、**ChatGPT Work自身**がインターネット上の資料を検索、原典を開いて検証し、判定を更新する。

## 実行系を取り違えない
- 過去の48パス = 16セル×3視点の**机上反論**。ユーザーへの実取材ではなく、今回の48件とは別。
- Phase A〜E = `harness.py`による総括1件（`state.json`: `BLOCKED_REAL_CUSTOMERS`）。**販売実測なしで止める正しい判定**だが、公開調査全体の停止指示ではない。
- 今回の48独立テーマ = `work48_plan.json` + `work48.py` + `work48_state.json`。初期進捗0/48。原典調査と反証の確認・保存を行う。

## Workでの最短の実行手順
1. 深掘り版入口と`WORK_DESIGN_REVIEW_20261010.md`, `AGENTS.md`, `WORK_HANDOFF.md`, `work48_plan.json`, `work48_state.json`, `reports/evidence-audit.md`、製品PR #10〜#21、2026-10-09の顧客正本を読む。以前の48パスを再生成しない。
2. `python3 research/market-validation/work48.py doctor`、`status`、`next`で未完了の1件を取得する。GitHubのブランチheadを再確認する。
3. Work内のChatGPT自身が**実際に公開の一次資料を検索・閲覧し**、Researcher→Critic→Strategist→Auditorを順に実施。役割は同一モデル内の異なる検査視点であり、独立モデルや顧客実験ではない。
4. `work48/results/round-NNN.json`へ根拠、異論、調査ログ、旧証拠との差、取り消す条件、次の実測を保存。`status=REVIEWED`は原典確認済みの具体的事実または厳密な設計判定がある場合のみ。架空の市場数値・利用結果・購入結果は不可。
5. `python3 research/market-validation/work48.py verify`後、成果物と`work48_state.json`をPR #23のブランチへコミット。GitHubから再取得して一致を確認。最初の1件でE2E（再開可能性）を試した後、最大4件ごとに確実に保存・再開する。
6. 公開根拠が見つからない個別テーマはBLOCKEDと記録し、**独立した次のテーマの公開調査は継続**する。現在の`work48.py`は6件連続BLOCKEDで警告を出すが全面停止はしない。実顧客が必要なテーマは実証済みと見せない。
7. 4件ごとに判断更新を`reports/work48_progress.md`へ追記。中断すれば最後のコミット番号から再開。実測顧客の課題・2回目・支払は別の同意済み調査で確認する。

### 完了の意味
48件を埋めるより**誰が何を買うのか、無料代替に勝てるか、その理由が覆る条件は何か**を重要視する。Workを開始していない状態を、Pythonのテスト成功だけで実行済みとは言わない。1回のWorkで48件完遂する保証もない。

実配信・広告・決済・未成年の個人情報公開・本番製品改修・mainマージは禁止。調査だけを対象とする。
