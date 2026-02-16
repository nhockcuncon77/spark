import { motion } from 'framer-motion';

export const CTA = () => {
    return (
        <section className="py-32 relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-bg-primary">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-purple/20 rounded-full blur-[120px] mix-blend-screen opacity-50" />
            </div>

            <div className="container relative z-10 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-7xl font-bold mb-8 leading-tight"
                >
                    Real people. <br />
                    Real conversations. <br />
                    <span className="text-gradient">Real attraction.</span>
                </motion.h2>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <a
                        href="/app/email-login"
                        className="relative group inline-block px-10 py-5 bg-white text-bg-primary font-bold rounded-full text-xl overflow-hidden transition-all hover:shadow-[0_0_50px_rgba(124,58,237,0.4)] hover:scale-105"
                    >
                        <span className="relative z-10">Join Spark</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-purple-light to-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                    </a>
                </motion.div>
            </div>
        </section>
    );
};
