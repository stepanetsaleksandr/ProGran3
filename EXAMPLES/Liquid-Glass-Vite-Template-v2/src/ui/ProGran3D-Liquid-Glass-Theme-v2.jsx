import React, { useState, useEffect, useContext, createContext } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * ProGran3D — Liquid Glass UI THEME v2 (Web)
 * Component library + demo. TailwindCSS + Framer Motion.
 *
 * Exported components:
 * PgTheme, PgCard, PgButton, PgInput, PgTextarea, PgSelect, PgCheckbox, PgRadio, PgToggle,
 * PgSlider, PgTabs, PgAccordion, PgModal, PgToast, PgBadge, PgAlert,
 * PgNavbar, PgSidebar, PgTable, PgBreadcrumbs, PgPagination, PgStepper,
 * PgProgress, PgSkeleton, PgAvatar, PgChip, PgTooltip, PgPopover, PgDropdown, PgDrawer, PgDivider
 */

// ========== helpers & theme ==========
const cx = (...a) => a.filter(Boolean).join(" ");

const AccentClasses = {
  sky: {
    grad: "from-slate-300/30 via-sky-300/20 to-slate-50/10 dark:from-slate-200/10 dark:via-sky-400/10 dark:to-slate-50/5",
    ring: "focus:ring-sky-400/50",
    tone: "text-sky-300 dark:text-sky-300",
    fill: "bg-sky-400/50",
  },
  indigo: {
    grad: "from-slate-300/30 via-indigo-300/20 to-slate-50/10 dark:from-slate-200/10 dark:via-indigo-400/10 dark:to-slate-50/5",
    ring: "focus:ring-indigo-400/50",
    tone: "text-indigo-300 dark:text-indigo-300",
    fill: "bg-indigo-400/50",
  },
  emerald: {
    grad: "from-slate-300/30 via-emerald-300/20 to-slate-50/10 dark:from-slate-200/10 dark:via-emerald-400/10 dark:to-slate-50/5",
    ring: "focus:ring-emerald-400/50",
    tone: "text-emerald-300 dark:text-emerald-300",
    fill: "bg-emerald-400/50",
  },
  violet: {
    grad: "from-slate-300/30 via-violet-300/20 to-slate-50/10 dark:from-slate-200/10 dark:via-violet-400/10 dark:to-slate-50/5",
    ring: "focus:ring-violet-400/50",
    tone: "text-violet-300 dark:text-violet-300",
    fill: "bg-violet-400/50",
  },
  graphite: {
    grad: "from-white/15 via-white/8 to-white/5 dark:from-white/8 dark:via-white/6 dark:to-white/4",
    ring: "focus:ring-white/40",
    tone: "text-slate-200",
    fill: "bg-white/30",
  },
  rose: {
    grad: "from-slate-300/30 via-rose-300/20 to-slate-50/10 dark:from-slate-200/10 dark:via-rose-400/10 dark:to-slate-50/5",
    ring: "focus:ring-rose-400/50",
    tone: "text-rose-300 dark:text-rose-300",
    fill: "bg-rose-400/50",
  },
  amber: {
    grad: "from-slate-300/30 via-amber-300/25 to-slate-50/10 dark:from-slate-200/10 dark:via-amber-400/10 dark:to-slate-50/5",
    ring: "focus:ring-amber-400/50",
    tone: "text-amber-300 dark:text-amber-300",
    fill: "bg-amber-400/50",
  },
  teal: {
    grad: "from-slate-300/30 via-teal-300/20 to-slate-50/10 dark:from-slate-200/10 dark:via-teal-400/10 dark:to-slate-50/5",
    ring: "focus:ring-teal-400/50",
    tone: "text-teal-300 dark:text-teal-300",
    fill: "bg-teal-400/50",
  },
};

const ThemeContext = createContext({
  mode: "light",
  accent: "sky",
  reduced: false,
});

export function PgTheme({ mode = "light", accent = "sky", reduced = false, children }) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);
  return (
    <ThemeContext.Provider value={{ mode, accent, reduced }}>
      {children}
    </ThemeContext.Provider>
  );
}

