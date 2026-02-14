/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    primary: 'var(--bg-primary)',
                    surface: 'var(--bg-surface)',
                    elevated: 'var(--bg-elevated)',
                },
                brand: {
                    purple: {
                        DEFAULT: 'var(--brand-purple)',
                        light: 'var(--brand-purple-light)',
                        deep: 'var(--brand-purple-deep)',
                        glow: 'var(--brand-purple-glow)',
                    },
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                    faint: 'var(--text-faint)',
                },
                border: {
                    subtle: 'var(--border-subtle)',
                    medium: 'var(--border-medium)',
                },
                accent: {
                    chip: {
                        bg: 'var(--accent-chip-bg)',
                    }
                }
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                }
            }
        },
    },
    plugins: [],
}
