#!/usr/bin/env python3
"""Bounded DeepSeek Harness sales-research orchestrator; no customer data or product writes.

Stdlib only. The actual language-model agent is the official pinned DeepSeek Harness CLI.
Synthetic exercises are NOT conversion estimates.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
CFG = ROOT / "config.json"
STATE = ROOT / "state.json"
ROUNDS = ROOT / "rounds"
DSH = "@deepseek-ai/dsh@0.2.0-rc.2"

def load(path: pathlib.Path, default=None):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))

def save(path: pathlib.Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(path)

def config():
    cfg = load(CFG)
    if not cfg:
        raise RuntimeError("config.json がありません")
    return cfg

def default_state():
    return {
        "schema_version": "1.0",
        "created": "2026-10-10",
        "phase": "BOOTSTRAPPED",
        "last_verified_round": 0,
        "prepared_round": None,
        "model_runs": 0,
        "customer_observations": 0,
        "paid_transactions": 0,
        "reason": "First desk-research baseline only. Live model not started."
    }

def state():
    return load(STATE, default_state())

def doctor():
    c = config()
    checks = {
        "python_ok": sys.version_info >= (3, 10),
        "node_installed": bool(shutil.which("node")),
        "npx_installed": bool(shutil.which("npx")),
        "deepseek_key_in_environment": bool(os.environ.get("DEEPSEEK_API_KEY")),
        "expected_official_dsh_version": c["harness"]["version"],
        "upstream_source_copied": False,
        "upstream_source_policy": "pinned official npm dependency, not source-vendored",
        "repo_status": state()["phase"],
        "live_product_allowed": False
    }
    print(json.dumps(checks, ensure_ascii=False, indent=2))
    return 0 if checks["python_ok"] else 2

def expected_pairs(cfg=None):
    cfg = cfg or config()
    return {(p["id"], s["id"]) for p in cfg["household_profiles"] for s in cfg["sales_messages"]}

def build_prompt(round_number):
    c = config()
    required = ", ".join(c["result_required_fields"])
    pairs = ", ".join(f"{p}×{s}" for p, s in sorted(expected_pairs(c)))
    output = f"research/market-validation/rounds/round-{round_number:03d}/RESULT.json"
    prev = f"research/market-validation/rounds/round-{round_number-1:03d}/RESULT.json"
    return f"""# 第{round_number}ラウンド：やってみクエスト市場検証（DSH headless）

必読:
- research/market-validation/AGENTS.md, README.md, config.json
- research/market-validation/reports/first-pass-20261010.md
- research/GAKUSTA_初期ターゲット_家庭ルールと対話可能性_行動ベース定義_20261009.md
- research/GAKUSTA_H1相談負担_vs_H2金融判断の任せ方_顧客仮説実証調査_20261009.md
- research/GAKUSTA_顧客層_残存ギャップ_祖父母参加効果_20261009.md
- research/GAKUSTA_10家庭_募集対象_最終確定_20260925.md
- 本体設計 PR #10–#21 のうち現在有効な記録。実装/デモ/未実装を厳密に区別。
{"- 前回結果: " + prev if round_number > 1 else "- 前回: desk baselineのみ。AI実行記録なし。"}

目標: 親4家庭像×売り方4案の全16条件を検証し、致命的な前提・直接代替・実測実験を出す。
全16条件: {pairs}

3つの役割を順番に使い、可能なら公式DeepSeek Harnessのsubagent/ralphを最大3名・
現在ラウンド内最大3レビューで使用する:
(A) Researcher: 現行証拠を調べ、原典URLと確認日、対象、発言の出所を付ける。
(B) Critic: 全16セルで口頭相談/無料ChatGPT/LINE/みてね/money ring/無料教材に負ける理由、
    親の確認負担、子どもの再使用、祖父母の権限衝突を厳しく批判する。
(C) Strategist: 認知→初回体験→有料契約→4週間継続→解約を最小実験にする。
次ラウンドに渡すのは更新された検証可能な証拠と停止理由だけ。前と同じ資料なら停止。

合成ペルソナは「SYNTHETIC」と明記し、人間実測の代用にしない。
本人の親への金銭相談前の遠慮や家計余裕を勝手に推測しない。
アンケートの賛同・架空の購買率を購入実績と扱わない。
このラウンドで顧客実測データが追加されなければstatusはNEEDS_REAL_CUSTOMERS。

必須出力:
指定の {output} に有効なJSONを**保存**する。読んだだけで完了を主張しない。
トップレベル必須: {required}.
round={round_number}, cellsは重複なし16件。
各cell: profile_id, message_id, buyer, trigger, closest_substitute,
likely_objection, retention_test, evidence_level (configの列挙値)。
sources配列は原典URL、資料・時期・事実と限界を含める。
evidence_deltaは新たに確認した証拠の配列（無ければ空）。
critical_objections, recommendation, real_customer_testsも必須。
stop_reasonを書き、事実とシミュレーションを分離。

