const express = require('express');
const router = express.Router();

router.use('/receipt',require('./receipt'))

module.exports = router;