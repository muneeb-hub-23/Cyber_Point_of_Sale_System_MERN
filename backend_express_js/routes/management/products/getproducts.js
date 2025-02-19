const express = require('express');
const router = express.Router();
const Products = require('../../../models/Product');
const Category = require('../../../models/Category');
const Customer = require('../../../models/Customer');
const Shop = require('../../../models/Shop');

router.get('/', async (req, res) => {
    try {
        const { shop, supliers } = req.headers;
        if (shop.length > 3 && supliers.length > 3) {
            let data = await Products.find({ supliersGroup: supliers, shop });
            let newData = [];

            for (let x = 0; x < data.length; x++) {
                let parser = data[x].toObject(); // Convert to plain object

                let Categoryx = await Category.findById(data[x].category) || {};
                let Suplier = await Customer.findById(data[x].suplier) || {};
                let SuplierGroup = await Shop.findById(data[x].supliersGroup) || {};

                parser.category = Categoryx
                parser.suplier = Suplier
                parser.supliersGroup = SuplierGroup

                newData.push(parser);
            }
            res.json({ data: newData });
        } else {
            res.json({ data: [] });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
