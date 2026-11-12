import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView
      style={{
        flex: 1,
      }}
    >
      <BottomSheetModalProvider>
        <SafeAreaProvider>{children}</SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}
