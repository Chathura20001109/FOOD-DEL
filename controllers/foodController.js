import Food from '../models/foodModel.js';  // Use ES module import syntax

// Add new food
export const addFood = async (req, res) => {
  try {
    const food = new Food(req.body);
    await food.save();
    res.status(201).json(food);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// List all food
export const listFood = async (req, res) => {
  try {
    const foods = await Food.find();
    res.status(200).json(foods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a food by ID
export const removeFood = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Food.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Food not found" });
    }
    res.status(200).json({ message: "Food deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
