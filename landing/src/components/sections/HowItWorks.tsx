import { motion } from 'framer-motion';
import { User, Heart, MessageCircle, Star } from 'lucide-react';

const steps = [
    {
        icon: User,
        title: "Profiles start photo-free",
        description: "No superficial swiping. Focus on who they are, not just what they look like."
    },
    {
        icon: Heart,
        title: "Match by hobbies & personality",
        description: "Our AI connects you based on shared interests and deep compatibility scores."
    },
    {
        icon: MessageCircle,
        title: "Chat deeply. Unlock photos.",
        description: "As conversation flows, photos are gradually revealed. Earn trust to see more."
    },
    {
        icon: Star,
        title: "Rate to refine your match",
        description: "Feedback helps our algorithm understand your type beyond physical traits."
    }
];

export const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-24 relative overflow-hidden bg-bg-surface">
            {/* Background gradients */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-purple/20 to-transparent"></div>

            <div className="container">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold mb-4"
                    >
                        How <span className="text-brand-purple">Spark</span> Works
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-text-secondary max-w-xl mx-auto"
                    >
                        A refreshed approach to dating that prioritizes emotional connection.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="group relative p-8 rounded-2xl bg-bg-primary border border-border-subtle hover:border-brand-purple/30 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-brand-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

                            <div className="relative z-10 flex flex-col items-center text-center gap-4">
                                <div className="p-4 rounded-full bg-brand-purple/10 text-brand-purple-light group-hover:bg-brand-purple group-hover:text-white transition-colors duration-300">
                                    <step.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                                <p className="text-sm text-text-secondary leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
