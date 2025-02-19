const express = require('express');
const router = express.Router();
const Document = require('../../../models/Documents');
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
    let { doctype, user, status, datenow } = req.headers;
    function formatDate(dateString) {
        const date = new Date(dateString);
      
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const day = String(date.getDate()).padStart(2, '0');
      
        return `${year}${month}${day}`;
      }
    date = formatDate(datenow)


    try {
        // Build the query object
        let query = {
            doctype,
            user,
            status,
            date
        };
        // Execute the query and populate 'customer' field
        let data = await Document.find(query)
        .populate('customer')
        .populate('customerGroup')
        .populate('customerGroup.ids.customerID')
        .populate('customerGroup.ids.shopID');
        if (data.length > 0) {
            res.json(data);
        } else {
            res.json([]);  // Return an empty array if no documents are found
        }
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ success: false, error: "An error occurred while fetching documents." });
    }
});

module.exports = router;
