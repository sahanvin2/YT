// Level 1 - Main Categories
export const MAIN_CATEGORIES = [
  { id: 'movies', name: 'Movies', icon: '🎬' },
  { id: 'series', name: 'Series', icon: '📺' },
  { id: 'documentaries', name: 'Documentaries', icon: '🎥' },
  { id: 'animation', name: 'Animation', icon: '🎨' }
];

// Level 2 - Genres (Movie Genres - Complete List)
export const GENRES = [
  { id: 'action', name: 'Action', description: 'Fights, chases, explosions' },
  { id: 'adventure', name: 'Adventure', description: 'Journeys, quests, exploration' },
  { id: 'comedy', name: 'Comedy', description: 'Humor, entertainment' },
  { id: 'drama', name: 'Drama', description: 'Emotional, serious storytelling' },
  { id: 'horror', name: 'Horror', description: 'Fear, suspense, supernatural' },
  { id: 'thriller', name: 'Thriller', description: 'Tension, twists, danger' },
  { id: 'romance', name: 'Romance', description: 'Love and relationships' },
  { id: 'science-fiction', name: 'Science Fiction', description: 'Future tech, space, AI' },
  { id: 'fantasy', name: 'Fantasy', description: 'Magic, imaginary worlds' },
  { id: 'mystery', name: 'Mystery', description: 'Investigation, secrets' },
  { id: 'crime', name: 'Crime', description: 'Criminal activity, law enforcement' },
  { id: 'animation', name: 'Animation', description: 'Animated storytelling' },
  { id: 'family', name: 'Family', description: 'Suitable for all ages' },
  { id: 'documentary', name: 'Documentary', description: 'Real events, factual' },
  { id: 'biography', name: 'Biography', description: 'Real person\'s life' },
  { id: 'war', name: 'War', description: 'Military conflicts' },
  { id: 'western', name: 'Western', description: 'Wild West, cowboys' },
  { id: 'musical', name: 'Musical', description: 'Songs and dance' },
  { id: 'sports', name: 'Sports', description: 'Sports-centered stories' },
  { id: 'historical', name: 'Historical', description: 'Based on past eras' },
  { id: 'superhero', name: 'Superhero', description: 'Powered heroes and villains' },
  { id: 'psychological', name: 'Psychological', description: 'Mind, mental conflict' },
  { id: 'survival', name: 'Survival', description: 'Struggle to stay alive' },
  { id: 'disaster', name: 'Disaster', description: 'Catastrophes and chaos' },
  { id: 'spy-espionage', name: 'Spy / Espionage', description: 'Secret agents' },
  { id: 'heist', name: 'Heist', description: 'Robbery and planning' },
  { id: 'political', name: 'Political', description: 'Power and government' },
  { id: 'martial-arts', name: 'Martial Arts', description: 'Combat-focused' },
  { id: 'anime', name: 'Anime', description: 'Japanese animation' },
  { id: 'mythology', name: 'Mythology', description: 'Gods, legends' }
];

// Level 3 - Sub-categories (Optional - shown based on parent genre)
export const SUB_CATEGORIES = {
  'action': [
    { id: 'superhero', name: 'Superhero' },
    { id: 'martial-arts', name: 'Martial Arts' }
  ],
  'horror': [
    { id: 'psychological', name: 'Psychological' },
    { id: 'survival', name: 'Survival' }
  ],
  'science-fiction': [
    { id: 'space', name: 'Space' },
    { id: 'dystopian', name: 'Dystopian' },
    { id: 'time-travel', name: 'Time Travel' }
  ],
  'crime': [
    { id: 'heist', name: 'Heist' },
    { id: 'detective', name: 'Detective' }
  ],
  'thriller': [
    { id: 'spy-espionage', name: 'Spy / Espionage' },
    { id: 'psychological', name: 'Psychological' }
  ],
  'drama': [
    { id: 'psychological', name: 'Psychological' }
  ]
};

// Helper function to get genre name by id
export const getGenreName = (genreId) => {
  const genre = GENRES.find(g => g.id === genreId);
  return genre ? genre.name : genreId;
};

// Helper function to get main category name by id
export const getMainCategoryName = (categoryId) => {
  const category = MAIN_CATEGORIES.find(c => c.id === categoryId);
  return category ? category.name : categoryId;
};

// Helper function to validate genre selection (max 3 genres)
export const validateGenreSelection = (genres) => {
  if (!genres || genres.length === 0) {
    return { valid: false, message: 'Please select at least one genre' };
  }
  if (genres.length > 3) {
    return { valid: false, message: 'Maximum 3 genres allowed per video' };
  }
  return { valid: true };
};
