# 仮説を用いた採算・継続シミュレーター

**仮想シナリオに基づく条件付き算術モデルです。実際の購買確率を予測するものではありません。**

実行（リポジトリrootから）：

    python3 research/market-validation/simulate.py --input research/market-validation/simulation/assumptions.example.json --output research/market-validation/simulation/example_result.json
    python3 -m unittest discover -s research/market-validation -p 'test_*.py' -v

入力は公開可能な仮定値だけ。個人データ・子どもの音声・家庭内事情の原文を入れない。

算出するのは、対象家庭×申込率×試用開始率×子の自発2回目率×実払率（2回目後）による期待購入人数、決済/AI/保管/支援の原価、獲得費用、最大52課金期の更新確率を用いた期待貢献利益、損益分岐に必要な有料転換率です。単発提供は更新なし。

自発2回目率と支払率を0.5倍/1倍/1.5倍で変動させた9条件の感度分析を実施します。**価格・経路・継続率・支払率を推定するエンジンではありません。** 競合価格が確認された場合も、競合価格を当社の成約率と混同しないこと。

未モデル化：消費税、割引率、返金、利用増に応じたコスト増、集客チャネルの相関等。粗利益と純利益を混同しない。実顧客の行動は承認済みの別手段で測定。
