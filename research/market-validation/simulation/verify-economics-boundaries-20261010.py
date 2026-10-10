#!/usr/bin/env python3
"""Research arithmetic and legacy diagnostics only. No demand estimates or provider calls."""
import importlib.util
import json
import math
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("legacy_sim", ROOT / "simulate.py")
legacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(legacy)

# Same common hypothetical conditions as initial-customer-assumptions-20261010.json.
def boundary(price=1980, minutes=30, tech=100, cac=500, refund=.05,
             tax=.1, fee=.036, renewal=0, horizon=1, fixed=20000):
    retained = price * (1 - refund) / (1 + tax)
    variable = price * fee + tech + 25 * minutes
    cm = retained - variable
    periods = sum(renewal ** i for i in range(horizon))
    after = cm * periods - cac
    return dict(price_jpy=price, support_minutes=minutes, tech_jpy=tech,
                cac_jpy=cac, refund=refund, tax_reserve=tax, fee=fee,
                renewal_condition=renewal, horizon=horizon,
                retained_revenue_per_period_jpy=retained,
                variable_cost_per_period_jpy=variable, cm_per_period_jpy=cm,
                conditional_paid_periods=periods, after_cac_jpy=after,
                fixed_jpy=fixed, breakeven_payers=math.ceil(fixed / after) if after > 0 else None,
                support_limit_before_fixed_minutes=(retained-price*fee-tech-cac/periods)/25)

single = [boundary(minutes=m) for m in [10, 30, 60]]
subs = [boundary(price=980, minutes=m, fee=.043, renewal=r, horizon=4, tech=x)
        for m, r, x in [(10,0,100), (10,.5,100), (10,.8,100), (30,.5,100), (10,.5,300)]]
# Toy rates are algebraic sentinel inputs, not inferred household frequencies.
doc = json.loads((ROOT / "simulation/assumptions.example.json").read_text())
s = dict(doc["scenarios"][0])
s.update(id="diagnostic-one-off",label="SYNTHETIC algebra sentinel",offer_type="one_off",
         reached_households=10,horizon_periods=1,renewal_probability=0,
         application_rate=1,trial_start_rate=1,paid_conversion_given_second_use_rate=1,
         unprompted_second_use_rate=0)
zero = legacy.run({"schema":"yattemi-simulation-v1","evidence_status":"HYPOTHETICAL",
                   "observed_customers":0,"scenarios":[s]})["scenarios"][0]
s2 = dict(s,unprompted_second_use_rate=1)
one = legacy.run({"schema":"yattemi-simulation-v1","evidence_status":"HYPOTHETICAL",
                  "observed_customers":0,"scenarios":[s2]})["scenarios"][0]
unknown = dict(s,application_rate=None)
try:
    legacy.validate({"schema":"yattemi-simulation-v1","evidence_status":"HYPOTHETICAL",
                     "observed_customers":0,"scenarios":[unknown]})
    unknown_result = "UNEXPECTED_ACCEPTANCE"
except ValueError as e:
    unknown_result = str(e)
assert zero["expected_first_purchases"] == 0
assert one["expected_first_purchases"] == 10
assert single[1]["breakeven_payers"] == 70 and single[2]["breakeven_payers"] is None
assert subs[1]["breakeven_payers"] == 57 and subs[3]["breakeven_payers"] is None
out = {"date":"2026-10-10","source_type":"SYNTHETIC_CONDITIONAL_ARITHMETIC",
       "not_a_forecast":True,"observed_households":0,"observed_payments":0,
       "parameters_source":"simulation/initial-customer-assumptions-20261010.json",
       "parameter_status":"Manual stress conditions; no candidate-specific behavior rates",
       "legacy_source_sha256":hashlib.sha256((ROOT / "simulate.py").read_bytes()).hexdigest(),
       "single":single,"subscription":subs,
       "legacy_execution":{"status":"EXECUTED_CODE_TEST","input_zero_second_use":s,
                           "output_zero_second_use":zero,"output_second_use_one":one,
                           "unknown_input_rejected":unknown_result,
                           "interpretation":"v1 only supports post-second-use purchase. This diagnostic cannot model prepaid sales. No real purchases occurred."}}
(ROOT / "simulation/sim-economics-results-20261010.json").write_text(
    json.dumps(out,ensure_ascii=False,indent=2)+"\n")
print(json.dumps({"single":single,"subscription":subs,
                  "legacy_purchases_at_second_use_zero":zero["expected_first_purchases"],
                  "unknown_input_rejected":unknown_result},ensure_ascii=False))
