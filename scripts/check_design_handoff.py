#!/usr/bin/env python3
"""Check documentation/fixtures only. No model calls, product tests, or approval changes."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def check(root=ROOT):
    errors = []

    def require(ok, message):
        if not ok:
            errors.append(message)

    def read(path):
        p = root / path
        require(p.is_file(), f"Missing: {path}")
        return p.read_text() if p.is_file() else ""

    state = json.loads(read("current/PROJECT_STATE.json"))
    tasks = json.loads(read("current/TASKS.json"))["tasks"]
    registry = json.loads(read("current/SKILLS.json"))["skills"]
    ids = {t["id"] for t in tasks}
    require(len(ids) == len(tasks), "Duplicate task IDs")
    require(state["stage"] in {"DESIGN", "PLAN", "BUILD", "VERIFY", "PILOT"}, "Unknown stage")
    for task in tasks:
        require(all(d in ids for d in task["depends_on"]), f"Unknown dependency: {task['id']}")
        for path in task.get("artifacts", []):
            read(path)
    selected = [t for t in tasks if t["id"] == state["next_task_id"]]
    require(len(selected) == 1, "Next task missing")
    if selected:
        task = selected[0]
        require(task["stage"] == state["stage"], "Next task is outside current stage")
        require(task["status"] != "done", "Next task already done")
        done = {t["id"] for t in tasks if t["status"] == "done"}
        require(all(d in done for d in task["depends_on"]), "Next task dependencies incomplete")
    for path in state["active_specs"]:
        read(path)
    read(state["implementation_plan"])
    bundle = json.loads(read(state["review_bundle"]))
    for path, expected_hash in bundle["files"].items():
        actual = hashlib.sha256(read(path).encode()).hexdigest()
        require(actual == expected_hash, f"Review bundle changed: {path}")
    require(set(state["active_specs"]).issubset(bundle["files"]), "Active specs missing from review bundle")
    features = json.loads(read("docs/design/FEATURES.json"))["features"]
    require(len(features) == 21 and len({f['id'] for f in features}) == 21, "Expected 21 unique features")
    for feature in features:
        require(feature["task"] in ids, f"Unknown feature task: {feature['id']}")
    if state["stage"] in {"DESIGN", "PLAN"}:
        require(state["implementation_allowed"] is False, "Implementation permitted too early")
    if state["implementation_allowed"]:
        require(state["approval"]["written_spec"] and state["approval"]["implementation_plan"], "Missing approval flags")
        require(bool(state["approval"]["evidence"]), "Missing approval evidence")
    for skill in registry:
        if "repo_path" not in skill:
            continue
        content = read(skill["repo_path"])
        require(content.startswith("---\nname: "), f"Invalid skill body: {skill['name']}")
        require(f"name: {skill['name']}\n" in content, "Skill name mismatch")
        require("description: " in content and len(content) > 500, "Incomplete skill")
        require(hashlib.sha256(content.encode()).hexdigest() == skill["sha256"], "Skill hash differs from registry")
        require(not any(x in content for x in ("sed: can't read", "[TODO", "No such file or directory")), "Skill contains placeholder or read error")
    fixture_text = read("evals/ai-cases.jsonl")
    cases = [json.loads(line) for line in fixture_text.splitlines() if line.strip()]
    require(len(cases) == 24, "Expected 24 design evaluation cases")
    require(len({c["case_id"] for c in cases}) == len(cases), "Duplicate evaluation IDs")
    require(sum(c["split"] == "holdout" for c in cases) == 8, "Expected 8 holdout cases")
    for case in cases:
        require(case["data_kind"] == "synthetic" and bool(case["input"]) and bool(case["expected"]), "Incomplete synthetic case")
        require(case["layer"] in {"application", "model"}, "Unknown evaluation layer")
    schema = json.loads(read("contracts/ai-draft.schema.json"))
    example = json.loads(read("contracts/ai-draft.example.json"))
    require(schema["additionalProperties"] is False, "Schema must reject unexpected actions")
    forbidden = {"approval", "recipient_ids", "family_id", "publish", "reward"}
    require(not forbidden.intersection(schema["properties"]), "Trusted fields in model schema")
    require(set(example) == set(schema["required"]), "Example top-level keys differ")
    require(example["schema_version"] == "0.2", "Wrong example version")
    for path in ("AGENTS.md", "docs/CODEX_HANDOFF.md", "docs/workflow/STAGES_AND_SKILLS.md"):
        read(path)
    return errors


if __name__ == "__main__":
    try:
        failures = check()
    except (KeyError, ValueError, OSError) as exc:
        raise SystemExit(f"FAIL: invalid handoff input: {exc}")
    if failures:
        raise SystemExit("FAIL:\n" + "\n".join(failures))
    print("PASS: stage, task dependencies, review hashes, 21 features, 2 bundled skills, schema envelope, 24 synthetic specifications")
    print("NOT RUN: product tests, model evaluations, family pilot; plugin availability must be checked in target Codex")
