// Shared helpers for all finalize routes

const Product = require('../../../models/Product')
const ProductHistory = require('../../../models/ProductHistory')
const Customer = require('../../../models/Customer')
const Shop = require('../../../models/Shop')
const CashRegister = require('../../../models/CashRegister')

/**
 * Save product history snapshots and bulk-update onHand for each item.
 * @param {Array}  itemsList - doc items (each needs .product = productId string)
 * @param {string} user      - userId
 * @param {number} qtySign   - +1 (stock in) or -1 (stock out)
 * @param {string} docType   - e.g. 'sale', 'purchase', 'refund', 'loss', 'stockreturn'
 * @param {object} [conn]    - optional transaction connection
 */
async function updateProductHistory(itemsList, user, qtySign, docType, conn) {
    const productIds = itemsList.map(item => item.product).filter(Boolean)
    const products = await Product.find({ id: { $in: productIds } }, conn)
    const bulkOps = []

    for (const match of itemsList) {
        const product = products.find(p => p.id === match.product || p.id === match.product?.toString())
        if (product) {
            await ProductHistory.save({ ...product, modifiedby: user, productId: product.id, docType }, conn)
            bulkOps.push({ updateOne: { filter: { id: match.product }, update: { $inc: { onHand: qtySign * match.qty } } } })
        }
    }
    await Product.bulkWrite(bulkOps, conn)
}

/**
 * Recalculate and save lenehain/denehain for a shop.
 * @param {string} shopId
 * @param {object} [conn]
 */
async function updateShopBalance(shopId, conn) {
    const customers = await Customer.find({ linkedShop: shopId }, conn)
    let lenehain = 0, denehain = 0
    customers.forEach(c => { if (c.balance >= 0) lenehain += c.balance; else denehain += Math.abs(c.balance) })
    await Shop.findByIdAndUpdate(shopId, {
        lenehain: parseFloat(lenehain).toFixed(2),
        denehain: parseFloat(denehain).toFixed(2),
    }, conn)
}

/**
 * Insert cash register entries for each payment method.
 * @param {object} [conn]
 */
async function insertCashRegisterEntries(payments, shopId, customerId, date, user, type, documentId, conn) {
    const entries = payments.map(p => ({
        user, customer: customerId || null, date, type,
        method: p.name, amount: p.amount,
        shop: shopId, document: documentId || null,
    }))
    await CashRegister.insertMany(entries, conn)
}

module.exports = { updateProductHistory, updateShopBalance, insertCashRegisterEntries }
