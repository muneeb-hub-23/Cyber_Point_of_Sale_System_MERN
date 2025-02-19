const express = require('express')
const router = express.Router()


router.use('/getnewcode',require('./getnewcode'))
router.use('/getproducts',require('./getproducts'))
router.use('/addproduct',require('./addproduct'))
router.use('/modifyproduct',require('./modifyproduct'))
router.use('/deleteproduct',require('./deleteproduct'))
router.use('/getproductbyid',require('./getproductbyid'))
router.use('/getproductentries',require('./getproductentries'))
router.use('/getproductsbyshop',require('./getproductbyshop'))
router.use('/uploadpictures',require('./uploadpictures'))
router.use('/getallproducts',require('./getallproducts'))


module.exports = router