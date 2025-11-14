const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');

  const options = {};
  if (process.env.NODE_ENV === 'production') {
    options.dbName = 'engineering-shop'; // explicitly for production
  }

  await mongoose.connect(uri, options);
  console.log(`✅ MongoDB connected (${process.env.NODE_ENV || 'development'})`);
};
