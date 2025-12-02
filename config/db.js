// db.js
import mongoose from 'mongoose';

export const connectDB = async () => {
  const MONGO_URI = 'mongodb+srv://Chathu2000:CHAnav123@cluster0.u9cnixk.mongodb.net/FOOD-DEL?retryWrites=true&w=majority';

  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1); // Exit process if connection fails
  }
};
