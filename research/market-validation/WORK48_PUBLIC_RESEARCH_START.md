# ChatGPT Work 起動指示｜顧客ゼロでも進める独立48テーマの深掘り市場調査

対象：`saienjoy0/saitama-` / PR #23 / `research/deepseek-market-harness-20261010`。
**これを唯一の起動入口とする。詳細な出典・反証・差分・保存の品質チェックは [`WORK_DEEP_RESEARCH_START_20261010.md`](WORK_DEEP_RESEARCH_START_20261010.md) を必ず併読する。ChatGPT Work自身が公開情報を調査する。** 外部LLM API、DeepSeek API/CLI、OpenAI APIは使わない。Pythonの`work48.py`は状態・構造確認専用で、Workの推論やブラウザを自動起動しない。

## 1. まず答えるべき経営判断

「どの家庭のどの未解決の行動問題を、紙・会話・無料教材・汎用AI・既存アプリより改善でき、なぜその親（または許可後の祖父母）が継続して払うのか」を反証可能な形で絞る。**P1×S1は暫定探索候補であり、証明された勝者ではない。** H1＝相談摩擦とH2＝任せ方の問題を同じ家庭で比較する。P1〜P3は重複するジョブ、P4は祖父母の参加・支払の修飾軸として扱う。

## 2. 「できる調査」と「できない実証」を分離

| 公開情報でChatGPT Workがさらにできる | 実家庭・許可・時間経過がなければできない |
| --- | --- |
| J-FLEC・保護者調査の質問文、母数、対象年齢、出版日、地域、限界の再検証 | 小5〜6親の最近の未解決委任失敗が本当に頻繁か |
| 日本/海外の現行競合の**公式料金・課金期間・解約・対象年齢・サービス提供地域・主要機能・撤退/変更**の比較 | 親が紙ではなく本製品を選ぶ理由と実際の利用価値 |
| アプリレビュー・SNSの実例と反例（偏り、重複、時点を明記） | 子どもが催促なしで2回目の判断を始める率 |
| 代替手段（紙、会話、ChatGPT、J-FLEC、money ring、LINE、みてね等）の設計・費用・摩擦比較 | 980円/28日の自腹入金、更新、返金 |
| 埼玉の募集/提携窓口の実在、募集規約や紹介許可の要否、現実的導線の探索 | 具体的な担当者の協力承認・保護者の応募 |
| 公開価格による変動費感度、類似サービスの価格体系、獲得方法の構造比較 | 実際のAI/人間の利用分数、CAC、LTV |

この48ラウンドは **DESK_ONLY**。`research/market-validation/state.json` の `BLOCKED_REAL_CUSTOMERS` は16セル総括/販売判断の停止であり、`work48_state.json` の公開情報調査を停止させない。顧客実証ゼロを別の調査から埋めたように表現しない。

## 3. 最初の読み込みと実行順

1. `WORK_DESIGN_REVIEW_20261010.md`、`AGENTS.md`、`WORK_HANDOFF.md`、`reports/work-decision-memo.md`、`reports/evidence-audit.md`、`reports/experiment-plan.md` を読み、既存の出典、反証、競合、未確認点を再利用する。
2. `.agents/skills/yattemi-research-harness/SKILL.md`、`.agents/product-marketing.md`、`skill_registry.json`、`WORK48_START.md`、`work48_plan.json`、`work48_state.json`、`work48.py` を読む。開始時に `python3 research/market-validation/work48.py status`、`next`、可能なら`doctor`を実行。**現在の初期位置は0/48。** 旧48パスとWork総括round-001を、新48ラウンドとしてカウントしない。
3. 最初に `python3 research/market-validation/skill_router.py audit` で12スキルと原典の完全性を検証する。各ラウンドを開始したら `python3 research/market-validation/skill_router.py route --round N` を実行し、返されたSKILL.mdと該当referencesを**実際に読む**。Skillは調査手順、Harnessは状態・根拠検査であり、スキルを置くだけでモデルが自動実行するものではない。計画にある48の固有テーマを順番に調査する。重点はラウンド1〜6（根拠）、7〜12（親のジョブと既存根拠の限界）、13〜18（競合・無料代替）、19〜24（訴求・募集チャネル）、25〜36（初回と継続の先行研究/未検証）、37〜42（**実際の競合価格と原価・有料モデル**）、43〜48（統合判断）。
4. 各テーマで、**(a) これまで何が分かっているか → (b) 公開一次資料・反証資料を探し原典を開く → (c) 国内適用条件と代替を比較 → (d) 従来判断を更新/維持/撤回する理由 → (e) 顧客観察でしか決着しない問い**を書く。「新しい表現」を「新しい証拠」と扱わない。
5. **新資料が見つからなくても各テーマに対する探索履歴と未確認理由を保存**し、他の独立テーマへ進む。6件連続でBLOCKEDになれば警告するが、別テーマの調査まで停止しない。48件すべて根拠があったふりをしない。時間・ツール上限等で実行不可なら進捗を保存し中断する。
6. `work48/results/round-NNN.json` に正しい `round/stage/title` と結果を記録する。`work48.py verify`は**現在の次の1件だけ**をチェック・進めるので、ファイル作成→verify→GitHub commit/readback の順を守る。4件ごとを目安に確実に保存。48件を一度のWorkタスクで完了できる保証はない。別Workでは最後のGitHub状態から再開。
7. 出典にアクセスできなかったら `BLOCKED_NO_SOURCE`、実ユーザーの効果にしか答えられなければ `BLOCKED_NEEDS_CUSTOMER`。`REVIEWED`は**その公開研究テーマの出典付き机上審査ができた**意味だけ（販売成立の証明ではない）。
8. 価格・ファネル・継続の採算仮説を比較するときは `python3 research/market-validation/simulate.py` を使い、`simulation/assumptions.example.json` の数字は**仮定（HYPOTHETICAL）**として扱う。出力はSYNTHETIC_SCENARIOであり購入の根拠ではない。未確認数字は現実実験へ戻す。
9. 最終的に既存`reports/work-decision-memo.md`を無条件に上書きしない。新しい原典が判断を変えた時のみ、差分と出典を伴う追加判断報告 `reports/public-deep-research-update.md` を作る。最優先で10月16日の発表に使える真偽表と、面談時に確かめる最大3つの仮説を提示する。

