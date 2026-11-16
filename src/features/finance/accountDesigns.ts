import type { ImageSourcePropType } from 'react-native'

export type AccountDesignId = 'bbva' | 'nu' | 'plata' | 'other' | 'cash'

export const accountDesigns: {
  id: AccountDesignId
  label: string
  image: ImageSourcePropType | null
}[] = [
  {
    id: 'bbva',
    label: 'BBVA',
    image: require('../../assets/images/cards/bbva_debito.png'),
  },
  {
    id: 'nu',
    label: 'Nu',
    image: require('../../assets/images/cards/nu_debito.png'),
  },
  {
    id: 'plata',
    label: 'Plata',
    image: require('../../assets/images/cards/plata_debito.png'),
  },
  {
    id: 'other',
    label: 'Otro banco',
    image: null,
  },
  {
    id: 'cash',
    label: 'Efectivo',
    image: null,
  },
]

export function getAccountDesign(id: AccountDesignId | undefined) {
  return accountDesigns.find((design) => design.id === id)
}
