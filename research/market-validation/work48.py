#!/usr/bin/env python3
"""ChatGPT Work 48-round FILE-BASED checkpoint controller. No model calls or APIs.

Run from the repo root:
    python3 research/market-validation/work48.py status
    python3 research/market-validation/work48.py next
    # ChatGPT Work reads that packet, does research itself, then writes its result.
    python3 research/market-validation/work48.py verify

The CLI cannot start or prolong ChatGPT Work. It provides deterministic resume
and evidence gates. All sales conclusions still require observed human behavior.
"""
from __future__ import annotations
import argparse
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
PLAN_FILE = ROOT / "work48_plan.json"
STATE_FILE = ROOT / "work48_state.json"
RESULTS = ROOT / "work48" / "results"
ALLOWED = {"REVIEWED", "BLOCKED_NEEDS_CUSTOMER", "BLOCKED_NO_SOURCE"}


def read(path, default=None):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def atomic_write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def plan():
    obj = read(PLAN_FILE)
    if not isinstance(obj, dict) or len(obj.get("rounds", [])) != 48:
        raise ValueError("work48_plan.json must define exactly 48 rounds")
    if [r["round"] for r in obj["rounds"]] != list(range(1, 49)):
        raise ValueError("round IDs must run from 1 to 48, without gaps")
    keys = [(r["stage"], r["title"]) for r in obj["rounds"]]
    if len(set(keys)) != 48:
        raise ValueError("all 48 objectives must have distinct stage + title")
    return obj


def initial_state():
    return {
        "schema": "work48-state-1",
        "execution": "chatgpt_work_no_api",
        "next_round": 1,
        "reviewed": [],
        "blocked": [],
        "halted": False,
        "halt_reason": "",
        "consecutive_blocked": 0,
        "real_customer_interviews": 0,
        "observed_purchases": 0,
        "note": "No ChatGPT Work execution has occurred. 48 earlier desk passes were NOT 48 Work rounds."
    }


def state():
    return read(STATE_FILE, initial_state())


def packet(number):
    p = plan()
    if not 1 <= number <= 48:
        raise ValueError("round number must be 1..48")
    return p["rounds"][number - 1]


def validate_result(data, number):
    problems = []
    if not isinstance(data, dict):
        return ["Result must be a JSON object"]
    objective = packet(number)
    if data.get("round") != number:
        problems.append("wrong round number")
    if data.get("stage") != objective["stage"]:
        problems.append("wrong stage")
    if data.get("title") != objective["title"]:
        problems.append("wrong task title")
    if data.get("status") not in ALLOWED:
        problems.append("unknown status")
    if data.get("model") != "ChatGPT Work":
        problems.append("model must be 'ChatGPT Work'; no simulated model execution")
    if data.get("is_real_customer_experiment") is not False:
        problems.append("desk research result must explicitly set is_real_customer_experiment=false")
    for key in ("finding", "contrary_view", "decision_update", "next_real_world_test", "remaining_uncertainty"):
        value = data.get(key)
        if not isinstance(value, str) or len(value.strip()) < 12:
            problems.append(f"{key} needs a substantive non-empty answer")
    sources = data.get("sources")
    if not isinstance(sources, list):
        problems.append("sources must be a list")
        sources = []
    for idx, source in enumerate(sources):
        if not isinstance(source, dict) or not isinstance(source.get("reference"), str) or not isinstance(source.get("claim"), str):
            problems.append(f"source {idx}: reference and claim required")
        elif not source["reference"].strip() or not source["claim"].strip():
            problems.append(f"source {idx}: empty reference or claim")
    if data.get("status") == "REVIEWED" and not sources:
        problems.append("REVIEWED requires traceable source references; else mark BLOCKED")
    if data.get("status") == "REVIEWED" and data.get("evidence_status") not in (
        "REPOSITORY_DESIGN", "VERIFIED_PUBLIC", "REVIEWED_SECONDARY", "INFERENCE"
    ):
        problems.append("REVIEWED requires a valid evidence_status")
    if data.get("status") != "REVIEWED" and data.get("evidence_status") != "UNVERIFIED":
        problems.append("blocked tasks must have evidence_status=UNVERIFIED")
    if data.get("claimed_purchase_rate") is not None or data.get("claimed_retention_rate") is not None:
        problems.append("do not invent purchase or retention rates")
    if data.get("new_customer_evidence") not in (False, None):
        problems.append("cannot label customer evidence without separate approved traceable source")
    return problems


