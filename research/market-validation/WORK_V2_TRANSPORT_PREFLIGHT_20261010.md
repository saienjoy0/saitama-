# ChatGPT Work実機の最初の受入｜GitHub接続だけ確認する（V2 Step 1）
対象: saienjoy0/saitama- / PR #23 / research/deepseek-market-harness-20261010
設計正本: research/market-validation/WORK_V2_IMPLEMENTATION_DESIGN_20261010.md

## Workモードに伝える依頼（そのまま使える）
このタスクは市場調査ではなく、WorkがGitHub PR #23の研究ブランチへ安全に読み書きできるかの能力テストです。
外部モデル/API、DeepSeek、顧客連絡、広告、決済、mainへのマージ、本番変更をしないでください。

1. GitHubの連携機能を使用し、PR #23とブランチ research/deepseek-market-harness-20261010 の最新head SHAを取得してください。Workからシェル/Pythonが使えると推定しないでください。
2. 既存のresearch/market-validation/work48_state.jsonとWORK_V2_IMPLEMENTATION_DESIGN_20261010.mdを読んでください。0/48と読めるか確認してください。
3. GitHubで次のテスト専用ファイルが存在しないことを確認した上で、指定ブランチに作成してください：
   research/market-validation/transport/work-write-probe-20261010.md
   中身は「V2 GitHub WRITE probe / 実市場調査ではない / 顧客データなし / 元のhead SHA / この実際のタスクで使用したGitHub操作」だけにしてください。
   これはユーザーが依頼する研究ブランチ内へのテスト書込であり、mainに公開しないでください。
4. 作成されたファイルをGitHubからもう一度取得し、内容が一致し、headが変更されたことを確認してください。GitHub Actionsが走っていれば、その検査結果も取得してください。取得できなければ失敗として記録してください。
5. 最後に以下の4項目を返信してください。a:READ確認 / b:WRITE確認 / c:READBACK確認 / d:CI実行結果。成功・失敗の証拠にコミットSHAを付記してください。
6. この時点ではwork48_state.jsonの進捗を変更せず、round-001の実調査を開始しないでください。

GitHubへの書込権限が無い、ブラウザ操作が制限される、コネクタでbranchが指定できない、CI結果を取得できない場合は、それを具体的に報告して停止してください。成功したふりをしないでください。

## 次の作業
上のA0が通ったら、別途Codex/実装担当へWORK_V2_CODEX_IMPLEMENTATION_TASK_20261010.mdを渡し、コミット済みRESULTのスキーマ検査と次テーマ算定を先に導入する。
その改修がCIで通ってから、WORK48_PUBLIC_RESEARCH_START.mdに従う本当のround-001調査→GitHub保存→CI→別Work再開を実行する。

このpreflightの成功は「Workが48ラウンドを自動で実行できる」「実際の販売判断に根拠がある」を意味しません。
