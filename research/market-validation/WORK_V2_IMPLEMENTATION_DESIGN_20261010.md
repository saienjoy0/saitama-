# やってみクエスト｜ChatGPT Work市場調査ハーネス V2 実装設計
更新日: 2026-10-10
対象: saienjoy0/saitama- / PR #23 / research/deepseek-market-harness-20261010
状態: DESIGN ONLY（本書は実装完了・Work実機E2E成功を主張しない）

## 0. 最優先の経営目的と設計判断

目的は「48回埋めること」ではなく、埼玉の小5〜6家庭について、(a)具体的な未解決課題、(b)紙・会話・無料教材・汎用AI・既存アプリとの差、(c)本人の自発的再利用、(d)支払と継続理由、(e)獲得経路・収益条件を反証可能に判定すること。
Workによる公開調査は顧客行動の実測にはならない。Workが自律的に研究し、証拠が尽きたら「実家庭でしか判定できない」と出すことは成功に含む。
このPRの守備範囲はRESEARCH ONLY。外部LLM/API、広告、実顧客連絡、決済、未成年個人情報保存、本番製品変更、自動マージをしない。

### 結論
- 現在のwork48.py、work48_plan.json、12スキル、simulate.py、GitHub Actionsを土台に採用。
- 先にWork→GitHubの読み書き能力を確認し、RESULT単一正本とコミット済みRESULT検査をCIに追加。その後にWork→GitHub→CI→別Work再開の1ラウンド実機E2Eを行う。失敗する場合は自動化拡張を中止し、接続方式を修正。
- WorkにPython実行が必ずあると仮定しない。WorkはGitHubコネクタ／対応するCloud Browserで入出力、PythonとテストはGitHub ActionsまたはCodex側で実行可能とする。
- CIのPASSは構造と算術のPASSであって、出典の内容的真偽のPASSではない。
- 48件を「必達回数」にせず、監査済みバックログへ変更。手順を変えるのは実機E2E成功後。

## 1. 現行実装の確認（2026-10-10）

- PR #23 のヘッドは本設計着手時点で 9c7c74c52789b15cec51f49d7ace9d70dca8fff5（以降の変更で更新される）。
- work48_state.json: next_round=1、reviewed=[]、blocked=[]、公開テーマ調査0/48。
- test_work48.py: syntheticなJSONで48回の前進、欠損、6連続BLOCKEDをテスト。実際のWork調査は実行していない。
- .github/workflows/market-validation-offline.yml: unittest、コードコンパイル、skill監査、シミュレーションを実行し成功。外部原典の真偽を監査しない。
- work48.pyはGitHubコミットやWorkモデルの起動を行わず、ローカルのwork48_state.jsonを進める。
- simulate.pyは一律「自発2回目後に購入」のファネル、３仮定シナリオ、感度分析。顧客データを使った予測ではない。
- 既存12スキルは固定したGit blob SHAで検査され、stage別にルーティングされる。
- PR #10〜#21の機能はDESIGNED/DEMO/PRODUCTION/TESTEDを区別し、存在しない本番動作を売らない。

## 2. 実行アーキテクチャ

人間がWorkタスクを開始
  ↓
ChatGPT Work: 研究テーマ選択 → 既存証拠閲覧 → 公開一次資料の本文確認 → 反例探索 → 戦略判断
  ↓
GitHub: Workが当該ラウンドのRESULT.jsonをPR #23研究ブランチに保存
  ↓
GitHub Actions: スキーマ・必須証拠情報・論理整合・改ざん防止・計算テスト
  ↓
ChatGPT Work: CI結果と保存されたファイルを再取得、内容監査・最終判断、GitHubに引継ぎ
  ↓
次回Work: GitHubの確定コミットと結果から再開

注: Work内のResearcher/Critic/Strategist/Auditorは同じモデルの視点切替であり、独立した外部審査ではない。
WorkタスクをPythonが自動起動したり、閉じた別Workタスクを自動再開する仕組みは今回導入しない。
GitHub Actionsはモデル推論せず機械テストだけを行う。

## 3. 実装順序：P0 → P1 → P2

