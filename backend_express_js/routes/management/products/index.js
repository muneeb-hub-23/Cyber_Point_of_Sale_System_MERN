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
router.use('/searchproducts',require('./searchproducts'))
router.use('/recalibratestock',require('./recalibratestock'))
router.use('/recalibrateallstock',require('./recalibrateallstock'))
router.use('/createadjustrequest',require('./createadjustrequest'))
router.use('/getadjustrequests',require('./getadjustrequests'))
router.use('/approveadjustrequest',require('./approveadjustrequest'))
router.use('/rejectadjustrequest',require('./rejectadjustrequest'))


module.exports = router