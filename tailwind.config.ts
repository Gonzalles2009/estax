import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: 'var(--cyber-dark)',
          darker: 'var(--cyber-darker)',
          cyan: 'var(--cyber-cyan)',
          magenta: 'var(--cyber-magenta)',
          green: 'var(--cyber-green)',
          purple: 'var(--cyber-purple)',
          yellow: 'var(--cyber-yellow)',
          orange: 'var(--cyber-orange)',
          pink: 'var(--cyber-pink)',
          text: 'var(--cyber-text)',
          'text-secondary': 'var(--cyber-text-secondary)',
          'text-muted': 'var(--cyber-text-muted)'
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 255, 255, 0.5)',
        'neon-magenta': '0 0 20px rgba(255, 0, 122, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 179, 0.5)',
        'neon-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
        'neon-glow': '0 0 10px rgba(0, 255, 255, 0.2), inset 0 0 10px rgba(0, 255, 255, 0.1)',
        'cyber-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        'neon-gradient': 'linear-gradient(90deg, #00ffff, #ff007a, #00ffb3)',
        'grid-pattern': 'radial-gradient(circle, rgba(0, 255, 255, 0.1) 1px, transparent 1px)'
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glitch': 'glitch 0.3s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'slide-in': 'slide-in 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-in'
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(0, 255, 255, 0.2), 0 0 10px rgba(0, 255, 255, 0.2), 0 0 15px rgba(0, 255, 255, 0.2)'
          },
          '50%': { 
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.4), 0 0 20px rgba(0, 255, 255, 0.4), 0 0 30px rgba(0, 255, 255, 0.4)'
          }
        },
        'glitch': {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      },
      fontFamily: {
        'cyber': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        'sans': ['ui-sans-serif', 'system-ui', 'sans-serif']
      },
      gridTemplateColumns: {
        'sidebar': '320px 1fr'
      }
    },
  },
  plugins: [],
};

export default config; 