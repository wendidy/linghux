export const PRICE_IDS = {
  ORIGINAL_SIZE_5X7: 'price_1TAhaIFDU67CvNwzLBpS2jBJ',
  ORIGINAL_SIZE_8X10: 'price_1TAhbNFDU67CvNwzZajKCagQ',
  ORIGINAL_SIZE_20X30: 'price_1TAhbgFDU67CvNwzYsBn7iTn',
  LE_SIZE_5X7: 'price_1TAhbvFDU67CvNwzLZpkHFCt',
  LE_SIZE_8X10: 'price_1TAhc8FDU67CvNwziGgsgIwq',
  LE_SIZE_24X36: 'price_1TAhcLFDU67CvNwzGfeKlWgQ',
  OE_PRINT_SIZE_5X7: 'price_1T9cKeFDU67CvNwznufWopCL',
  OE_PRINT_SIZE_8X10: 'price_1T9d81FDU67CvNwz9VPts2TY',
  OE_PRINT_SIZE_17X22: 'price_1T9uOyFDU67CvNwz5Gi4lxMj',
}

export const PRICE_BY_CATEGORY_AND_SIZE = {
  originals: {
    '5x7': PRICE_IDS.ORIGINAL_SIZE_5X7,
    '8x10': PRICE_IDS.ORIGINAL_SIZE_8X10,
    '20x30': PRICE_IDS.ORIGINAL_SIZE_20X30,
  },
  'limited-edition-prints': {
    '5x7': PRICE_IDS.LE_SIZE_5X7,
    '8x10': PRICE_IDS.LE_SIZE_8X10,
    '24x36': PRICE_IDS.LE_SIZE_24X36,
  },
  'open-edition-prints': {
    '5x7': PRICE_IDS.OE_PRINT_SIZE_5X7,
    '8x10': PRICE_IDS.OE_PRINT_SIZE_8X10,
    '17x22': PRICE_IDS.OE_PRINT_SIZE_17X22,
  },
}

export const PRICE_BY_WORK_ID = {
  // Example override:
  // 'work-1': PRICE_IDS.ORIGINAL_SIZE_8X10,
}

export function priceIdFor(item) {
  if (!item) return ''
  return (
    PRICE_BY_WORK_ID[item.id] ||
    PRICE_BY_CATEGORY_AND_SIZE[item.category]?.[item.size] ||
    ''
  )
}
