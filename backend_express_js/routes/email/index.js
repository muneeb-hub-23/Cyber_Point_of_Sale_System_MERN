const express = require('express')
const router = express.Router()


router.use('/restoredata',require('./restoreData'))


module.exports = router