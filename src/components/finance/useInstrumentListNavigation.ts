import { CommonActions } from '@react-navigation/native'
import { useNavigation } from 'expo-router'

export function useInstrumentListNavigation() {
  const navigation = useNavigation()
  return () => navigation.dispatch(CommonActions.reset({
    index: 1,
    routes: [{ name: '(tabs)' }, { name: 'accounts-and-cards' }],
  }))
}