### P0-A 接続受入／現在の書込能力を小さく確認（最優先）

1. WorkでGitHub接続が実際に使えるか、PR #23の対象branchを指定してreadできるか確認。
2. Workがbranchへ1ファイル作成→再取得する権限を持つか、テスト専用の非機微なprobeファイルで確認。プローブは後で削除可能。WorkにPython/ターミナルが無くてもよい。
3. GitHubへの書込不可ならここで停止し、ユーザーの接続/権限設定またはCodexでのGitHub書込に切り替える。公開調査を48件作成しても保存できない状態で先へ進まない。

### P0-B 最小の状態管理・CIゲートを先に修正

- 最初の実調査前に、GitHubにコミットされたRESULTだけを正本にして次のラウンドを算定する処理を実装する。既存のwork48_state.jsonは初期値・互換用であり、次番号を決定する単独の正本にはしない。
- コミット済みRESULTの状態をGitHub Actionsが非破壊で検証する専用テストを追加する。現状のoffline workflowはtest_work48.pyの合成fixtureをテストするだけで、**新たにコミットされたround-NNN.jsonの正当性を検査しない**。この欠落を修正してから実E2Eを行う。
- CIの結果をWorkが参照できること、保存結果とbranch SHAを再取得できることを確認。

### P0-C 実際に1件の公開原典調査を実行

1. WorkモードでWORK48_PUBLIC_RESEARCH_START.mdとWORK_DEEP_RESEARCH_START_20261010.mdを指定する。
2. WorkがGitHubにread access、PR #23のhead SHA、work48_state.json、work48_plan.jsonとresultの保存先を確認。
3. Workがround-001について実際に公開資料を検索・本文閲覧し、原典と主張・反例を対応づけてRESULT.jsonを作成。出典にアクセスできなければBLOCKEDにし、架空の出典を作らない。
4. GitHubコネクタのcreate_file等で当該研究ブランチへRESULT.jsonを保存。Workにシェルがあれば既存のwork48.py verifyも行ってよいが、シェルを必須条件にしない。
5. 保存後、GitHubから読み戻し、内容一致・ブランチ・コミットSHAを確認。CIの実行結果と検査対象コミットを確認する。
6. 一度Workタスクを終え、新しいWorkタスクがGitHub確定結果を読み、round-002から続けられることを確認。
7. 失敗の分類: NO_GITHUB_WRITE / NO_WORK_SHELL / FAILED_CI / LOST_CHECKPOINT / SOURCE_UNVERIFIED / BRANCH_CONFLICT。失敗した工程から再設計し、48件の連続運転を先に宣言しない。

受入基準: 実際に外部資料を閲覧したround-001のGitHub保存、CI通過、結果再取得、別Workでround-002認識、履歴で追跡可能、の5点。
注意: 現行のwork48_state.jsonを手で002に書き換えただけでは合格ではない。

### P0-D 保存・再開を一意にする（実機E2E後の強化）

現状の「結果ファイル」と「ローカルで書き換えるstate.json」が別々の正本になる設計をやめる。
- GitHubの確定済みcheckpointが唯一の進捗正本。work48_state.jsonは表示用の派生キャッシュと定義する。
- まず単一のround-NNN.jsonの保存を最小のコミット単位とする。CIがファイルを検査し、次回Workはチェック済み結果一覧から未処理テーマを算定する。
- 複数ファイルを一緒に保存する必要がある場合、Git tree→commit→ref更新で一コミットにまとめる。refの更新では事前のhead SHAを照合し、force pushしない。ブランチ競合時は新headを読み直してrebase/retryする。GitHubコネクタがその手順を許可するかをE2Eで確認。
- checkpoint.py（新規、原則pure Python）：list/validate/next/summary/reconcile。GitHubに依存せずローカルの保存結果から決定論的に次を導く。
- round UUID とbased_on_commitを保存し、重複・並行実行・古いcommitへの書込を検出。状態更新は冪等にする。
- 失敗・未監査・構造不正の結果は次へ進めた「完了」と数えない。資料不足でBLOCKEDと確定したものは「検討済／未立証」として進捗に数え、成功証拠には数えない。

