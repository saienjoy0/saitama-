#!/usr/bin/env python3
"""Pinned research skills: authenticity audit + deterministic Work48 routing."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
WORK=ROOT/"research"/"market-validation"


def load_registry():
    return json.loads((WORK/"skill_registry.json").read_text(encoding="utf-8"))


def git_blob_sha(data):
    header=b"blob "+str(len(data)).encode("ascii")+b"\0"
    return hashlib.sha1(header+data).hexdigest()


def audit(reg=None,root=None):
    reg=reg or load_registry()
    root=root or ROOT
    problems=[]
    chosen=set(reg["selected"])
    if len(chosen)!=len(reg["selected"]) or len(chosen)<10:
        problems.append("Skill list is missing or duplicated")
    routes=reg["stage_routes"]
    for stage,names in routes.items():
        if not names:
            problems.append("No skills for stage "+stage)
        for name in names:
            if name not in chosen:
                problems.append("Uninstalled routed skill "+name)
    seen=set()
    for item in reg["pinned_files"]:
        name=item["path"]
        if name in seen:
            problems.append("Duplicate vendored path "+name)
        seen.add(name)
        file=root/name
        if not file.is_file():
            problems.append("Missing "+name)
            continue
        actual=git_blob_sha(file.read_bytes())
        if actual!=item["git_blob_sha1"]:
            problems.append("Source mismatch "+name)
    for name in chosen:
        if ".agents/skills/"+name+"/SKILL.md" not in seen:
            problems.append("Missing entry skill "+name)
    if "THIRD_PARTY_LICENSES/marketingskills-LICENSE" not in seen:
        problems.append("Missing upstream MIT license attribution")
    return problems


def route(round_no,reg=None,plan=None):
    reg=reg or load_registry()
    if plan is None:
        plan=json.loads((WORK/"work48_plan.json").read_text(encoding="utf-8"))
    if type(round_no) is not int or not 1<=round_no<=48:
        raise ValueError("round must be 1..48")
    item=plan["rounds"][round_no-1]
    if item["round"]!=round_no:
        raise ValueError("out of order plan")
    skills=reg["stage_routes"].get(item["stage"])
    if not skills:
        raise ValueError("No registered skills for "+item["stage"])
    return {
        "round":round_no,"stage":item["stage"],"title":item["title"],
        "mandatory_router_skill":".agents/skills/yattemi-research-harness/SKILL.md",
        "ordered_skills":[".agents/skills/"+s+"/SKILL.md" for s in skills],
        "mode":"desk_research_only",
        "real_customer_evidence":"NOT_OBSERVED",
        "simulation":"hypothetical sensitivity only; run simulate.py only when economics or funnel assumptions are being challenged"
    }


def main():
    p=argparse.ArgumentParser()
    p.add_argument("command",choices=("audit","route"))
    p.add_argument("--round",type=int,default=None)
    a=p.parse_args()
    if a.command=="audit":
        problems=audit()
        if problems:
            print(json.dumps({"status":"FAILED","problems":problems},indent=2,ensure_ascii=False))
            return 2
        reg=load_registry()
        print(json.dumps({"status":"PASS","pinned_commit":reg["pinned_commit"],
                          "skills":len(reg["selected"]),"verified_files":len(reg["pinned_files"]),
                          "stage_routes":len(reg["stage_routes"])},indent=2))
        return 0
    if a.round is None:
        p.error("route requires --round")
    print(json.dumps(route(a.round),indent=2,ensure_ascii=False))
    return 0


if __name__=="__main__":
    raise SystemExit(main())
