# Codex実装指示｜市場調査ハーネスV2（PR #23、最小差分）
更新: 2026-10-10 / 状態: 未実装 / 研究用のみ

## 最初に読む
- research/market-validation/WORK_V2_IMPLEMENTATION_DESIGN_20261010.md（設計正本）
- research/market-validation/WORK_DESIGN_REVIEW_20261010.md
- research/market-validation/WORK48_PUBLIC_RESEARCH_START.md
- research/market-validation/work48.py, work48_plan.json, work48_state.json, test_work48.py
- research/market-validation/skill_router.py, skill_registry.json, simulate.py, test_market_simulation.py
- .github/workflows/market-validation-offline.yml

## 最優先の実装タスク：P0のみ
Goal: ChatGPT Workが実際に調査したRESULTをGitHubに1件保存し、CIがそのRESULTの構造を検査し、別Workで安全に次テーマへ再開できる最小システムを成立させる。

1. checkpoint.py（新規）: 現在のwork48/results/round-NNN.jsonを列挙して、planとvalidate_resultを使い、完了済み/保留/無効を決定論的に再構成する。成功記録が一度コミットされたら、work48_state.json単独のnext_round値が古くても失敗なく復元する。旧stateは表示キャッシュ扱い。未処理や無効を勝手に完了扱いしない。48固定テーマは維持。
2. work48.py改修: status/next/doctorをコミット済みRESULTから算定できるようにし、従来状態との齟齬を検出。必要な移行処理と旧CLI互換。verifyはローカルの検証と記録を区別、GitHub接続を暗黙に仮定しない。既存round-001（旧総括）とwork48/results/round-001（新公開調査）を混同しない。
3. test_committed_results.py（新規）: 実際にリポジトリに存在するwork48/results/*.jsonを順に読み、plan番号、必須field、source、blocked区分、二重カウント、必要な証拠境界を検査する。テスト用synthetic fixtureの48成功だけで「実調査完了」と言わない。空ディレクトリ（現在0/48）はPASSのうえ0件と明示。
4. CI改修: 上記の「コミット済み結果の検査」を.github/workflows/market-validation-offline.ymlへ加える。CIはread-only。G0構造だけのPASSをPUBLIC_FACTの検証完了と表示しない。
5. GitHub権限・Work受入用の短い手順を文書化: WorkにはローカルPythonが無い場合があるため、GitHub connectorによる「単一RESULTファイルcommit→readback→CI結果確認」を基本とし、コネクタが書き込めない場合はそこで停止。ローカルシェルがある時だけCLIのdoctor/statusを補助使用。
6. E2EのGate Aテスト仕様: WorkでGitHub branch確認→1件の実公開資料調査→結果commit→CI→新Workでnext確認。実Workをこの実装作業の中で動かしたと偽ってはいけない。必要なら実際のWork利用者向けプロンプトを生成する。

## P0テスト（手で読める必須条件）
- resultが未作成なら0/48のまま、nextは1
- 有効なround-001を追加したら、クリーンな別プロセスのnextは2
- work48_state.jsonのnext=1が古くても正しく再計算できる
- 無効なJSON、不足source、誤round番号ではnextが進まずCI失敗
- BLOCKED_NO_SOURCEとBLOCKED_NEEDS_CUSTOMERは完了率には含めず、調査試行数に含める
- 既存のwork48.py/test_work48.pyの機能を退行させない
- 既存のレポート・正本・合成デモ・main/PR #10〜#21は変更しない
- GitHubへのpushやPRのマージは自動で行わない。変更はPR #23 headの研究専用ブランチにコミットし、commit SHAとテストを表示

## P0合格後、続けるP1の実装（別コミット）
A. source_audit.pyとround-result-v2 schema: claim単位のURL・本文位置・確認日・適用限界・反証・閲覧区分。機械的整合をCIで、資料本文の真偽はWork/人の監査として分離。
B. decision_ledger.jsonとselection.py: 48件をバックログ化し、意思決定に影響するテーマを選択。SOURCE_AUDIT先行、残りは新証拠がある時に順位変更。再計算可能で理由保存、恣意的な無限ループ無し。
C. simulate.pyと入力schema v2: 事前単発/無料体験後購入/自発2回目後購入を別ファネルにし、条件確率の二重積算を防ぐ。AI、音声、保管、サポート、返金、決済、獲得費、初期費用の感度分析。観測のない数値は予測と呼ばない。旧サンプルの回帰テストを維持。
D. docs: 何が実装/未実装/デモ/未検証かをREADMEに差分追記する。

## 改変しない原則
- Workから外部LLM APIやDeepSeekモデルは呼ばない
- ChatGPT WorkをPythonがバックグラウンドで自動起動できると主張しない
- GitHub Actionsはモデルを起動せず、CIで機械的検査のみ
- 子どもの個人情報をpublic repoへ保存しない
- 有料購入、配信、広告、ユーザー接触、製品本番デプロイ、PRマージをしない
- 価格980円/4週間も購入率も未検証仮説
- スキルは既存12種で足りる。新たな外部スキルの取得はP0の実機成功に必要な場合のみ、出所・ライセンス・SHAと採用理由を付して別提案

## 報告様式
各コミットごとに「何を修正したか」「どういう失敗を防ぐか」「実際に実行したテストと結果」「未検証の制約」「次のWorkで行う受入手順」を5項目で簡潔に報告。
完了判定はCIだけでなくWorkの別セッション再開まで保留と明記する。
