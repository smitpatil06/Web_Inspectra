import { useState, useCallback, useRef, useEffect } from "react";
import type { DOMNode } from "../types";

// ── Color map by tag category ───────────────────────────────────────────────
const TAG_COLOR: Record<string, string> = {
  // Structure
  html: "#a78bfa", head: "#a78bfa", body: "#a78bfa",
  header: "#818cf8", nav: "#818cf8", main: "#818cf8", footer: "#818cf8",
  section: "#818cf8", article: "#818cf8", aside: "#818cf8",
  // Containers
  div: "#38bdf8", span: "#7dd3fc", p: "#93c5fd",
  // Headings
  h1: "#f0abfc", h2: "#e879f9", h3: "#d946ef",
  h4: "#c084fc", h5: "#a855f7", h6: "#9333ea",
  // Interactive
  a: "#34d399", button: "#34d399", input: "#34d399",
  select: "#34d399", textarea: "#34d399", form: "#6ee7b7",
  label: "#6ee7b7",
  // Media
  img: "#fbbf24", video: "#f59e0b", svg: "#fde68a",
  canvas: "#fcd34d", picture: "#fbbf24", source: "#fbbf24",
  // Meta
  script: "#64748b", style: "#64748b", link: "#64748b", meta: "#475569",
  // Text
  ul: "#94a3b8", ol: "#94a3b8", li: "#cbd5e1", table: "#94a3b8",
  tr: "#94a3b8", td: "#cbd5e1", th: "#cbd5e1",
};
const getColor = (tag: string) => TAG_COLOR[tag.toLowerCase()] ?? "#94a3b8";

// ── Layout: convert tree → positioned nodes + edges ───────────────────────
interface LayoutNode {
  id: string;
  tag: string;
  id_attr?: string;
  classes?: string[];
  x: number;
  y: number;
  depth: number;
  childCount: number;
}
interface LayoutEdge { from: string; to: string; }

function layoutTree(
  node: DOMNode,
  maxNodes = 120,
  maxDepth = 5
): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  let idCounter = 0;
  // Track x-position per depth level
  const depthX: Record<number, number> = {};

  const LEVEL_GAP = 90; // vertical space between levels
  const NODE_GAP  = 56; // horizontal space between siblings

  function walk(n: DOMNode, depth: number, parentId: string | null) {
    if (nodes.length >= maxNodes || depth > maxDepth) return;
    const myId = `n${idCounter++}`;
    depthX[depth] = (depthX[depth] ?? 0);

    nodes.push({
      id: myId,
      tag: n.tag,
      id_attr: n.id,
      classes: n.classes,
      x: depthX[depth] * NODE_GAP,
      y: depth * LEVEL_GAP,
      depth,
      childCount: n.children.length,
    });
    depthX[depth]++;

    if (parentId !== null) edges.push({ from: parentId, to: myId });

    for (const child of n.children) {
      walk(child, depth + 1, myId);
    }
  }

  walk(node, 0, null);

  // Center each depth level
  const levelNodes: Record<number, LayoutNode[]> = {};
  for (const nd of nodes) {
    (levelNodes[nd.depth] = levelNodes[nd.depth] ?? []).push(nd);
  }
  const maxWidth = Math.max(...Object.values(levelNodes).map((a) => a.length)) * NODE_GAP;
  for (const [, arr] of Object.entries(levelNodes)) {
    const totalW = arr.length * NODE_GAP;
    const offset = (maxWidth - totalW) / 2;
    arr.forEach((nd, i) => { nd.x = offset + i * NODE_GAP; });
  }

  return { nodes, edges };
}

// ── Main component ─────────────────────────────────────────────────────────
interface Props { node: DOMNode; }