受入テスト: 同時書込、途中失敗、保存後読戻し、再実行、重複番号、古いhead、結果欠損、構造不正、GitHub接続不可からの復旧。決定論的に同じ次テーマへ復元できること。

### P0-E 証拠検証の3層化

現在のvalidate_result()は文字列長・sources欄の存在に偏る。これを以下に分離する。

G0 構造ゲート（CIが自動）：スキーマ、IDの一意性、URL/パス、日付、列挙値、漏れ・重複、顧客実測の捏造フィールド、データ非公開制約。
G1 根拠対応ゲート（Workが原典本文を読んで記録）：claim_idごとの出典URL、確認日、原典発行日、本文箇所（章/頁/見出し/短い抜粋）、対象国・母数・年代、そこから言える事、言えない事、反例、閲覧失敗を記録する。
G2 重要判断ゲート（Workが異論提示、人が必要に応じレビュー）：前回の何が変わったか、どの反例で撤回するか、紙/会話/無料AIの代替、次の実観測。支払・顧客需要・撤退等の重大判断はCI通過だけで確定しない。

G0を通っただけの結果はSCHEMA_VALIDに過ぎない。G1の原典監査を記録した場合にDESK_REVIEWED、実家庭データには別のOBSERVED_CUSTOMER（非公開）を用いる。
REPOSITORY_DESIGNだけを参照した場合はPUBLIC_SOURCE_VERIFIEDにできない。本文未閲覧や検索スニペットだけの資料も原典確認済みにはできない。
最重要主張はURLと本文位置を人が再確認できる構成とする。

新規または更新するファイル：
- research/market-validation/validation/source_audit.py （新規）
- research/market-validation/schemas/round-result-v2.schema.json （新規）
- research/market-validation/tests/test_source_audit.py （新規／既存test_*.pyを維持）
- research/market-validation/work48.py （G0/G1を使う最小変更）

新RESULT概念例:
{
  "schema": "work48-round-v2",
  "round_id": "R001",
  "base_commit": "<start SHA>",
  "status": "DESK_REVIEWED | BLOCKED_NO_SOURCE | BLOCKED_NEEDS_CUSTOMER",
  "claim_audit": [{
    "claim_id": "C001",
    "claim": "限定された事実主張",
    "source_url_or_repo_ref": "URL or exact repo path@sha",
    "source_kind": "PRIMARY | SECONDARY | REPOSITORY",
    "access": "FULL_TEXT | PARTIAL | SNIPPET_ONLY | FAILED",
    "checked_at": "2026-10-10",
    "published_at": "date or UNKNOWN",
    "locator": "section/page/heading",
    "population_geography": "対象・地域・母数/不明",
    "supports": "何が直接言えるか",
    "does_not_support": "何は言えないか",
    "contrary_evidence": "反例、または探索結果"
  }],
  "decision_delta": {"prior":"旧判断","now":"維持/修正/撤回","reason":"出典と反例","next_test":"実証方法"},
  "research_log": ["検索語と実際の閲覧・失敗"],
  "real_customer_data_in_repo": false
}
上記は設計例であり現行ファイルの完全な置換JSONではない。移行時に旧schemaの読取互換または明示的migrationを実装する。

## 4. P1 調査テーマを証拠駆動にする

48テーマは「研究バックログ」であって48個の成果を必ず作る目標ではない。
round ID（固定）とexecution sequence（可変）を分ける。最初のSOURCE_AUDIT 1〜6は優先固定。その後、既存48件から次のテーマを選ぶ。テーマを勝手に削除せず、SKIPPED_REDUNDANT/DEFERRED_WITH_REASONとして残せるようにする。

優先度の提案例（点数は自動的な市場の真理ではない）：
 priority = 3×意思決定影響(0〜4) + 2×未解決の程度(0〜3) + 公開証拠入手可能性(0〜2) − コスト(0〜2)
