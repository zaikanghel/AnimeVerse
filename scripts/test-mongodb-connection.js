/**
 * Script to test MongoDB connection with provided credentials
 * Run with: node scripts/test-mongodb-connection.js
 * 
 * This script helps verify if the MongoDB connection works with the provided
 * environment variables or defaults. It's useful for debugging connection issues.
 */

const mongoose = require('mongoose');

// Get MongoDB connection details from environment variables with fallbacks
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animeverse';
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'animeverse';

async function testMongoDBConnection() {
  console.log('Testing MongoDB connection...');
  console.log('========================');
  
  try {
    // Prepare connection options
    const options = {
      serverSelectionTimeoutMS: 5000,  // Timeout after 5 seconds
      connectTimeoutMS: 10000          // Timeout after 10 seconds
    };
    
    // Build connection URI with credentials if provided
    let connectionUri = MONGODB_URI;
    if (MONGODB_USER && MONGODB_PASSWORD && !MONGODB_URI.includes('@')) {
      // Extract protocol and host
      const uriParts = MONGODB_URI.split('//');
      if (uriParts.length > 1) {
        // Insert credentials into URI
        connectionUri = `${uriParts[0]}//${MONGODB_USER}:${encodeURIComponent(MONGODB_PASSWORD)}@${uriParts[1]}`;
        console.log('Using MongoDB with provided credentials');
      }
    }
    
    // Ensure the database name is included in URI
    if (!connectionUri.includes('/')) {
      connectionUri = `${connectionUri}/${MONGODB_DB_NAME}`;
    }
    
    // Mask password in logs
    const displayUri = connectionUri.replace(/\/\/.*@/, '//****:****@');
    console.log(`Attempting connection to: ${displayUri}`);
    
    // Attempt to connect
    await mongoose.connect(connectionUri, options);
    
    console.log('✅ Successfully connected to MongoDB!');
    console.log(`Connected to database: ${mongoose.connection.name}`);
    
    // Test connection by fetching server info
    const serverInfo = await mongoose.connection.db.admin().serverInfo();
    console.log(`MongoDB version: ${serverInfo.version}`);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAvailable collections:');
    if (collections.length > 0) {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    } else {
      console.log('No collections found (empty database)');
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error(error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\nPossible solutions:');
      console.log('1. Check if MongoDB server is running');
      console.log('2. Verify connection URI is correct');
      console.log('3. Ensure network connectivity to MongoDB server');
      console.log('4. Check if provided credentials are correct');
    }
    
  } finally {
    try {
      await mongoose.disconnect();
      console.log('\nDisconnected from MongoDB');
    } catch (disconnectError) {
      // Ignore disconnect errors
    }
    
    console.log('\nConnection test complete');
    console.log('=======================');
  }
}

testMongoDBConnection().catch(console.error);