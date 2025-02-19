const express = require('express')
const router = express.Router()


router.use('/createshop',require('./CreateShop'))
router.use('/retrieveshops',require('./RetrieveShops'))
router.use('/deleteshop',require('./DeleteShop'))
router.use('/getshopbyid',require('./GetShopByID'))
router.use('/modifyshop',require('./ModifyShop'))


module.exports = router