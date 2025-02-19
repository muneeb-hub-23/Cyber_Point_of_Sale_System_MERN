const express = require('express')
const router = express.Router()
const DocumentItems = require('../../models/DocumentItem')
function extractIntegersFromString(inputString) {
    const regex = /\d+/g;
      const matches = inputString.match(regex);
      return matches ? matches.map(Number) : [];
  }
  function formatISODate(isoString) {
    const date = new Date(isoString);

    // Get date components
    const day = date.getDate();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    // Get time components
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format, 0 should be 12

    // Construct formatted string
    return `${day}-${month}-${year}, ${hours}:${minutes}:${period}`;
}
router.post('/', async (req, res) => {
    const data = req.body
    const shopNumbers = extractIntegersFromString(data.selectedShop.shopName);
    const shopNumber = shopNumbers[0];
    let receiptNumber = data.selectedBill.count;
    let dateandtime = formatISODate(data.selectedDate);
    let operator = data.user;
    let customerName = data.customer ? data.customer.customerName : undefined;
    let itemsList = await DocumentItems.find({document:data.selectedBill._id}).populate('product')
    let totalItems = data.total.totalitems;
    let subTotal = data.total.totalamount;
    let discount = data.total.billDiscount;
    let totalAmount = data.total.totalamount-data.total.billDiscount
    let paymentsList = data.splitedPayments;
    let amountPaid = data.paidamount;
    let oldBalance = 0;
    let newBalance = 0;

    if(data.customer){
        oldBalance = parseFloat(data.customer.balance.toFixed(2));
        newBalance = parseFloat((data.customer.balance+Number(data.totalSum)).toFixed(2));
    }
    let debit = 0;
    let debitamount = paymentsList.find(p=>p.name === "Debit");
        if(debitamount){
        debit += debitamount.amount;
    }
    res.render('receipt', {
        shopNumber,
        receiptNumber,
        dateandtime,
        operator,
        customerName,
        itemsList,
        totalItems,
        subTotal,
        discount,
        totalAmount,
        paymentsList,
        amountPaid,
        oldBalance: isNaN(newBalance) ? oldBalance-amountPaid : oldBalance,
        newBalance: newBalance ? newBalance : oldBalance
    });
});

module.exports = router