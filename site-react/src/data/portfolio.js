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

const originals = [
  {
    id: 'test2Original',
    category: 'originals',
    type: 'Plein Air',
    title: 'test',
    size: '7.32"x9.96"',
    framedSize: '8.86"x10.83"',
    medium: 'Watercolor and pencil on paper',
    date: '2022-07-16',
    location: 'St John\'s, Newfoundland, Canada',
    image: '/images/signalHill/signalHill.jpg',
    images: gallery('signalHill', ['signalHill.jpg', 'signalHill2.jpg']),
    description: 'Life, work, and relationships were slowly wearing me down — so I made the decision to take my first solo trip to the east coast of Canada. Solitude is terrifying, yet it offers something irreplaceable: the unhurried introspective moments to get to know yourself better. I climbed the road\'s edge to visit the old landmark of St John\'s - Signal Hill. I sat in the endless sweep of grass, watching ships pass in and out of the harbour, humpbacks float up and down the ocean — just like what the landmark has done for over 350 years.'
  },  
  {
    id: 'test3Original',
    category: 'originals',
    type: 'Plein Air',
    title: 'test',
    size: '7.32"x9.96"',
    framedSize: '8.86"x10.83"',
    medium: 'Watercolor and pencil on paper',
    date: '2022-07-16',
    location: 'St John\'s, Newfoundland, Canada',
    image: '/images/signalHill/signalHill.jpg',
    images: gallery('signalHill', ['signalHill.jpg', 'signalHill2.jpg']),
    description: 'Life, work, and relationships were slowly wearing me down — so I made the decision to take my first solo trip to the east coast of Canada. Solitude is terrifying, yet it offers something irreplaceable: the unhurried introspective moments to get to know yourself better. I climbed the road\'s edge to visit the old landmark of St John\'s - Signal Hill. I sat in the endless sweep of grass, watching ships pass in and out of the harbour, humpbacks float up and down the ocean — just like what the landmark has done for over 350 years.'
  },  
  {
    id: 'signalHill',
    category: 'originals',
    type: 'Plein Air',
    title: 'Signal Hill',
    size: '7.32"x9.96"',
    framedSize: '8.86"x10.83"',
    medium: 'Watercolor and pencil on paper',
    date: '2022-07-16',
    location: 'St John\'s, Newfoundland, Canada',
    image: '/images/signalHill/signalHill.jpg',
    images: gallery('signalHill', ['signalHill.jpg', 'signalHill2.jpg']),
    description: 'Life, work, and relationships were slowly wearing me down — so I made the decision to take my first solo trip to the east coast of Canada. Solitude is terrifying, yet it offers something irreplaceable: the unhurried introspective moments to get to know yourself better. I climbed the road\'s edge to visit the old landmark of St John\'s - Signal Hill. I sat in the endless sweep of grass, watching ships pass in and out of the harbour, humpbacks float up and down the ocean — just like what the landmark has done for over 350 years.'
  },  
  {
    id: 'waldenPonds',
    category: 'originals',
    type: 'Plein Air',
    title: 'Walden Ponds',
    size: '7.4"x10.63"',
    framedSize: 'will be determined by the artist once the order is placed.',
    medium: 'Watercolor and pencil on paper',
    date: '2024-09-28',
    location: 'Boulder, Colorado, USA',
    image: '/images/waldenPonds/waldenPonds.jpg',
    images: gallery('waldenPonds', ['waldenPonds.jpg']),
    description: 'Walden Ponds Wildlife Habitat unfolds as a series of quiet pools scattered across Boulder\'s edge. A family of geese claimed the first; more had settled in the second, unhurried and entirely unbothered by my arrival. For once, there was a bench — positioned as though someone had known exactly where to place it for the best views. The sunlight had chosen one patch of water and was doing something extraordinary with it.'
  },
  {
    id: 'goreCreek',
    category: 'originals',
    type: 'Plein Air',
    title: 'Gore Creek',
    size: '7.44"x10.04"',
    framedSize: 'will be determined by the artist once the order is placed.',
    medium: 'Watercolor and pencil on paper',
    date: '2024-10-07',
    location: 'Vail, Colorado, USA',
    image: '/images/goreCreek/goreCreek.jpg',
    images: gallery('goreCreek', ['goreCreek.png']),
    description: 'Vail — the reputation of this town travels far. I went there not for the snow, but for the aspen trees in fall. Layers of evergreen pressed in around them, creating depth and a palette of colours, all of it reflected perfectly in the creek. I sat watching the people fishing, half-listening to the birds.'
  },
  // {
  //   id: 'dreamLake',
  //   category: 'originals',
  //   type: 'Plein Air',
  //   title: 'Dream Lake',
  //   size: '7.48"x9.45"',
  //   framedSize: '9.25"x11.81"',
  //   medium: 'Watercolor and pencil on paper',
  //   date: '2024-09-08',
  //   location: 'Rocky Mountain National Park, Colorado, USA',
  //   image: '/images/dreamLake/dreamLake.jpg',
  //   images: gallery('dreamLake', ['dreamLake.jpg', 'dreamLake2.jpg']),
  //   description: 'It was the first time I set foot in Rocky Mountain National Park — a place that would later become my refuge for two years. Sitting beside the lake, I watched clouds veil the sun and bring down the snowflakes of September, accompanied by a group of chipmunks awaiting their familiar feast. It felt like slipping into a dream just like its name..'
  // },
  {
    id: 'grossReservoir',
    category: 'originals',
    type: 'Studio',
    title: 'Gross Reservoir',
    size: '7.5"x11"',
    framedSize: 'will be determined by the artist once the order is placed.',
    medium: 'Watercolor and pencil on paper',
    date: '2026-03',
    location: 'Boulder County, Colorado, USA',
    image: '/images/grossReservoir/grossReservoir.png',
    images: gallery('grossReservoir', ['grossReservoir.png']),
    description: 'I was captivated by the light filtering through the trees and reflecting off the creek, softened by the water vapor hanging in the air. The atmosphere felt dreamlike — still and undisturbed. I brought some photographs back to the studio and worked up this study.'
  },
  {
    id: 'bourtonOnTheWater',
    category: 'originals',
    type: 'Plein Air',
    title: 'Bourton-on-the-Water',
    size: '5.35"x7.64"',
    framedSize: 'comes in a 8×10 frame — style is artist\'s choice and may vary from shown.',
    medium: 'Watercolor and pencil on paper',
    date: '2024-05-31',
    location: 'Bourton-on-the-Water, England',
    image: '/images/bourtonOnTheWater/bourtonOnTheWater.jpg',
    images: gallery('bourtonOnTheWater', ['bourtonOnTheWater.jpg', 'bourtonOnTheWater2.jpg']),
    description: 'It was a peaceful, sunny day during my graduation trip to England, the Coltwolds looked like a dream from centuries ago. Some sheeps were grazing on the farm, and some were laying down in a circle underneath the giant trees avoiding the sun. My friend and I parted ways to wander separately. I chose a bench beside the river and captured the history of this old town, listening to the water flowing. My most cherished encounter: a father urging his daughter for five whole minutes to watch me paint, while she remained entirely unmoved and longed to be anywhere else.'
  },
  {
    id: 'chateauDeVersailles',
    category: 'originals',
    type: 'Plein Air',
    title: 'Château De Versailles',
    size: '5.2"x7.48"',
    framedSize: 'comes in a 8×10 frame — style is artist\'s choice and may vary from shown.',
    medium: 'Watercolor and pencil on paper',
    date: '2024-06-02',
    location: 'Chateau De Versailles, France',
    image: '/images/chateauDeVersailles/chateauDeVersailles.jpg',
    images: gallery('chateauDeVersailles', ['chateauDeVersailles.jpg', 'chateauDeVersailles2.jpg']),
    description: 'The day was warm and filled with light. In front of the palace, families had spread themselves across the lawns with their picnics, and ducks claimed the Grand Canal as their own lunch spot. A little girl was very curious about the painting, but was too shy to ask — until her mother approached politely. Neither of us spoke the other\'s language, yet we shared a moment of warmth and kindness through the canvas between us.'
  },
   {
    id: 'rooseveltPark',
    category: 'originals',
    type: 'Plein Air',
    title: 'Roosevelt Park',
    size: '7.48"x10.63"',
    framedSize: '9.21"x11.81"',
    medium: 'Watercolor and pencil on paper',
    date: '2024-09-15',
    location: 'Longmont, CO, USA',
    image: '/images/rooseveltPark/rooseveltPark.jpg',
    images: gallery('rooseveltPark', ['rooseveltPark.jpg', 'rooseveltPark2.jpg', 'rooseveltPark3.jpg']),
    description: 'It was a pleasure to be joining the Artists\' Guild for a get together in Roosevelt Park. I was most fond of the flora beautifully arranged in the garden, and the way the man made objects interwined with nature. As usual, I sat on the ground and let the scene come to me.',
  },
  // {
  //   id: 'standleyPark',
  //   category: 'originals',
  //   type: 'Plein Air',
  //   title: 'Standley Park',
  //   size: '8x10',
  //   framedSize: 'TBD',
  //   date: '2023-11-15',
  //   image: '/images/standleyPark/standleyPark.jpg',
  //   images: gallery('standleyPark', ['standleyPark.jpg']),
  //   description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  // },
  {
    id: 'lakeOfTwoRivers',
    category: 'originals',
    type: 'Plein Air',
    title: 'Lake of Two Rivers',
    size: '5.12"x7.32"',
    framedSize: '8.86"x10.83"',
    medium: 'Watercolor on paper',
    date: '2023-08-28',
    location: 'Algonquin Provincial Park, Ontario, Canada',
    image: '/images/lakeOfTwoRivers/lakeOfTwoRivers.jpg',
    images: gallery('lakeOfTwoRivers', ['lakeOfTwoRivers.jpg', 'lakeOfTwoRivers2.jpg']),
    description: 'We happened upon a quiet beach in the late afternoon — a canoe resting on the shore, unattended, untethered. As the sun descended, I watched the small waves nudge it again and again, and felt something like loneliness settle over the scene. Would it feel abandoned when it\'s dark? Or perhaps I was the one projecting — perhaps it was entirely in its element, having the time of its life, content with the solitude I had yet to make peace with.'
  },
  {
    id: 'oxenPond',
    category: 'originals',
    type: 'Plein Air',
    title: 'Oxen Pond',
    size: '7.32"x9.88"',
    framedSize: '9.25"x11.77"',
    medium: 'Watercolor and pencil on paper',
    date: '2022-07-10',
    location: 'St John\'s, Newfoundland, Canada',
    image: '/images/oxenPond/oxenPond.jpg',
    images: gallery('oxenPond', ['oxenPond.jpg', 'oxenPond2.jpg']),
    description: 'The sun was beaming down on the pond, and I must have stilled myself enough to watch a group of ducks edge toward the shore and gather near my feet, unbothered. Some dove beneath the surface to graze on algae; others simply rested. I captured one of them with their head submerged and their butt skyward, it was such an adorable scene to watch.'
  },
  {
    id: 'pacificBeach',
    category: 'originals',
    type: 'Plein Air',
    title: 'Pacific Beach',
    size: '7.4"x10"',
    framedSize: 'comes in a 8×10 frame — style is artist\'s choice and may vary from shown.',
    medium: 'Watercolor and pencil on paper',
    date: '2025-05-26',
    location: 'San Diego, California, USA',
    image: '/images/pacificBeach/pacificBeach.jpg',
    images: gallery('pacificBeach', ['pacificBeach.jpg', 'pacificBeach2.jpg']),
    description: 'My friends insisted I experience La Jolla and Pacific Beach — a proper initiation into San Diego\'s coastal world. We settled on the sand together, and I sat on the edge of a beach towel, very aware of being the third wheel. Still, the deck floated out there amid the turqoise water and the cloudless sky — and I was, quietly, impossibly glad to be there.'
  },
  {
    id: 'majorsHillPark',
    category: 'originals',
    type: 'Plein Air',
    title: 'Major\'s Hill Park',
    size: '7.36"x10.24"',
    framedSize: '9.21"x11.81"',
    medium: 'Watercolor and pencil on paper',
    date: '2023-08-27',
    location: 'Ottawa, Ontario, Canada',
    image: '/images/majorsHillPark/majorsHillPark2.jpg',
    images: gallery('majorsHillPark', ['majorsHillPark2.jpg']),
    description: 'From Major\'s Hill Park in the heart of the capital of Canada, the Parliament Buildings emerged through the canopy — majestic and half-disclosed. People had gathered in clusters on the grass, taking in the sunlight and the breeze. I found myself in unexpected company: another plein air painter, working the same light.'
  },
  {
    id: 'tobermory',
    category: 'originals',
    type: 'Plein Air',
    title: 'Tobermory',
    size: '7.24"x10.08"',
    framedSize: 'comes in a 8×10 frame — style is artist\'s choice and may vary from shown.',
    medium: 'Watercolor and pencil on paper',
    date: '2023-11-15',
    location: 'Tobermory, Ontario, Canada',
    image: '/images/tobermory/tobermory.jpg',
    images: gallery('tobermory', ['tobermory.jpg']),
    description: 'The duck kept approaching me, convinced my watercolor palette was food. This painting is about that particular one—marching over with absolute confidence, ready for a feast.'
  },
]

