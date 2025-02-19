const express = require('express');
const router = express.Router();
const Shop = require('../../models/Shop');

router.get('/', async (req, res) => {
    try {
        let shops = await Shop.find();

        // Sort the shops based on the number in the shopName (e.g., "Shop 1", "Shop 2", etc.)
        shops.sort((a, b) => {
            const shopA = parseInt(a.shopName.split(' ')[1]); // Extract the number from "Shop X"
            const shopB = parseInt(b.shopName.split(' ')[1]); // Extract the number from "Shop Y"
            return shopA - shopB; // Compare the numbers
        });

        res.json(shops);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
