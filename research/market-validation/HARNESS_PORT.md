# DeepSeek Harnessの設計をChatGPT Workへ移植した範囲

上流リファレンス: https://github.com/deepseek-ai/deepseek-harness / 2026-10-10の固定コミットはUPSTREAM.lock.jsonに記録。公式DSHのRalphは「各ラウンドで新しい子エージェントを起動、前ラウンドのhandoffと共有ワークスペースだけを参照する」仕組み。Goalは継続目標と状態を保存する別の機構である。

| 上流の仕組み | 今回のWork版 | 同一ではない点 |
|---|---|---|
| Goal | config.jsonで目的を固定、state.jsonでステータスを保持 | Workの製品内部にDSH Goalプラグインを追加しない |
| Ralph bounded rounds | WORK_START / REQUEST / RESULT / verifyによる最大3ラウンド | 別々の新規子エージェントを本物のDSHで生成しない |
| Shared workspace | GitHub PRの研究用ディレクトリが持続する状態 | 会話・Work自身の内部状態には依存しない |
| Bounded handoff | 各ラウンドのRESULT.json、次のREQUEST.md | 公式DSHの構造化Handoff型/APIとは異なる |
| Subagent specialist | Workの同じモデルがResearcher→Critic→Strategist→Auditorを順次実行 | モデルの独立性を保証する「別エージェント」ではない |
| Tools restrictions | 研究専用PR、書込み先・外部送信の禁止、GitHub CI | Workの内部サンドボックスの技術的なアクセス制御と同一ではない |
| Completion gate | 16セル、証拠の有無、初期利用、2回目、自発性、実際の支払いまで未検証明記 | AIの自己申告だけで商品売上を証明しない |

## なぜ公式DeepSeekランタイムをWorkに入れないのか
DeepSeek Harnessのプロセスをそのまま使用するなら、そこから推論モデルへ接続する資格情報や対応するバックエンドが必要になる。ChatGPT Workはユーザーが選択する製品モードであり、`npx @deepseek-ai/dsh`から「Work内の同じChatGPTモデル」を呼び出す一般公開の方法は確認できない。そこで**ユーザーの要求どおり、Work内のChatGPTが分析・検証を実施し、公開されたDeepSeek Harness設計から停止/再開/受渡しのパターンだけを移植**している。

注意: これは**DeepSeek Harness本体をChatGPTモデルに差し替えて実行する実装ではない**。目的に必要な機能をWork上で再現した設計であり、DeepSeekのプログラムを操作可能と誤認させない。

Work実行タスクはユーザーがChatGPTで開始する必要があり、このPRを作成しただけでは継続起動しない。
