#!/usr/bin/env python3
"""File-based research guardrails for ChatGPT Work, with no external model API.

The ChatGPT model inside a user-started Work task performs the actual research,
adversarial review, revision and writes RESULT.json. This CLI only checkpoints,
prepares inputs and verifies evidence and 16-cell completeness. It never runs
DeepSeek, calls OpenAI API, or schedules work.
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
CFG = ROOT / "config.json"
STATE = ROOT / "state.json"
ROUNDS = ROOT / "rounds"


def load(path: pathlib.Path, default=None):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save(path: pathlib.Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


def config():
    c = load(CFG)
    if c is None:
        raise RuntimeError("missing config.json")
    return c


def default_state():
    return {
        "schema_version": "1.1",
        "created": "2026-10-10",
        "execution": "chatgpt_work",
        "phase": "HANDOFF_READY",
        "last_verified_round": 0,
        "prepared_round": 1,
        "model_runs": 0,
        "customer_observations": 0,
        "paid_transactions": 0,
        "reason": "Work has not yet generated a verified round. Desk baseline available."
    }


def state():
    return load(STATE, default_state())


def expected_pairs(cfg=None):
    cfg = cfg or config()
    return {
        (p["id"], s["id"])
        for p in cfg["household_profiles"]
        for s in cfg["sales_messages"]
    }


def doctor():
    c = config()
    output = {
        "python_ok": sys.version_info >= (3, 10),
        "execution_surface": c["harness"]["execution_surface"],
        "model": c["harness"]["model"],
        "no_api_credentials_needed": True,
        "no_external_model_runtime": True,
        "deepseek_patterns_only": True,
        "profile_count": len(c["household_profiles"]),
        "message_count": len(c["sales_messages"]),
        "pair_count": len(expected_pairs(c)),
        "repo_phase": state()["phase"],
        "live_product_allowed": False,
    }
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0 if output["python_ok"] and output["pair_count"] == 16 else 2


def build_prompt(n):
    c = config()
    pairs = ", ".join(f"{p}×{s}" for p, s in sorted(expected_pairs(c)))
    dest = f"research/market-validation/rounds/round-{n:03d}/RESULT.json"
    previous = f"research/market-validation/rounds/round-{n-1:03d}/RESULT.json"
    return f"""# ChatGPT Work 実行タスク — 第{n}ラウンド

あなた自身（ChatGPT Work内のモデル）が実行担当。DeepSeek/外部API/DSH CLIを起動しない。
作業はこのWorkタスク内で、研究→懐疑的レビュー→改訂→検証の順に自律的に進める。
現在のアクティブ依頼は research/market-validation/WORK_START.md と
research/market-validation/AGENTS.md。両方を必ず読む。

必読（先にGitHubで確認）:
- research/market-validation/config.json, README.md, reports/first-pass-20261010.md
- research/GAKUSTA_初期ターゲット_家庭ルールと対話可能性_行動ベース定義_20261009.md
- research/GAKUSTA_H1相談負担_vs_H2金融判断の任せ方_顧客仮説実証調査_20261009.md
- research/GAKUSTA_顧客層_残存ギャップ_祖父母参加効果_20261009.md
- research/GAKUSTA_10家庭_募集対象_最終確定_20260925.md
- R/O/F/Bは面談後の仮説分類。10家庭のR1〜R4募集条件には手を触れない。
- PR #10〜21 の最新製品仕様の該当部分（mainだけを信頼しない）。
{"- 前回の検証済み結果: "+previous if n > 1 else "- 第0ラウンドはdesk baseline。モデル検証や実課金ではない。"}

目的: P1〜P4候補家庭×S1〜S4訴求の16条件で、実在する課題/現在の代替/
購入・非購入の理由/2回目利用/保護者の負担/祖父母の追加価値を比較する。
必須ペア: {pairs}

各条件の回答は実行済みの契約率ではなく、ラベル付きの仮説として記す。
全条件共通で4週間980円（旧製品設計の仮価格）と無料代替を比較する。
実際の購入者の年齢・収入・投資経験・家庭状況をデータ無しで決めつけない。

同一Workタスク内で役割を順次切り替える:
1. Researcher: 最新の実在する資料（原典/日付/地域/母数）を確認。
2. Critic: 顧客像そのものに反論し、無料のLINE/ChatGPT/親子会話/
   みてね/money ringなどで十分なケースを探す。
3. Strategist: 改善策、反証基準、親子・祖父母への現実的な検証設計を作る。
4. Auditor: 根拠と実測の混同がないかを確認し、必要なら修正。
無限ループ禁止。最低1回批判を行い、同一ラウンド最大3反復。

ラウンド成果物: {dest}
json top-level: {", ".join(c["result_required_fields"])}
各cell必須: {", ".join(c["cell_required_fields"])}
sources/evidence_deltaは情報源への追跡可能な参照を含む配列。
次のラウンドに回すには**新しい検証可能な証拠**が必要。
新証拠がない/実顧客を見ないと判定不能ならstatus=NEEDS_REAL_CUSTOMERSで停止。
Workで結果をGitHubに書き込んだら、可能なら
python3 research/market-validation/harness.py verify を実行。
実行環境がない場合は結果をこのスキーマに照らして検査して状態を報告する。

