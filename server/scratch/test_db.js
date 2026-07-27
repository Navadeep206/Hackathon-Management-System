import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const testConnection = async () => {
  const uri = process.env.MONGO_URI;
  console.log('Testing connection to URI:', uri);
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    console.log('Success! Connected to host:', conn.connection.host);
    process.exit(0);
  } catch (err) {
    console.error('Connection failed with error:');
    console.error(err);
    process.exit(1);
  }
};

testConnection();