書き込み可能範囲: research/market-validation/rounds/round-{round_number:03d}/ のみ。
それ以外のファイルの改変、外部顧客への連絡、本番公開、広告費、決済は禁止。
"""

def prepare():
    s, c = state(), config()
    if s["phase"] == "BLOCKED_REAL_CUSTOMERS":
        print("停止: 新しい実顧客の証拠が入るまで自律ループを回さない")
        return 3
    if s["prepared_round"] and not (ROUNDS / f"round-{s['prepared_round']:03d}" / "RESULT.json").exists():
        n = s["prepared_round"]
    else:
        n = s["last_verified_round"] + 1
    if n > c["guardrails"]["max_rounds"]:
        print("停止: ラウンド上限")
        return 3
    d = ROUNDS / f"round-{n:03d}"
    d.mkdir(parents=True, exist_ok=True)
    (d / "REQUEST.md").write_text(build_prompt(n), encoding="utf-8")
    s["phase"], s["prepared_round"] = "PREPARED", n
    save(STATE, s)
    print(f"準備済み: {d.relative_to(ROOT)}/REQUEST.md")
    return 0

def verify_result(payload, round_number):
    c = config()
    errs = []
    for k in c["result_required_fields"]:
        if k not in payload:
            errs.append(f"top-level missing: {k}")
    if payload.get("round") != round_number:
        errs.append("round does not match")
    if payload.get("status") not in c["statuses"]:
        errs.append("invalid status")
    cells = payload.get("cells")
    if not isinstance(cells, list):
        cells = []
        errs.append("cells must be a list")
    found = []
    for i, cell in enumerate(cells):
        if not isinstance(cell, dict):
            errs.append(f"cells[{i}] not an object")
            continue
        for k in c["cell_required_fields"]:
            if k not in cell or cell[k] in (None, ""):
                errs.append(f"cells[{i}] missing {k}")
        found.append((cell.get("profile_id"), cell.get("message_id")))
        if cell.get("evidence_level") not in c["evidence_levels"]:
            errs.append(f"cells[{i}] evidence_level invalid")
    expected = expected_pairs(c)
    if len(cells) != 16 or len(set(found)) != 16 or set(found) != expected:
        errs.append("cells must match all and only the 16 P×S pairs")
    for k in ("sources", "evidence_delta", "critical_objections", "real_customer_tests"):
        if k in payload and not isinstance(payload[k], list):
            errs.append(f"{k} must be a list")
    if "status" in payload and payload["status"] == "COMPLETE" and not payload.get("evidence_delta"):
        errs.append("COMPLETE requires evidence_delta; empty evidence is a blocker")
    # Data from synthetic personas must not masquerade as observed transactions.
    if payload.get("observed_paid_conversions", 0) and payload.get("evidence_class") != "OBSERVED_CUSTOMER":
        errs.append("numeric paid outcomes require OBSERVED_CUSTOMER evidence class")
    return errs

def verify():
    s = state()
    n = s.get("prepared_round")
    if not n:
        print("prepareを先に実行")
        return 2
    output = ROUNDS / f"round-{n:03d}" / "RESULT.json"
    if not output.exists():
        print(f"RESULT.json 未生成: {output.relative_to(ROOT)}")
        return 2
    try:
        payload = load(output)
        errors = verify_result(payload, n)
    except (ValueError, TypeError, KeyError) as exc:
        print(f"検証失敗: {exc}")
        return 2
    if errors:
        print("検証失敗:\n- " + "\n- ".join(errors))
        return 2
    s["last_verified_round"] = n
    s["prepared_round"] = None
    if not payload.get("evidence_delta") or payload["status"] in ("NEEDS_REAL_CUSTOMERS", "BLOCKED"):
        s["phase"] = "BLOCKED_REAL_CUSTOMERS"
        s["reason"] = payload.get("stop_reason", "New customer or external evidence required")
    elif n >= config()["guardrails"]["max_rounds"]:
        s["phase"], s["reason"] = "LIMIT_REACHED", "Max rounds reached"
    else:
        s["phase"], s["reason"] = "VERIFIED", payload.get("stop_reason", "")
    save(STATE, s)
    print(f"検証PASS: round-{n:03d}; phase={s['phase']}")
    return 0

def run():
    s = state()
    if s["phase"] != "PREPARED" or not s.get("prepared_round"):
        print("まずprepareを実行")
        return 2
    if not os.environ.get("DEEPSEEK_API_KEY"):
        print("MODEL_NOT_STARTED: DEEPSEEK_API_KEYが未設定。Workでモデル資格情報を設定するか、DSH公式Web UIを使用してください。")
        return 4
    if not shutil.which("npx"):
        print("MODEL_NOT_STARTED: npx未導入")
        return 4
    n = s["prepared_round"]
    d = ROUNDS / f"round-{n:03d}"
    prompt = (d / "REQUEST.md").read_text(encoding="utf-8")
    print(f"公式DeepSeek Harness固定版を起動: {DSH} / round-{n:03d}")
    try:
        cp = subprocess.run(
            ["npx", "--yes", DSH, "--profile", "headless", prompt],
            cwd=ROOT.parent.parent,
            text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            timeout=config()["guardrails"]["max_model_call_minutes"] * 60,
            check=False
        )
    except subprocess.TimeoutExpired:
        print("モデル実行の上限時間で停止（再実行前に成果物を確認）")
        return 5
    # No secrets or raw prompts in committed logs. Local logs should not be committed.
    if cp.returncode:
        print(f"DSH終了コード: {cp.returncode}; stdout/stderrはセッション内で確認。コミットしない。")
        return cp.returncode
    s = state()
    s["model_runs"] += 1
    save(STATE, s)
    return verify()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["doctor", "status", "prepare", "run", "verify", "loop"])
    args = parser.parse_args()
    if args.command == "doctor":
        return doctor()
    if args.command == "status":
        print(json.dumps(state(), ensure_ascii=False, indent=2))
        return 0
    if args.command == "prepare":
        return prepare()
    if args.command == "run":
        return run()
    if args.command == "verify":
        return verify()
    if args.command == "loop":
        # Stop on first missing evidence gate rather than continually manufacturing "progress".
        for _ in range(config()["guardrails"]["max_rounds"]):
            if state()["phase"] != "PREPARED" and prepare():
                return 0
            result = run()
            if result:
                return result
            if state()["phase"] in ("BLOCKED_REAL_CUSTOMERS", "LIMIT_REACHED"):
                return 0
        return 0
    return 2

if __name__ == "__main__":
    raise SystemExit(main())
