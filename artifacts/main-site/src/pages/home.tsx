import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { useRef } from "react";
import InteractiveGrid from "@/components/InteractiveGrid";
import SectionReveal from "@/components/SectionReveal";

import heroBg from "@/assets/images/hero-bg.png";
import work1 from "@/assets/images/work-1.png";
import work2 from "@/assets/images/work-2.png";
import studio from "@/assets/images/studio.png";

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <div ref={containerRef} className="bg-background text-foreground min-h-screen relative">
      {/* Global interactive grid background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <InteractiveGrid cellSize={56} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 mix-blend-difference">
        <div className="font-serif text-2xl font-bold tracking-wider">AURA.</div>
        <div className="hidden md:flex items-center gap-12 text-sm font-medium tracking-widest uppercase">
          <a href="#work" className="hover:text-primary transition-colors">Work</a>
          <a href="#studio" className="hover:text-primary transition-colors">Studio</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </div>
        <button className="text-sm font-medium tracking-widest uppercase hover:text-primary transition-colors">
          Menu
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden z-10">
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: heroY, scale: heroScale }}
        >
          <div className="absolute inset-0 bg-black/50 z-10 mix-blend-multiply" />
          <img
            src={heroBg}
            alt="Hero abstract"
            className="w-full h-full object-cover object-center"
            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop"; }}
          />
        </motion.div>

        {/* Hero-specific tighter grid */}
        <div className="absolute inset-0 z-[5] pointer-events-none opacity-90">
          <InteractiveGrid cellSize={44} />
        </div>

        <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 w-full max-w-7xl mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tighter">
              Crafting <span className="text-primary italic">Digital</span><br />
              Masterpieces.
            </h1>
          </motion.div>

          <motion.p
            className="mt-8 text-lg md:text-xl text-foreground/70 max-w-2xl font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            We are a luxury creative agency shaping unignorable brand experiences for the bold and the visionary.
          </motion.p>
        </div>

        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4 opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <span className="text-xs tracking-widest uppercase">Scroll to explore</span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* Manifesto Section */}
      <SectionReveal className="py-32 px-4 md:px-12 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="text-sm tracking-widest uppercase text-primary font-semibold mb-6">The Manifesto</h2>
          </div>
          <div className="md:col-span-8">
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="text-3xl md:text-5xl font-serif leading-tight"
            >
              We believe in the power of <em className="text-primary">intentional design</em>. Every pixel, every interaction, every word must serve a singular purpose: to make your audience feel something profound.
            </motion.p>
          </div>
        </div>
      </SectionReveal>

      {/* Featured Work */}
      <SectionReveal id="work" className="py-20 w-full overflow-hidden relative z-10">
        <div className="px-4 md:px-12 mb-16 flex justify-between items-end max-w-[1400px] mx-auto">
          <h2 className="text-5xl md:text-7xl font-serif">Selected Works</h2>
          <button className="hidden md:flex items-center gap-2 text-sm tracking-widest uppercase hover:text-primary transition-colors pb-2">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 px-4 md:px-12 max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden aspect-[3/4] mb-6">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
              <img
                src={work1}
                alt="Project One"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop"; }}
              />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-serif mb-2 group-hover:text-primary transition-colors">Maison De L'Art</h3>
                <p className="text-foreground/60 text-sm">Art Direction, Digital</p>
              </div>
              <span className="text-xs tracking-wider">2024</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="group cursor-pointer md:mt-32"
          >
            <div className="relative overflow-hidden aspect-[3/4] mb-6">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
              <img
                src={work2}
                alt="Project Two"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"; }}
              />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-serif mb-2 group-hover:text-primary transition-colors">Obsidian Core</h3>
                <p className="text-foreground/60 text-sm">Brand Identity, Web</p>
              </div>
              <span className="text-xs tracking-wider">2023</span>
            </div>
          </motion.div>
        </div>
      </SectionReveal>

      {/* Studio / Image Section */}
      <SectionReveal id="studio" className="py-32 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="w-full aspect-[21/9] relative overflow-hidden"
        >
          <img
            src={studio}
            alt="Our Studio"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop"; }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <h2 className="text-6xl md:text-9xl font-serif text-white tracking-tight">The Studio</h2>
          </div>
        </motion.div>
      </SectionReveal>

      {/* Capabilities */}
      <SectionReveal className="py-24 px-4 md:px-12 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-serif mb-8">Capabilities</h2>
            <p className="text-foreground/70 text-lg max-w-md">
              We partner with visionary leaders to build brands that defy expectations and redefine categories.
            </p>
          </div>
          <div className="space-y-8">
            {[
              { num: "01", title: "Brand Identity", desc: "Naming, positioning, visual identity, and brand guidelines." },
              { num: "02", title: "Digital Experience", desc: "Web design, e-commerce, application interfaces, and motion." },
              { num: "03", title: "Content Creation", desc: "Art direction, 3D visualization, photography, and copywriting." },
            ].map((cap, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group border-b border-border pb-8"
              >
                <div className="flex items-baseline gap-6 mb-4">
                  <span className="text-sm font-mono text-primary">{cap.num}</span>
                  <h3 className="text-3xl font-serif group-hover:text-primary transition-colors">{cap.title}</h3>
                </div>
                <p className="text-foreground/60 pl-11">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionReveal>

      {/* Footer / CTA */}
      <footer id="contact" className="relative bg-black pt-32 pb-12 px-4 md:px-12 overflow-hidden border-t border-white/10 z-10">
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <InteractiveGrid cellSize={48} />
        </div>
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="text-center mb-32">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-6xl md:text-8xl lg:text-[10rem] font-serif leading-none mb-8 tracking-tighter"
            >
              Let's create<br /> <span className="text-primary italic">something.</span>
            </motion.h2>
            <button className="bg-primary text-black px-8 py-4 rounded-full text-sm font-semibold tracking-widest uppercase hover:bg-white transition-colors duration-300">
              Start a Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pt-12 border-t border-white/10 text-sm text-foreground/60">
            <div>
              <h4 className="text-white font-serif text-2xl mb-4">AURA.</h4>
              <p>Luxury Creative Agency<br />Based in London, operating globally.</p>
            </div>
            <div>
              <h4 className="text-white mb-4 uppercase tracking-widest text-xs">Socials</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">LinkedIn</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4 uppercase tracking-widest text-xs">Contact</h4>
              <ul className="space-y-2">
                <li><a href="mailto:hello@aura.studio" className="hover:text-primary transition-colors">hello@aura.studio</a></li>
                <li>+44 (0) 20 7123 4567</li>
              </ul>
            </div>
            <div className="flex items-end justify-end md:justify-start">
              <p>&copy; {new Date().getFullYear()} AURA Studio. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
