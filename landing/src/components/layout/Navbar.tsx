import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        scrolled
          ? "bg-bg-primary/80 backdrop-blur-md border-border-subtle py-4"
          : "bg-transparent border-transparent py-6",
      )}
      style={{
        backgroundColor: scrolled ? "rgba(11, 11, 16, 0.8)" : "transparent",
      }}
    >
      <div className="container flex items-center justify-between">
        <a href="#" className="text-2xl font-bold tracking-tighter text-white">
          Spark<span className="text-brand-purple">.</span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#how-it-works"
            className="text-sm font-medium text-text-secondary hover:text-white transition-colors"
          >
            How it Works
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-text-secondary hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#safety"
            className="text-sm font-medium text-text-secondary hover:text-white transition-colors"
          >
            Safety
          </a>
          <Link
            to="/docs"
            className="px-5 py-2.5 rounded-full bg-brand-purple hover:bg-brand-purple-light text-white font-medium text-sm transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]"
          >
            Documentation
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-bg-surface border-b border-border-subtle overflow-hidden"
          >
            <div className="container py-8 flex flex-col gap-6">
              <a
                href="#how-it-works"
                className="text-lg font-medium text-text-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </a>
              <a
                href="#features"
                className="text-lg font-medium text-text-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#safety"
                className="text-lg font-medium text-text-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Safety
              </a>
              <Link
                to="/docs"
                className="w-full py-3 rounded-full bg-brand-purple text-white font-medium text-lg text-center block"
                onClick={() => setMobileMenuOpen(false)}
              >
                Documentation
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
