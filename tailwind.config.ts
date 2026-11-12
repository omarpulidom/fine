import type { Config } from 'tailwindcss'
import { Colors } from './src/components/colors'
import { AppFontNames } from './src/components/fonts/font-names'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,tsx}',
    './src/components/**/*.{js,ts,tsx}',
  ],
  presets: [
    require('nativewind/preset'),
  ],
  theme: {
    extend: {
      colors: Colors,
      fontFamily: {
        sans: [
          AppFontNames.Inter_400Regular,
          'sans-serif',
        ],
        inter: [
          AppFontNames.Inter_400Regular,
        ],
        'inter-medium': [
          AppFontNames.Inter_500Medium,
        ],
        'inter-semibold': [
          AppFontNames.Inter_600SemiBold,
        ],
        'inter-bold': [
          AppFontNames.Inter_700Bold,
        ],
      },
    },
  },
  plugins: [],
}

export default config
