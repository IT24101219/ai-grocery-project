import { Brain } from "lucide-react";

function ScoreGauge({ score }) {
    const pct = Math.min(100, Math.max(0, (score / 10) * 100));
    const color =
        score >= 8 ? "#10b981" :
            score >= 6 ? "#3b82f6" :
                score >= 4 ? "#f59e0b" : "#cbd5e1";
    const r = 38;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="9" />
                <circle
                    cx="50" cy="50" r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="9"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: "stroke-dasharray 1s ease" }}
                />
                <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1e293b">
                    {score.toFixed(1)}
                </text>
            </svg>
            <div className="text-xs text-slate-500">/ 10.0 reliability score</div>
        </div>
    );
}

export default function AIPanel() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <Brain size={16} />
                </div>
                <div>
                    <div className="text-sm font-bold text-slate-900">AI Reliability Score</div>
                    <div className="text-xs text-slate-500">Machine learning prediction</div>
                </div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <ScoreGauge score={0} />
            </div>
        </div>
    );
}