const usePgTheme = () => useContext(ThemeContext);

// shared tokens
const tokens = {
  r: { lg: "rounded-2xl", full: "rounded-full" },
  border: "border border-white/15 dark:border-white/10",
  ringBase: "ring-1 ring-black/5 dark:ring-white/5",
  shadow: "shadow-[0_10px_40px_-10px_rgba(0,0,0,.28)]",
  text: "text-slate-900 dark:text-slate-100",
  textDim: "text-slate-600 dark:text-slate-300",
};

const glass = (reduced) => cx(tokens.r.lg, tokens.border, tokens.ringBase, tokens.shadow, reduced?"bg-white/8":"backdrop-blur-xl", "outline outline-1 outline-white/5");
const gfill = (reduced, accent) => cx(reduced? "bg-white/6" : "bg-gradient-to-br "+AccentClasses[accent].grad, "dark:[background:linear-gradient(135deg,rgba(255,255,255,.06),rgba(2,6,23,.3))]");

// ========== primitives ==========
export function PgCard({ children, className = "", reduced }) {
  const { reduced: r, accent } = usePgTheme();
  const useReduced = reduced ?? r;
  return <div className={cx(glass(useReduced), gfill(useReduced, accent), "p-5", className)}>{children}</div>;
}

export function PgDivider({ className = "" }) {
  return <div className={cx("h-px w-full bg-white/20", className)} />;
}

export function PgButton({ children, onClick, variant = "primary", size = "md", disabled=false, loading=false, className = "", reduced }) {
  const { reduced: r, accent } = usePgTheme();
  const useReduced = reduced ?? r;
  const sizes = { sm: "px-3 py-2 text-sm", md: "px-4 py-2", lg: "px-5 py-3 text-base" };
  const base = cx(
    glass(useReduced),
    tokens.r.full,
    tokens.border,
    sizes[size],
    "inline-flex items-center gap-2 select-none font-medium",
    disabled && "opacity-60 pointer-events-none",
  );
  const looks = {
    primary: cx(gfill(useReduced, accent), AccentClasses[accent].ring),
    ghost: "bg-white/5",
    outline: "bg-transparent border-white/30 hover:border-white/60",
    soft: "bg-white/10",
    danger: "bg-rose-500/20 hover:bg-rose-500/30",
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} className={cx(base, looks[variant], "hover:brightness-110 active:brightness-95", className)}>
      {loading && <span className="h-4 w-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />}
      {children}
    </button>
  );
}

export function PgInput({ label, value, onChange, placeholder = "", suffix, state="default", hint, type="text" }) {
  const { accent } = usePgTheme();
  const stateRing = state === "error" ? "focus:ring-rose-500/50" : state === "success" ? "focus:ring-emerald-500/50" : AccentClasses[accent].ring;
  return (
    <label className="flex flex-col gap-2 w-full">
      {label && <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>}
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e)=>onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cx(glass(true), "w-full h-12 px-4 bg-white/10 text-slate-900 dark:text-slate-50 placeholder-white/50 focus:outline-none focus:ring-2", stateRing, tokens.r.lg)}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-70">{suffix}</span>}
      </div>
      {hint && <span className={cx("text-xs", state==='error'?"text-rose-400":"text-white/70")}>{hint}</span>}
    </label>
  );
}

export function PgTextarea({ label, value, onChange, placeholder = "", rows = 3 }) {
  const { accent } = usePgTheme();
  return (
    <label className="flex flex-col gap-2 w-full">
      {label && <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>}
      <textarea value={value} onChange={(e)=>onChange?.(e.target.value)} placeholder={placeholder} rows={rows}
        className={cx(glass(true), "w-full px-4 py-3 bg-white/10 text-slate-900 dark:text-slate-50 placeholder-white/50 focus:outline-none focus:ring-2", AccentClasses[accent].ring, tokens.r.lg)} />
    </label>
  );
}