禁止: DeepSeek API/DSH CLIを必要条件にすること、架空の成約率/架空口コミ、
実家庭・未成年の個人情報のrepo投入、外部顧客連絡、広告課金、配信、
本番改変、自動PRマージ、承諾なしの公開。
"""


def prepare():
    s, c = state(), config()
    if s["phase"] in ("BLOCKED_REAL_CUSTOMERS", "LIMIT_REACHED"):
        print("停止: 実顧客証拠・実測が必要か、ラウンド上限に達しました")
        return 3
    n = s.get("prepared_round") or s["last_verified_round"] + 1
    if n > c["guardrails"]["max_rounds"]:
        print("停止: max_roundsを超過")
        return 3
    d = ROUNDS / f"round-{n:03d}"
    d.mkdir(parents=True, exist_ok=True)
    if (d / "RESULT.json").exists():
        print("既存結果あり: 先にverifyしてください（成果物は上書きしません）")
        return 3
    (d / "REQUEST.md").write_text(build_prompt(n), encoding="utf-8")
    s["phase"] = "HANDOFF_READY"
    s["prepared_round"] = n
    s["execution"] = "chatgpt_work"
    save(STATE, s)
    print(f"Work用タスク準備完了: rounds/round-{n:03d}/REQUEST.md")
    return 0


def verify_result(payload, n):
    c = config()
    errors = []
    if not isinstance(payload, dict):
        return ["RESULT.json must contain a JSON object"]
    for key in c["result_required_fields"]:
        if key not in payload:
            errors.append("top-level missing: " + key)
    if payload.get("round") != n:
        errors.append("round mismatch")
    if payload.get("status") not in c["statuses"]:
        errors.append("invalid status")
    cells = payload.get("cells")
    if not isinstance(cells, list):
        cells = []
        errors.append("cells must be list")
    found = []
    for i, cell in enumerate(cells):
        if not isinstance(cell, dict):
            errors.append(f"cells[{i}] invalid")
            continue
        for key in c["cell_required_fields"]:
            if cell.get(key) in ("", None):
                errors.append(f"cells[{i}] missing {key}")
        if cell.get("evidence_level") not in c["evidence_levels"]:
            errors.append(f"cells[{i}] invalid evidence_level")
        found.append((cell.get("profile_id"), cell.get("message_id")))
    if len(cells) != 16 or set(found) != expected_pairs(c) or len(set(found)) != 16:
        errors.append("cells must contain 16 unique P×S pairs")
    for key in ("evidence_delta", "sources", "critical_objections", "real_customer_tests"):
        if key in payload and not isinstance(payload[key], list):
            errors.append(f"{key} must be list")
    if payload.get("status") in ("RESEARCHED", "COMPLETE") and not payload.get("evidence_delta"):
        errors.append("RESEARCHED/COMPLETE requires evidence_delta")
    if payload.get("status") == "COMPLETE" and payload.get("evidence_class") != "OBSERVED_CUSTOMER":
        errors.append("COMPLETE cannot mean real-world sales proven without OBSERVED_CUSTOMER")
    if payload.get("observed_paid_conversions", 0) and payload.get("evidence_class") != "OBSERVED_CUSTOMER":
        errors.append("paid conversions need OBSERVED_CUSTOMER evidence")
    return errors


def verify():
    s = state()
    n = s.get("prepared_round")
    if not n:
        print("No prepared round; run prepare")
        return 2
    dest = ROUNDS / f"round-{n:03d}" / "RESULT.json"
    if not dest.exists():
        print(f"No completed Work output yet: {dest}")
        return 2
    try:
        result = load(dest)
        errors = verify_result(result, n)
    except (ValueError, KeyError, TypeError) as exc:
        print(f"Validation failed: {exc}")
        return 2
    if errors:
        print("INVALID:\n- " + "\n- ".join(errors))
        return 2
    s["last_verified_round"] = n
    s["prepared_round"] = None
    s["model_runs"] = s.get("model_runs", 0) + 1
    if result["status"] in ("BLOCKED", "NEEDS_REAL_CUSTOMERS") or not result.get("evidence_delta"):
        s["phase"] = "BLOCKED_REAL_CUSTOMERS"
    elif n >= config()["guardrails"]["max_rounds"]:
        s["phase"] = "LIMIT_REACHED"
    else:
        s["phase"] = "VERIFIED"
    s["reason"] = result.get("stop_reason", "")
    save(STATE, s)
    print(f"Verified Work output round-{n:03d}; phase={s['phase']}")
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("doctor", "status", "prepare", "verify"))
    args = parser.parse_args()
    if args.command == "doctor":
        return doctor()
    if args.command == "status":
        print(json.dumps(state(), indent=2, ensure_ascii=False))
        return 0
    if args.command == "prepare":
        return prepare()
    if args.command == "verify":
        return verify()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