- 今回の1次目的に直結する顧客ジョブ/無料代替/課金/継続を優先。
- 4件ごとに「新しい主張・撤回・未解決」を比較し、priorityを更新。変更前後の理由を決定台帳へ保存。
- 根拠を伴う新事実が0のテーマで繰り返し表現改善をしない。同一論点が連続して無成果なら次の独立テーマまたは現実検証へ移す。
- P1×S1は現時点の第一探索候補であって固定した勝者ではない。H1（相談摩擦）とH2（任せる問題）を、無料代替・直近行動・支払者で比較する。
- 結論を出せないことを許容し、NEEDS_REAL_CUSTOMERSを正しい終端の一つとする。

新設：
- research/market-validation/decision_ledger.json （顧客セグメント/仮説/根拠ID/反証/有効期限/次の測定）
- research/market-validation/work48_priority.json （候補テーマの優先順位・理由・更新履歴）
- research/market-validation/selection.py と test_selection.py （同じ台帳なら同じ優先順位になる純関数）

## 5. P1 採算シミュレーターを「販売方式別」にする

既存simulate.pyとtest_market_simulation.pyは消さず、v2形式と新しいテストで拡張する。
商品方式:
A. 最初からの単発販売（事前購入→体験）
B. 無料体験→本人の自発2回目→4週間有料
C. 無料体験→初回後有料（2回目必須ではない）
D. 祖父母ギフト（子ども・親の利用/許可は独立）※親子実証まで後回し
E. B2B（別ファネル。親向けファネルに混ぜない）※採算仮説だけ

全方式で入口、母数、同意、申込、初回体験、自発再使用、購入時点、解約、更新を明示して条件確率を二重乗算しない。
収支: 価格×入金件数×有料期間 − 決済手数料 − AI・音声・画像保管・人的サポート − 無料体験原価 − 集客費 − 初期費用 − 返金/税関連の影響。
分析: シナリオ比較（悲観/基準/楽観）、価格・顧客獲得・再使用・購入率・更新率の感度、粗利/CAC/損益分岐点、購入率の上限でも黒字不可の検出。
「実測値」「確認済みの公開単価」「仮定」はフィールドごとに出所を表示。例示JSONから生成した結果には必ずSYNTHETIC_SCENARIOとnot_a_forecast=trueを付与する。
実測ユーザーの行動・会話・決済情報はpublic GitHubに格納しない。集計値を使う場合にも同意済み、匿名で再識別困難な形か、人が承認した統計に限定。

必須テスト:
- 事前購入型では自発2回目が0でも購入数が0へ落ちない。
- 未観測の購入率・継続率は実測と表示されない。
- ファネルごとの分母・条件確率が一致する。
- 価格や原価を変えると期待方向に損益が動く（適切な条件下）。
- 顧客数0、購入0、返金、更新率0、粗利マイナス、高CACを処理できる。
- 現行例の回帰計算が維持される。

## 6. P2 成果物の読みやすさ・長期運用

GitHubの正本:
- work48/results/round-NNN.json: 元資料・反証・意思決定・調査履歴（機微情報なし）
- reports/work48_progress.md: 4テーマ程度ごとの変更点だけ
- reports/work-decision-memo.md: 人間の経営判断。差分と根拠を追記（既存内容を無条件に上書きしない）
- decision_ledger.json: H1/H2/S1〜S4/価格の現在の判断、覆る条件
- work48_state.json: 生成キャッシュ。実体はGitHub上の完了チェックポイント
- simulation/: 各入力の出所・シナリオ・計算結果・バージョン

初回Work開始時は「前回と比べ何が新しいか／何が覆ったか／今は答えられないか」を返す。毎回全文レポートを作り直さない。
直近の10/16中間発表向けには、上記を要約した1ページの意思決定表だけを出力する。

## 7. 役割別の仕事とスキル

ChatGPT Work: 原典を実閲覧し、比較・反証・仮説更新・出典監査・GitHubへの結果保存。実際に利用できるGitHub接続機能を確認し、シェルを持つ前提を置かない。
GitHub Actions: Python検査（offline）、整合性・スキーマ・計算・スキルSHA検査。外部サイトの正しさ・需要・支払の真偽は判定できない。
Codex／実装担当: checkpoint.py、source_audit.py、selection.py、simulate.py改修、CI改修・テスト。必ずPR #23上で小さくコミットする。
人間: 顧客との接触・同意、調査開始の許可、公開/課金/撤退の最終判断、重要な市場主張の原典確認。

