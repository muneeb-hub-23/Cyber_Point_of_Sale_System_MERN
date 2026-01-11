const express = require('express')
const router = express.Router()


router.use('/addcustomer',require('./AddCustomer'))
router.use('/addcustomerinallshops',require('./AddCustomerInAllShops'))
router.use('/retrievecustomers',require('./RetrieveCustomers'))
router.use('/deletecustomer',require('./DeleteCustomer'))
router.use('/getcustomersbyshop',require('./GetCustomersByShop'))
router.use('/getallcustomers',require('./GetAllCustomers'))
router.use('/getallsuppliers',require('./GetAllSuppliers'))
router.use('/getcustomerbyid',require('./GetCustomersByID'))
router.use('/gettransactionsbyid',require('./GetTransactionsByID'))
router.use('/modifycustomer',require('./ModifyCustomer'))
router.use('/getblacklist',require('./GetBlackList'))
router.use('/getcustomergroup',require('./GetCustomerGroup'))
router.use('/createcustomergroup',require('./CreateCustomerGroup'))
router.use('/deletecustomergroup',require('./DeleteCustomerGroup'))
router.use('/getcustomergroupbyid',require('./GetCustomerGroupByID'))
router.use('/updatecustomergroup',require('./UpdateCustomerGroup'))


module.exports = router