const mongoose = require('mongoose');
const Video = require('../backend/models/Video');

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://MoviaAdmin:bbfX196Wv8dm7LlJ@movia.ytwtfrc.mongodb.net/movia?retryWrites=true&w=majority&appName=movia';

// Category mappings based on video titles
const categoryMappings = [
  // Robin Hood series - should be Series + Adventure
  {
    pattern: /Robin Hood.*S\d+.*EP\d+/i,
    mainCategory: 'series',
    primaryGenre: 'adventure',
    secondaryGenres: ['action', 'drama']
  },
  // Animation patterns
  {
    pattern: /(cartoon|anime|animated|disney|pixar)/i,
    mainCategory: 'animation',
    primaryGenre: 'family',
    secondaryGenres: ['adventure']
  },
  // Family content
  {
    pattern: /(family|kids|children)/i,
    mainCategory: 'movies',
    primaryGenre: 'family',
    secondaryGenres: ['adventure']
  },
  // Comedy patterns
  {
    pattern: /(comedy|funny|laugh)/i,
    mainCategory: 'movies',
    primaryGenre: 'comedy',
    secondaryGenres: ['family']
  },
  // Horror patterns
  {
    pattern: /(horror|scary|terror|haunted|ghost)/i,
    mainCategory: 'movies',
    primaryGenre: 'horror',
    secondaryGenres: ['thriller']
  },
  // Action (default for most movies)
  {
    pattern: /(action|fight|battle|war)/i,
    mainCategory: 'movies',
    primaryGenre: 'action',
    secondaryGenres: ['adventure']
  }
];

async function fixVideoCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    const videos = await Video.find({});
    console.log(`\n📹 Found ${videos.length} videos to analyze\n`);

    let updatedCount = 0;
    const updates = [];

    for (const video of videos) {
      let matched = false;
      let newCategory = {
        mainCategory: video.mainCategory || 'movies',
        primaryGenre: video.primaryGenre || 'action',
        secondaryGenres: video.secondaryGenres || []
      };

      // Check title against patterns
      for (const mapping of categoryMappings) {
        if (mapping.pattern.test(video.title)) {
          newCategory = {
            mainCategory: mapping.mainCategory,
            primaryGenre: mapping.primaryGenre,
            secondaryGenres: mapping.secondaryGenres
          };
          matched = true;
          break;
        }
      }

      // Check description if no title match
      if (!matched && video.description) {
        for (const mapping of categoryMappings) {
          if (mapping.pattern.test(video.description)) {
            newCategory = {
              mainCategory: mapping.mainCategory,
              primaryGenre: mapping.primaryGenre,
              secondaryGenres: mapping.secondaryGenres
            };
            matched = true;
            break;
          }
        }
      }

      // Update if different
      if (
        newCategory.mainCategory !== video.mainCategory ||
        newCategory.primaryGenre !== video.primaryGenre ||
        JSON.stringify(newCategory.secondaryGenres) !== JSON.stringify(video.secondaryGenres)
      ) {
        updates.push({
          _id: video._id,
          title: video.title,
          old: {
            mainCategory: video.mainCategory,
            primaryGenre: video.primaryGenre
          },
          new: newCategory
        });

        await Video.findByIdAndUpdate(video._id, {
          mainCategory: newCategory.mainCategory,
          primaryGenre: newCategory.primaryGenre,
          secondaryGenres: newCategory.secondaryGenres,
          category: newCategory.primaryGenre // Update legacy field too
        });
        updatedCount++;
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`✅ Updated ${updatedCount} videos`);
    console.log(`⏭️  Skipped ${videos.length - updatedCount} videos (already correct)\n`);

    if (updates.length > 0) {
      console.log('📝 Changes made:');
      updates.forEach((update, index) => {
        console.log(`\n${index + 1}. "${update.title.substring(0, 50)}..."`);
        console.log(`   From: ${update.old.mainCategory}/${update.old.primaryGenre}`);
        console.log(`   To:   ${update.new.mainCategory}/${update.new.primaryGenre} + [${update.new.secondaryGenres.join(', ')}]`);
      });
    }

    console.log('\n✅ Category fix completed!');
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing categories:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
fixVideoCategories();
