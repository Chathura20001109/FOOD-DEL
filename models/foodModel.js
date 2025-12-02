// models/foodModel.js
import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }
});

const Food = mongoose.model('Food', foodSchema);
export default Food;
