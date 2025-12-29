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
  'superhero': 'Superhero.jpg',  // Fixed: exact filename
  'psychological': 'pschology.jpg',
  'survival': 'survive.jpg',
  'disaster': 'Disaster.jpg',
  'spy-espionage': 'Spy.jpg',
  'heist': 'Heist.jpg',
  'political': 'Political.jpg',
  'martial-arts': 'Martial Arts.jpg',  // Fixed: has space in filename
  'anime': 'Anime.jpg',
  'mythology': 'Mythology.jpg'
};

// Get category image path with URL encoding for spaces
export const getCategoryImagePath = (categoryId) => {
  const imageName = IMAGE_MAP[categoryId];
  if (imageName) {
    // Encode spaces and special characters in the filename
    const encodedName = encodeURIComponent(imageName);
    return `/categories/${encodedName}`;
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