export default function DOMGraph({ node }: Props) {
  const [selected, setSelected] = useState<LayoutNode | null>(null);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false); // Bug #10: useState so cursor re-renders
  const isPanning = useRef(false);
  const panStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const { nodes, edges } = layoutTree(node, 120, 5);

  // Bug #4: Guard empty nodes array — Math.min/max on [] returns ±Infinity
  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-600 text-sm font-mono">
        No DOM nodes to display
      </div>
    );
  }

  // bounding box
  const minX = Math.min(...nodes.map((n) => n.x));
  const maxX = Math.max(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y));
  const W = maxX - minX + 120;
  const H = maxY - minY + 100;

  // position map
  const pos: Record<string, { x: number; y: number }> = {};
  for (const nd of nodes) pos[nd.id] = { x: nd.x, y: nd.y };

  // Pan handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest(".dom-node")) return;
    isPanning.current = true;
    setPanning(true);
    panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    setPan({
      x: panStart.current.px + (e.clientX - panStart.current.mx),
      y: panStart.current.py + (e.clientY - panStart.current.my),
    });
  }, []);

  const onMouseUp = useCallback(() => { isPanning.current = false; setPanning(false); }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(2.5, z - e.deltaY * 0.001)));
  }, []);

  // Touch pan
  const touchStart = useRef({ tx: 0, ty: 0, px: 0, py: 0 });
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { tx: e.touches[0].clientX, ty: e.touches[0].clientY, px: pan.x, py: pan.y };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setPan({
      x: touchStart.current.px + (e.touches[0].clientX - touchStart.current.tx),
      y: touchStart.current.py + (e.touches[0].clientY - touchStart.current.ty),
    });
  };

  const RADIUS = 18;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Controls row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { tag: "Structure", color: "#a78bfa" },
            { tag: "Container", color: "#38bdf8" },
            { tag: "Heading",   color: "#f0abfc" },
            { tag: "Link/Form", color: "#34d399" },
            { tag: "Media",     color: "#fbbf24" },
            { tag: "Meta",      color: "#64748b" },
          ].map(({ tag, color }) => (
            <span key={tag} className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="w-7 h-7 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors flex items-center justify-center"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>+</button>
          <span className="text-[10px] font-mono text-slate-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}
            className="w-7 h-7 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors flex items-center justify-center"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>−</button>
          <button onClick={() => { setZoom(1); setPan({ x: 40, y: 30 }); }}
            className="px-2.5 h-7 rounded-lg text-[10px] font-mono text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>Reset</button>
        </div>
      </div>

      <div className="flex gap-4 flex-1">
        {/* SVG canvas */}
        <div
          className="flex-1 rounded-2xl overflow-hidden relative"
          style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(255,255,255,0.07)",
            cursor: panning ? "grabbing" : "grab",
            minHeight: 440,
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
        >
          {/* Dot grid background */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }} />

          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            style={{ overflow: "visible" }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L6,3 z" fill="rgba(99,102,241,0.4)" />
              </marker>
            </defs>
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {edges.map((edge, i) => {
                const f = pos[edge.from];
                const t = pos[edge.to];
                if (!f || !t) return null;
                // Bezier curve
                const midY = (f.y + t.y) / 2;
                const d = `M ${f.x} ${f.y + RADIUS} C ${f.x} ${midY}, ${t.x} ${midY}, ${t.x} ${t.y - RADIUS}`;
                return (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="rgba(99,102,241,0.25)"
                    strokeWidth="1.5"
                    strokeDasharray="200"
                    strokeDashoffset="0"
                    style={{ animation: `drawEdge 0.6s ease ${i * 0.01}s both` }}
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((nd) => {
                const color = getColor(nd.tag);
                const isSelected = selected?.id === nd.id;
                const label = nd.id_attr ? `#${nd.id_attr}` : nd.tag;
                return (
                  <g
                    key={nd.id}
                    className="dom-node"
                    transform={`translate(${nd.x}, ${nd.y})`}
                    onClick={(e) => { e.stopPropagation(); setSelected(isSelected ? null : nd); }}
                  >
                    {/* Selection ring */}
                    {isSelected && (
                      <circle r={RADIUS + 5} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
                    )}
                    {/* Node circle */}
                    <circle
                      r={RADIUS}
                      fill={`${color}18`}
                      stroke={isSelected ? color : `${color}60`}
                      strokeWidth={isSelected ? 2 : 1.5}
                      style={{
                        filter: isSelected ? `drop-shadow(0 0 8px ${color}60)` : "none",
                        transition: "all 0.2s",
                      }}
                    />
                    {/* Child count badge */}
                    {nd.childCount > 0 && (
                      <g transform={`translate(${RADIUS - 4}, ${-RADIUS + 4})`}>
                        <circle r="8" fill="#1e1e35" stroke={`${color}50`} strokeWidth="1" />
                        <text textAnchor="middle" dominantBaseline="middle" fill={color}
                          style={{ fontSize: "8px", fontFamily: "JetBrains Mono, monospace", fontWeight: 600 }}>
                          {nd.childCount > 9 ? "9+" : nd.childCount}
                        </text>
                      </g>
                    )}
                    {/* Tag name */}
                    <text
                      className="dom-node-label"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      y={1}
                      fill={color}
                      style={{ fontWeight: 600 }}
                    >
                      {nd.tag.length > 5 ? nd.tag.substring(0, 4) + "…" : nd.tag}
                    </text>
                    {/* Attribute label below */}
                    {(nd.id_attr || (nd.classes && nd.classes.length > 0)) && (
                      <text
                        className="dom-node-label"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        y={RADIUS + 12}
                        fill="rgba(148,163,184,0.6)"
                      >
                        {nd.id_attr ? `#${nd.id_attr.substring(0, 8)}` : `.${nd.classes![0].substring(0, 8)}`}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Node count badge */}
          <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-600">
            {nodes.length} nodes · {edges.length} edges · scroll to zoom · drag to pan
          </div>
        </div>

        {/* Selected node details panel */}
        {selected && (
          <div className="w-52 flex-shrink-0 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getColor(selected.tag) }} />
              <span className="font-mono text-sm font-bold" style={{ color: getColor(selected.tag) }}>
                &lt;{selected.tag}&gt;
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { k: "Depth", v: `Level ${selected.depth}` },
                { k: "Children", v: `${selected.childCount}` },
                ...(selected.id_attr ? [{ k: "ID", v: `#${selected.id_attr}` }] : []),
                ...(selected.classes?.length ? [{ k: "Classes", v: `.${selected.classes.slice(0, 3).join(" .")}` }] : []),
              ].map(({ k, v }) => (
                <div key={k}>
                  <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-0.5">{k}</p>
                  <p className="text-xs font-mono text-slate-300 truncate" title={v}>{v}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setSelected(null)}
              className="mt-auto text-[10px] font-mono text-slate-600 hover:text-slate-400 transition-colors self-start">
              ✕ deselect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
