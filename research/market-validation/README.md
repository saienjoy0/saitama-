# やってみクエスト｜販売仮説の反復検証ハーネス

更新日: 2026-10-10 / Status: research-only, customer evidence not yet established.

## 何を作ったか
DeepSeek公式のDeepSeek Harness（DSH）の配布版を、**独自に模倣せず**正規のランタイムとして使うための検証環境。ソース: https://github.com/deepseek-ai/deepseek-harness （MIT）。検証した配布版: @deepseek-ai/dsh@0.2.0-rc.2（2026-10-10のnpm情報）。Developer Previewのため、更新は固定版の見直し後のみ。

「4つの売り方を4つの顧客候補に交差させ、証拠調査→仮想反論の列挙→敵対的レビュー→改善→実顧客テスト設計→停止」の反復。DeepSeekのGoal/Ralph/subagent/skill機能は公開仕様に従って利用する。学習用サンプルや機能紹介のコピーではなく、販売仮説検証を扱う独立したディレクトリ。

### 重要な状態
- **本体開発を開始しない。** main/current/PROJECT_STATE.json は DESIGN / D90 / implementation_allowed=false。今回の作業は research / synthetic fixtures / non-production planning のみ。
- DeepSeek公式ランタイムの大規模ソースはアプリ本体へ丸ごと複製しない。ライセンス、依存関係、供給元の追跡をしやすくするため、固定版の公式配布物を使う。公式ソースcheckout手順も後述。
- 本会話の環境にはDeepSeek APIキーとnpm/GitHubへのDNS接続がなく、**実LLMの自律ループは起動未確認**。初期ベースラインの作成とオフラインゲートのみ開始。Workではキー/ランタイム確認後に実モデル実行を開始する。
- 合成ペルソナの発言は購買率の証拠ではない。公開調査、実際の保護者観察、決済を分離する。

## 今回の4つの訴求（S）
S1. 「子どもに、どこまで任せる？」（親の裁量権・自立）
S2. 「『買って！』の前に、自分で考える」（日常の金銭相談）
S3. 「今週末、夕飯を子どもに任せてみませんか？」（家庭で実践）
S4. 「お年玉に『自分で考える経験』も添える」（祖父母ギフト）

## 4つの候補家庭（P）と16条件
P1: 親が裁量権の渡し方に迷う家庭。
P2: 家庭ルール＋相談余地＋直近の相談摩擦がある家庭（R/O/F/Bを観察して判定）。
P3: 日常で体験を任せたいが、準備や見守りが重い家庭。
P4: 別居祖父母が関与可能で、親が家族共有を希望する家庭（祖父母は選別必須条件ではない）。
**同じPにS1〜S4すべて提示して、訴求と家庭特性を混同しない。** P4でも最初の保護者の実用課題が無ければ契約しない可能性を残す。

## 調査上の正本（古いターゲットへの逆戻り禁止）
- research/GAKUSTA_初期ターゲット_家庭ルールと対話可能性_行動ベース定義_20261009.md
- research/GAKUSTA_H1相談負担_vs_H2金融判断の任せ方_顧客仮説実証調査_20261009.md
- research/GAKUSTA_顧客層_残存ギャップ_祖父母参加効果_20261009.md
- research/GAKUSTA_10家庭_募集対象_最終確定_20260925.md
- PR #10〜#21 の2026-10-05〜08最新プロダクト設計・デモ（mainだけを見ない）。
「投資経験豊富・共働き・富裕層」を必須条件に戻さない。初期10家庭の募集比較枠R1-R4は維持。仮説のR/O/F/Bで募集段階を勝手に限定しない。

## 開始方法（Work/ローカルで実行）
1. リポジトリをclone。PRのブランチをcheckoutし、Node.js 22以上、Python 3.10以上を確認。
2. DeepSeek Harnessの公開コードを確認。必要なら下記の公式タグからソースを別ディレクトリにcheckoutする。MIT License / noticeを保持。
3. DeepSeek APIキーは環境変数DEEPSEEK_API_KEYかDSHの資格情報設定へ。**キーをgitに入れない**。子ども・実家庭の個人データは投入しない。
4. まず python3 research/market-validation/harness.py doctor と python3 research/market-validation/harness.py status。
5. python3 research/market-validation/harness.py prepare で第1ラウンドの依頼書を生成。
6. モデル起動の準備ができた場合に限り python3 research/market-validation/harness.py run 。プロセスが完了したら verify で成果物を検査。
7. 次のラウンドは python3 research/market-validation/harness.py prepare、run の順。最大3ラウンド。**実証データなしで自説を反復増幅しない。**
8. 研究変更はこのディレクトリだけでcommitし、製品ブランチや本番画面へ自動マージしない。

公式起動例（2026-10-10に確認）:
  npx --yes @deepseek-ai/dsh@0.2.0-rc.2 web
  npx --yes @deepseek-ai/dsh@0.2.0-rc.2 --profile headless "このリポジトリのresearch/market-validation/AGENTS.mdを読んで初回検証を実施"
ソース確認用（アプリの製品コードに直接上書きしない）:
  git clone --branch dsh-v0.2.0-rc.2 --depth 1 https://github.com/deepseek-ai/deepseek-harness.git .cache/deepseek-harness

## 意味のある「自律ループ」
1. Researcher: 事実・原典・時点・対象と、親子の直近の行動を調べる。
2. Personas: P1〜P4×S1〜S4の「反論・購入の障害」を**架空の演習として**出す。
3. Critic: 無料のChatGPT/LINE/みてね/カード/家族会議で足りる条件を探し、撤退仮説を立てる。
4. Designer: 訴求、無料体験、価格提示、継続導線を必要最小限に直す。
5. Validator: 顧客実測／有料決済なしに「売れた」と書いていないかをチェック。
6. Gate: 新しい証拠・実測の追加が無い状態で同じ比較だけが続くなら停止、必要な一次検証を要求する。

## 出力と受入ゲート
- rounds/round-001/RESULT.json （次のラウンドで更新）: 16条件・根拠・最大の反証・計測する実験・自己評価。
- reports/first-pass-20261010.md: **初期ベースライン**。研究開始時点の材料であってモデル推定や実課金の証拠ではない。
- 1ラウンドあたりResearcher→Critic→Designerを実施するが、証拠が追加されない場合は最大3回で停止。
- AI生成の「購入率」「継続率」「市場規模」は禁止。実際のクリックや契約と混ぜない。
- 費用が発生する広告、外部送信、課金、PRマージは人間の明示承認が必要。

## 警告
公式DSHはdeveloper preview。外部サイト・CLI/依存関係は安全境界が変わる。起動前に上流Security Notice、バージョン、許可ツール、sandboxを確認。生のインタビュー、特に未成年の発言を勝手に外部モデルへ送らない。