const limitedEditionPrints = [
  // {
  //   id: 'universityOfDenver',
  //   category: 'limited-edition-prints',
  //   title: 'University of Denver',
  //   size: ['8x10', '17x22'],
  //   date: '2024-11-15',
  //   location: 'Denver, Colorado, USA',
  //   image: '/images/universityOfDenver/universityOfDenver.jpg',
  //   images: gallery('universityOfDenver', ['universityOfDenver.jpg', 'universityOfDenver2.jpg']),
  //   description: 'My friend and I arrived early to Denver to slip ahead of the traffic before the concert. The University of Denver surprised me — intimate in scale, with white and red lounge chairs scattered across the grounds like punctuation among the trees. The accent colours caught the afternoon light with quiet confidence. I found shelter beneath a full-leafed canopy and let one red chair become the whole story.'
  // },
  {
    id: 'mountSanitas',
    category: 'limited-edition-prints',
    title: 'Mount Sanitas | Set of 2 Panels',
    size: ['8x10', '17x22'],
    date: '2024-11-15',
    location: 'Boulder, Colorado, USA',
    image: '/images/mountSanitas/mountSanitas4.png',
    images: gallery('mountSanitas', ['mountSanitas4.png', 'mountSanitas2.png']),
    note: 'Important note: This panoramic landscape was originally painted as a continuous diptych and is faithfully reproduced in its authentic, two-panel format. Each order includes the full two-print collection, with each individual panel meeting the precise measurements listed above. The large print is approximately 46" Wide × 17" High on your wall assuming a 2" gap, while the smaller print is 22" Wide × 8" High.',
    description: 'Something about Colorado makes people move as though stillness would be a waste. The trail runners I met on Mount Sanitas were already on their second lap by the time I was halfway through my first — grinning, effortless, greeted me for a second hello before they were gone again. I never did find a place to sit on top of the mountain. So I borrowed the runner\'s resiliency instead: I squatted the whole time I painted, and the view asked nothing more of me than that.'
  },
  {
    id: 'testLimited2',
    category: 'limited-edition-prints',
    title: 'Mount Sanitas | Set of 2 Panels',
    size: ['8x10', '17x22'],
    date: '2024-11-15',
    location: 'Boulder, Colorado, USA',
    image: '/images/mountSanitas/mountSanitas4.png',
    images: gallery('mountSanitas', ['mountSanitas4.png', 'mountSanitas2.png']),
    note: 'Important note: This panoramic landscape was originally painted as a continuous diptych and is faithfully reproduced in its authentic, two-panel format. Each order includes the full two-print collection, with each individual panel meeting the precise measurements listed above. The large print is approximately 46" Wide × 17" High on your wall assuming a 2" gap, while the smaller print is 22" Wide × 8" High.',
    description: 'Something about Colorado makes people move as though stillness would be a waste. The trail runners I met on Mount Sanitas were already on their second lap by the time I was halfway through my first — grinning, effortless, greeted me for a second hello before they were gone again. I never did find a place to sit on top of the mountain. So I borrowed the runner\'s resiliency instead: I squatted the whole time I painted, and the view asked nothing more of me than that.'
  },
]

