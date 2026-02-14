/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // Primary font - Lexend (cute, modern, friendly)
        sans: ["Lexend-Regular"],
        heading: ["Lexend-Bold"],
        "lexend-thin": ["Lexend-Thin"],
        "lexend-light": ["Lexend-Light"],
        "lexend-regular": ["Lexend-Regular"],
        "lexend-medium": ["Lexend-Medium"],
        "lexend-semibold": ["Lexend-SemiBold"],
        "lexend-bold": ["Lexend-Bold"],
        "lexend-extrabold": ["Lexend-ExtraBold"],
        "lexend-black": ["Lexend-Black"],
        // Secondary font - Nunito (soft, rounded, friendly)
        nunito: ["Nunito-Regular"],
        "nunito-light": ["Nunito-Light"],
        "nunito-regular": ["Nunito-Regular"],
        "nunito-medium": ["Nunito-Medium"],
        "nunito-semibold": ["Nunito-SemiBold"],
        "nunito-bold": ["Nunito-Bold"],
        "nunito-extrabold": ["Nunito-ExtraBold"],
        "nunito-black": ["Nunito-Black"],
      },
      colors: {
        // --- Core Background ---
        background: "#080314", // Deep near-black purple
        surface: "#17102E", // Clean elevated surfaces
        "surface-elevated": "rgba(255, 255, 255, 0.06)", // glassy overlay

        // --- Brand Purple ---
        primary: "#7C3AED", // Softer, modern purple
        "primary-dark": "#5B21B6", // Better for hover/pressed
        "primary-light": "#A78BFA", // Text/icons on purple
        "primary-gradient-start": "#6D28D9",
        "primary-gradient-end": "#9D4EDD",

        // --- Muted Texts ---
        body: "#F5F3FF", // White with slight warmth
        muted: "#A6A3B8", // Muted text (distance, hints)
        subtle: "#6E6A85", // Very soft grey-violet

        // --- Functional Colors (modernized) ---
        success: "#10B981", // Emerald (cleaner than neon)
        warning: "#F59E0B", // Soft amber
        danger: "#EF4444", // Softer red, less harsh
        info: "#3B82F6", // Modern bright blue

        // Tinder/Bumble-style glowing accents
        like: "#22C55E",
        superlike: "#38BDF8",
        love: "#F472B6",
        nope: "#F43F5E",
        ai: "#FDE68A",

        // --- Shadows & Effects ---
        "shadow-strong": "rgba(0, 0, 0, 0.5)",
        "shadow-soft": "rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
};
