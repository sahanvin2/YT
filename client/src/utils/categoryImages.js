// Category Images Mapping
// Maps category IDs to actual image files in public/categories folder

// Image filename mapping (exact filenames as they appear in public/categories)
const IMAGE_MAP = {
  // Main Categories
  'movies': 'Movie.jpg',
  'series': 'Series.jpg',
  'documentaries': 'Documentry.jpg',
  'documentary': 'Documentry (Sub cato).jpg',  // Documentary sub category
  'animation': 'Animation.jpg',
  'animation-sub': 'Animation (sub cato).jpg',  // Animation sub category
  
  // Genres
  'action': 'Action.jpg',
  'adventure': 'Adventure.jpg',
  'comedy': 'Comedy.jpg',
  'drama': 'Drama.jpg',
  'horror': 'Horror.jpg',
  'thriller': 'Thriller.jpg',
  'romance': 'Romance.jpg',
  'science-fiction': 'Sci-fi.jpg',
  'fantasy': 'Fantacy.jpg',
  'mystery': 'Mystery.jpg',
  'crime': 'Crime.jpg',
  'family': 'Family.jpg',
  'biography': 'Biology.jpg',
  'war': 'War.jpg',
  'western': 'Western.jpg',
  'musical': 'Musical.jpg',
  'sports': 'Sport.jpg',
  'historical': 'Historicle.jpg',
  'superhero': 'Superhero.jpg',
  'psychological': 'pschology.jpg',
  'survival': 'survive.jpg',
  'disaster': 'Disaster.jpg',
  'spy-espionage': 'Spy.jpg',
  'heist': 'Heist.jpg',
  'political': 'Political.jpg',
  'martial-arts': 'Martial Arts.jpg',  // Has space - will be URL encoded
  'anime': 'Anime.jpg',
  'mythology': 'Mythology.jpg'
};

// Get category image path - properly handle spaces and special characters
export const getCategoryImagePath = (categoryId) => {
  const imageName = IMAGE_MAP[categoryId];
  if (imageName) {
    // For React/HTML img src, we need to encode the filename properly
    // Split the path and encode only the filename part
    const parts = imageName.split('/');
    const encodedParts = parts.map(part => encodeURIComponent(part));
    return `/categories/${encodedParts.join('/')}`;
  }
  // Fallback to a default image
  console.warn(`Category image not found for: ${categoryId}, using default`);
  return '/categories/Movie.jpg';
};

// Get category image config (for backward compatibility)
export const getCategoryImage = (categoryId) => {
  return {
    imagePath: getCategoryImagePath(categoryId),
    gradient: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)',
    bgColor: '#000000'
  };
};

// Get all category images
export const getAllCategoryImages = () => {
  return IMAGE_MAP;
};
