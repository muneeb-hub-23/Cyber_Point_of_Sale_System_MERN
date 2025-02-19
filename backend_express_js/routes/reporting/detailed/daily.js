const express = require('express')
const router = express.Router()
const Shop = require('../../../models/Shop')
const Document = require('../../../models/Documents')
const DocItem = require('../../../models/DocumentItem')
const Product = require('../../../models/Product')


function convertDateFormat(dateString) {
    // Ensure the date string is valid and has a length of 8 characters
    if (dateString.length === 8) {
        // Extract the year, month, and day from the string
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);

        // Format the date as mm/dd/yyyy
        return `${month}/${day}/${year}`;
    } else {
        return "Invalid date format";
    }
}
function convertToDateFormat(dateInput) {
    // Parse the input into a Date object
    const date = new Date(dateInput);

    // Check if the date is valid
    if (isNaN(date)) {
        throw new Error("Invalid date");
    }

    // Extract year, month, and day from the date
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed, so add 1
    const day = date.getDate().toString().padStart(2, '0');

    // Return in yyyymmdd format
    return `${year}${month}${day}`;
}
function getDateRange({ sdate, edate }) {
    const dates = [];
    let currentDate = new Date(
        sdate.substring(0, 4), 
        sdate.substring(4, 6) - 1, 
        sdate.substring(6, 8)
    );
    const endDate = new Date(
        edate.substring(0, 4), 
        edate.substring(4, 6) - 1, 
        edate.substring(6, 8)
    );

    while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        dates.push(`${year}${month}${day}`);
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
}
router.get('/', async (req, res) => {
    const {doctype,criteria,startdate,enddate} = req.headers
    let sdate = convertToDateFormat(startdate)
    let edate = convertToDateFormat(enddate)
    let datesArray = getDateRange({sdate,edate})

    let shops = await Shop.find();
    shops.sort((a, b) => {
        const shopA = parseInt(a.shopName.split(' ')[1]); // Extract the number from "Shop X"
        const shopB = parseInt(b.shopName.split(' ')[1]); // Extract the number from "Shop Y"
        return shopA - shopB; // Compare the numbers
    });
    
    let todayDocs = await Document.find({ 
        date: { $in: datesArray }, 
        status: "processed" 
    });
    
    let todayDocsIds = todayDocs.map(doc => { return doc._id })
    let todayDocsItems = await DocItem.find({ document: { $in: todayDocsIds } }).populate('document');
    let shopNames = shops.map(s => { return { id: s._id, name: s.shopName } });
    let products = await Product.find().populate('shop');
    let stock = [];
    let sales = [];
    let profit = [];
    const formattedDate = convertDateFormat(sdate);


    for (let shop in shops) {
        let stockCost = 0;
        let stockSale = 0;

        for (let product in products) {
            if (products[product].shop._id.toString() === shops[shop]._id.toString()) {
                stockCost += (products[product].cost + (products[product].iskharchaincludedinsale ? products[product].kharcha : 0)) * products[product].onHand
                stockSale += (products[product].sale * products[product].onHand)
            }
        }
        stockCost = parseFloat(stockCost.toFixed(2))
        stockSale = parseFloat(stockSale.toFixed(2))
        stock.push({ shopid: shops[shop]._id, shopname: shops[shop].shopName, stockCost, stockSale })
        let saleTotal = 0;
        let cashSale = 0;
        let debitSale = 0;
        let easypaisaSale = 0;
        let jazzcashSale = 0;
        let upaisaSale = 0;
        let meezanSale = 0;

        for (let sale in todayDocs) {
            let currentDoc = todayDocs[sale]
            // console.log(currentDoc.linkedShop,shops[shop]._id)
            if (currentDoc.linkedShop.toString() === shops[shop]._id.toString() && currentDoc.doctype === "sale") {
                saleTotal += currentDoc.amountpaid
                for (let payment in currentDoc.payment) {
                    let currentPayment = currentDoc.payment[payment]
                    if (currentPayment.name === "Debit") {
                        debitSale += currentPayment.amount
                    } else if (currentPayment.name === "Cash") {
                        cashSale += currentPayment.amount
                    } else if (currentPayment.name === "Easypaisa") {
                        easypaisaSale += currentPayment.amount
                    } else if (currentPayment.name === "Jazzcash") {
                        jazzcashSale += currentPayment.amount
                    } else if (currentPayment.name === "Upaisa") {
                        upaisaSale += currentPayment.amount
                    } else if (currentPayment.name === "Meezan") {
                        meezanSale += currentPayment.amount
                    }
                }
            }
        }
        sales.push({ shopid: shops[shop]._id, shopname: shops[shop].shopName, saleTotal, cashSale, debitSale, easypaisaSale, jazzcashSale, upaisaSale, meezanSale })




        let totalProfit = 0;
        let cashProfit = 0;
        let debitProfit = 0;
        let easypaisaProfit = 0;
        let jazzcashProfit = 0;
        let upaisaProfit = 0;
        let meezanProfit = 0;
        for (let i in todayDocsItems) {
            let currentItem = todayDocsItems[i]
            if (currentItem.document.doctype === "sale" && currentItem.document.linkedShop.toString() === shops[shop]._id.toString() && currentItem.document.status === "processed") {
                // Calculate the total profit first
                totalProfit += (currentItem.saleamount - currentItem.costamount);  // Using the updated variable name 'costamount'

                // Iterate over the payments for the current item
                for (var k in currentItem.document.payment) {
                    let currentPayment = currentItem.document.payment[k];
                
                    // Calculate proportionate profit based on the payment amount
                    let proportionateProfit = (currentItem.saleamount - currentItem.costamount) * (currentPayment.amount / currentItem.document.amountpaid);
                
                    if (currentPayment.name === "Debit") {
                        if (currentPayment.amount === currentItem.document.amountpaid) {
                            debitProfit += (currentItem.saleamount - currentItem.costamount); // Full profit if payment matches the amount paid
                        } else {
                            debitProfit += proportionateProfit; // Proportional profit if there are multiple payment methods
                        }
                    } else if (currentPayment.name === "Cash") {
                        if (currentPayment.amount === currentItem.document.amountpaid) {
                            cashProfit += (currentItem.saleamount - currentItem.costamount); // Full profit if payment matches the amount paid
                        } else {
                            cashProfit += proportionateProfit; // Proportional profit
                        }
                    } else if (currentPayment.name === "Easypaisa") {
                        if (currentPayment.amount === currentItem.document.amountpaid) {
                            easypaisaProfit += (currentItem.saleamount - currentItem.costamount); // Full profit if payment matches the amount paid
                        } else {
                            easypaisaProfit += proportionateProfit; // Proportional profit
                        }
                    } else if (currentPayment.name === "Jazzcash") {
                        if (currentPayment.amount === currentItem.document.amountpaid) {
                            jazzcashProfit += (currentItem.saleamount - currentItem.costamount); // Full profit if payment matches the amount paid
                        } else {
                            jazzcashProfit += proportionateProfit; // Proportional profit
                        }
                    } else if (currentPayment.name === "Upaisa") {
                        if (currentPayment.amount === currentItem.document.amountpaid) {
                            upaisaProfit += (currentItem.saleamount - currentItem.costamount); // Full profit if payment matches the amount paid
                        } else {
                            upaisaProfit += proportionateProfit; // Proportional profit
                        }
                    } else if (currentPayment.name === "Meezan") {
                        if (currentPayment.amount === currentItem.document.amountpaid) {
                            meezanProfit += (currentItem.saleamount - currentItem.costamount); // Full profit if payment matches the amount paid
                        } else {
                            meezanProfit += proportionateProfit; // Proportional profit
                        }
                    }
                }
                



            }
        }
        profit.push({ shopid: shops[shop]._id, shopname: shops[shop].shopName, totalProfit, cashProfit, debitProfit, easypaisaProfit, jazzcashProfit, upaisaProfit, meezanProfit })

    }




    res.render('reports/detailed/daily', {
        titledate:formattedDate,
        stock,
        sales,
        shops: shopNames,
        profit,
    });



})


module.exports = router