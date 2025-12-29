// Category Images/Icons Mapping
// Using gradient backgrounds with icons for a modern look

import { 
  FiFilm, FiTv, FiVideo, FiSmile, FiZap, FiHeart, 
  FiStar, FiCompass, FiTarget, FiShield, FiUsers,
  FiGlobe, FiAward, FiMusic, FiCamera, FiBook
} from 'react-icons/fi';

export const CATEGORY_IMAGES = {
  // Main Categories
  'movies': {
    icon: FiFilm,
    gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    bgColor: '#FF6B35',
    emoji: '🎬'
  },
  'series': {
    icon: FiTv,
    gradient: 'linear-gradient(135deg, #E94057 0%, #F27121 100%)',
    bgColor: '#E94057',
    emoji: '📺'
  },
  'documentaries': {
    icon: FiVideo,
    gradient: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
    bgColor: '#8E2DE2',
    emoji: '🎥'
  },
  'animation': {
    icon: FiSmile,
    gradient: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
    bgColor: '#ff0844',
    emoji: '🎨'
  },
  
  // Genres
  'action': {
    icon: FiZap,
    gradient: 'linear-gradient(135deg, #fc6767 0%, #ec008c 100%)',
    bgColor: '#fc6767',
    emoji: '⚡'
  },
  'comedy': {
    icon: FiSmile,
    gradient: 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
    bgColor: '#fdbb2d',
    emoji: '😄'
  },
  'drama': {
    icon: FiHeart,
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    bgColor: '#ff9a9e',
    emoji: '💔'
  },
  'horror': {
    icon: FiTarget,
    gradient: 'linear-gradient(135deg, #fa8bff 0%, #2bff88 100%)',
    bgColor: '#fa8bff',
    emoji: '👻'
  },
  'thriller': {
    icon: FiZap,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    bgColor: '#667eea',
    emoji: '🔪'
  },
  'romance': {
    icon: FiHeart,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    bgColor: '#f093fb',
    emoji: '💕'
  },
  'science-fiction': {
    icon: FiStar,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    bgColor: '#4facfe',
    emoji: '🚀'
  },
  'fantasy': {
    icon: FiStar,
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    bgColor: '#fa709a',
    emoji: '✨'
  },
  'mystery': {
    icon: FiCompass,
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    bgColor: '#30cfd0',
    emoji: '🔍'
  },
  'crime': {
    icon: FiShield,
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    bgColor: '#a8edea',
    emoji: '🔫'
  },
  'adventure': {
    icon: FiCompass,
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    bgColor: '#ffecd2',
    emoji: '🗺️'
  },
  'family': {
    icon: FiUsers,
    gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
    bgColor: '#ff9a56',
    emoji: '👨‍👩‍👧‍👦'
  },
  'documentary': {
    icon: FiCamera,
    gradient: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
    bgColor: '#8E2DE2',
    emoji: '📹'
  },
  'biography': {
    icon: FiBook,
    gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    bgColor: '#a1c4fd',
    emoji: '📖'
  },
  'war': {
    icon: FiShield,
    gradient: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
    bgColor: '#ff6e7f',
    emoji: '⚔️'
  },
  'western': {
    icon: FiCompass,
    gradient: 'linear-gradient(135deg, #fad961 0%, #f76b1c 100%)',
    bgColor: '#fad961',
    emoji: '🤠'
  },
  'musical': {
    icon: FiMusic,
    gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    bgColor: '#fbc2eb',
    emoji: '🎵'
  },
  'sports': {
    icon: FiTarget,
    gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    bgColor: '#84fab0',
    emoji: '⚽'
  },
  'historical': {
    icon: FiBook,
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    bgColor: '#ffecd2',
    emoji: '🏛️'
  },
  'superhero': {
    icon: FiZap,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    bgColor: '#667eea',
    emoji: '🦸'
  },
  'psychological': {
    icon: FiTarget,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    bgColor: '#f093fb',
    emoji: '🧠'
  },
  'survival': {
    icon: FiCompass,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    bgColor: '#4facfe',
    emoji: '🏕️'
  },
  'disaster': {
    icon: FiZap,
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    bgColor: '#fa709a',
    emoji: '🌋'
  },
  'spy-espionage': {
    icon: FiShield,
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    bgColor: '#30cfd0',
    emoji: '🕵️'
  },
  'heist': {
    icon: FiShield,
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    bgColor: '#a8edea',
    emoji: '💰'
  },
  'political': {
    icon: FiGlobe,
    gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
    bgColor: '#ff9a56',
    emoji: '🏛️'
  },
  'martial-arts': {
    icon: FiZap,
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    bgColor: '#ffecd2',
    emoji: '🥋'
  },
  'anime': {
    icon: FiStar,
    gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    bgColor: '#fbc2eb',
    emoji: '🎌'
  },
  'mythology': {
    icon: FiStar,
    gradient: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    bgColor: '#84fab0',
    emoji: '⚡'
  }
};

// Get category image config
export const getCategoryImage = (categoryId) => {
  return CATEGORY_IMAGES[categoryId] || {
    icon: FiCompass,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    bgColor: '#667eea',
    emoji: '📁'
  };
};

