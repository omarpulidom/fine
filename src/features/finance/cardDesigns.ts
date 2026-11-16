import type { ImageSourcePropType } from 'react-native'

export const cardDesigns: {
  id: CardDesignId
  bank: string
  image: ImageSourcePropType | null
}[] = [
  {
    id: 'bbva',
    bank: 'BBVA',
    image: require('../../assets/images/cards/bbva_credito.png'),
  },
  {
    id: 'nu',
    bank: 'Nu',
    image: require('../../assets/images/cards/nu_credito.png'),
  },
  {
    id: 'plata',
    bank: 'Plata',
    image: require('../../assets/images/cards/plata_credito.png'),
  },
  {
    id: 'other',
    bank: 'Otro banco',
    image: null,
  },
]

export type CardDesignId = 'bbva' | 'nu' | 'plata' | 'other'

export function getCardDesign(id: CardDesignId | undefined) {
  return cardDesigns.find((design) => design.id === id)
}
