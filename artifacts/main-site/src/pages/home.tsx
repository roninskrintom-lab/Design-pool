import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowDown, Plus, Globe } from "lucide-react";
import { useRef } from "react";
import InteractiveGrid from "@/components/InteractiveGrid";
import SectionReveal from "@/components/SectionReveal";
import GlowingStar from "@/components/GlowingStar";
import ScrollProgress from "@/components/ScrollProgress";
import WarpStreaks from "@/components/WarpStreaks";
import HorizonGlow from "@/components/HorizonGlow";
import CursorGlow from "@/components/CursorGlow";
import SparkleField from "@/components/SparkleField";
import StarBeams from "@/components/StarBeams";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroFade = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.2]);

  return (
    <div ref={containerRef} className="bg-background text-foreground min-h-screen relative overflow-x-hidden">
      <CursorGlow />
      <ScrollProgress />

      {/* Top atmospheric glow */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 h-[60vh] z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, hsl(215 90% 35% / 0.4), transparent 70%)",
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 bg-primary rounded-sm rotate-45 opacity-30 blur-sm" />
            <Plus className="w-5 h-5 text-primary absolute inset-0 rotate-45" strokeWidth={2.5} />
          </div>
          <div className="font-sans text-lg font-medium tracking-tight">
            <span className="text-primary">aura</span>
            <span className="text-foreground/90">studio</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-10 text-xs font-medium uppercase tracking-[0.18em] glass px-6 py-3 rounded-full">
          <a href="#about" className="hover:text-primary transition-colors">About</a>
          <a href="#solutions" className="hover:text-primary transition-colors">Solutions</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-foreground/70 hover:text-primary transition-colors">
            <Globe className="w-4 h-4" /> English
          </button>
          <button className="glass px-4 py-2 rounded-full text-xs uppercase tracking-[0.18em] hover:bg-primary/10 hover:border-primary/40 transition-all">
            Log In
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs uppercase tracking-[0.18em] flex items-center gap-2 hover:bg-white transition-all glow-cyan">
            Onboard <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen w-full flex flex-col items-center overflow-hidden pt-32 md:pt-40">
        {/* Sparkles drifting in the background */}
        <div className="absolute inset-0 z-0">
          <SparkleField count={140} />
        </div>

        {/* Wide cinematic cyan back-light — softbox style, no discrete rays */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ opacity: heroFade }}
        >
          <StarBeams
            glowReach={1400}
            brightness={1}
            spread={1.4}
            yBias={250}
            lampRadius={420}
            lampIntensity={1}
          />
        </motion.div>

        {/* Dark silhouette star — backlit by the glow above */}
        <motion.div
          className="absolute inset-x-0 top-[50%] flex items-start justify-center z-[1]"
          style={{ opacity: heroFade, scale: heroScale }}
        >
          <GlowingStar size={500} />
        </motion.div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="glass inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs">
              <Plus className="w-3 h-3 text-primary rotate-45" />
              <span className="tracking-wider">Introducing Aura Studio</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-4xl text-glow-soft"
          >
            <span className="text-shimmer">Delivering deep liquidity</span>
            <br />
            <span className="text-foreground/40">across off-exchange markets</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-6 text-sm md:text-base text-foreground/55 max-w-md font-light leading-relaxed"
          >
            Empowering institutions with bespoke trading solutions
            and seamless market access.
          </motion.p>
        </div>

        <motion.div
          className="absolute bottom-8 right-8 z-20 flex items-center gap-2 opacity-70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <span className="text-[11px] tracking-[0.2em] uppercase">Scroll</span>
          <ArrowDown className="w-3 h-3 animate-bounce text-primary" />
        </motion.div>
      </section>

      {/* OVERVIEW SECTION */}
      <SectionReveal id="about" className="relative py-32 px-4 md:px-12 max-w-6xl mx-auto z-10">
        <div className="text-center">
          <div className="glass inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-10">
            <Plus className="w-3 h-3 text-primary rotate-45" />
            <span className="tracking-wider">Company Overview</span>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1 }}
            className="text-2xl md:text-4xl font-serif leading-snug max-w-4xl mx-auto"
          >
            <span className="text-foreground">Aura Studio reshapes institutional digital asset trading with bespoke OTC solutions,</span>{" "}
            <span className="text-foreground/40">cutting-edge technology, and a compliance-first ethos—delivering precision, security, and agility for global markets.</span>
          </motion.p>

          {/* Glowing star anchor below text */}
          <div className="relative mt-16 flex items-center justify-center min-h-[400px]">
            <GlowingStar size={420} />
          </div>
        </div>
      </SectionReveal>

      {/* WARP / TRANSITION SECTION */}
      <SectionReveal className="relative py-40 w-full overflow-hidden z-10">
        <div className="absolute inset-0">
          <WarpStreaks density={120} />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/50 to-background pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center px-4">
          <motion.h2
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="font-serif text-5xl md:text-7xl tracking-tight"
          >
            Speed beyond <em className="text-primary text-glow">measure.</em>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-6 text-lg text-foreground/60 max-w-2xl mx-auto"
          >
            Built on a high-performance backbone — every order, every execution, every signal moves at the speed of light.
          </motion.p>
        </div>
      </SectionReveal>

      {/* MOSAIC / SECURE SECTION */}
      <SectionReveal id="solutions" className="relative py-32 w-full overflow-hidden z-10">
        <div className="absolute inset-0">
          <InteractiveGrid cellSize={28} gap={4} baseAlpha={0.03} hotAlpha={1} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-20">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="font-serif text-5xl md:text-7xl tracking-tight"
            >
              Secure. <em className="text-primary text-glow">Compliant.</em>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-md text-foreground/60"
            >
              Move with confidence — your operations meet the highest regulatory standards by default.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Institutional Grade", desc: "Built for funds, prop desks, and treasuries demanding zero compromise." },
              { num: "02", title: "Regulated By Design", desc: "MSB-registered. FinCEN-compliant. Bank-level controls end-to-end." },
              { num: "03", title: "Always On", desc: "24/7 execution with redundant infrastructure across three continents." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="glass rounded-2xl p-8 hover:border-primary/40 transition-all group cursor-pointer"
              >
                <div className="text-xs font-mono text-primary mb-4">{item.num}</div>
                <h3 className="text-xl font-serif mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* WHO WE SERVE — Cards over mosaic */}
      <SectionReveal className="relative py-32 w-full overflow-hidden z-10">
        <div className="absolute inset-0">
          <InteractiveGrid cellSize={36} gap={5} baseAlpha={0.05} hotAlpha={0.95} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="font-serif text-5xl md:text-7xl tracking-tight text-center mb-20"
          >
            Who we <em className="text-primary text-glow">Serve.</em>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Institutions",
                desc: "We serve hedge funds, asset managers, and family offices needing institutional-grade execution and bespoke OTC solutions tailored to mandate.",
              },
              {
                num: "02",
                title: "High-Net-Worth Individuals",
                desc: "We cater to private clients with significant investable assets, providing them with personalized service for digital asset trading. Our OTC desk ensures optimal execution with privacy.",
              },
              {
                num: "03",
                title: "Brokers & Aggregators",
                desc: "Brokers rely on our OTC desk for competitive pricing, quick settlement, and access to deep liquidity pools — streamlining execution and meeting demand in volatile markets.",
              },
            ].map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.15 }}
                whileHover={{ y: -6 }}
                className="glass rounded-3xl p-8 cursor-pointer group transition-all hover:border-primary/50 hover:shadow-[0_0_40px_hsl(200_100%_62%/0.25)]"
              >
                <div className="text-2xl font-mono text-primary/70 mb-8">{c.num}</div>
                <h3 className="text-2xl font-serif mb-4 group-hover:text-primary transition-colors">
                  {c.title}
                </h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* OTC FEATURE STAR SECTION */}
      <SectionReveal className="relative py-40 w-full overflow-hidden z-10">
        <div className="relative max-w-7xl mx-auto px-4 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative h-[500px] flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 80, ease: "linear", repeat: Infinity }}
            >
              <GlowingStar size={480} />
            </motion.div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-primary mb-6 font-mono">
              / OTC Desk
            </div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="font-serif text-4xl md:text-6xl leading-[1.05] tracking-tight mb-8"
            >
              <em className="text-primary text-glow">Over-the-counter</em><br />
              execution at scale.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-foreground/60 text-lg leading-relaxed mb-10 max-w-md"
            >
              Block trades, structured products, and bespoke liquidity solutions.
              Our desk is staffed by professionals from leading exchanges and prime brokerages.
            </motion.p>
            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-xs uppercase tracking-[0.18em] inline-flex items-center gap-2 hover:bg-white transition-all glow-cyan">
              Contact our desk <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </SectionReveal>

      {/* CTA / FOOTER */}
      <footer id="contact" className="relative pt-40 pb-12 px-4 md:px-12 overflow-hidden border-t border-white/5 z-10">
        <HorizonGlow className="absolute left-0 right-0 top-0 h-[400px]" />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="text-center mb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="glass inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs mb-8"
            >
              <Plus className="w-3 h-3 text-primary rotate-45" />
              <span className="tracking-wider">Get In Touch</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="font-serif text-6xl md:text-8xl lg:text-[9rem] leading-[0.95] tracking-tight mb-10 text-glow-soft"
            >
              Let's create<br />
              <em className="text-shimmer">something.</em>
            </motion.h2>
            <button className="bg-primary text-primary-foreground px-8 py-4 rounded-full text-sm font-medium tracking-[0.15em] uppercase inline-flex items-center gap-3 hover:bg-white transition-all glow-cyan">
              Start a Project <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pt-12 border-t border-white/10 text-sm text-foreground/60">
            <div className="col-span-2 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-primary rotate-45" strokeWidth={2.5} />
                <h4 className="font-medium text-base text-foreground">
                  <span className="text-primary">aura</span>studio
                </h4>
              </div>
              <p className="max-w-xs">Luxury creative agency.<br />Based in London, operating globally.</p>
              <div className="mt-6 inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-primary glow-cyan" />
                <span className="tracking-wider">All systems operational</span>
              </div>
            </div>
            <div>
              <h4 className="text-foreground mb-4 uppercase tracking-[0.18em] text-xs">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary transition-colors">About us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Solutions</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Insights</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground mb-4 uppercase tracking-[0.18em] text-xs">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary transition-colors">Licenses</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">AML/CTF</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Disclosures</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-foreground mb-4 uppercase tracking-[0.18em] text-xs">Follow us</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 mt-12 border-t border-white/5 text-xs text-foreground/40">
            <p>&copy; {new Date().getFullYear()} Aura Studio. All Rights Reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Cookies Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
