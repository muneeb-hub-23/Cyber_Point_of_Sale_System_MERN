const express = require('express');
const router = express.Router();
const Document = require('../../../models/Documents');

router.get('/', async (req, res) => {
    let { doctype, user, status, datenow } = req.headers;
    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
    let date = formatDate(datenow)

    try {
        let query = { doctype, user, status, date };
        let data = await Document.find(query)
            .populate('customer')
            .populate('customerGroup')
        if (data.length > 0) {
            res.json(data);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ success: false, error: "An error occurred while fetching documents." });
    }
});

module.exports = router;
