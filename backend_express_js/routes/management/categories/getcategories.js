const express = require('express');
const router = express.Router();
const Category = require('../../../models/Category'); // Adjust the path to your Category model

// GET route to fetch categories, optionally filtered by shop ID
router.get('/', async (req, res) => {
  try {
    const { shop } = req.query; // Get the shop ID from the query parameters if provided
    let categories;

    // If shop is provided, fetch categories for that specific shop
    if (shop) {
      categories = await Category.find({ shop });
    } else {
      // If no shop is provided, fetch all categories
      categories = await Category.find();
    }

    // Respond with the categories
    return res.status(200).json({ categories });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error, please try again later' });
  }
});

module.exports = router;
