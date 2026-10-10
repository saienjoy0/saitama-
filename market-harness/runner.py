#!/usr/bin/env python3
"""Evidence-first, bounded market validation with the official DeepSeek Harness CLI."""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from uuid import uuid4

HERE = Path(__file__).resolve().parent
LOCAL = HERE / "runs" / ".local"

def load_config():
    cfg = json.loads((HERE / "config.json").read_text(encoding="utf-8"))
    assert len(cfg["icps"]) == len({x["id"] for x in cfg["icps"]}) == 4
    assert len(cfg["offers"]) == len({x["id"] for x in cfg["offers"]}) == 4
    assert cfg["recruitment"]["groups"] == {"R1": 4, "R2": 2, "R3": 2, "R4": 2}
    assert cfg["limits"]["max_agent_calls"] <= 16
    return cfg

def make_matrix(cfg):
    return [{"cell_id": f'{icp["id"]}-{offer["id"]}',
             "icp_id": icp["id"], "offer_id": offer["id"],
             "customer": icp["name"], "message": offer["headline"],
             "payer": offer["payer"], "status": "NOT_VALIDATED"}
            for icp in cfg["icps"] for offer in cfg["offers"]]

def audit_sources(repo_root, cfg):
    root = repo_root.resolve()
    ledger = []
    for item in cfg["sources"]:
        if "path" not in item:
            ledger.append({**item, "availability": "REFERENCE_ONLY_NOT_FETCHED"})
            continue
        source = (root / item["path"]).resolve()
        if not source.is_relative_to(root):
            raise ValueError("Unsafe source path: " + str(source))
        if source.is_file():
            data = source.read_bytes()
            ledger.append({**item, "availability": "LOCAL_FILE_PRESENT",
                           "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})
        else:
            ledger.append({**item, "availability": "MISSING_IN_CHECKOUT"})
    return ledger

def snippets(repo_root, ledger):
    parts = []
    for row in ledger:
        if row["availability"] == "LOCAL_FILE_PRESENT":
            contents = (repo_root / row["path"]).read_text(encoding="utf-8")[:2200]
            parts.append("### " + row["path"] + "\nSHA-256: " + row["sha256"] + "\n" + contents)
    return "\n\n".join(parts)

def prompt_for(icp, offer, evidence):
    return """あなたはやってみクエストの顧客調査・厳格な反証エージェント。
実在する顧客を演じない。AIペルソナの声・購入率・契約実績を捏造しない。
R/O/F/Bは面談後の判定軸。R1/R2/R3/R4の既存募集比率は固定。
親の対話拒否がある家庭への相談促進、子どもの相談内容の無断送信は不可。
次の情報は事業仮説であり、顧客から得た証言ではない。

顧客: {name}
具体的な候補: {who}
利用の契機: {trigger}
未解決課題の仮説: {pain}
代替: {alternatives}
反証: {counterexample}
訴求: {headline}
初回体験: {first_experience}
想定支払者: {payer}
価格は4週間980円の検証仮説であり、正式料金・売上実績ではない。

【作業】
(1) 公開一次資料を使い、属性だけでなく実際の購買・相談行動を検証。
(2) 競合が同じ層にどう売っているか・無料の代替で十分かを検証。
(3) 認知→試用→子の自発的2回目→親の負担→実支払→継続→離脱を具体的に検討。
(4) もっとも致命的な反証を挙げる。売れないという結論を許可する。
(5) 検証不能な点は、実家庭の観察や有料行動で何を測るか記載。
発見した公開情報にはURL・取得日・対象集団・確認範囲を明記。
アクセスしていないURLを検証済みにしない。
旧設計に回帰しない。製品は家庭の裁量合意→AI支援の実行→本人記録→
親の気づきレポート→任意の祖父母新聞／祖父母自身の近況。
売上推定・購入率・継続率を架空の数字で出さない。
モデルが返した結果は仮説であり、実地の証拠ではない。

【ローカルに存在する既存の公開調査メモ（全文の代替ではない）】
{evidence}

次の見出しを使い、日本語で簡潔に出す：
VERIFIED / HYPOTHESES / FAILURE_MODES / COMPETITOR_ALTERNATIVES /
PAYMENT_AND_RETENTION / REAL_WORLD_TEST / STOP_OR_CONTINUE
""".format(**icp, **offer, alternatives=", ".join(icp["alternatives"]), evidence=evidence)

def prepare(repo_root, out=None):
    cfg = load_config()
    repo_root = repo_root.resolve()
    run = out or LOCAL / (datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
                          + "-" + uuid4().hex[:6])
    run = run.resolve()
    if run.exists():
        raise FileExistsError("Run directory must be unique: " + str(run))
    (run / "prompts").mkdir(parents=True)
    rows = make_matrix(cfg)
    with (run / "matrix.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    ledger = audit_sources(repo_root, cfg)
    (run / "evidence-ledger.json").write_text(
        json.dumps(ledger, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    excerpt = snippets(repo_root, ledger)
    for icp in cfg["icps"]:
        for offer in cfg["offers"]:
            file = run / "prompts" / (icp["id"] + "-" + offer["id"] + ".md")
            file.write_text(prompt_for(icp, offer, excerpt), encoding="utf-8")
    state = {"created_at": datetime.now(timezone.utc).isoformat(),
             "phase": "PREPARED_NO_LIVE_MODEL",
             "matrix_cells": len(rows), "evaluated_cells": 0,
             "verified_interviews": 0, "verified_payments": 0,
             "missing_sources": sum(x["availability"] == "MISSING_IN_CHECKOUT" for x in ledger),
             "reference_only": sum(x["availability"] == "REFERENCE_ONLY_NOT_FETCHED" for x in ledger),
             "warning": "Model not called; prompts are not simulations or user evidence."}
    (run / "state.json").write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n",
                                    encoding="utf-8")
    return run, state

def execute(run, cfg, cell_count, rounds):
    limits = cfg["limits"]
    if not (1 <= cell_count <= limits["max_cells_per_execute"]):
        raise ValueError("max-cells outside configured limit")
    if not (1 <= rounds <= limits["max_rounds"]):
        raise ValueError("rounds outside configured limit")
    if cell_count * rounds > limits["max_agent_calls"]:
        raise ValueError("Too many model calls: capped at 16 per run")
    state_path = run / "state.json"
    state = json.loads(state_path.read_text(encoding="utf-8"))
    if shutil.which("dsh") is None:
        state["phase"] = "BLOCKED_DSH_CLI_UNAVAILABLE"
        state["warning"] = "Official dsh executable missing; configure outside repository."
        state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n",
                              encoding="utf-8")
        print("Official dsh CLI not found. No model calls made.", file=sys.stderr)
        return 2
    cells = list(csv.DictReader((run / "matrix.csv").open(encoding="utf-8")))
    records = []
    for row in cells[:cell_count]:
        previous = ""
        for step in range(1, rounds + 1):
            prompt = (run / "prompts" / (row["cell_id"] + ".md")).read_text(encoding="utf-8")
            if step > 1:
                prompt += ("\n第" + str(step) + "反復：前の応答を厳しく反証。"
                           "ただし追加された実証データではない。\n" + previous[:2500])
            with tempfile.TemporaryDirectory(prefix="yattemi-research-") as scratch:
                try:
                    result = subprocess.run(
                        ["dsh", "--profile", "headless", prompt], cwd=scratch,
                        capture_output=True, text=True,
                        timeout=limits["per_call_seconds"], check=False,
                        env={k: v for k, v in os.environ.items()
                             if k not in ("GITHUB_TOKEN", "GH_TOKEN")})
                    output = result.stdout[-18000:]
                    err = result.stderr[-2000:]
                    status = "UNVERIFIED_MODEL_OUTPUT" if result.returncode == 0 else "ERROR"
                except subprocess.TimeoutExpired:
                    output, err, status = "", "TIMEOUT", "ERROR"
            records.append({"cell": row["cell_id"], "round": step,
                            "status": status, "response": output, "error": err})
            previous = output
            if status == "ERROR":
                break
    with (run / "model-responses.jsonl").open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    state.update({"phase": "MODEL_SIMULATION_UNVERIFIED",
                  "evaluated_cells": len({x["cell"] for x in records}),
                  "model_calls": len(records),
                  "warning": "Synthetic hypotheses only; real payment and retention still untested."})
    state_path.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n",
                          encoding="utf-8")
    return 1 if any(x["status"] == "ERROR" for x in records) else 0

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["prepare", "execute"])
    parser.add_argument("--repo", type=Path, default=HERE.parent)
    parser.add_argument("--max-cells", type=int, default=4)
    parser.add_argument("--rounds", type=int, default=1)
    args = parser.parse_args()
    repo_root = args.repo.resolve()
    if not (repo_root / "AGENTS.md").is_file():
        parser.error("--repo must be the saitama- repository checkout")
    run, state = prepare(repo_root)
    print("Prepared", run, "| cells:", state["matrix_cells"],
          "| missing sources:", state["missing_sources"])
    if args.command == "execute":
        return execute(run, load_config(), args.max_cells, args.rounds)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
