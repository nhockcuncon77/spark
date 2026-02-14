import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const screens = [
  {
    title: "Onboarding",
    color: "bg-bg-primary",
    content: (
      <div className="flex flex-col items-center justify-center h-full p-3">
        {/* Responsive screenshot container — fits within phone mockup */}
        <div className="rounded-xl overflow-hidden w-full h-full">
          <img
            src="/screenshots/landing.png"
            alt="App preview"
            className="w-full h-full object-cover object-center"
            style={{
              // small nudge to ensure perfect centering if the phone mockup crops slightly
              transform: "translateZ(0)",
            }}
          />
        </div>
      </div>
    ),
  },
  {
    title: "Swipes",
    color: "bg-bg-primary",
    content: (
      <div className="flex flex-col items-center justify-center h-full p-3">
        {/* Responsive screenshot container — fits within phone mockup */}
        <div className="rounded-xl overflow-hidden w-full h-full">
          <img
            src="/screenshots/swipe.png"
            alt="App preview"
            className="w-full h-full object-cover object-center"
            style={{
              // small nudge to ensure perfect centering if the phone mockup crops slightly
              transform: "translateZ(0)",
            }}
          />
        </div>
      </div>
    ),
  },
  {
    title: "Community",
    color: "bg-bg-primary",
    content: (
      <div className="flex flex-col items-center justify-center h-full p-3">
        {/* Responsive screenshot container — fits within phone mockup */}
        <div className="rounded-xl overflow-hidden w-full h-full">
          <img
            src="/screenshots/community.png"
            alt="App preview"
            className="w-full h-full object-cover object-center"
            style={{
              // small nudge to ensure perfect centering if the phone mockup crops slightly
              transform: "translateZ(0)",
            }}
          />
        </div>
      </div>
    ),
  },
  {
    title: "Messages",
    color: "bg-bg-primary",
    content: (
      <div className="flex flex-col items-center justify-center h-full p-3">
        {/* Responsive screenshot container — fits within phone mockup */}
        <div className="rounded-xl overflow-hidden w-full h-full">
          <img
            src="/screenshots/messages.png"
            alt="App preview"
            className="w-full h-full object-cover object-center"
            style={{
              // small nudge to ensure perfect centering if the phone mockup crops slightly
              transform: "translateZ(0)",
            }}
          />
        </div>
      </div>
    ),
  },
  {
    title: "Chat",
    color: "bg-bg-primary",
    content: (
      <div className="flex flex-col items-center justify-center h-full p-3">
        {/* Responsive screenshot container — fits within phone mockup */}
        <div className="rounded-xl overflow-hidden w-full h-full">
          <img
            src="/screenshots/chat.png"
            alt="App preview"
            className="w-full h-full object-cover object-center"
            style={{
              // small nudge to ensure perfect centering if the phone mockup crops slightly
              transform: "translateZ(0)",
            }}
          />
        </div>
      </div>
    ),
  },
  {
    title: "Verification",
    color: "bg-bg-primary",
    content: (
      <div className="flex flex-col items-center justify-center h-full p-3">
        {/* Responsive screenshot container — fits within phone mockup */}
        <div className="rounded-xl overflow-hidden w-full h-full">
          <img
            src="/screenshots/verify.png"
            alt="App preview"
            className="w-full h-full object-cover object-center"
            style={{
              // small nudge to ensure perfect centering if the phone mockup crops slightly
              transform: "translateZ(0)",
            }}
          />
        </div>
      </div>
    ),
  },
];

export const AppShowcase = () => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });
  const x = useTransform(scrollYProgress, [0, 1], ["10%", "-50%"]);

  return (
    <section ref={targetRef} className="h-[300vh] bg-bg-surface relative">
      <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">
        <div className="container text-center mb-12">
          <span className="text-brand-purple text-sm font-bold tracking-wider uppercase mb-2 block">
            App Preview
          </span>
          <h2 className="text-3xl md:text-5xl font-bold my-4">
            Designed for <span className="text-gradient">Immersion</span>
          </h2>
        </div>
        <motion.div style={{ x }} className="flex gap-12 px-4 md:px-24 w-max">
          {screens.map((screen, index) => (
            <div
              key={index}
              className="relative w-[280px] h-[570px] bg-black rounded-[48px] border-[8px] border-zinc-800 shadow-2xl overflow-hidden flex-shrink-0"
            >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-20" />
              {/* Screen Content */}
              <div
                className={`w-full h-full ${screen.color} pt-8 relative group`}
              >
                <div className="absolute inset-0 bg-brand-purple/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />
                {screen.content}
                {/* Scanlines Overlay for retro/cyber feel */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
