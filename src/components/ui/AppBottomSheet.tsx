import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef } from 'react'

type Props = {
  visible: boolean
  onClose: () => void
  children: ReactNode
  snapPoints?: string[]
}

export function AppBottomSheet({
  visible,
  onClose,
  children,
  snapPoints = [
    '75%',
    '92%',
  ],
}: Props) {
  const sheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (visible) sheetRef.current?.present()
    else sheetRef.current?.dismiss()
  }, [
    visible,
  ])

  const backdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior='close'
      />
    ),
    [],
  )

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      keyboardBehavior='interactive'
      keyboardBlurBehavior='restore'
      android_keyboardInputMode='adjustResize'
      backdropComponent={backdrop}
      backgroundStyle={{
        borderRadius: 24,
        backgroundColor: '#fff',
      }}
      handleIndicatorStyle={{
        backgroundColor: '#d0d0d0',
      }}
      onDismiss={onClose}
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 14,
          paddingBottom: 36,
        }}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  )
}
