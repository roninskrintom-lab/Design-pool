import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Home as HomeIcon,
  LineChart,
  Briefcase,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Plus,
  Search,
  Bell,
  ChevronRight,
  Eye,
  EyeOff,
  Shield,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const TABS = [
  { id: "vault", label: "Vault", Icon: HomeIcon },
  { id: "markets", label: "Markets", Icon: LineChart },
  { id: "desk", label: "Desk", Icon: Briefcase },
  { id: "profile", label: "Profile", Icon: User },
] as const;

export default function MobileApp() {
  const [tab, setTab] = useState(0);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const screensRef = useRef<HTMLDivElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  // Sync active tab from scroll position (debounced via rAF for 60fps)
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = screensRef.current;
      if (!el) return;
      const w = el.clientWidth;
      if (w === 0) return;
      const idx = Math.round(el.scrollLeft / w);
      const clamped = Math.max(0, Math.min(TABS.length - 1, idx));
      setTab((prev) => (prev === clamped ? prev : clamped));
    });
  }, []);

  // Programmatic tab change → smooth scroll
  const goToTab = useCallback((i: number) => {
    const el = screensRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  // Re-align on resize/orientation change so partial scrolls don't desync
  useEffect(() => {
    const el = screensRef.current;
    if (!el) return;
    const onResize = () => {
      el.scrollTo({ left: tab * el.clientWidth, behavior: "auto" });
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [tab]);

  return (
    <div
      className="fixed inset-0 bg-background text-foreground overflow-hidden flex flex-col select-none"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Atmospheric back-glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(190 95% 50% / 0.18), transparent 60%), radial-gradient(ellipse 90% 55% at 50% 100%, hsl(215 90% 35% / 0.35), transparent 65%)",
        }}
      />

      {/* Status-bar safe area */}
      <div style={{ height: "env(safe-area-inset-top, 0px)" }} className="relative z-10" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 bg-primary rounded-sm rotate-45 opacity-30 blur-sm" />
            <Plus className="w-5 h-5 text-primary absolute inset-0 rotate-45" strokeWidth={2.5} />
          </div>
          <div className="text-base font-medium tracking-tight">
            <span className="text-primary">aura</span>
            <span className="text-foreground/90">studio</span>
          </div>
        </div>
        <button className="glass w-10 h-10 rounded-full flex items-center justify-center relative">
          <Bell className="w-4 h-4 text-foreground/80" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
        </button>
      </header>

      {/* Swipeable screens — native CSS scroll-snap (iOS-friendly, no JS drag) */}
      <div
        ref={screensRef}
        onScroll={handleScroll}
        className="relative z-10 flex-1 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
          scrollSnapStop: "always",
        }}
      >
        <Screen>
          <VaultScreen hidden={balanceHidden} onToggleHide={() => setBalanceHidden((h) => !h)} />
        </Screen>
        <Screen>
          <MarketsScreen />
        </Screen>
        <Screen>
          <DeskScreen />
        </Screen>
        <Screen>
          <ProfileScreen />
        </Screen>
      </div>

      {/* Bottom tab bar */}
      <nav
        className="relative z-20 glass-strong border-t border-white/8 px-2 pt-2 pb-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)" }}
      >
        <div className="flex items-center justify-around">
          {TABS.map((t, i) => {
            const active = i === tab;
            return (
              <button
                key={t.id}
                onClick={() => goToTab(i)}
                className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl relative transition-colors"
              >
                {active && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 bg-primary/12 rounded-xl border border-primary/25"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <t.Icon
                  className={`w-5 h-5 relative z-10 transition-colors ${
                    active ? "text-primary" : "text-foreground/55"
                  }`}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                <span
                  className={`text-[10px] uppercase tracking-[0.14em] relative z-10 transition-colors ${
                    active ? "text-primary" : "text-foreground/55"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* ============================================================
   Screen wrapper — each tab is a full-viewport snap-stop. Vertical scroll
   is isolated inside the screen so it never fights horizontal swipe.
   ============================================================ */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="h-full w-full flex-shrink-0 snap-start snap-always overflow-y-auto overflow-x-hidden px-5 pt-2 pb-6"
      style={{
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
   1) VAULT — portfolio dashboard
   ============================================================ */
function VaultScreen({ hidden, onToggleHide }: { hidden: boolean; onToggleHide: () => void }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-foreground/55 uppercase tracking-[0.18em]">Good evening</p>
        <h1 className="font-serif text-3xl mt-1">Vasily</h1>
      </div>

      {/* Balance card */}
      <div className="glass rounded-3xl p-5 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 80% 80% at 100% 0%, hsl(190 95% 50% / 0.2), transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.18em] text-foreground/55">
              Total balance
            </span>
            <button
              onClick={onToggleHide}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/5"
            >
              {hidden ? (
                <EyeOff className="w-3.5 h-3.5 text-foreground/55" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-foreground/55" />
              )}
            </button>
          </div>
          <div className="font-serif text-4xl mt-2 tracking-tight">
            {hidden ? "$ • • • • • •" : "$2,847,392.88"}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" />
              +$12,438.20
            </span>
            <span className="text-xs text-foreground/55">+0.44% today</span>
          </div>

          {/* Mini sparkline */}
          <svg viewBox="0 0 300 70" className="w-full h-16 mt-4" preserveAspectRatio="none">
            <defs>
              <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(190 95% 60%)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="hsl(190 95% 60%)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,55 L25,48 L50,52 L75,40 L100,42 L125,30 L150,35 L175,22 L200,28 L225,18 L250,24 L275,12 L300,15 L300,70 L0,70 Z"
              fill="url(#spark)"
            />
            <path
              d="M0,55 L25,48 L50,52 L75,40 L100,42 L125,30 L150,35 L175,22 L200,28 L225,18 L250,24 L275,12 L300,15"
              fill="none"
              stroke="hsl(190 95% 65%)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { Icon: ArrowDownLeft, label: "Receive" },
          { Icon: Send, label: "Send" },
          { Icon: ArrowUpRight, label: "Buy" },
          { Icon: Plus, label: "More" },
        ].map((a) => (
          <button
            key={a.label}
            className="glass rounded-2xl flex flex-col items-center gap-1.5 py-3.5 active:scale-95 transition-transform"
          >
            <a.Icon className="w-4 h-4 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.14em] text-foreground/75">
              {a.label}
            </span>
          </button>
        ))}
      </div>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm uppercase tracking-[0.18em] text-foreground/70">Recent</h3>
          <button className="text-xs text-primary">See all</button>
        </div>
        <div className="glass rounded-2xl divide-y divide-white/5">
          {[
            { name: "ETH purchase", sub: "via Concierge desk", amt: "+0.84 ETH", neg: false, time: "2h" },
            { name: "Wire to Beneficiary", sub: "Singapore Branch", amt: "−$14,200", neg: true, time: "Yesterday" },
            { name: "Yield distribution", sub: "Vault Tier II", amt: "+$1,823.40", neg: false, time: "May 9" },
            { name: "FX conversion", sub: "USD → CHF", amt: "−$8,500", neg: true, time: "May 7" },
          ].map((r) => (
            <div key={r.name} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                {r.neg ? (
                  <ArrowUpRight className="w-4 h-4 text-foreground/70" />
                ) : (
                  <ArrowDownLeft className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{r.name}</div>
                <div className="text-xs text-foreground/50 truncate">{r.sub}</div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-sm tabular-nums ${r.neg ? "text-foreground/85" : "text-emerald-400"}`}>
                  {r.amt}
                </div>
                <div className="text-[10px] text-foreground/45 uppercase tracking-wider">{r.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   2) MARKETS — instrument list with mock prices
   ============================================================ */
function MarketsScreen() {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Crypto", "Equities", "FX"];
  const instruments = [
    { sym: "BTC", name: "Bitcoin", cat: "Crypto", price: "67,418.20", change: 2.34 },
    { sym: "ETH", name: "Ethereum", cat: "Crypto", price: "3,562.88", change: 1.12 },
    { sym: "SOL", name: "Solana", cat: "Crypto", price: "168.43", change: -0.84 },
    { sym: "AAPL", name: "Apple Inc.", cat: "Equities", price: "212.40", change: 0.92 },
    { sym: "NVDA", name: "NVIDIA", cat: "Equities", price: "138.20", change: 3.18 },
    { sym: "TSLA", name: "Tesla", cat: "Equities", price: "248.55", change: -1.42 },
    { sym: "EUR/USD", name: "Euro · Dollar", cat: "FX", price: "1.0884", change: 0.18 },
    { sym: "USD/JPY", name: "Dollar · Yen", cat: "FX", price: "154.20", change: -0.34 },
    { sym: "XAU/USD", name: "Gold", cat: "FX", price: "2,418.80", change: 0.62 },
  ].filter((i) => filter === "All" || i.cat === filter);

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Markets</h1>

      {/* Search */}
      <div className="glass rounded-2xl flex items-center gap-3 px-4 py-3">
        <Search className="w-4 h-4 text-foreground/55" />
        <input
          placeholder="Search instruments…"
          className="bg-transparent flex-1 outline-none text-sm placeholder:text-foreground/40"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-hide">
        {filters.map((f) => {
          const active = f === filter;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.14em] whitespace-nowrap transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "glass text-foreground/70"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="glass rounded-2xl divide-y divide-white/5">
        {instruments.map((i) => (
          <button
            key={i.sym}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/3 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-foreground/8 border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-medium tabular-nums">
                {i.sym.length > 4 ? i.sym.slice(0, 3) : i.sym}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm">{i.sym}</div>
              <div className="text-xs text-foreground/50 truncate">{i.name}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm tabular-nums">{i.price}</div>
              <div
                className={`text-xs tabular-nums inline-flex items-center gap-0.5 ${
                  i.change >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {i.change >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {i.change >= 0 ? "+" : ""}
                {i.change.toFixed(2)}%
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   3) DESK — service tier cards (horizontal swipe inside the tab)
   ============================================================ */
function DeskScreen() {
  const tiers = [
    {
      name: "Concierge",
      tagline: "For the curious",
      price: "$0",
      cadence: "/ no minimum",
      color: "from-cyan-500/20 to-cyan-500/0",
      features: ["Self-directed access", "24/7 chat support", "Standard execution", "Basic reporting"],
    },
    {
      name: "Black",
      tagline: "For the active",
      price: "$2,500",
      cadence: "/ month",
      color: "from-violet-500/20 to-violet-500/0",
      features: ["Dedicated dealer", "Priority execution", "Bespoke FX rates", "Quarterly review"],
      featured: true,
    },
    {
      name: "Sovereign",
      tagline: "For the principal",
      price: "Bespoke",
      cadence: "by invitation",
      color: "from-amber-500/20 to-amber-500/0",
      features: ["Family office desk", "OTC liquidity", "White-glove onboarding", "On-call principal"],
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-3xl">The Desk</h1>
        <p className="text-sm text-foreground/55 mt-1">Pick a tier. Upgrade any time.</p>
      </div>

      <div className="space-y-4">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`relative glass rounded-3xl p-5 overflow-hidden ${
              t.featured ? "border-primary/40" : ""
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-60 pointer-events-none`} />
            {t.featured && (
              <div className="absolute top-4 right-4 text-[10px] uppercase tracking-[0.14em] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Most picked
              </div>
            )}
            <div className="relative">
              <div className="text-xs uppercase tracking-[0.18em] text-foreground/55">
                {t.tagline}
              </div>
              <div className="font-serif text-3xl mt-1">{t.name}</div>
              <div className="flex items-baseline gap-1.5 mt-3">
                <span className="font-serif text-3xl">{t.price}</span>
                <span className="text-xs text-foreground/55">{t.cadence}</span>
              </div>
              <ul className="mt-4 space-y-2">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Plus className="w-3 h-3 text-primary rotate-45 shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full mt-5 py-3 rounded-full text-xs uppercase tracking-[0.18em] font-medium transition-all ${
                  t.featured
                    ? "bg-primary text-primary-foreground hover:bg-white"
                    : "glass-strong text-foreground hover:bg-white/8"
                }`}
              >
                {t.featured ? "Begin onboarding" : `Choose ${t.name}`}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   4) PROFILE
   ============================================================ */
function ProfileScreen() {
  const items = [
    { Icon: Bell, label: "Notifications", hint: "On" },
    { Icon: Shield, label: "Security & Sign-in", hint: "Face ID" },
    { Icon: CreditCard, label: "Cards & Methods", hint: "3 active" },
    { Icon: FileText, label: "Statements", hint: "" },
    { Icon: HelpCircle, label: "Help & Concierge", hint: "" },
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-3xl">Profile</h1>

      <div className="glass rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 70% 80% at 100% 50%, hsl(190 95% 50% / 0.18), transparent 60%)",
          }}
        />
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border border-primary/30 flex items-center justify-center">
          <span className="font-serif text-2xl">V</span>
        </div>
        <div className="relative flex-1 min-w-0">
          <div className="font-serif text-xl truncate">Vasily K.</div>
          <div className="text-xs text-foreground/55">Member since 2024</div>
          <span className="inline-block mt-1.5 text-[10px] uppercase tracking-[0.14em] bg-primary/15 border border-primary/30 text-primary px-2 py-0.5 rounded-full">
            Black tier
          </span>
        </div>
      </div>

      <div className="glass rounded-2xl divide-y divide-white/5">
        {items.map((it) => (
          <button
            key={it.label}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/3 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-foreground/6 border border-white/8 flex items-center justify-center shrink-0">
              <it.Icon className="w-4 h-4 text-foreground/75" />
            </div>
            <div className="flex-1 min-w-0 text-left text-sm">{it.label}</div>
            {it.hint && <span className="text-xs text-foreground/45">{it.hint}</span>}
            <ChevronRight className="w-4 h-4 text-foreground/35 shrink-0" />
          </button>
        ))}
      </div>

      <button className="w-full glass rounded-2xl py-3.5 flex items-center justify-center gap-2 text-sm text-rose-400 active:bg-white/3 transition-colors">
        <LogOut className="w-4 h-4" />
        Sign out
      </button>

      <div className="text-center pt-2">
        <a href="/" className="text-xs text-foreground/45 underline-offset-4 hover:underline">
          ← Back to desktop site
        </a>
      </div>
    </div>
  );
}
