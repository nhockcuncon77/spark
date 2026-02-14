import { motion } from 'framer-motion';
import { Hash, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

const posts = [
    {
        tag: "Photography",
        content: "Just got my film developed from the weekend trip. The lighting was unreal! 📸",
        likes: 24,
        comments: 5,
        color: "from-pink-500 to-rose-500"
    },
    {
        tag: "Jazz",
        content: "Anyone else obsessed with Miles Davis' earlier work? Looking for recommendations similar to Kind of Blue.",
        likes: 42,
        comments: 12,
        color: "from-blue-500 to-indigo-500"
    },
    {
        tag: "Hiking",
        content: "Found this hidden trail today. The view at the summit was worth every step. 🏔️",
        likes: 18,
        comments: 3,
        color: "from-emerald-500 to-teal-500"
    }
];

export const SocialDiscovery = () => {
    return (
        <section className="py-24 relative bg-bg-surface overflow-hidden">
            <div className="container grid lg:grid-cols-2 gap-12 items-center">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="order-2 lg:order-1"
                >
                    <span className="text-brand-purple text-sm font-bold tracking-wider uppercase mb-2 block">Social Discovery</span>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Meet people <br /> <span className="text-gradient">organically.</span>
                    </h2>
                    <p className="text-text-secondary text-lg mb-8 leading-relaxed max-w-md">
                        No more forced bios. Connect through shared passions in a vibrant, anonymous community feed.
                    </p>
                    <button className="text-white border-b border-brand-purple pb-1 hover:text-brand-purple transition-colors">
                        Explore the Community
                    </button>
                </motion.div>

                {/* Feed UI */}
                <div className="order-1 lg:order-2 relative h-[600px] w-full flex flex-col gap-6 overflow-hidden mask-linear-fade">
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-bg-surface to-transparent z-10"></div>
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bg-surface to-transparent z-10"></div>

                    <div className="animate-scroll-vertical flex flex-col gap-6 p-4">
                        {[...posts, ...posts].map((post, index) => (
                            <div key={index} className="bg-bg-elevated p-6 rounded-2xl border border-border-subtle shadow-xl max-w-md mx-auto w-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${post.color} opacity-80`} />
                                        <div>
                                            <div className="w-24 h-3 bg-white/10 rounded mb-1.5" />
                                            <div className="w-16 h-2 bg-white/5 rounded" />
                                        </div>
                                    </div>
                                    <MoreHorizontal className="text-text-muted" size={20} />
                                </div>

                                <div className="mb-3 px-3 py-1 rounded-full bg-bg-primary inline-flex items-center gap-2 border border-border-subtle w-fit">
                                    <Hash size={14} className="text-brand-purple" />
                                    <span className="text-xs text-text-secondary font-medium">{post.tag}</span>
                                </div>

                                <p className="text-text-primary text-sm leading-relaxed mb-4">
                                    {post.content}
                                </p>

                                <div className="flex items-center gap-6 text-text-muted text-sm border-t border-border-subtle pt-4">
                                    <div className="flex items-center gap-2 hover:text-red-500 transition-colors cursor-pointer">
                                        <Heart size={18} />
                                        <span>{post.likes}</span>
                                    </div>
                                    <div className="flex items-center gap-2 hover:text-blue-500 transition-colors cursor-pointer">
                                        <MessageCircle size={18} />
                                        <span>{post.comments}</span>
                                    </div>
                                    <div className="ml-auto hover:text-white transition-colors cursor-pointer">
                                        <Share2 size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