採用済み12スキル（customer-research、competitor-profiling、competitors、product-marketing、pricing、ab-testing、analytics、marketing-plan、onboarding、churn-prevention、cro、offers）で市場調査・GTM・料金設計には十分。
今回の阻害要因はスキル不足でなく、Work→GitHubの実行接続と証拠/状態の品質ゲート。無目的に外部スキルを追加しない。新規で必要なのはマーケティング知識スキルよりsource_audit.pyの検査器とcheckpoint.pyの整合性管理。

## 8. 実装PRの受入チェックリスト

Gate A / 接続:
[ ] Workが正しいbranchとheadを読める
[ ] 実際の公開原典本文を閲覧し、round-001の根拠と反例を記録
[ ] WorkがPRブランチにRESULTを保存し、GitHubから読戻せる
[ ] 保存コミットのCI結果が確認できる
[ ] 別Workタスクで未完了の次テーマを復元

Gate B / 保存:
[ ] source of truthが単一である
[ ] 中断/古いbranch/2重コミット/部分保存から誤って進まない
[ ] BLOCKEDとREVIEWEDは区別される
[ ] 再実行で同じ結果を二重カウントしない

Gate C / 証拠:
[ ] URL存在だけでVERIFYとしない
[ ] スニペットだけ、リポジトリ設計だけの主張は公開一次根拠へ格上げしない
[ ] 顧客実測0をAI仮想人格で補わない
[ ] 重要な主張は人が原典へ辿れる（本文位置・日付・対象・限界）

Gate D / 戦略:
[ ] 新しい反証によってP1×S1の順位を変更可能
[ ] 調査価値がないテーマを飛ばして理由を残せる
[ ] 4件ごとの決定差分が保存される
[ ] 公開資料だけでは決着しない場合、同意済み実家庭調査に戻せる

Gate E / 採算:
[ ] 単発と4週間継続の購入タイミングを混同しない
[ ] 感度分析の前提と数値出所が追跡可能
[ ] 実測の無い採算結果にはSYNTHETIC_SCENARIOが残る
[ ] GitHub Actionsのユニットテストとシミュレーションが成功

## 9. 開発・運用の順番（重要）

Step 1 / WorkのGitHub接続についてread/writeの最小probe。ツール実行可否を推測で済ませない。
Step 2 / 結果ファイルから次ラウンドを導く最小checkpointと、実際に保存されたRESULTを検査するCIを先に実装。
Step 3 / Work実機1ラウンドE2E→別タスクから再開。失敗箇所を特定し、保存衝突・根拠不足の異常系をテスト。
Step 4 / Gate B・Gate Cを強化し、source auditと構造・内容を区分。
Step 5 / 既存48テーマを保持したまま、優先度選択・decision ledgerを実装。
Step 6 / simulate.pyを購入時点別に拡張、商材別比較・感度分析を行う。
Step 7 / 4ラウンド程度実際に運転して、証拠の増分・意思決定品質とコストを評価。
Step 8 / 公開資料で決着しない3つ以下の仮説を抽出して、実家庭の同意済み観察へ接続.

上位Gateが通らないうちは、48件分の結果自動生成や大規模なスキル追加をしない。

## 10. 根拠と注意事項

- GitHub公式：Git trees / commits / refsを使った複数ファイルcommit。https://docs.github.com/en/rest/git/trees 、https://docs.github.com/en/rest/git/refs
- OpenAI公式：WorkのCloud Browserは対応サイトの操作に利用できるが、サイト/操作に制限があり得る。https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt
- GitHub連携がChatGPT Workでどの操作に使えるか、Work内でPythonのローカル実行ができるか、GitHubへの書込・認証・実際の自律継続可能時間は環境依存のため、必ずGate Aで実測する。
- この設計は「自動化できるようにする設計」であり、Work 48件実行や販売成功の主張ではない。
