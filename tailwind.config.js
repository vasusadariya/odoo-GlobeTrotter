/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			// Waypoint brand accent — brass. Kept under the "primary" key so
  			// every existing bg-primary-*/text-primary-*/border-primary-* utility
  			// across the app now resolves to the new system without per-page edits.
  			primary: {
  				'50': '#faf6ec',
  				'100': '#f3ead1',
  				'200': '#e6d3a3',
  				'300': '#d6b871',
  				'400': '#c49c4a',
  				'500': '#ac812f',
  				'600': '#96691e',
  				'700': '#7a5419',
  				'800': '#614314',
  				'900': '#4d3510',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			// Waypoint neutrals — ink-tinted rather than pure grey, so every
  			// bg-gray-50/text-gray-900/border-gray-* utility inherits the chart
  			// paper + ink hue instead of a generic SaaS grey.
  			gray: {
  				'50': '#f5f7f6',
  				'100': '#e9edeb',
  				'200': '#d2dbd8',
  				'300': '#b3c2bd',
  				'400': '#8a9d98',
  				'500': '#687e79',
  				'600': '#4f625d',
  				'700': '#3b4a46',
  				'800': '#28332f',
  				'900': '#142523'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// "Waypoint" direction tokens — opt-in via these utilities on pages
  			// migrating to the new visual system. See app/dashboard/page.jsx and
  			// app/trips/[id]/itinerary/view/page.jsx for the first rollout.
  			parchment: {
  				DEFAULT: '#eef2f0',
  				raised: '#ffffff',
  				sunken: '#e3e9e5'
  			},
  			ink: '#142523',
  			brass: {
  				DEFAULT: '#96691e',
  				light: '#d9a856'
  			},
  			route: '#a8402f'
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			display: [
  				'var(--font-display)',
  				'Georgia',
  				'serif'
  			],
  			data: [
  				'var(--font-data)',
  				'ui-monospace',
  				'monospace'
  			]
  		},
  		borderRadius: {
  			xl: '0.5rem',
  			'2xl': '0.625rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			soft: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  			medium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  		}
  	}
  },
  plugins: [
    require('@tailwindcss/forms'),
    require("tailwindcss-animate"),
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
}