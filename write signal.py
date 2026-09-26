"""Write signal.json for fourgatealpha.com from the frozen engine's weekly targets.

Usage:
    python "write signal.py" path/to/full_recon_1995_plus__ss_hv_weekly_targets.csv path/to/site/signal.json [sleeve]

The optional third argument is the sleeve number (1, 2 or 3) for this week's trade;
the engine's CSV doesn't record it, so pass it by hand or omit it.

Takes the last row of the weekly targets CSV and emits the JSON the site's
gate panel reads. Commit and push signal.json; Vercel redeploys automatically.
"""
import csv, json, sys

src, dst = sys.argv[1], sys.argv[2]
sleeve = int(sys.argv[3]) if len(sys.argv) > 3 else None
with open(src, newline="") as f:
    last = list(csv.DictReader(f))[-1]

tf = lambda v: str(v).strip().lower() == "true"
out = {
    "signal_date": last["signal_date"],
    "trade_date": last["trade_date"],
    "sleeve": sleeve,
    "risk_on": tf(last["spy_above_sma200"]),
    "gates": {
        "slow_momentum": tf(last["slow_favorable"]),
        "trend_quality": tf(last["trend_favorable"]),
        "volume_pressure": tf(last["volume_favorable"]),
        "qqq_trend": tf(last["qqq_above_sma200"]),
    },
    "equity_budget": float(last["equity_budget"]),
    "allocation": {k: round(float(last[k]), 4) for k in ["SPY", "QQQ", "SHY", "TLT", "UUP", "GLD", "CASH"]},
}
with open(dst, "w") as f:
    json.dump(out, f, indent=2)
print("wrote", dst, "for signal of", out["signal_date"])