def show_status():
    p, s = plan(), state()
    summary = {
        "configured_rounds": len(p["rounds"]),
        "next_round": s["next_round"],
        "reviewed": len(s["reviewed"]),
        "blocked": len(s["blocked"]),
        "attempted": len(s["reviewed"]) + len(s["blocked"]),
        "halted": s["halted"],
        "halt_reason": s["halt_reason"],
        "work_engine": "ChatGPT Work invoked by user; not this Python process",
        "model_api_calls": 0,
    }
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


def next_round():
    s = state()
    if s["halted"]:
        print("STOP: " + s["halt_reason"])
        return 3
    n = s["next_round"]
    if n > 48:
        print("All 48 rounds have checkpoints; inspect how many are actually REVIEWED vs BLOCKED.")
        return 0
    location = RESULTS / f"round-{n:03d}.json"
    if location.exists():
        print(f"Result already exists for round {n}, run verify first: {location}")
        return 2
    r = packet(n)
    out = {
        "round": n, "of": 48, "stage": r["stage"], "title": r["title"],
        "research_goal": r["goal"], "most_important_failure": r["failure_mode"],
        "save_as": str(location.relative_to(ROOT)),
        "previous_checkpoint": f"round-{n-1:03d}.json" if n > 1 else "48_passes_20261010.md baseline",
        "required_fields": [
            "round", "stage", "title", "status", "model",
            "is_real_customer_experiment", "finding", "contrary_view",
            "decision_update", "next_real_world_test", "remaining_uncertainty",
            "sources", "evidence_status", "new_customer_evidence"
        ],
        "stop_policy": "Mark missing evidence BLOCKED; never invent sources or customer purchases."
    }
    print(json.dumps(out, indent=2, ensure_ascii=False))
    return 0


def advance():
    s = state()
    if s["halted"]:
        print("The workflow is halted; do not continue without new evidence and approval.")
        return 3
    n = s["next_round"]
    if n > 48:
        print("All rounds accounted for")
        return 0
    p = RESULTS / f"round-{n:03d}.json"
    if not p.exists():
        print("No result from Work; do not increment: " + str(p))
        return 2
    try:
        payload = read(p)
        failures = validate_result(payload, n)
    except (ValueError, KeyError, TypeError) as e:
        print(f"INVALID {p}: {e}")
        return 2
    if failures:
        print("INVALID\n- " + "\n- ".join(failures))
        return 2
    if payload["status"] == "REVIEWED":
        s["reviewed"].append(n)
        s["consecutive_blocked"] = 0
    else:
        s["blocked"].append(n)
        s["consecutive_blocked"] += 1
    s["next_round"] = n + 1
    if s["consecutive_blocked"] >= 6:
        s["halted"] = True
        s["halt_reason"] = "Six successive research foci produced no verifiable evidence. Need new real-world evidence; don't spin."
    if n == 48:
        s["halted"] = True
        s["halt_reason"] = "48 task checkpoints reached; NOT proof of 48 successful market validations."
    atomic_write(STATE_FILE, s)
    print(f"CHECKPOINT {n}/48: {payload['status']}. Next={s['next_round']}; halted={s['halted']}")
    return 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("status", "next", "verify", "plan", "doctor"))
    args = parser.parse_args()
    if args.command == "status":
        return show_status()
    if args.command == "next":
        return next_round()
    if args.command == "verify":
        return advance()
    if args.command == "plan":
        print(json.dumps(plan(), ensure_ascii=False, indent=2))
        return 0
    if args.command == "doctor":
        r = plan()
        print(json.dumps({"planned_distinct_rounds":len(r["rounds"]),"no_model_api":True,
                          "save_restarts":True,"Work_actually_invoked":False,
                          "not_a_ChatGPT_Work_background_scheduler":True},ensure_ascii=False,indent=2))
        return 0
    return 2


if __name__ == "__main__":
    sys.exit(main())
