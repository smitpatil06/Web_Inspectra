import type { NetworkRequest } from "../types";

interface Props { requests: NetworkRequest[] }

const TYPE_COLORS: Record<string, string> = {
  document:   "#818cf8",
  script:     "#fbbf24",
  stylesheet: "#34d399",
  image:      "#22d3ee",
  font:       "#c084fc",
  fetch:      "#fb7185",
  xhr:        "#f97316",
  other:      "#64748b",
};

const TYPE_LABELS: Record<string, string> = {
  document: "HTML", script: "JS", stylesheet: "CSS",
  image: "IMG", font: "Font", fetch: "Fetch", xhr: "XHR", other: "Other",
};

export default function WaterfallChart({ requests }: Props) {
  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-8 text-slate-600 text-sm">
        No network requests recorded
      </div>
    );
  }

  const visible = requests.slice(0, 50);
  // Bug #8: Math.max on empty array returns -Infinity; guard with || 1 so bar widths are valid
  const maxEnd = Math.max(...visible.map((r) => r.startTime + r.duration), 0) || 1;


  const formatMs = (ms: number) =>
    ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;

  const formatUrl = (url: string) => {
    try {
      const u = new URL(url);
      const path = u.pathname.split("/").pop() || u.hostname;
      return path.length > 32 ? path.substring(0, 32) + "…" : path || u.hostname;
    } catch { return url.substring(0, 35); }
  };

  return (
    <div className="overflow-x-auto">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-slate-500 font-mono uppercase">{TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {visible.map((req, i) => {
          const color = TYPE_COLORS[req.resourceType] || TYPE_COLORS.other;
          const leftPct = (req.startTime / maxEnd) * 100;
          const widthPct = Math.max((req.duration / maxEnd) * 100, 0.4);

          return (
            <div key={i} className="group flex items-center gap-3 hover:bg-white/[0.02] rounded-lg px-2 py-1 transition-colors" title={req.url}>
              {/* URL label */}
              <div className="flex items-center gap-2 w-52 flex-shrink-0">
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}30` }}
                >
                  {TYPE_LABELS[req.resourceType] || "?"}
                </span>
                <span className={`text-[10px] font-mono truncate ${req.failed ? "text-rose-400 line-through opacity-60" : "text-slate-400"}`}>
                  {formatUrl(req.url)}
                </span>
              </div>

              {/* Bar track */}
              <div className="flex-1 relative h-4 bg-white/[0.02] rounded">
                <div
                  className="absolute top-1 h-2 rounded-sm transition-all"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    backgroundColor: req.failed ? "#f87171" : color,
                    boxShadow: req.failed ? "none" : `0 0 6px ${color}60`,
                    opacity: req.failed ? 0.4 : 1,
                  }}
                />
              </div>

              {/* Duration */}
              <span className={`text-[10px] font-mono w-16 text-right flex-shrink-0 ${
                req.duration > 2000 ? "text-rose-400" :
                req.duration > 1000 ? "text-amber-400" :
                "text-slate-500"
              }`}>
                {formatMs(req.duration)}
              </span>

              {/* Status */}
              <span className={`text-[10px] font-mono w-8 text-right flex-shrink-0 ${
                req.failed || req.status >= 400 ? "text-rose-400" :
                req.status >= 300 ? "text-amber-400" :
                "text-slate-600"
              }`}>
                {req.failed ? "✗" : req.status || "–"}
              </span>
            </div>
          );
        })}
      </div>

      {requests.length > 50 && (
        <p className="text-center text-[10px] text-slate-600 mt-3">
          Showing 50 of {requests.length} requests
        </p>
      )}
    </div>
  );
}
