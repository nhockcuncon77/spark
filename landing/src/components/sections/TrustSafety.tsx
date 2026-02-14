import { motion } from 'framer-motion';
import { Shield, Lock, ScanFace, UserCheck } from 'lucide-react';

const trustPoints = [
    {
        icon: ScanFace,
        title: "Liveness Checks",
        description: "Real-time selfie verification ensures every user is a real human."
    },
    {
        icon: Shield,
        title: "ID Verification",
        description: "Optional government ID verification for that extra layer of trust."
    },
    {
        icon: UserCheck,
        title: "Anti-Catfish",
        description: "Our systems detect and block fake profiles instantly."
    },
    {
        icon: Lock,
        title: "Photo Encryption",
        description: "Your photos are encrypted and only revealed when you choose."
    }
];

export const TrustSafety = () => {
    return (
        <section id="safety" className="py-24 bg-bg-primary text-center">
            <div className="container">
                <div className="mb-16">
                    <motion.h2
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="text-2xl md:text-4xl font-bold mb-4"
                    >
                        Safety isn't an afterthought. <br /> It's our <span className="text-brand-purple">foundation.</span>
                    </motion.h2>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {trustPoints.map((point, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="flex flex-col items-center gap-4 group"
                        >
                            <div className="p-4 rounded-full bg-bg-elevated border border-border-subtle text-text-secondary group-hover:text-brand-purple group-hover:border-brand-purple/50 transition-all duration-300">
                                <point.icon size={32} />
                            </div>
                            <h3 className="font-bold text-lg">{point.title}</h3>
                            <p className="text-sm text-text-muted max-w-[200px]">
                                {point.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