export function PgSelect({ label, value, onChange, options = [], state="default" }) {
  const { accent } = usePgTheme();
  const stateRing = state === "error" ? "focus:ring-rose-500/50" : state === "success" ? "focus:ring-emerald-500/50" : AccentClasses[accent].ring;
  return (
    <label className="flex flex-col gap-2 w-full">
      {label && <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>}
      <select value={value} onChange={(e)=>onChange?.(e.target.value)} className={cx(glass(true), "h-12 px-4 bg-white/10 focus:outline-none focus:ring-2", stateRing, tokens.r.lg)}>
        {options.map((o)=> <option key={o.value ?? o} value={o.value ?? o} className="bg-slate-900 text-white">{o.label ?? o}</option>)}
      </select>
    </label>
  );
}

export const PgCheckbox = ({ checked, onChange, label }) => (
  <label className="inline-flex items-center gap-2">
    <input type="checkbox" checked={checked} onChange={(e)=>onChange?.(e.target.checked)} className="accent-sky-400" />
    {label && <span className="text-sm opacity-80">{label}</span>}
  </label>
);

export const PgRadio = ({ name, value, checked, onChange, label }) => (
  <label className="inline-flex items-center gap-2">
    <input type="radio" name={name} value={value} checked={checked} onChange={()=>onChange?.(value)} className="accent-sky-400" />
    {label && <span className="text-sm opacity-80">{label}</span>}
  </label>
);

export function PgToggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={()=>onChange?.(!checked)} className={cx(glass(false), "w-14 h-8 relative", tokens.border, tokens.r.full, checked?"bg-sky-400/40":"bg-white/10")}>{/* track */}
        <span className={cx("absolute top-1 left-1 h-6 w-6", tokens.r.full, "bg-white/80 dark:bg-white/70 transition-transform", checked?"translate-x-6":"translate-x-0")} />
      </button>
      {!!label && <span className="text-sm opacity-80">{label}</span>}
    </div>
  );
}

export function PgSlider({ value, onChange }) {
  const { accent } = usePgTheme();
  return (
    <div className="w-full">
      <input type="range" min={0} max={100} value={value} onChange={(e)=>onChange?.(Number(e.target.value))}
        className={cx("w-full h-2 appearance-none bg-white/10", tokens.r.full)}
        style={{ backgroundImage: `linear-gradient(90deg, var(--pg-accent, rgba(56,189,248,.5)) ${value}%, rgba(255,255,255,.1) ${value}%)` }} />
      <style>{`:root{--pg-accent:${accent==='sky'?'rgba(56,189,248,.5)':accent==='indigo'?'rgba(129,140,248,.5)':accent==='emerald'?'rgba(16,185,129,.5)':accent==='violet'?'rgba(167,139,250,.5)':accent==='rose'?'rgba(244,63,94,.5)':accent==='amber'?'rgba(245,158,11,.5)':accent==='teal'?'rgba(20,184,166,.5)':'rgba(255,255,255,.4)'};}`}</style>
    </div>
  );
}

export function PgTabs({ tabs, current, onChange }) {
  const { reduced, accent } = usePgTheme();
  return (
    <div className={cx(glass(reduced), gfill(reduced, accent), "p-1 flex gap-1", tokens.r.full)}>
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange?.(t)} className={cx("px-4 py-2 text-sm", tokens.r.full, current===t?"bg-white/60 text-slate-900":"text-white/80 hover:text-white")}>{t}</button>
      ))}
    </div>
  );
}

