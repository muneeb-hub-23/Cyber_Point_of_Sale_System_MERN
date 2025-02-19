const express = require('express');
const router = express.Router();
const Document = require('../../models/Documents'); // Ensure your schema is correctly defined

// POST route to fetch documents
router.post('/', async (req, res) => {
    try {
        let { sdate, ldate, status, userid, shopid, allusers, docType } = req.body;


        // Validate required fields
        if (!sdate || !ldate || !shopid) {
            return res.status(400).json({ error: "Start date (sdate), end date (ldate), and shop ID (shopid) are required." });
        }

        // Build the base query (without date filter)
        const query = {
            linkedShop: shopid,
            doctype:docType,
            status, // Add status if provided
            ...(!allusers && userid && { user: userid }) // Add user filter if allusers is false
        };

        // Fetch documents based on the base query
        const documents = await Document.find(query).populate('customer').populate('user');

        // Filter documents by date range
        const filteredDocuments = documents.filter(doc => {
            // const docDate = parseInt(doc.date, 10); // Convert document date to a number
            return parseInt(doc.date) >= sdate && parseInt(doc.date) <= ldate;
        });

        // Return the filtered documents
        res.json(filteredDocuments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
});

module.exports = router;
