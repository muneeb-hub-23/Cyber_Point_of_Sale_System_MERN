const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Users = require('../../models/User');
const fetch = require('node-fetch'); // You will need node-fetch to fetch the image

// Ensure the cache directory exists
const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

// Function to fetch an image and convert it to base64
const convertImageToBase64 = async (imageUrl) => {
    try {
        const response = await fetch("http://localhost:4000/" + imageUrl);
        const buffer = await response.buffer();
        return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    } catch (error) {
        throw new Error(`Failed to convert image to base64: ${error.message}`);
    }
};

router.post('/', async (req, res) => {
    try {
        // Get users from database
        const users = await Users.find({}, { _id: 1, profilepicture: 1 });

        if (!req.body.image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        // Fetch and convert user profile pictures to base64
        const usersWithBase64Images = await Promise.all(users.map(async (user) => {
            const userProfilePictureBase64 = await convertImageToBase64(user.profilepicture);
            return {
                userID: user._id.toString(),
                profilepicture: userProfilePictureBase64,
            };
        }));


        const response = await fetch('http://localhost:5000/match',
            {
                method: 'POST',
                headers:{"Content-Type": "application/json"},
                body: JSON.stringify({ data: { users: usersWithBase64Images, pictureToMatch: req.body.image } })
            }
        );


        res.json(response.data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
