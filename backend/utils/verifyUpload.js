/**
 * Verify uploaded HLS files exist in B2
 */

const axios = require('axios');

async function verifyHLSUpload(masterUrl, expectedVariants = []) {
  const results = {
    masterPlaylist: false,
    variants: {},
    missingFiles: [],
    status: 'unknown'
  };

  try {
    // Check master playlist
    console.log(`🔍 Verifying master playlist...`);
    const masterResponse = await axios.head(masterUrl, { timeout: 10000 });
    results.masterPlaylist = masterResponse.status === 200;
    
    if (!results.masterPlaylist) {
      results.missingFiles.push('master.m3u8');
    }

    // Extract variant playlists from master URL
    const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf('/'));
    
    // Check each expected variant
    for (const quality of expectedVariants) {
      const variantUrl = `${baseUrl}/hls_${quality}/playlist.m3u8`;
      try {
        const variantResponse = await axios.head(variantUrl, { timeout: 10000 });
        results.variants[quality] = variantResponse.status === 200;
        
        if (!results.variants[quality]) {
          results.missingFiles.push(`hls_${quality}/playlist.m3u8`);
        }
      } catch (error) {
        results.variants[quality] = false;
        results.missingFiles.push(`hls_${quality}/playlist.m3u8`);
      }
    }

    // Determine overall status
    const allVariantsOk = Object.values(results.variants).every(v => v === true);
    
    if (results.masterPlaylist && allVariantsOk) {
      results.status = 'complete';
      console.log(`✅ Upload verification: All files accessible`);
    } else if (results.masterPlaylist && Object.keys(results.variants).length > 0) {
      results.status = 'partial';
      console.warn(`⚠️ Upload verification: Some variants missing`);
    } else {
      results.status = 'failed';
      console.error(`❌ Upload verification: Master playlist not accessible`);
    }

  } catch (error) {
    results.status = 'error';
    console.error(`❌ Verification error:`, error.message);
  }

  return results;
}

module.exports = { verifyHLSUpload };
