# 既存OSSシミュレーションのクローン可否・採用レビュー
検証日：2026-10-10。用途：やってみクエスト A/B/C の利用行動・親子相談の失敗条件を探索し、既存40件のAI仕様と収益モデルを実際のテストへ接続。**この文書は候補リポジトリのGitHub README・LICENSE・更新状況の確認であり、クローン・依存インストール・実行検証の完了報告ではない。**

## 1. 経営判断
- **使い回しは適切。ただし「顧客の購買を予測する万能シミュレーター」を丸ごとコピーするのは不適切。** OSSの仕事は操作・会話の試験実行と失敗のログ記録。購入率・継続率は現実の実測が必要。
- 第一候補（UIテスト）：**neuhai/UXAgent**。モデルAPIを許可した環境で、ローカルの `prototype/gakusta/index.html` をブラウザ操作、ログ・スクリーンショットを取得する1ケースの技術試験。研究コードなので保守・依存の監査が必要。
- API無しの第一選択：**microsoft/playwright**で既存HTMLの固定導線・安全性・説明のテスト。代案 `matthiasroder/UXAgent` はLLMなしのdeterministic demoを提供するが、GitHub 0 stars／2026-06作成・同月以降pushなしで採用リスクが高い。**demoは自律的な仮想ユーザーではない。**
- 第二候補（AI会話・安全）：**langwatch/scenario**。既存 `evals/ai-cases.jsonl` 24件と `evals/next-action-cases.jsonl` 16件をスクリプトから読み、実際のAIエンドポイントが用意できた場合のみUserSimulator + AgentAdapter + assertionで検証。現時点で既存40件はテスト仕様のみ・未実行。
- 補助（探索）：**microsoft/TinyTroupe**。TinyPerson/TinyWorldで親子や祖父母の架空の会話を発想。購入/継続率の推定は不可。実データ比較用のvalidatorも搭載しているが、実家庭データがなければ精度を主張できない。
- 採算：既存 `simulate.py` + `initial-customer-assumptions-20261010.json` の分岐・前払/試用後の違いを先に修正。SALT/SALib等を丸ごとクローンするより、必要時 `SALib` を依存として追加する程度でよい。

## 2. 確認済候補（2026-10-10時点のGitHubリポジトリAPI）
| OSS | ソースと目的 | License | push | 技術上の障壁・適合 |
|---|---|---|---|---|
| UXAgent（研究版） | https://github.com/neuhai/UXAgent Webサイトを仮想ユーザーが操作。複数persona、runConfig.yaml、ログ、スクショ、集計 | MIT（README明記） | 2025-11-05 | `uv`, Playwright Chromium, 既定のAPI鍵例がAnthropic。現行「外部LLM APIなし」制約と不一致 |
| TinyTroupe | https://github.com/microsoft/TinyTroupe 擬人エージェントとの会話 | MIT | 2026-07-03 | 推奨はOpenAI/Azure OpenAI API。Ollama対応は公式が**experimental**と説明 |
| Scenario | https://github.com/langwatch/scenario 多ターンUserSimulator/Agent/JudgeとCI検査 | Apache-2.0 | 2026-10-07 | 仮想ユーザー/判定にはモデルAPI。アプリAIへのAdapter実装も必要 |
| tau2-bench | https://github.com/sierra-research/tau2-bench 接客やツール連携のシミュレーション | MIT | 2026-10-07 | 大規模、独自domainと2側のLLMを要し今回の最小試験では過剰 |
| Concordia | https://github.com/google-deepmind/concordia 社会相互作用の仮想環境 | Apache-2.0 | 2026-10-08 | 家庭内の会話を設計できるが初期製品動作テストより大規模で過剰 |
| Playwright | https://github.com/microsoft/playwright 実Web画面操作・E2E | Apache-2.0 | 2026-10-10 | 決定論的なテストはLLM API不要。人間の自然な離脱や購買は再現しない |
| SALib | https://github.com/SALib/SALib 感度分析 | MIT | 2026-10-10 | Pythonから既存利益式へ接続。根拠のない分布では予測確率にならない |
| UXAgent（小型別作品） | https://github.com/matthiasroder/UXAgent 決定論的demoとOpenAI live browser | README参照要 | 2026-06-28 | API不要demoが使えるが0 starsで品質は未評価。研究版UXAgentとは**別作者/別製品** |
| OpenPersona | https://github.com/npmiaman/OpenPersonaSimulation 広告訴求への仮想反応 | MIT | 2026-04-07 | 広告向け、スター1件。架空顧客の「買いそう」を正答として使わない |