## 4. 各ラウンド結果の厳格な記録

以下のキーをJSONに含める：`round,stage,title,status,model,is_real_customer_experiment, finding, contrary_view, decision_update,next_real_world_test,remaining_uncertainty,sources,evidence_status,new_customer_evidence,evidence_scope,confidence_rationale,prior_work_delta,research_log`。

- `model` は `"ChatGPT Work"`、`is_real_customer_experiment` は `false`、`evidence_scope` は `"DESK_ONLY"`、`new_customer_evidence` は `false`。
- `sources` の各要素は `{"reference":"原典URLまたはリポジトリpath","claim":"その出典から直接言える限定された事実"}`。有料記事・規約・価格ページでは**閲覧できたか、対象地域、料金周期、手数料、日付**を文章にも明記。推測で数値を埋めない。
- `research_log` は最低一つの `{"question":"検証した具体的な問い","action":"検索語、閲覧URL、調べた競合・一次資料","outcome":"得られた根拠、取得失敗、または未確認理由"}`。検索に失敗したことも残す。
- `confidence_rationale` は根拠の強度と限界。`prior_work_delta` は既存レポートからの新事実・修正点。「前回と変化なし」なら**新証拠なし**と明記。
- 出典確認とJSON構造検査は別。機械検査に通っても正確性・市場の成立は保証されない。
- 顧客の架空発言、架空成約率・DL数・レビュー数・「有料で買う割合」、URLの捏造、一般論だけの再言い換えは禁止。

## 5. 価格・売上の深掘りに必ず含める論点

ラウンド5、16、17、37〜42、43〜48では、特に次を追跡する。

1. **競合価格**：日本で実際に使える商品か、無料/有料の機能差、親/子/祖父母の誰が払うか、月額か28日か年額か、決済手数料、解約条件、変更履歴、課金なしの有力代替。
2. **本事業の価値**：課題が「一回の任せ方の決定」で終わるなら定期課金は不利。1回限りの手動体験パック、イベントベース課金、無料+オプション、B2Bを比較するが、競合の価格を需要やWTPの証拠にしない。
3. **採算**：980円/28日は仮価格。AI・音声処理・画像保管/転送・人の確認・安全対応・決済・返金・営業/募集工数の原価式を用意。使用回数・サポート時間が未知なら**感度分析**に留める。税・手数料・人件費を省いた利益主張禁止。
4. **価格実験の設計**：仮の興味→説明を読んだ行動→予約→自己資金入金→28日実利用→自発更新を分ける。現在の実支払0・更新0は「市場購入率0%」ではなく**未観測**。

## 6. 途中成果物と継続/停止の原則

毎回まず「**新たに分かった事実、覆された仮説、未解決の問い**」を短く報告する。新しい証拠のない出力を大量生産して「48回改善した」と売り込まない。根拠不足の論点はBLOCKEDとし、他のテーマを進める。実顧客実験の実行は別途、保護者同意・子の任意参加・私的記録管理・明示的な人の許可が必要。個人情報はGitHubへ書かない。広告、顧客連絡、料金徴収、製品改修、PRのマージを勝手に実行しない。

**完了の意味：** 48テーマを実際に調べて、REVIEWED/BLOCKEDの内訳・公開根拠・検証すべき優先仮説を保存したこと。**完了ではない意味：** 48回の独立モデル実行の証明、48件の購入、顧客による商品評価、売上成立、継続率の検証。

## ChatGPT Workにそのまま伝える指示

> PR #23の`research/market-validation/WORK48_PUBLIC_RESEARCH_START.md`を読み、その手順で**公開資料に基づく48テーマの深掘り市場・競合・価格調査**を始めてください。旧総括が`NEEDS_REAL_CUSTOMERS`でも公開調査を止めず、`work48_state.json`の未実施ラウンドから進めてください。証拠のない顧客効果や支払率はBLOCKEDにして別テーマへ進み、48すべてを埋めるための創作はしないでください。各ラウンドの成果はGitHub PR #23の同一研究ブランチへ保存し、検査・再取得を行ってください。まずround-001〜004を実行し、継続可能なら後続も進めてください。mainにはマージせず、外部モデルAPI・顧客への無許可連絡・課金・広告・製品変更はしないでください。
