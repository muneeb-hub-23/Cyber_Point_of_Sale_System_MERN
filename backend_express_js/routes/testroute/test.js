const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Ensure the images directory exists
const imageDir = path.join(__dirname, "images");
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir);
}

router.post("/", (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "No image data provided" });
  }

  // Remove "data:image/jpeg;base64," part from the image data
  const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
  const fileName = `image_${Date.now()}.jpeg`; // Save as .jpeg
  const filePath = path.join(imageDir, fileName);

  fs.writeFile(filePath, base64Data, "base64", (err) => {
    if (err) {
      console.error("Error saving the image:", err);
      return res.status(500).json({ error: "Failed to save image" });
    }
    console.log(`Image saved as ${fileName}`);
    res.status(200).json({ message: "Image saved successfully", fileName });
  });
});

module.exports = router;