## 3. インストール前に決める「fork / clone / package」の境界
- `git clone`は**ソースコードを取得するだけ**。実行・API権限・日本語UIに対する適合性は検証が必要。
- 既存PR #23の外部モデルAPI禁止は維持。**許可なしにキーを設定・モデルAPIを呼び出さない**。LLM無しテストを先行する場合はPlaywright、または実態がdeterministicと明示されたdemoを使う。
- 研究ブランチ全体へ外部ソースを無差別にvendorしない。別作業ディレクトリにcloneし、上流SHAとMIT/Apache原文、依存/セキュリティを固定・監査。結果だけ（機微データなし）を研究ブランチへコミット。
- 親子・祖父母の合成人物には`SYNTHETIC`を付け、実子の氏名・写真・音声・家庭情報を外部サービスへ渡さない。
- 「アプリの挙動」チェックと「家庭が使いたがるか」は別。UIタスクPASSを顧客需要のPASSに変換しない。

## 4. UXAgent最小PoCの具体的実験（**未実行**）
開発者ローカルまたは隔離されたCodex環境に `git clone https://github.com/neuhai/UXAgent.git`。READMEに沿って `uv sync`、`uv run playwright install chromium`。必要時、外部LLM API利用の明示承認と鍵・コスト・使用モデル・収集情報の確認を受ける。アプリ側は既存 `prototype/gakusta/index.html` をローカルHTTP配信し、本番・送金・個人情報のないsandboxで実行する。GitHub PRのブランチ変更を伴わない。

1. 最初の1ケースのみ：親画面→子画面→「500円の範囲で買い物を比較」→親が拒否→見送り/貯蓄を示す。既存プロトタイプの実際の導線・操作可能要素を事前点検。無い機能は未実装として停止、テスト専用の機能を本番機能として装わない。
2. `uv run -m src.simulated_web_agent.main --intent "（実際にプロトタイプで可能な日本語タスク）" --start-url "http://127.0.0.1:8765/prototype/gakusta/" --max-steps 20` を使用する場合、上記API許可とローカルサーバーが必要。コマンドは**実行例であり検証成功ではない**。
3. `runs/<timestamp>` の操作ログ・スクショ・失敗地点を検査。アクセス許可・遷移・親承認を見ずに勝手に進まなかったか確認し、手動のPlaywright脚本と一致するか比較。
4. 成功条件：実ブラウザで操作した証拠があり、実装済みと未実装の境界を区別でき、安全違反が無く、失敗を再現できる。仮想ユーザーの好意・継続・購入は採点しない。
5. PoCで接続・コスト・セキュリティ・テストの価値が適切ならA/B/C×3条件へ拡張。不適ならUXAgent統合を止め、既存Playwrightと `evals` に戻す。

## 5. Scenario最小PoC（**未実行**）
Node.js/TypeScript、Pythonどちらも選べるが、アプリの既存インターフェース（API/デモの固定AI出力）があるか確認してからAgentAdapterを用意。まず現行 `evals/next-action-cases.jsonl` のNA01を1件だけ読み、既存 `expected` と実AI出力を比較。「本人に買い物を指示しない」「無関係な候補を提示しない」をassert。言語モデルを伴うUserSimulator/Judge使用はAPI許可後に限定。計算機的PASSではない自然言語検査は人レビューに残す。

## 6. 意思決定
**初手：採用を決め打ちして外部OSSを丸ごとmainにコピーしない**。先に1ケースの技術PoCをCodex隔離環境で実施し、証拠（操作トレース・ログ・費用・エラー・未実装）を残す。その後UXAgentを使用継続するか判断。LangWatch Scenarioは実際のAIヒントAPIが動く段階で追加。TinyTroupeは仮説発見用であり、当面の課金先選定を目的に大量実行する必要はない。

## 7. 現在の実行状態
今回はOSS公開リポジトリの内容確認のみ。どの候補もclone / 実装 / CLI実行 / 価格支払 / 実家庭への接触は行っていない。既存 `evals` 40件もまだ`not_run`。PR #23の研究・本体状態は変更せず、この比較文書のみ保存する。
