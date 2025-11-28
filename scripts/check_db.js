require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI missing');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('Mongo OK');
    process.exit(0);
  } catch (e) {
    console.error('Mongo FAIL:', e.message);
    process.exit(1);
  }
})();
