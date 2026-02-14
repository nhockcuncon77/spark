import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";

export const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  // Parallax for secondary card
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  // Extended opacity range for better visibility on mobile
  const opacity = useTransform(scrollY, [0, 700], [1, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Ambience - More Vibrant */}
      <div className="absolute inset-0 bg-bg-primary z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-brand-purple/40 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-purple-deep/50 rounded-full blur-[100px] mix-blend-screen animate-float" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 brightness-120 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="container relative z-10 flex flex-col items-center text-center px-4">
        {/* Logo - Spark on the left */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <span className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]">
            Spark<span className="text-brand-purple">.</span>
          </span>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-chip-bg border border-brand-purple/40 text-brand-purple-light text-sm font-medium mb-6 shadow-[0_0_20px_rgba(124,58,237,0.2)]"
        >
          <Sparkles size={16} className="text-brand-purple-glow" />
          <span className="tracking-wide text-brand-purple-glow">
            The Future of True Connection
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-6 max-w-5xl"
        >
          Meet the person first. <br />
          <span className="text-gradient relative inline-block">
            Looks later.
            {/* Stronger glow behind text */}
            <span className="absolute inset-0 blur-3xl bg-brand-purple/50 -z-10"></span>
          </span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-lg md:text-xl text-text-secondary max-w-2xl mb-12 leading-relaxed"
        >
          Spark helps you create real connections through personality,
          hobbies, and conversation before revealing the photo.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-20 z-20"
        >
          <button
            className="relative group px-9 py-4 bg-white text-bg-primary font-bold rounded-full text-lg overflow-hidden transition-all hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95"
            onClick={() =>
              window.open("https://spark.example.com/docs", "_blank")
            }
          >
            <span className="relative z-10">Documentation</span>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-purple-light to-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </button>

          <button className="px-9 py-4 rounded-full border border-border-medium text-text-primary font-medium text-lg hover:bg-white/5 hover:border-white/30 transition-all backdrop-blur-sm">
            Download Latest
          </button>
        </motion.div>

        {/* Actual UI Mockups - "Card Deal" Animation */}
        <motion.div
          style={{ y: y1, opacity }}
          className="relative w-full max-w-5xl h-[500px] md:h-[700px] pointer-events-none flex justify-center perspective-1000"
        >
          {/* Main Swipe Card Replica with Spring Entrance */}
          <motion.div
            initial={{ y: 800, rotate: 0, scale: 0.8 }}
            animate={{ y: 0, rotate: -4, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 70,
              damping: 18,
              delay: 0.4,
            }}
            className="absolute w-[340px] md:w-[380px] bg-[#1D0F45] border-[3px] border-white/20 rounded-[32px] overflow-hidden shadow-2xl z-20 origin-bottom"
          >
            {/* Photo Section with Blur */}
            <div className="relative h-64 bg-bg-surface overflow-hidden">
              {/* Mock Blurred Image Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-purple-deep via-bg-primary to-black opacity-80 z-0"></div>

              {/* Blur Overlay & Lock */}
              <div className="absolute inset-0 backdrop-blur-[24px] bg-bg-elevated/30 flex flex-col items-center justify-center z-10">
                <div className="w-16 h-16 rounded-full bg-bg-elevated/80 items-center justify-center flex mb-3 shadow-lg border border-white/10">
                  <Sparkles size={28} className="text-brand-purple" />
                </div>
                <span className="text-white font-bold text-lg">
                  Photo Hidden
                </span>
                <span className="text-text-muted text-sm mt-1">
                  Match & chat to unlock
                </span>
              </div>

              {/* Match Badge */}
              <div className="absolute bottom-4 left-4 z-20 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                <Sparkles size={12} className="text-accent-ai" fill="#FFD166" />
                <span className="text-xs font-medium text-white">
                  96% Match
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">Sarah, 24</h2>
                  <div className="bg-utility-success/20 p-1 rounded-full">
                    <div className="w-2 h-2 bg-utility-success rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1 text-text-muted text-xs">
                  <div className="w-1 h-1 bg-text-muted rounded-full"></div>
                  <span>2 km away</span>
                </div>
                <div className="flex items-center gap-1 text-text-muted text-xs border-l border-white/10 pl-2">
                  <span>Active now</span>
                </div>
              </div>

              {/* AI Summary Chip */}
              <div className="bg-bg-elevated border border-accent-ai/20 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles size={12} className="text-accent-ai" />
                  <span className="text-xs font-bold text-accent-ai uppercase tracking-wider">
                    AI Summary
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Sarah is a creative soul who loves jazz clubs and photography.
                  A genuine match if you appreciate deep talks!
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-text-primary">
                  Photography
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-text-primary">
                  Jazz
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-text-primary">
                  Art
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-xs text-text-primary">
                  +3
                </span>
              </div>
            </div>
          </motion.div>

          {/* Secondary Card (Behind) with Spring Entrance */}
          <motion.div
            style={{ y: y2 }}
            initial={{ y: 800, rotate: 0, scale: 0.8, opacity: 0 }}
            animate={{ y: 0, rotate: 4, scale: 0.95, opacity: 0.4 }}
            transition={{
              type: "spring",
              stiffness: 60,
              damping: 20,
              delay: 0.6,
            }}
            className="absolute w-[340px] md:w-[380px] h-[500px] bg-bg-surface border border-border-medium rounded-[32px] shadow-xl z-10 blur-[1px] translate-x-12 translate-y-8"
          />
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-text-muted"
      >
        <ChevronDown size={24} />
      </motion.div>
    </section>
  );
};
