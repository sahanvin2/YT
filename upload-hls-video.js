/**
 * Upload Pre-Processed HLS Video Script
 * 
 * This script allows admins to upload already-processed HLS videos
 * without going through the video processing queue.
 * 
 * Usage:
 *   node upload-hls-video.js <folder-path> <title> [options]
 * 
 * Example:
 *   node upload-hls-video.js "D:\Videos\my-video-hls" "My Movie" --description "Great movie" --genre action
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const TOKEN_FILE = path.join(__dirname, '.admin-token');

// Parse command line arguments
const args = process.argv.slice(2);

function printUsage() {
  console.log(`
📁 Upload Pre-Processed HLS Video

Usage:
  node upload-hls-video.js <folder-path> <title> [options]

Required:
  <folder-path>              Path to HLS folder containing master.m3u8
  <title>                    Video title

Options:
  --description <text>       Video description
  --category <category>      Category (movies/series/documentaries/animation)
  --genre <genre>            Primary genre (action/comedy/drama/etc)
  --tags <tag1,tag2>         Comma-separated tags
  --visibility <type>        public/private (default: public)
  --duration <seconds>       Video duration in seconds
  --thumbnail <path>         Path to thumbnail image

Example:
  node upload-hls-video.js "D:\\Videos\\my-movie" "Inception" \\
    --description "A mind-bending thriller" \\
    --category movies \\
    --genre action \\
    --tags "thriller,scifi,nolan" \\
    --duration 8880

First Time Setup:
  Run this script once and enter your admin credentials to save a token.
  `);
  process.exit(1);
}

if (args.length < 2) {
  printUsage();
}

const hlsFolderPath = args[0];
const title = args[1];

// Parse options
const options = {
  description: '',
  category: 'movies',
  mainCategory: 'movies',
  primaryGenre: 'other',
  secondaryGenres: [],
  tags: [],
  visibility: 'public',
  duration: 0,
  thumbnailPath: ''
};

for (let i = 2; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--')) {
    const key = arg.substring(2);
    const value = args[i + 1];
    
    switch (key) {
      case 'description':
        options.description = value;
        i++;
        break;
      case 'category':
      case 'mainCategory':
        options.category = value;
        options.mainCategory = value;
        i++;
        break;
      case 'genre':
        options.primaryGenre = value;
        i++;
        break;
      case 'tags':
        options.tags = value.split(',').map(t => t.trim());
        i++;
        break;
      case 'visibility':
        options.visibility = value;
        i++;
        break;
      case 'duration':
        options.duration = parseInt(value);
        i++;
        break;
      case 'thumbnail':
        options.thumbnailPath = value;
        i++;
        break;
    }
  }
}

// Get or create admin token
async function getAdminToken() {
  if (fs.existsSync(TOKEN_FILE)) {
    const token = fs.readFileSync(TOKEN_FILE, 'utf8').trim();
    if (token) return token;
  }

  console.log('\n🔐 Admin Authentication Required\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const email = await new Promise(resolve => {
    rl.question('Email: ', resolve);
  });

  const password = await new Promise(resolve => {
    rl.question('Password: ', resolve);
  });

  rl.close();

  try {
    console.log('\n🔄 Logging in...');
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });

    const token = response.data.token;
    fs.writeFileSync(TOKEN_FILE, token);
    console.log('✅ Token saved for future use\n');
    return token;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

async function uploadHlsVideo() {
  try {
    // Validate folder
    if (!fs.existsSync(hlsFolderPath)) {
      console.error(`❌ Folder not found: ${hlsFolderPath}`);
      process.exit(1);
    }

    const masterPath = path.join(hlsFolderPath, 'master.m3u8');
    if (!fs.existsSync(masterPath)) {
      console.error(`❌ master.m3u8 not found in: ${hlsFolderPath}`);
      console.error('   Make sure this is a valid HLS video folder.');
      process.exit(1);
    }

    // Get admin token
    const token = await getAdminToken();

    console.log('📁 HLS Folder Upload');
    console.log('═'.repeat(50));
    console.log(`Title:        ${title}`);
    console.log(`Folder:       ${hlsFolderPath}`);
    console.log(`Category:     ${options.mainCategory}`);
    console.log(`Genre:        ${options.primaryGenre}`);
    console.log(`Visibility:   ${options.visibility}`);
    console.log('═'.repeat(50));
    console.log('\n🚀 Starting upload...\n');

    const response = await axios.post(
      `${API_URL}/api/videos/upload-hls-folder`,
      {
        hlsFolderPath,
        title,
        ...options
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        maxBodyLength: Infinity,
        timeout: 600000 // 10 minutes
      }
    );

    console.log('\n✅ Upload Complete!');
    console.log('═'.repeat(50));
    console.log(`Video ID:     ${response.data.data._id}`);
    console.log(`Status:       ${response.data.data.processingStatus}`);
    console.log(`HLS URL:      ${response.data.data.hlsUrl}`);
    console.log(`Files:        ${response.data.uploadStats.filesUploaded}`);
    console.log(`Size:         ${(response.data.uploadStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Variants:     ${response.data.uploadStats.variants}`);
    console.log('═'.repeat(50));
    console.log(`\n🌐 View at: ${API_URL.replace(':5000', ':3000')}/watch/${response.data.data._id}\n`);

  } catch (error) {
    console.error('\n❌ Upload failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.message || error.message}`);
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

uploadHlsVideo();
