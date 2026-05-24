function getImagesForDir(dir) {
  const allImages = import.meta.glob('/images/*/*.jpg', { eager: true, query: '?url', import: 'default' });
  return Object.entries(allImages)
    .filter(([path]) => path.includes(`/images/${dir}/`))
    .map(([, url]) => url)
    .sort(); // Sort for consistent order
}

const rawItems = [
  {
    id: 'dreamLake',
    category: 'originals',
    title: 'Dream Lake',
    size: '8x10',
    framedSize: 'TBD',
    date: '2024-06-01',
    image: '/images/dreamLake/dreamLake.jpg',
    images: getImagesForDir('dreamLake'),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'signalHill',
    category: 'originals',
    title: 'Signal Hill',
    size: '8x10',
    framedSize: 'TBD',
    date: '2024-05-10',
    image: '/images/signalHill/signalHill.jpg',
    images: getImagesForDir('signalHill'),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'bourtonOnTheWater',
    category: 'originals',
    title: 'Bourton-on-the-Water',
    size: '8x10',
    framedSize: 'TBD',
    date: '2024-04-22',
    image: '/images/bourtonOnTheWater/bourtonOnTheWater.jpg',
    images: getImagesForDir('bourtonOnTheWater'),
    description: 'It was a peaceful, sunny day during my graduation trip to England, the Coltwolds looked like a dream from centuries ago. Some sheeps grazing on the farm, and some were laying down underneath the giant trees avoiding the sun. Nothing was noisy, my friend and I decided to explore separately. I chose to sit on a bench by the river and captured the history of this old town, listening to the water flowing. The most interesting encounter was a father wanted his daughter to look at me painting for 5 minutes shouting in the background, but the daughter was so unbothered and just wanted to be gone.'
  },
  {
    id: 'chateauDeVersailles',
    category: 'originals',
    title: 'Château De Versailles',
    size: '8x10',
    framedSize: 'TBD',
    date: '2023-11-15',
    image: '/images/chateauDeVersailles/chateauDeVersailles.jpg',
    images: getImagesForDir('chateauDeVersailles'),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'universityOfDenver:limited-edition-prints:5x7',
    category: 'limited-edition-prints',
    title: 'University of Denver',
    size: '5x7',
    framedSize: 'TBD',
    date: '2024-01-05',
    image: '/images/universityOfDenver/universityOfDenver.jpg',
    images: getImagesForDir('universityOfDenver'),
    description: 'My friend and I were waiting for the concert to begin and decided to drive to Denver earlier to avoid the traffic. The University of Denver was just a compacted size, with white and red lounge chairs scattered around. The accent colors popped among the trees. I hid underneath a leafy one and made 1 red chair to be my main subject.'
  },
  {
    id: 'dakotaRidgePark:limited-edition-prints:8x10',
    category: 'limited-edition-prints',
    title: 'Dakota Ridge Park',
    size: '8x10',
    framedSize: 'TBD',
    date: '2023-08-09',
    image: '/images/dakotaRidgePark/dakotaRidgePark.jpg',
    images: getImagesForDir('dakotaRidgePark'),
    description: 'How do you recognize beauty in everyday life? That\'s a question we should all ask ourselves, to appreciate the things we take for granted and feel at peace with our surroundings. What did I see in the playground in and "uneventful" day? It was a swing sets that offered joy to children (and myself) with trees that make us be able to breathe in a beautiful happy afternoon.'
  },
  {
    id: 'lakeOfTwoRivers:limited-edition-prints:24x36',
    category: 'limited-edition-prints',
    title: 'Lake of Two Rivers',
    size: '24x36',
    framedSize: 'TBD',
    date: '2024-02-20',
    image: '/images/lakeOfTwoRivers/lakeOfTwoRivers.jpg',
    images: getImagesForDir('lakeOfTwoRivers'),
    description: 'During my studies in college, we didn\'t have a lot free time to do anything other than studying. Friends enjoyed each other\'s company in the cafetria and classrooms - whispering unrelated subjects that annoyed the other classmates a bit too much. We decided to do a picnic for once and went to the river bank by Columbia Lake. It was a nice get away from the busy campus life, and really enjoyed the nature as we should be.'
  },
  {
    id: 'petiteParis:limited-edition-prints:24x36',
    category: 'limited-edition-prints',
    title: 'Petite Paris',
    size: '24x36',
    framedSize: 'TBD',
    date: '2023-12-02',
    image: '/images/petiteParis/petiteParis.jpg',
    images: getImagesForDir('petiteParis'),
    description: 'My friend went to Vimy to visit the memorial for his great grandfather and I wandered around Paris by myself. It was the first time I was in France, I gave myself courage to feel comfortable being with myself, and take in the scenery that I had once in my life to visit. At the Petite Paris by Louvre, I was mesmorized by the flower arrangements, so I sat behind a bench - not on the bench but behind it, and painted this.'
  },
  {
    id: 'harbourfront:open-edition-prints:8x10',
    category: 'open-edition-prints',
    title: 'Harbourfront',
    size: '8x10',
    framedSize: 'TBD',
    date: '2023-07-18',
    image: '/images/harbourfront/harbourfront.jpg',
    images: getImagesForDir('harbourfront'),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'signalHill:open-edition-prints:5x7',
    category: 'open-edition-prints',
    title: 'Signal Hill',
    size: '5x7',
    framedSize: 'TBD',
    date: '2024-03-11',
    image: '/images/signalHill/signalHill.jpg',
    images: getImagesForDir('signalHill'),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'chateauDeVersailles:open-edition-prints:17x22',
    category: 'open-edition-prints',
    title: 'Château de Versailles',
    size: '17x22',
    framedSize: 'TBD',
    date: '2023-10-01',
    image: '/images/chateauDeVersailles/chateauDeVersailles.jpg',
    images: getImagesForDir('chateauDeVersailles'),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  },
  {
    id: 'peleeIsland:open-edition-prints:17x22',
    category: 'open-edition-prints',
    title: 'Pelee Island',
    size: '17x22',
    framedSize: 'TBD',
    date: '2024-04-01',
    image: '/images/peleeIsland/peleeIsland.jpg',
    images: getImagesForDir('peleeIsland'),
    description: 'A layered and expressive composition with tonal shifts and deliberate brush texture.'
  }
]

export const items = rawItems

    // description: 'During my studies in college, we didn\'t have a lot free time to do anything other than studying. Friends enjoyed each other\'s company in the cafetria and classrooms - whispering unrelated subjects that annoyed the other classmates a bit too much. We decided to do a picnic for once and went to the river bank by Columbia Lake. It was a nice get away from the busy campus life, and really enjoyed the nature as we should be.'
// 