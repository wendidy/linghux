function gallery(dir, fileNames) {
  return fileNames.map((fileName) => `/images/${dir}/${fileName}`)
}

function normalizeImages(image, images) {
  if (Array.isArray(images)) return images.filter(Boolean)
  if (typeof images === 'string' && images) return [images]
  return image ? [image] : []
}

const PRINT_CATEGORIES = new Set([
  'limited-edition-prints',
  'open-edition-prints',
])

function variantIdFor(artworkId, category, size) {
  return `${artworkId}:${category}:${size}`
}

function buildPrintVariants(item) {
  const sizes = Array.isArray(item.size) ? item.size.filter(Boolean) : []
  if (!PRINT_CATEGORIES.has(item.category) || !item.id || sizes.length === 0) return null

  return sizes.map((size) => ({
    id: variantIdFor(item.id, item.category, size),
    size,
    framedSize: item.framedSize,
  }))
}

const rawItems = [
  {
    id: 'dreamLake',
    category: 'originals',
    type: 'Plein Air',
    title: 'Dream Lake',
    size: '8x10',
    framedSize: 'TBD',
    date: '2024-06-01',
    image: '/images/dreamLake/dreamLake.jpg',
    images: gallery('dreamLake', ['dreamLake.jpg', 'dreamLake2.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'signalHill',
    category: 'originals',
    type: 'Plein Air',
    title: 'Signal Hill',
    size: '8x10',
    framedSize: 'TBD',
    date: '2024-05-10',
    image: '/images/signalHill/signalHill.jpg',
    images: gallery('signalHill', ['signalHill.jpg', 'signalHill2.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'bourtonOnTheWater',
    category: 'originals',
    type: 'Plein Air',
    title: 'Bourton-on-the-Water',
    size: '8x10',
    framedSize: 'TBD',
    date: '2024-04-22',
    image: '/images/bourtonOnTheWater/bourtonOnTheWater.jpg',
    images: gallery('bourtonOnTheWater', ['bourtonOnTheWater.jpg', 'bourtonOnTheWater2.jpg']),
    description: 'It was a peaceful, sunny day during my graduation trip to England, the Coltwolds looked like a dream from centuries ago. Some sheeps grazing on the farm, and some were laying down underneath the giant trees avoiding the sun. Nothing was noisy, my friend and I decided to explore separately. I chose to sit on a bench by the river and captured the history of this old town, listening to the water flowing. The most interesting encounter was a father wanted his daughter to look at me painting for 5 minutes shouting in the background, but the daughter was so unbothered and just wanted to be gone.'
  },
  {
    id: 'chateauDeVersailles',
    category: 'originals',
    type: 'Plein Air',
    title: 'Château De Versailles',
    size: '8x10',
    framedSize: 'TBD',
    date: '2023-11-15',
    image: '/images/chateauDeVersailles/chateauDeVersailles.jpg',
    images: gallery('chateauDeVersailles', ['chateauDeVersailles.jpg', 'chateauDeVersailles2.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
   {
    id: 'rooseveltPark',
    category: 'originals',
    type: 'Plein Air',
    title: 'Roosevelt Park',
    size: '8x10',
    framedSize: 'TBD',
    date: '2023-11-15',
    image: '/images/rooseveltPark/rooseveltPark.jpg',
    images: gallery('rooseveltPark', ['rooseveltPark.jpg', 'rooseveltPark2.jpg', 'rooseveltPark3.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'standleyPark',
    category: 'originals',
    type: 'Plein Air',
    title: 'Standley Park',
    size: '8x10',
    framedSize: 'TBD',
    date: '2023-11-15',
    image: '/images/standleyPark/standleyPark.jpg',
    images: gallery('standleyPark', ['standleyPark.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'lakeOfTwoRivers',
    category: 'originals',
    type: 'Plein Air',
    title: 'Lake of Two Rivers',
    size: '8x10',
    framedSize: 'TBD',
    date: '2023-11-15',
    image: '/images/lakeOfTwoRivers/lakeOfTwoRivers.jpg',
    images: gallery('lakeOfTwoRivers', ['lakeOfTwoRivers.jpg', 'lakeOfTwoRivers2.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'oxenPond',
    category: 'originals',
    type: 'Plein Air',
    title: 'Oxen Pond',
    size: '8x10',
    framedSize: 'TBD',
    date: '2023-11-15',
    image: '/images/oxenPond/oxenPond.jpg',
    images: gallery('oxenPond', ['oxenPond.jpg', 'oxenPond2.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'pacificBeach',
    category: 'originals',
    type: 'Plein Air',
    title: 'Pacific Beach',
    size: '8x10',
    framedSize: 'TBD',
    date: '2023-11-15',
    image: '/images/pacificBeach/pacificBeach.jpg',
    images: gallery('pacificBeach', ['pacificBeach.jpg', 'pacificBeach2.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'majorsHillPark',
    category: 'originals',
    type: 'Plein Air',
    title: 'Major\'s Hill Park',
    size: '8x10',
    framedSize: 'TBD',
    date: '2023-11-15',
    image: '/images/majorsHillPark/majorsHillPark2.jpg',
    images: gallery('majorsHillPark', ['majorsHillPark2.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'tobermory',
    category: 'originals',
    type: 'Plein Air',
    title: 'Tobermory',
    size: '8x10',
    framedSize: 'TBD',
    date: '2023-11-15',
    image: '/images/tobermory/tobermory.jpg',
    images: gallery('tobermory', ['tobermory.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'universityOfDenver',
    category: 'limited-edition-prints',
    title: 'University of Denver',
    size: ['8x10', '17x22'],
    framedSize: 'TBD',
    date: '2024-01-05',
    image: '/images/universityOfDenver/universityOfDenver.jpg',
    images: gallery('universityOfDenver', ['universityOfDenver.jpg', 'universityOfDenver2.jpg']),
    description: 'My friend and I were waiting for the concert to begin and decided to drive to Denver earlier to avoid the traffic. The University of Denver was just a compacted size, with white and red lounge chairs scattered around. The accent colors popped among the trees. I hid underneath a leafy one and made 1 red chair to be my main subject.'
  },
    {
    id: 'theLaughingGoat',
    category: 'open-edition-prints',
    title: 'The Laughing Goat',
    size: ['8x10'],
    framedSize: 'TBD',
    date: '2024-01-05',
    image: '/images/theLaughingGoat/theLaughingGoat.jpg',
    images: gallery('theLaughingGoat', ['theLaughingGoat.jpg']),
    description: 'My friend and I were waiting for the concert to begin and decided to drive to Denver earlier to avoid the traffic. The University of Denver was just a compacted size, with white and red lounge chairs scattered around. The accent colors popped among the trees. I hid underneath a leafy one and made 1 red chair to be my main subject.'
  },
  {
    id: 'dreamLake',
    category: 'open-edition-prints',
    title: 'Dream Lake',
    size: ['8x10'],
    framedSize: 'TBD',
    date: '2024-01-05',
    image: '/images/dreamLake/dreamLake.jpg',
    images: gallery('dreamLake', ['dreamLake.jpg', 'dreamLake2.jpg']),
    description: 'My friend and I were waiting for the concert to begin and decided to drive to Denver earlier to avoid the traffic. The University of Denver was just a compacted size, with white and red lounge chairs scattered around. The accent colors popped among the trees. I hid underneath a leafy one and made 1 red chair to be my main subject.'
  },
  {
    id: 'dakotaRidgePark',
    category: 'open-edition-prints',
    title: 'Dakota Ridge Park',
    size: ['8x10', '24x36'],
    framedSize: 'TBD',
    date: '2023-08-09',
    image: '/images/dakotaRidgePark/dakotaRidgePark.jpg',
    images: gallery('dakotaRidgePark', ['dakotaRidgePark.jpg']),
    description: 'How do you recognize beauty in everyday life? That\'s a question we should all ask ourselves, to appreciate the things we take for granted and feel at peace with our surroundings. What did I see in the playground in and "uneventful" day? It was a swing sets that offered joy to children (and myself) with trees that make us be able to breathe in a beautiful happy afternoon.'
  },
  {
    id: 'lakeOfTwoRivers',
    category: 'open-edition-prints',
    title: 'Lake of Two Rivers',
    size: ['24x36'],
    framedSize: 'TBD',
    date: '2024-02-20',
    image: '/images/lakeOfTwoRivers/lakeOfTwoRivers.jpg',
    images: gallery('lakeOfTwoRivers', ['lakeOfTwoRivers.jpg']),
    description: 'During my studies in college, we didn\'t have a lot free time to do anything other than studying. Friends enjoyed each other\'s company in the cafetria and classrooms - whispering unrelated subjects that annoyed the other classmates a bit too much. We decided to do a picnic for once and went to the river bank by Columbia Lake. It was a nice get away from the busy campus life, and really enjoyed the nature as we should be.'
  },
  {
    id: 'petiteParis',
    category: 'open-edition-prints',
    title: 'Petite Paris',
    size: ['24x36'],
    framedSize: 'TBD',
    date: '2023-12-02',
    image: '/images/petiteParis/petiteParis.jpg',
    images: gallery('petiteParis', ['petiteParis.jpg', 'petiteParis2.jpg']),
    description: 'My friend went to Vimy to visit the memorial for his great grandfather and I wandered around Paris by myself. It was the first time I was in France, I gave myself courage to feel comfortable being with myself, and take in the scenery that I had once in my life to visit. At the Petite Paris by Louvre, I was mesmorized by the flower arrangements, so I sat behind a bench - not on the bench but behind it, and painted this.'
  },
  {
    id: 'harbourfront',
    category: 'open-edition-prints',
    title: 'Harbourfront',
    size: ['8x10'],
    framedSize: 'TBD',
    date: '2023-07-18',
    image: '/images/harbourfront/harbourfront.jpg',
    images: gallery('harbourfront', ['harbourfront.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'signalHill',
    category: 'open-edition-prints',
    title: 'Signal Hill',
    size: ['5x7'],
    framedSize: 'TBD',
    date: '2024-03-11',
    image: '/images/signalHill/signalHill.jpg',
    images: gallery('signalHill', ['signalHill.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'chateauDeVersailles',
    category: 'open-edition-prints',
    title: 'Château de Versailles',
    size: ['17x22'],
    framedSize: 'TBD',
    date: '2023-10-01',
    image: '/images/chateauDeVersailles/chateauDeVersailles.jpg',
    images: gallery('chateauDeVersailles', ['chateauDeVersailles.jpg', 'chateauDeVersailles2.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'peleeIsland',
    category: 'open-edition-prints',
    title: 'Pelee Island',
    size: ['17x22'],
    framedSize: 'TBD',
    date: '2024-04-01',
    image: '/images/peleeIsland/peleeIsland.jpg',
    images: gallery('peleeIsland', ['peleeIsland.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'marshallLake',
    category: 'open-edition-prints',
    title: 'Marshall Lake',
    size: ['17x22'],
    framedSize: 'TBD',
    date: '2024-04-01',
    image: '/images/marshallLake/marshallLake.jpg',
    images: gallery('marshallLake', ['marshallLake.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'neckPoint',
    category: 'open-edition-prints',
    title: 'Neck Point',
    size: ['17x22'],
    framedSize: 'TBD',
    date: '2024-04-01',
    image: '/images/neckPoint/neckPoint.jpg',
    images: gallery('neckPoint', ['neckPoint.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'petiteParis',
    category: 'open-edition-prints',
    title: 'Petite Paris',
    size: ['17x22'],
    framedSize: 'TBD',
    date: '2024-04-01',
    image: '/images/petiteParis/petiteParis.jpg',
    images: gallery('petiteParis', ['petiteParis.jpg']),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  }
]

export const items = rawItems.map((item) => {
  const variants = buildPrintVariants(item)
  return {
    ...item,
    slug: item.id,
    defaultVariantId: variants?.[0]?.id || item.id,
    variants,
    images: normalizeImages(item.image, item.images),
  }
})

    // description: 'During my studies in college, we didn\'t have a lot free time to do anything other than studying. Friends enjoyed each other\'s company in the cafetria and classrooms - whispering unrelated subjects that annoyed the other classmates a bit too much. We decided to do a picnic for once and went to the river bank by Columbia Lake. It was a nice get away from the busy campus life, and really enjoyed the nature as we should be.'
// 
