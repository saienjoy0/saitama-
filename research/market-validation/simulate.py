#!/usr/bin/env python3
"""Hypothetical funnel economics; NOT a buyer-behavior forecast."""
import argparse
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PERCENT = ("application_rate","trial_start_rate","unprompted_second_use_rate",
           "paid_conversion_given_second_use_rate","renewal_probability","payment_percent_fee")
COST = ("cost_per_reached_household_jpy","price_jpy","payment_fixed_fee_jpy",
        "period_ai_cost_jpy","period_storage_cost_jpy","period_human_support_cost_jpy",
        "trial_setup_cost_jpy","fixed_project_cost_jpy")
REQUIRED = ("id","label","offer_type","reached_households","horizon_periods") + PERCENT + COST


def validate(doc):
    if not isinstance(doc,dict) or doc.get("schema") != "yattemi-simulation-v1":
        raise ValueError("wrong simulation schema")
    if doc.get("evidence_status") != "HYPOTHETICAL" or doc.get("observed_customers") != 0:
        raise ValueError("Simulated assumptions MUST NOT be presented as real customer data")
    scenarios = doc.get("scenarios")
    if not isinstance(scenarios,list) or not scenarios:
        raise ValueError("Need at least one scenario")
    seen=set()
    for s in scenarios:
        if not isinstance(s,dict) or any(k not in s for k in REQUIRED):
            raise ValueError("Incomplete scenario")
        if not isinstance(s["id"],str) or not s["id"] or s["id"] in seen:
            raise ValueError("Nonunique or empty scenario id")
        seen.add(s["id"])
        if not isinstance(s["label"],str) or not s["label"]:
            raise ValueError("Missing scenario label")
        if s["offer_type"] not in ("subscription","one_off"):
            raise ValueError("Unknown offer_type")
        if type(s["reached_households"]) is not int or not 0 <= s["reached_households"] <= 10000000:
            raise ValueError("Invalid reached_households")
        if type(s["horizon_periods"]) is not int or not 1 <= s["horizon_periods"] <= 52:
            raise ValueError("Invalid horizon_periods")
        for k in PERCENT:
            x=s[k]
            if type(x) not in (int,float) or not math.isfinite(x) or not 0 <= x <= 1:
                raise ValueError("Invalid rate: "+k)
        for k in COST:
            x=s[k]
            if type(x) not in (int,float) or not math.isfinite(x) or not 0 <= x <= 10000000:
                raise ValueError("Invalid JPY cost: "+k)
        if s["offer_type"]=="one_off" and (s["horizon_periods"]!=1 or s["renewal_probability"]!=0):
            raise ValueError("One-off cannot renew")


def evaluate(s,repeat_factor=1.0,purchase_factor=1.0):
    n=s["reached_households"]
    applications=n*s["application_rate"]
    trials=applications*s["trial_start_rate"]
    repeats=trials*min(1,s["unprompted_second_use_rate"]*repeat_factor)
    purchases=repeats*min(1,s["paid_conversion_given_second_use_rate"]*purchase_factor)
    periods=sum(s["renewal_probability"]**i for i in range(s["horizon_periods"]))
    per_period_cost=(s["payment_fixed_fee_jpy"]+s["price_jpy"]*s["payment_percent_fee"]+
                     s["period_ai_cost_jpy"]+s["period_storage_cost_jpy"]+
                     s["period_human_support_cost_jpy"])
    margin=s["price_jpy"]-per_period_cost
    marketing=n*s["cost_per_reached_household_jpy"]+trials*s["trial_setup_cost_jpy"]
    net=purchases*margin*periods-marketing-s["fixed_project_cost_jpy"]
    denom=repeats*margin*periods
    threshold=(marketing+s["fixed_project_cost_jpy"])/denom if denom>0 else None
    return {
        "id":s["id"],"offer_type":s["offer_type"],
        "expected_applications":round(applications,4),
        "expected_trials":round(trials,4),
        "expected_unprompted_second_uses":round(repeats,4),
        "expected_first_purchases":round(purchases,4),
        "expected_paid_periods_per_payer":round(periods,5),
        "per_period_variable_cost_jpy":round(per_period_cost,2),
        "per_period_contribution_jpy":round(margin,2),
        "acquisition_and_trial_cost_jpy":round(marketing,2),
        "cac_jpy":round(marketing/purchases,2) if purchases else None,
        "horizon_net_contribution_jpy":round(net,2),
        "breakeven_paid_rate_given_repeat":round(threshold,5) if threshold is not None else None,
        "breakeven_rate_feasible":threshold is not None and threshold<=1
    }


def run(doc):
    validate(doc)
    sensitivity=[]
    for s in doc["scenarios"]:
        for m2 in (0.5,1,1.5):
            for mp in (0.5,1,1.5):
                e=evaluate(s,m2,mp)
                sensitivity.append({"id":s["id"],"repeat_rate_multiplier":m2,
                    "purchase_rate_multiplier":mp,"net_contribution_jpy":e["horizon_net_contribution_jpy"]})
    return {
        "schema":"yattemi-simulation-result-v1",
        "source_type":"SYNTHETIC_SCENARIO",
        "observed_customer_count":0,
        "not_a_forecast":True,
        "disclaimer":"All rates are manually assumed. Not evidence of real purchases, retention, or demand. No personal data included.",
        "limitations":["Conditional funnel: purchases occur after an unprompted second use.",
                       "Discount rates, taxes, refunds, changing variable costs and real channel performance not modeled.",
                       "Comparisons across offers require independently checked price and cost assumptions."],
        "scenarios":[evaluate(s) for s in doc["scenarios"]],
        "sensitivity":sensitivity,
    }


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--input",default=str(ROOT/"simulation"/"assumptions.example.json"))
    p.add_argument("--output")
    args=p.parse_args()
    result=run(json.loads(Path(args.input).read_text(encoding="utf-8")))
    data=json.dumps(result,ensure_ascii=False,indent=2)+"\n"
    if args.output:
        dest=Path(args.output)
        dest.parent.mkdir(parents=True,exist_ok=True)
        dest.write_text(data,encoding="utf-8")
        print("Saved SYNTHETIC_SCENARIO: "+str(dest))
    else:
        print(data)


if __name__=="__main__":
    main()
