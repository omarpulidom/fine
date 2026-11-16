import type { AppFontKeys } from './fonts'

export const AppFontNames = {
  Inter_300Light: 'Inter_300Light',
  Inter_400Regular: 'Inter_400Regular',
  Inter_500Medium: 'Inter_500Medium',
  Inter_600SemiBold: 'Inter_600SemiBold',
  Inter_700Bold: 'Inter_700Bold',
} as const satisfies { [key in AppFontKeys]: AppFontKeys }
