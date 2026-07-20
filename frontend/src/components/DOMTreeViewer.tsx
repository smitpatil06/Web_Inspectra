import { useState } from "react";
import type { DOMNode } from "../types";
import { ChevronRight, ChevronDown } from "lucide-react";

interface Props { node: DOMNode; depth?: number; defaultExpanded?: boolean; }

export default function DOMTreeViewer({ node, depth = 0, defaultExpanded = false }: Props) {
  const [open, setOpen] = useState(depth < 2 || defaultExpanded);
  const hasChildren = node.children && node.children.length > 0;

  const tagColor =
    ["html", "head", "body"].includes(node.tag) ? "text-violet-400" :
    ["div", "section", "article", "main", "header", "footer", "nav", "aside"].includes(node.tag) ? "text-cyan-400" :
    ["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.tag) ? "text-amber-400" :
    ["a", "button", "input", "select", "textarea", "form", "label"].includes(node.tag) ? "text-emerald-400" :
    ["img", "video", "audio", "svg", "canvas", "picture"].includes(node.tag) ? "text-rose-400" :
    ["script", "style", "link", "meta"].includes(node.tag) ? "text-slate-500" :
    ["p", "span", "strong", "em", "code", "pre"].includes(node.tag) ? "text-slate-300" :
    "text-slate-400";

  return (
    <div className="select-none">
      <div
        className={`flex items-start gap-1 py-0.5 px-1 rounded cursor-pointer group hover:bg-white/[0.03] transition-colors`}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {/* Expand icon */}
        <span className="mt-1 flex-shrink-0 w-3 h-3">
          {hasChildren ? (
            open
              ? <ChevronDown className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
              : <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
          ) : (
            <span className="block w-1.5 h-1.5 rounded-full bg-slate-800 mt-1 ml-0.5" />
          )}
        </span>

        {/* Tag name */}
        <span className={`font-mono text-[11px] font-semibold ${tagColor}`}>
          &lt;{node.tag}
        </span>

        {/* Attributes */}
        {node.id && (
          <span className="font-mono text-[11px] text-amber-500/80 ml-0.5">
            #{node.id}
          </span>
        )}
        {node.classes && node.classes.length > 0 && (
          <span className="font-mono text-[11px] text-violet-400/60 ml-0.5 truncate max-w-[180px]">
            .{node.classes.slice(0, 2).join(".")}
            {node.classes.length > 2 && <span className="text-slate-600">+{node.classes.length - 2}</span>}
          </span>
        )}

        {/* Text preview */}
        {node.textContent && !hasChildren && (
          <span className="font-mono text-[10px] text-slate-600 ml-1 italic truncate max-w-[120px]">
            "{node.textContent}"
          </span>
        )}

        {/* Close tag or self-close */}
        <span className={`font-mono text-[11px] ${tagColor}`}>
          {hasChildren ? ">" : " />"}
        </span>

        {/* Child count badge */}
        {hasChildren && !open && (
          <span className="ml-1 text-[9px] font-mono bg-white/5 text-slate-500 px-1.5 py-0.5 rounded border border-white/5">
            {node.children.length} child{node.children.length !== 1 ? "ren" : ""}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && open && (
        <div>
          {node.children.map((child, i) => (
            <DOMTreeViewer key={`${child.tag}-${depth + 1}-${i}`} node={child} depth={depth + 1} />

          ))}
          <div
            className="font-mono text-[11px] py-0.5 px-1"
            style={{ paddingLeft: `${depth * 14 + 4}px` }}
          >
            <span className={`${tagColor}`}>&lt;/{node.tag}&gt;</span>
          </div>
        </div>
      )}
    </div>
  );
}
