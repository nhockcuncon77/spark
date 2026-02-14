import React, { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Wand2, MessageSquare, BrainCircuit, ShieldCheck, Lock } from 'lucide-react';
import clsx from 'clsx';

const features = [
    {
        icon: Wand2,
        title: "AI Bio Generator",
        description: "Don't know what to write? Our AI analyzes your interests to craft the perfect bio that sounds like you.",
        size: "large"
    },
    {
        icon: MessageSquare,
        title: "AI Rizz Assistant",
        description: "Get smart reply suggestions to keep the conversation flowing naturally.",
        size: "small"
    },
    {
        icon: BrainCircuit,
        title: "Personality Matchmaking",
        description: "Deep compatibility algorithms that go beyond surface-level interests.",
        size: "small"
    },
    {
        icon: Lock,
        title: "Secure Photo Reveal",
        description: "You control when photos are shown. Build trust before revealing your face.",
        size: "large"
    },
    {
        icon: ShieldCheck,
        title: "Verified Community",
        description: "Strict ID and liveness checks ensure everyone is real. No catfish allowed.",
        size: "wide"
    }
];

const FeatureCard = ({ feature, index }: { feature: any, index: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set(clientX - left - width / 2);
        y.set(clientY - top - height / 2);
    }

    function onMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const rotateX = useTransform(mouseY, [-300, 300], [12, -12]);
    const rotateY = useTransform(mouseX, [-300, 300], [-12, 12]);

    return (
        <motion.div
            ref={ref}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className={clsx(
                "relative group rounded-3xl bg-bg-surface border border-border-subtle overflow-hidden transition-colors hover:border-brand-purple/40",
                feature.size === "large" ? "md:col-span-2 lg:col-span-1 lg:row-span-2" : "",
                feature.size === "wide" ? "md:col-span-2" : ""
            )}
            style={{
                transformStyle: "preserve-3d",
                rotateX,
                rotateY,
            }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Glow Follower */}
            <motion.div
                className="absolute w-[300px] h-[300px] bg-brand-purple/20 rounded-full blur-[80px] -z-10 group-hover:opacity-100 opacity-0 transition-opacity duration-500"
                style={{
                    left: useMotionTemplate`calc(${mouseX}px + 50%)`,
                    top: useMotionTemplate`calc(${mouseY}px + 50%)`,
                }}
            />

            <div className="p-8 h-full flex flex-col items-start gap-4 z-10 relative">
                <div className="p-3 bg-bg-elevated rounded-xl border border-border-medium group-hover:border-brand-purple/50 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="text-brand-purple-light" size={24} />
                </div>

                <div className="mt-auto">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-brand-purple-light transition-colors">{feature.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
                </div>
            </div>
        </motion.div>
    );
};

export const Features = () => {
    return (
        <section id="features" className="py-24 relative overflow-hidden">
            <div className="container">
                <div className="mb-16">
                    <motion.span
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-brand-purple text-sm font-bold tracking-wider uppercase mb-2 block"
                    >
                        Intelligent Features
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="text-3xl md:text-5xl font-bold max-w-xl"
                    >
                        Designed for <br /> <span className="text-gradient">Meaningful Connections</span>
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};