export function PgAccordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/5">
          <button className="w-full text-left px-4 py-3" onClick={() => setOpen(open === i ? -1 : i)}>
            {it.title}
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="px-4 pb-4 text-sm opacity-80 overflow-hidden">{it.content}</motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export function PgModal({ open, onClose, title, children }) {
  const { reduced, accent } = usePgTheme();
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className={cx(glass(reduced), gfill(reduced, accent), "relative w-full max-w-lg p-6")}> 
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PgDrawer({ open, onClose, side = 'right', children, title }) {
  const { reduced, accent } = usePgTheme();
  const axis = side === 'left' ? -1 : 1;
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ x: 40 * axis }} animate={{ x: 0 }} exit={{ x: 20 * axis }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cx(glass(reduced), gfill(reduced, accent), "absolute top-0 bottom-0 w-[360px] p-6", side==='right'?'right-0':'left-0')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button onClick={onClose}>✕</button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PgToast({ message, open, onClose }) {
  const { reduced, accent } = usePgTheme();
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className={cx(glass(reduced), gfill(reduced, accent), "fixed bottom-6 right-6 p-4 z-50")}> 
          <div className="flex items-center gap-3">
            <span>✨</span>
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">Close</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const PgBadge = ({ children }) => (<span className="px-2 py-1 text-xs rounded-full bg-white/10 border border-white/15">{children}</span>);

export function PgAlert({ title, children, variant = 'info' }) {
  const looks = {
    info: "border-sky-300/40 bg-sky-400/10",
    success: "border-emerald-300/40 bg-emerald-400/10",
    warning: "border-amber-300/40 bg-amber-400/10",
    error: "border-rose-300/40 bg-rose-400/10",
  };
  return (
    <div className={cx("rounded-xl border p-4", looks[variant])}>
      {title && <div className="font-medium mb-1">{title}</div>}
      <div className="text-sm opacity-90">{children}</div>
    </div>
  );
}

export const PgNavbar = ({ left, right }) => {
  const { reduced, accent } = usePgTheme();
  return (
    <div className={cx(glass(reduced), gfill(reduced, accent), "flex items-center justify-between p-3 md:p-4 sticky top-4 z-50")}>{left}{right}</div>
  );
};

export const PgSidebar = ({ items = [] }) => (
  <div className="sticky top-24 space-y-2">
    {items.map((i) => (<div key={i} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">{i}</div>))}
  </div>
);

export function PgTable({ rows = [], headers = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-white/10">
          <tr>{headers.map((h) => (<th key={h} className="px-3 py-2 text-left">{h}</th>))}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-white/5">{r.map((c, j) => (<td key={j} className="px-3 py-2">{c}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const PgBreadcrumbs = ({ items = [] }) => (
  <div className="text-sm opacity-80">{items.map((it,i)=> (<span key={i}>{i>0 && " / "}{i<items.length-1? <span className="opacity-80">{it}</span> : <span className="opacity-100">{it}</span>}</span>))}</div>
);

export function PgPagination({ page=1, pages=3, onChange }) {
  const nums = Array.from({length: pages}, (_,i)=> i+1);
  return (
    <div className="flex items-center gap-2">
      <PgButton variant="outline" onClick={()=>onChange?.(Math.max(1,page-1))}>Prev</PgButton>
      {nums.map(n => <PgButton key={n} variant={n===page?"primary":"ghost"} className="px-3 py-1" onClick={()=>onChange?.(n)}>{n}</PgButton>)}
      <PgButton variant="outline" onClick={()=>onChange?.(Math.min(pages,page+1))}>Next</PgButton>
    </div>
  );
}

export function PgStepper({ steps=[], current=0 }) {
  return (
    <div className="flex items-center gap-3">
      {steps.map((s,i)=> (
        <div key={s} className="flex items-center gap-3">
          <div className={cx("h-8 w-8 rounded-full grid place-items-center border", i<=current?"bg-white/20 border-white/50":"bg-white/5 border-white/20")}>{i+1}</div>
          <span className="text-sm opacity-90">{s}</span>
          {i<steps.length-1 && <div className="w-8 h-px bg-white/30" />}
        </div>
      ))}
    </div>
  );
}

export function PgProgress({ value = 50 }) {
  const { accent } = usePgTheme();
  return (
    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
      <div className={cx("h-full transition-all", AccentClasses[accent].fill)} style={{ width: `${value}%` }} />
    </div>
  );
}

export function PgSkeleton({ className = "h-8 w-full" }) {
  return <div className={cx("animate-pulse bg-white/10 rounded-lg", className)} />;
}

export function PgAvatar({ src, name = "?", size = 40 }) {
  const initials = name?.split(" ").map(w => w[0]).slice(0,2).join("") || "?";
  const style = { width: size, height: size };
  return (
    <div className="relative">
      {src ? (
        <img src={src} alt={name} style={style} className="rounded-full object-cover border border-white/20" />
      ) : (
        <div style={style} className="rounded-full grid place-items-center bg-white/20 border border-white/30 text-sm font-medium">{initials}</div>
      )}
    </div>
  );
}

export function PgChip({ children, onClose, variant = 'default' }) {
  const looks = {
    default: "bg-white/10 border-white/15",
    soft: "bg-white/20 border-white/15",
  };
  return (
    <span className={cx("inline-flex items-center gap-2 px-3 py-1 rounded-full border", looks[variant])}>
      {children}
      {onClose && <button onClick={onClose} className="opacity-70 hover:opacity-100">✕</button>}
    </span>
  );
}

export function PgTooltip({ children, content, side = 'top' }) {
  const pos = side === 'top' ? "bottom-full left-1/2 -translate-x-1/2 mb-2" : side === 'bottom' ? "top-full left-1/2 -translate-x-1/2 mt-2" : side === 'left' ? "right-full top-1/2 -translate-y-1/2 mr-2" : "left-full top-1/2 -translate-y-1/2 ml-2";
  return (
    <span className="relative inline-block group">
      {children}
      <span className={cx("pointer-events-none absolute opacity-0 group-hover:opacity-100 transition text-xs px-2 py-1 rounded-md bg-black/70 text-white", pos)}>{content}</span>
    </span>
  );
}

export function PgPopover({ trigger, children, align = 'start' }) {
  const { reduced, accent } = usePgTheme();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <span onClick={()=>setOpen(!open)} className="cursor-pointer select-none">{trigger}</span>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0, y:6}} className={cx(glass(reduced), gfill(reduced, accent), "absolute mt-2 p-3 min-w-[200px] z-50", align==='end'?'right-0':'left-0')}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PgDropdown({ label = 'Menu', items = [] }) {
  const [open, setOpen] = useState(false);
  const { reduced, accent } = usePgTheme();
  return (
    <div className="relative inline-block">
      <PgButton variant="soft" onClick={()=>setOpen(!open)}>{label}</PgButton>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0, y:6}} className={cx(glass(reduced), gfill(reduced, accent), "absolute mt-2 p-2 min-w-[160px] z-50")}> 
            {items.map((it,i)=> (
              <button key={i} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10" onClick={()=>{ it.onSelect?.(); setOpen(false); }}>{it.label}</button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========== ProGran3D panel mock using the theme ==========
function ProGran3DPanel() {
  const [isCm, setIsCm] = useState(true);
  const [len, setLen] = useState("2000");
  const [wid, setWid] = useState("1000");
  const [hei, setHei] = useState("150");

  const [vThick, setVThick] = useState("50");
  const [vMode, setVMode] = useState("same");
  const [vWidth, setVWidth] = useState("300");

  const [lay, setLay] = useState("frame");
  const [edge, setEdge] = useState("30 мм");
  const [frameW, setFrameW] = useState("300");
  const [offset, setOffset] = useState("50");

  const [fOpen, setFOpen] = useState(true);
  const [vOpen, setVOpen] = useState(true);
  const [pOpen, setPOpen] = useState(true);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <PgCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">proGran3 Конструктор</div>
          <div className="flex items-center gap-3"><span className="text-sm opacity-80">Одиниці:</span><PgToggle checked={isCm} onChange={setIsCm} /><span className="text-sm opacity-80 w-8">{isCm?"см":"in"}</span></div>
        </div>
      </PgCard>

      <PgCard>
        <Section title="Фундамент" meta={`${len}×${wid}×${hei} мм`} open={fOpen} onToggle={()=>setFOpen(!fOpen)}>
          <div className="grid grid-cols-3 gap-3">
            <PgInput label="Довжина (мм)" value={len} onChange={setLen} />
            <PgInput label="Ширина (мм)" value={wid} onChange={setWid} />
            <PgInput label="Висота (мм)" value={hei} onChange={setHei} />
          </div>
          <PgButton className="w-full mt-4">Створити фундамент</PgButton>
        </Section>
      </PgCard>

      <PgCard>
        <Section title="Відмостка" meta={`Ширина: ${vWidth} мм, Товщина: ${vThick} мм`} open={vOpen} onToggle={()=>setVOpen(!vOpen)}>
          <PgInput label="Товщина (мм)" value={vThick} onChange={setVThick} />
          <div className="mt-3" />
          <PgSelect label="Режим ширини" value={vMode} onChange={setVMode} options={[{value:"same",label:"Однакова ширина"},{value:"custom",label:"Кожна сторона окремо"}]} />
          <div className="mt-3" />
          <PgInput label="Ширина (мм)" value={vWidth} onChange={setVWidth} />
          <PgButton className="w-full mt-4">Створити відмостку</PgButton>
        </Section>
      </PgCard>

      <PgCard>
        <Section title="Плитка на фундаменті" meta={lay==="frame"?"Рамка з 4 частин":"Модульне замощення"} open={pOpen} onToggle={()=>setPOpen(!pOpen)}>
          <div className="space-y-2">
            <div className="text-sm opacity-80">Спосіб укладання:</div>
            <div className="flex gap-3 flex-wrap">
              <PgButton variant={lay==="frame"?"primary":"outline"} onClick={()=>setLay("frame")}>Рамка з 4 частин</PgButton>
              <PgButton variant={lay==="module"?"primary":"outline"} onClick={()=>setLay("module")}>Модульне замощення</PgButton>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-2">
            {(["20 мм","30 мм","40 мм","50 мм"]).map((e)=> (
              <PgButton key={e} variant={edge===e?"primary":"outline"} onClick={()=>setEdge(e)} className="px-4 py-2">{e}</PgButton>
            ))}
          </div>
          <PgInput label="Ширина рамки (мм)" value={frameW} onChange={setFrameW} />
          <PgInput label="Виступ (мм)" value={offset} onChange={setOffset} />
        </Section>
      </PgCard>

      <div className="flex items-center justify-between gap-3 pt-2">
        <PgButton variant="outline">Скасувати</PgButton>
        <PgButton>Застосувати зміни</PgButton>
      </div>
    </div>
  );
}

function Section({ title, meta, children, open, onToggle }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">{title}</span>
          {meta && <span className="text-sm opacity-70">{meta}</span>}
        </div>
        <button onClick={onToggle} className="text-sm opacity-80 hover:opacity-100">{open?"▾":"▸"}</button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="mt-4 space-y-4 overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========== Demo page ==========
export default function PgThemeDemo() {
  const [mode, setMode] = useState("light");
  const [accent, setAccent] = useState("sky");
  const [reduced, setReduced] = useState(false);
  const [toast, setToast] = useState(false);
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState(false);

  useEffect(()=>{ document.documentElement.classList.toggle("dark", mode === "dark"); },[mode]);

  return (
    <PgTheme mode={mode} accent={accent} reduced={reduced}>
      <div className={cx("min-h-screen p-4 md:p-10", mode==="dark"?"bg-[radial-gradient(50%_60%_at_50%_0%,#0b1220_0%,#020617_55%,#01030a_100%)] text-white":"bg-[radial-gradient(50%_60%_at_50%_0%,#f8fbff_0%,#e8eef8_55%,#e6e9f4_100%)] text-slate-900")}> 
        <div className="max-w-6xl mx-auto space-y-6">
          <PgNavbar
            left={<div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-white/70 dark:bg-white/60 grid place-items-center font-bold text-slate-800">LG</div><span className="font-semibold">ProGran3D Liquid Glass — Theme v2</span></div>}
            right={<div className="flex items-center gap-2">
              <PgSelect value={accent} onChange={setAccent} options={["sky","indigo","emerald","violet","graphite","rose","amber","teal"]} />
              <PgButton variant="ghost" onClick={()=>setMode(mode==="dark"?"light":"dark")}>{mode==="dark"?"Light":"Dark"}</PgButton>
              <PgButton variant={reduced?"primary":"outline"} onClick={()=>setReduced(!reduced)}>Reduce Effects</PgButton>
              <PgDropdown label="Швидкі дії" items={[{label:"Відкрити Drawer", onSelect:()=>setDrawer(true)},{label:"Toast", onSelect:()=>setToast(true)}]} />
            </div>}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <PgCard className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Компоненти</h2>
                <PgTabs tabs={["Buttons","Inputs","Display"]} current={"Buttons"} onChange={()=>{}} />
              </div>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2 items-center">
                  <PgButton>Primary</PgButton>
                  <PgButton variant="ghost">Ghost</PgButton>
                  <PgButton variant="outline">Outline</PgButton>
                  <PgButton variant="soft">Soft</PgButton>
                  <PgButton variant="danger">Danger</PgButton>
                  <PgTooltip content="Підказка"><PgButton>Tooltip</PgButton></PgTooltip>
                  <PgPopover trigger={<PgButton variant="soft">Popover</PgButton>}><div className="text-sm">Будь-який контент всередині.</div><PgDivider className="my-2"/><PgButton size="sm">Ок</PgButton></PgPopover>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <PgInput label="Поле вводу" placeholder="Type…" />
                  <PgSelect label="Вибір" options={["A","B","C"]} />
                  <PgTextarea label="Textarea" placeholder="Мульти-рядок…" />
                  <div className="flex items-center gap-4"><PgCheckbox checked onChange={()=>{}} label="Опція" /><PgRadio name="r" value="a" checked onChange={()=>{}} label="A" /><PgRadio name="r" value="b" onChange={()=>{}} label="B" /></div>
                  <div className="flex items-center gap-4"><PgToggle checked onChange={()=>{}} /><PgSlider value={65} onChange={()=>{}} /></div>
                </div>

                <PgAlert title="Порада" variant="info">Тримай контраст і відступи — Liquid Glass любить повітря.</PgAlert>
                <div className="flex items-center gap-2"><PgBadge>New</PgBadge><PgBadge>v2.0</PgBadge><PgChip onClose={()=>{}}>Chip</PgChip></div>

                <div className="grid grid-cols-3 gap-3 items-center">
                  <PgProgress value={35} />
                  <PgProgress value={60} />
                  <PgProgress value={90} />
                  <PgSkeleton className="h-6 w-24" />
                  <PgAvatar name="Pro Gran" />
                  <PgAvatar name="User" src="https://picsum.photos/seed/pg/80" />
                </div>

                <PgButton onClick={()=>setToast(true)}>Показати Toast</PgButton>
              </div>
            </PgCard>

            <PgCard>
              <h2 className="text-xl font-semibold mb-3">Таблиця</h2>
              <PgTable headers={["Name","Role","Status"]} rows={[["Alice","Designer","Active"],["Bob","Engineer","Away"],["Cara","PM","Active"]]} />
              <div className="mt-3 flex items-center justify-between"><PgBreadcrumbs items={["Home","UI Kit","Liquid Glass"]} /><PgPagination page={page} pages={3} onChange={setPage} /></div>
            </PgCard>
          </div>

          <PgCard>
            <h2 className="text-xl font-semibold mb-3">ProGran3D Панель (приклад)</h2>
            <ProGran3DPanel />
          </PgCard>

          <PgToast open={toast} onClose={()=>setToast(false)} message="Дія виконана" />
          <PgDrawer open={drawer} onClose={()=>setDrawer(false)} title="Бокова панель">
            <p className="text-sm opacity-90">Тут може бути додаткова конфігурація.</p>
          </PgDrawer>
        </div>
      </div>
    </PgTheme>
  );
}
