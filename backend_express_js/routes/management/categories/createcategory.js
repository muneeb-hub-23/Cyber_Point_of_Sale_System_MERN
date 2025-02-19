const express = require('express');
const router = express.Router();
const Category = require('../../../models/Category'); // Adjust the path to your Category model

// POST route to create a category
router.post('/', async (req, res) => {
  try {
    const { name, description, shop } = req.body;

    // Ensure the shop ID is provided
    if (!shop) {
      return res.status(400).json({ message: 'Shop ID is required' });
    }

    // Check if the category name is already taken
    const existingCategory = await Category.findOne({ name, shop });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category name already exists for this shop' });
    }

    // Create a new category with the provided title (name), description, and shop
    const newCategory = new Category({
      name,
      description,
      shop, // You need to pass the `shop` ID here
    });

    // Save the category to the database
    await newCategory.save();

    return res.status(201).json({success:true, message: 'Category created successfully', category: newCategory });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success:false,message: 'Server error, please try again later' });
  }
});


module.exports = router;
