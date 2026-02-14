import { motion } from 'framer-motion';
import { Apple, Smartphone } from 'lucide-react';

export const DownloadApp = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-brand-purple/5 block md:hidden"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-purple/10 rounded-full blur-[100px] -z-10"></div>

            <div className="container relative z-10 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl mx-auto"
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Ready to meet <br />
                        <span className="text-gradient">Real People?</span>
                    </h2>
                    <p className="text-text-secondary text-lg mb-10 max-w-lg mx-auto">
                        Join the community that values personality first. Download Spark today and start connecting on a deeper level.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="flex items-center gap-3 bg-white text-black px-6 py-3.5 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-white/20">
                            <Apple size={24} className="fill-current" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">Download on the</span>
                                <span className="text-base">App Store</span>
                            </div>
                        </button>

                        <button className="flex items-center gap-3 bg-bg-elevated border border-white/20 text-white px-6 py-3.5 rounded-xl font-bold hover:scale-105 transition-transform hover:bg-white/10 hover:border-white/40">
                            <Smartphone size={24} />
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">Get it on</span>
                                <span className="text-base">Google Play</span>
                            </div>
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
