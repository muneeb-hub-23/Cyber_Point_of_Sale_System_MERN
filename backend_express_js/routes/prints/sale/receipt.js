const express = require('express');
const router = express.Router();
const DocItem = require('../../../models/DocumentItem')
const Shop = require('../../../models/Shop');
const User = require('../../../models/User');
const Customer = require('../../../models/Customer');
const CustomerGroup = require('../../../models/CustomerGroup');

function formatDate(dateString) {
  const date = new Date(dateString);

  // Convert to GMT+5 timezone
  const offset = 5 * 60; // Offset in minutes (GMT+5)
  const localDate = new Date(date.getTime() + offset * 60 * 1000);

  // Format the date
  const day = localDate.getUTCDate();
  const month = localDate.toLocaleString('en-US', { month: 'short' });
  const year = localDate.getUTCFullYear();

  // Format the time
  let hours = localDate.getUTCHours();
  const minutes = localDate.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert to 12-hour format

  return `${day}-${month}-${year} ${hours}:${minutes.toString().padStart(2, '0')}:${ampm}`;
}
router.post('/',async (req,res)=>{
    let {
        user,
        date,
        selectedBill,
        customerGroup,
        balanceTotal,  
    } = req.body

    date = formatDate(date)

    let dataSet = []
    let shopIDS = []
    user = await User.findById(user)
    let allItems = await DocItem.find({document:selectedBill._id}).populate('product').populate('document')
    for(item of allItems){
        if(!shopIDS.includes(item.product.shop.toString()))
        shopIDS.push(item.product.shop.toString())
    }
    for(let shop of shopIDS){
        shopData = await Shop.findById(shop)
        let thisShopItems = allItems.filter(item=>item.product.shop.toString() === shop.toString())
        let subTotal = thisShopItems.reduce((total, l) => total + l.saleamount, 0)
        let balanceTotalObject = balanceTotal.find(f=>f.shop._id.toString()===shop.toString())
        let discount = balanceTotalObject.cartDiscount
        let customer = balanceTotalObject.shopCustomer.length>0 ? balanceTotalObject.shopCustomer[0] : undefined
        if(customer){
            customer = await Customer.findById(customer.customerID._id)
        }
        let datatopush = {
            shopNumber:shopData.shopName.toUpperCase(),
            receiptNumber:selectedBill.count,
            dateandtime:date,
            operator:user.username,
            customerName:customer ? customer.customerName : undefined,
            itemsList:thisShopItems,
            totalItems:thisShopItems.length,
            subTotal,
            discount,
            totalAmount:subTotal-discount,
            paymentsList:balanceTotalObject.shopPayments,
            amountPaid:balanceTotalObject.shopPayments.reduce((total, l) => total + l.amount, 0),
            oldBalance: customer ? customer.balance : 0,
            newBalance: (customer ? customer.balance : 0) + balanceTotalObject.shopPayments.reduce((total, l) => total + (l.name==="Debit" ? l.amount: 0), 0)
        }


        dataSet.push(datatopush)

    }
    let totalItems = allItems.length
    let subTotal = allItems.reduce((total, l) => total + l.saleamount, 0)
    let discount = balanceTotal.reduce((total, l) => total + l.cartDiscount, 0)
    let totalAfterDiscount = subTotal-discount
    let allPayments = balanceTotal.map(element => element.shopPayments);
    let mainPayments = [];
    for (let pays of allPayments) {
        for (let pay of pays) {
            let existingPay = mainPayments.find(m => m.name === pay.name);
            if (!existingPay) {
                mainPayments.push({ ...pay }); // Add the new payment
            } else {
                existingPay.amount += pay.amount; // Increment the existing payment's amount
            }
        }
    }
    let paidAmount = mainPayments.reduce((total, l) => total + l.amount, 0)
    let allShopsData = {mainPayments,subTotal,discount,totalAfterDiscount,totalItems,paidAmount}
    if(customerGroup){
        let thisGroup = await CustomerGroup.findById(customerGroup).populate("ids.customerID").populate("ids.shopID")
        let customerBalance = thisGroup.ids.reduce((total, l) => total + l.customerID.balance, 0)
        allShopsData.customerBalance = customerBalance
        let debtAmount = mainPayments.find(f=>f.name==="Debit")
        allShopsData.customerNewBalance = debtAmount ? debtAmount.amount+customerBalance : customerBalance

    }
    if(shopIDS.length===1){
        allShopsData.showShopsTotal = false
    }else{
        allShopsData.showShopsTotal = true
    }

    res.render('saleReceipt',{dataSet,allShopsData} );

})

module.exports = router;