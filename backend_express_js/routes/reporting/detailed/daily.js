const express = require('express')
const router = express.Router()
const Shop = require('../../../models/Shop')
const Document = require('../../../models/Documents')
const DocItem = require('../../../models/DocumentItem')
const Product = require('../../../models/Product')
const CashRegister = require('../../../models/CashRegister')


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
    if (!dateInput) {
        throw new Error("Invalid date");
    }
    if (typeof dateInput === 'string') {
        const trimmed = dateInput.trim();
        if (/^\d{8}$/.test(trimmed)) {
            // already in yyyymmdd
            return trimmed;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            // yyyy-mm-dd -> yyyymmdd
            return trimmed.replace(/-/g, '');
        }
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
            // dd/mm/yyyy -> yyyymmdd
            const [dd, mm, yyyy] = trimmed.split('/');
            return `${yyyy}${mm}${dd}`;
        }
    }
    const date = new Date(dateInput);
    if (isNaN(date)) {
        throw new Error("Invalid date");
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
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
    const { doctype, criteria, startdate, enddate } = req.headers
    let sdate = convertToDateFormat(startdate)
    let edate = convertToDateFormat(enddate)
    let datesArray = getDateRange({ sdate, edate })
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
    const formattedDate2 = convertDateFormat(edate);

    let cashRegisterEntries = await CashRegister.find({ date: { $in: datesArray } });
    let wasooli = [];
    let paidMoney = [];
    let purchase = [];
    let salesmanwasooli = [];

    for (let shop in shops) {

        let cashPaidMoney = 0;
        let debitPaidMoney = 0;
        let easypaisaPaidMoney = 0;
        let jazzcashPaidMoney = 0;
        let upaisaPaidMoney = 0;
        let meezanPaidMoney = 0;

        let totalPaidMoney = cashRegisterEntries.reduce((accumulator, currentEntry) => {
            if(currentEntry.shop.toString() === shops[shop]._id.toString() && currentEntry.type === "paidmoney"){

                const amt = Number(currentEntry.amount) || 0;
                if (currentEntry.method === "debit") {
                    debitPaidMoney += amt
                } else if (currentEntry.method === "cash") {
                    cashPaidMoney += amt
                } else if (currentEntry.method === "easypaisa") {
                    easypaisaPaidMoney += amt
                } else if (currentEntry.method === "jazzcash") {
                    jazzcashPaidMoney += amt
                } else if (currentEntry.method === "upaisa") {
                    upaisaPaidMoney += amt
                } else if (currentEntry.method === "meezan") {
                    meezanPaidMoney += amt
                }

                return accumulator + amt;
            }else{
                return accumulator;
            }
          }, 0);
        paidMoney.push({ shopid: shops[shop]._id, shopname: shops[shop].shopName,cashPaidMoney,debitPaidMoney,easypaisaPaidMoney,jazzcashPaidMoney,upaisaPaidMoney,meezanPaidMoney, amount: totalPaidMoney })
        let cashWasooli = 0;
        let debitWasooli = 0;
        let easypaisaWasooli = 0;
        let jazzcashWasooli = 0;
        let upaisaWasooli = 0;
        let meezanWasooli = 0;
        let wasoolthroughsalesman = 0;
        let wasoolthroughcounter = 0;
        let totalAmount = cashRegisterEntries.reduce((accumulator, currentEntry) => {
            if(currentEntry.shop.toString() === shops[shop]._id.toString() && currentEntry.type === "wasool"){
                const amt = Number(currentEntry.amount) || 0;
                if(currentEntry.transactionCollectedFrom === "salesman"){
                    wasoolthroughsalesman+= amt
                }else{
                    wasoolthroughcounter += amt
                }

                if (currentEntry.method === "debit") {
                    debitWasooli += amt
                } else if (currentEntry.method === "cash") {
                    cashWasooli += amt
                } else if (currentEntry.method === "easypaisa") {
                    easypaisaWasooli += amt
                } else if (currentEntry.method === "jazzcash") {
                    jazzcashWasooli += amt
                } else if (currentEntry.method === "upaisa") {
                    upaisaWasooli += amt
                } else if (currentEntry.method === "meezan") {
                    meezanWasooli += amt
                }

                return accumulator + amt;
            }else{
                return accumulator;
            }
          }, 0);
        wasooli.push({ shopid: shops[shop]._id, shopname: shops[shop].shopName,cashWasooli,debitWasooli,easypaisaWasooli,jazzcashWasooli,upaisaWasooli,meezanWasooli, amount: totalAmount })
        salesmanwasooli.push({ shopid: shops[shop]._id, shopname: shops[shop].shopName,wasoolthroughsalesman,wasoolthroughcounter })

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
                saleTotal += (Number(currentDoc.amountpaid) || 0)
                for (let payment in currentDoc.payment) {
                    let currentPayment = currentDoc.payment[payment]
                    if (currentPayment.name === "Debit") {
                        debitSale += (Number(currentPayment.amount) || 0)
                    } else if (currentPayment.name === "Cash") {
                        cashSale += (Number(currentPayment.amount) || 0)
                    } else if (currentPayment.name === "Easypaisa") {
                        easypaisaSale += (Number(currentPayment.amount) || 0)
                    } else if (currentPayment.name === "Jazzcash") {
                        jazzcashSale += (Number(currentPayment.amount) || 0)
                    } else if (currentPayment.name === "Upaisa") {
                        upaisaSale += (Number(currentPayment.amount) || 0)
                    } else if (currentPayment.name === "Meezan") {
                        meezanSale += (Number(currentPayment.amount) || 0)
                    }
                }
            }
        }
        sales.push({ shopid: shops[shop]._id, shopname: shops[shop].shopName, saleTotal, cashSale, debitSale, easypaisaSale, jazzcashSale, upaisaSale, meezanSale })

        let purchaseTotal = 0;
        let cashpurchase = 0;
        let debitpurchase = 0;
        let easypaisapurchase = 0;
        let jazzcashpurchase = 0;
        let upaisapurchase = 0;
        let meezanpurchase = 0;

        for (let purchase of todayDocs) {

            if (purchase.linkedShop.toString() === shops[shop]._id.toString() && purchase.doctype === "purchase") {
                purchaseTotal += (Number(purchase.amountpaid) || 0)
                for (let payment in purchase.payment) {
                    let currentPayment = purchase.payment[payment]
                    if (currentPayment.name === "Debit") {
                        debitpurchase += (Number(currentPayment.amount) || 0)
                    } else if (currentPayment.name === "Cash") {
                        cashpurchase += (Number(currentPayment.amount) || 0)
                    } else if (currentPayment.name === "Easypaisa") {
                        easypaisapurchase += (Number(currentPayment.amount) || 0)
                    } else if (currentPayment.name === "Jazzcash") {
                        jazzcashpurchase += (Number(currentPayment.amount) || 0)
                    } else if (currentPayment.name === "Upaisa") {
                        upaisapurchase += (Number(currentPayment.amount) || 0)
                    } else if (currentPayment.name === "Meezan") {
                        meezanpurchase += (Number(currentPayment.amount) || 0)
                    }
                }
            }
        }
        purchase.push({ shopid: shops[shop]._id, shopname: shops[shop].shopName, purchaseTotal, cashpurchase, debitpurchase, easypaisapurchase, jazzcashpurchase, upaisapurchase, meezanpurchase })



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
        titledate: formattedDate,
        enddate: formattedDate2,
        stock,
        sales,
        shops: shopNames,
        profit,
        wasooli,
        paidMoney,
        purchase,
        salesmanwasooli
    });



})


module.exports = router