const openEditionPrints = [
  {
    id: 'dreamLake',
    category: 'open-edition-prints',
    title: 'Dream Lake',
    size: ['8x10', '11x17','13x19', '17x22'],
    date: '2024-09-08',
    location: 'Rocky Mountain National Park, Colorado, USA',
    image: '/images/dreamLake/dreamLake.jpg',
    images: gallery('dreamLake', ['dreamLake.jpg', 'dreamLake2.jpg']),
    description: 'It was the first time I set foot in Rocky Mountain National Park — a place that would later become my refuge for two years. Sitting beside the lake, I watched clouds veil the sun and bring down the snowflakes of September, accompanied by a group of chipmunks awaiting their familiar feast. It felt like slipping into a dream just like its name..'
  },
  {
    id: 'peleeIsland',
    category: 'open-edition-prints',
    title: 'Pelee Island',
    size: ['5x7','8x10','11x17','17x22'],
    date: '2024-05-19',
    location: 'Pelee Island, Ontario, Canada',
    image: '/images/peleeIsland/peleeIsland.jpg',
    images: gallery('peleeIsland', ['peleeIsland.jpg']),
    description: 'Have you ever watched a snake move through water — that fluid, impossible velocity? Sitting on the dock, I was startled at first by the little creatures swimming past. But they were entirely indifferent to me, absorbed in their own busy lives. I was quite comfortable being the invisible observer: fish, herons, snakes, muskrats, and the lighthouse dissolving in the distance. Silence, when you let it, becomes the most profound form of connection with the world.'
  },
  {
    id: 'waldenPonds',
    category: 'open-edition-prints',
    title: 'Walden Ponds',
    size: ['8x10', '11x17','13x19'],
    date: '2024-09-28',
    location: 'Boulder, Colorado, USA',
    image: '/images/waldenPonds/waldenPonds.jpg',
    images: gallery('waldenPonds', ['waldenPonds.jpg']),
    description: 'Walden Ponds Wildlife Habitat unfolds as a series of quiet pools scattered across Boulder\'s edge. A family of geese claimed the first; more had settled in the second, unhurried and entirely unbothered by my arrival. For once, there was a bench — positioned as though someone had known exactly where to place it for the best views. The sunlight had chosen one patch of water and was doing something extraordinary with it.'
  },
  {
    id: 'goreCreek',
    category: 'open-edition-prints',
    title: 'Gore Creek',
    size: ['8x10', '11x17','13x19'],
    date: '2024-10-07',
    location: 'Vail, Colorado, USA',
    image: '/images/goreCreek/goreCreek.jpg',
    images: gallery('goreCreek', ['goreCreek.png']),
    description: 'Vail — the reputation of this town travels far. I went there not for the snow, but for the aspen trees in fall. Layers of evergreen pressed in around them, creating depth and a palette of colours, all of it reflected perfectly in the creek. I sat watching the people fishing, half-listening to the birds.'
  },
  {
    id: 'theLaughingGoat',
    category: 'open-edition-prints',
    title: 'The Laughing Goat',
    size: ['8x10', '11x17','13x19'],
    date: '2024-08',
    location: 'Boulder, Colorado, USA',
    image: '/images/theLaughingGoat/theLaughingGoat.jpg',
    description: 'I wandered into a busy café in the heart of downtown Boulder and immediately fell in love with its warm wooden interiors and earthy tones. I settled into a corner seat, where I could take in the entire café at once. A man beside me spent the morning in meetings, becoming an unexpected companion to my painting session.' 
  },
  {
    id: 'dakotaRidgePark',
    category: 'open-edition-prints',
    title: 'Dakota Ridge Park',
    size: ['5x7','8x10', '11x17'],
    date: '2024-10-09',
    location: 'Boulder, Colorado, USA',
    image: '/images/dakotaRidgePark/dakotaRidgePark.jpg',
    images: gallery('dakotaRidgePark', ['dakotaRidgePark.jpg']),
    description: 'How do you recognize beauty in everyday life? That\'s a question we should all ask ourselves, to appreciate the things we take for granted and feel at peace with our surroundings. What did I see in the playground in an "uneventful" day? A swing set that offered joy to children with trees breathing quietly overhead, in a beautiful happy afternoon.',
  },
  {
    id: 'bourtonOnTheWater',
    category: 'open-edition-prints',
    title: 'Bourton-on-the-Water',
    size: ['5x7','8x10'],
    medium: 'Watercolor and pencil on paper',
    date: '2024-05-31',
    location: 'Bourton-on-the-Water, England',
    image: '/images/bourtonOnTheWater/bourtonOnTheWater.jpg',
    images: gallery('bourtonOnTheWater', ['bourtonOnTheWater.jpg', 'bourtonOnTheWater2.jpg']),
    description: 'It was a peaceful, sunny day during my graduation trip to England, the Coltwolds looked like a dream from centuries ago. Some sheeps were grazing on the farm, and some were laying down in a circle underneath the giant trees avoiding the sun. My friend and I parted ways to wander separately. I chose a bench beside the river and captured the history of this old town, listening to the water flowing. My most cherished encounter: a father urging his daughter for five whole minutes to watch me paint, while she remained entirely unmoved and longed to be anywhere else.'
  },
  {
    id: 'lakeOfTwoRivers',
    category: 'open-edition-prints',
    title: 'Lake of Two Rivers',
    size: ['5x7','8x10', '11x17'],
    date: '2023-08-28',
    medium: 'Watercolor on paper',
    location: 'Algonquin Provincial Park, Ontario, Canada',
    image: '/images/lakeOfTwoRivers/lakeOfTwoRivers.jpg',
    images: gallery('lakeOfTwoRivers', ['lakeOfTwoRivers.jpg']),
    description: 'We happened upon a quiet beach in the late afternoon — a canoe resting on the shore, unattended, untethered. As the sun descended, I watched the small waves nudge it again and again, and felt something like loneliness settle over the scene. Would it feel abandoned when it\'s dark? Or perhaps I was the one projecting — perhaps it was entirely in its element, having the time of its life, content with the solitude I had yet to make peace with.'
  },
  {
    id: 'chateauDeVersailles',
    category: 'open-edition-prints',
    title: 'Château De Versailles',
    size: ['5x7','8x10'],
    medium: 'Watercolor and pencil on paper',
    date: '2024-06-02',
    location: 'Chateau De Versailles, France',
    image: '/images/chateauDeVersailles/chateauDeVersailles.jpg',
    images: gallery('chateauDeVersailles', ['chateauDeVersailles.jpg', 'chateauDeVersailles2.jpg']),
    description: 'The day was warm and filled with light. In front of the palace, families had spread themselves across the lawns with their picnics, and ducks claimed the Grand Canal as their own lunch spot. A little girl was very curious about the painting, but was too shy to ask — until her mother approached politely. Neither of us spoke the other\'s language, yet we shared a moment of warmth and kindness through the canvas between us.'
  },
    // description: 'During my studies in college, we didn\'t have a lot free time to do anything other than studying. Friends enjoyed each other\'s company in the cafetria and classrooms - whispering unrelated subjects that annoyed the other classmates a bit too much. We decided to do a picnic for once and went to the river bank by Columbia Lake. It was a nice get away from the busy campus life, and really enjoyed the nature as we should be.'
  {
    id: 'petitPalais',
    category: 'open-edition-prints',
    title: 'Petit Palais',
    size: ['5x7','8x10'],
    date: '2024-06-03',
    location: 'Paris, France',
    image: '/images/petitPalais/petitPalais.jpg',
    images: gallery('petitPalais', ['petitPalais.jpg', 'petitPalais2.jpg']),
    description: 'My friend had gone to Vimy to visit the memorial for his great-grandfather, and I was left to wander Paris alone — my first time in France. I gave myself courage to feel comfortable being with myself, and absorb what I might only ever witness once. At the Petit Palais near the Louvre, the flower arrangements stilled me completely. I sat not on the bench but behind it, and painted from there.'
  },
  {
    id: 'rooseveltPark',
    category: 'open-edition-prints',
    title: 'Roosevelt Park',
    size: ['8x10', '11x17','13x19'],
    medium: 'Watercolor and pencil on paper',
    date: '2024-09-15',
    location: 'Longmont, CO, USA',
    image: '/images/rooseveltPark/rooseveltPark.jpg',
    images: gallery('rooseveltPark', ['rooseveltPark.jpg', 'rooseveltPark2.jpg', 'rooseveltPark3.jpg']),
    description: 'It was a pleasure to be joining the Artists\' Guild for a get together in Roosevelt Park. I was most fond of the flora beautifully arranged in the garden, and the way the man made objects interwined with nature. As usual, I sat on the ground and let the scene come to me.',
  },
  {
    id: 'oxenPond',
    category: 'open-edition-prints',
    title: 'Oxen Pond',
    size: ['8x10', '11x17','13x19', '17x22'],
    medium: 'Watercolor and pencil on paper',
    date: '2022-07-10',
    location: 'St John\'s, Newfoundland, Canada',
    image: '/images/oxenPond/oxenPond.jpg',
    images: gallery('oxenPond', ['oxenPond.jpg', 'oxenPond2.jpg']),
    description: 'The sun was beaming down on the pond, and I must have stilled myself enough to watch a group of ducks edge toward the shore and gather near my feet, unbothered. Some dove beneath the surface to graze on algae; others simply rested. I captured one of them with their head submerged and their butt skyward, it was such an adorable scene to watch.'
  },
  {
    id: 'harbourfront',
    category: 'open-edition-prints',
    title: 'Harbourfront',
    size: ['5x7','8x10'],
    date: '2023',
    location: 'Toronto, Ontario, Canada',
    image: '/images/harbourfront/harbourfront.jpg',
    images: gallery('harbourfront', ['harbourfront.jpg']),
    description: 'Just beside the Terry Fox Mile Zero memorial, a girl lay stretched out on the deck while I sat on a nearby bench. The statue of Terry Fox cast a quiet solemnity over the harbour — and over me. Overlooking the Atlantic, St. John\'s was where he began his cross-Canada run: a man who chose, against every limit, how to live. I found myself pondering over that for a long time.'
  },
  {
    id: 'signalHill',
    category: 'open-edition-prints',
    title: 'Signal Hill',
    size: ['8x10', '11x17','13x19'],
    date: '2022-07-16',
    location: 'St John\'s, Newfoundland, Canada',
    image: '/images/signalHill/signalHill.jpg',
    images: gallery('signalHill', ['signalHill.jpg']),
    description: 'Life, work, and relationships were slowly wearing me down — so I made the decision to take my first solo trip to the east coast of Canada. Solitude is terrifying, yet it offers something irreplaceable: the unhurried introspective moments to get to know yourself better. I climbed the road\'s edge to visit the old landmark of St John\'s - Signal Hill. I sat in the endless sweep of grass, watching ships pass in and out of the harbour, humpbacks float up and down the ocean — just like what the landmark has done for over 350 years.'
  },
  {
    id: 'marshallLake',
    category: 'open-edition-prints',
    title: 'Marshall Lake',
    size: ['5x7','8x10'],
    date: '2024-11-17',
    location: 'Boulder, Colorado, USA',
    image: '/images/marshallLake/marshallLake.jpg',
    images: gallery('marshallLake', ['marshallLake.jpg']),
    description: 'If you were to ask me to summarize Colorado in three colors, I would tell you: yellow, blue, with a splash of green. Vast fields of golden grass stretch beneath an open blue sky, while endless evergreens climb the mountains in the distance. I love that yellow so much—it\'s a landscape I rarely encounter in the other places I\'ve frequented. I found the perfect spot by the lake, nestled among the grass, to spend a morning reading and painting.'
  },
  {
    id: 'neckPoint',
    category: 'open-edition-prints',
    title: 'Neck Point',
    size: ['8x10', '11x17','13x19'],
    date: '2022-08-29',
    location: 'Nanaimo, British Columbia, Canada',
    image: '/images/neckPoint/neckPoint.jpg',
    images: gallery('neckPoint', ['neckPoint.jpg']),
    description: 'If you ask me the finest place in British Columbia, I will always say Vancouver Island. Something shifts when you cross the strait from the mainland — the air loosens, the pace unravels. Water has run through so much of my work; I\'m drawn to its softness and its force in equal measure. My friends set off on the trail while I stayed behind to sit with the water, which has always been enough.'
  },
]

const rawItems = [
  ...originals,
  ...limitedEditionPrints,
  ...openEditionPrints,
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
