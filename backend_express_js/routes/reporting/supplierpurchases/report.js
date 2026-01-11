const express = require('express');
const router = express.Router();
const Document = require('../../../models/Documents');
const DocItem = require('../../../models/DocumentItem');
const Product = require('../../../models/Product');

function convertToDateFormat(dateInput) {
    if (!dateInput) {
        throw new Error("Invalid date");
    }
    if (typeof dateInput === 'string') {
        const trimmed = dateInput.trim();
        if (/^\d{8}$/.test(trimmed)) {
            return trimmed;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed.replace(/-/g, '');
        }
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
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
    try {
        const { startdate, enddate, shopid, supplierid } = req.headers;
        
        console.log('Supplier Purchase Report Parameters:');
        console.log('  startdate:', startdate);
        console.log('  enddate:', enddate);
        console.log('  shopid:', shopid);
        console.log('  supplierid:', supplierid);
        
        let sdate = convertToDateFormat(startdate);
        let edate = convertToDateFormat(enddate);
        let datesArray = getDateRange({ sdate, edate });
        
        console.log(`Date range: ${sdate} to ${edate} (${datesArray.length} days)`);

        // Build query for purchase documents
        let docQuery = {
            date: { $in: datesArray },
            status: "processed",
            doctype: "purchase"
        };

        if (shopid && shopid !== 'all') {
            docQuery.linkedShop = shopid;
        }

        // Get purchase documents
        const documents = await Document.find(docQuery);
        const documentIds = documents.map(doc => doc._id);

        console.log(`Found ${documents.length} purchase documents for supplier purchase report`);

        // Get document items with product details
        let docItems = await DocItem.find({ document: { $in: documentIds } })
            .populate({
                path: 'product',
                populate: [
                    { path: 'suplier', model: 'customers' },
                    { path: 'shop', model: 'shops' }
                ]
            });

        console.log(`Found ${docItems.length} purchase items`);

        // Aggregate purchases by supplier
        const supplierPurchases = {};
        let skippedItems = 0;
        
        for (let item of docItems) {
            if (!item.product || !item.product.suplier) {
                skippedItems++;
                continue;
            }

            const supplierId = item.product.suplier._id.toString();
            
            // Filter by specific supplier if selected
            if (supplierid && supplierid !== 'all' && supplierId !== supplierid) {
                continue;
            }
            
            if (!supplierPurchases[supplierId]) {
                supplierPurchases[supplierId] = {
                    supplierName: item.product.suplier.customerName || 'N/A',
                    supplierMobile: item.product.suplier.customerMobileNumber || 'N/A',
                    totalPurchaseCost: 0,
                    totalQuantity: 0,
                    expectedRevenue: 0,
                    expectedProfit: 0,
                    purchaseCount: 0
                };
            }

            supplierPurchases[supplierId].totalPurchaseCost += item.costamount || 0;
            supplierPurchases[supplierId].totalQuantity += item.qty || 0;
            supplierPurchases[supplierId].expectedRevenue += (item.sale || 0) * (item.qty || 0);
            supplierPurchases[supplierId].expectedProfit += ((item.sale || 0) * (item.qty || 0)) - (item.costamount || 0);
            supplierPurchases[supplierId].purchaseCount += 1;
        }

        // Convert to array and sort by total purchase cost (highest to lowest)
        const purchasesArray = Object.values(supplierPurchases).sort((a, b) => b.totalPurchaseCost - a.totalPurchaseCost);

        console.log(`Skipped ${skippedItems} items with missing supplier`);
        console.log(`Aggregated purchases for ${purchasesArray.length} suppliers`);

        // Calculate totals
        const totals = purchasesArray.reduce((acc, item) => {
            acc.totalQuantity += item.totalQuantity;
            acc.totalPurchaseCost += item.totalPurchaseCost;
            acc.expectedRevenue += item.expectedRevenue;
            acc.expectedProfit += item.expectedProfit;
            acc.purchaseCount += item.purchaseCount;
            return acc;
        }, { totalQuantity: 0, totalPurchaseCost: 0, expectedRevenue: 0, expectedProfit: 0, purchaseCount: 0 });

        // Generate HTML report
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Supplier Purchase Report</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    background: white;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #333;
                    padding-bottom: 15px;
                }
                .header h1 {
                    color: #1976d2;
                    margin: 0;
                    font-size: 28px;
                }
                .header p {
                    color: #666;
                    margin: 5px 0 0 0;
                }
                .summary {
                    background: #e3f2fd;
                    border: 2px solid #1976d2;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 25px;
                }
                .summary-item {
                    display: inline-block;
                    margin: 0 20px;
                    font-size: 16px;
                }
                .summary-item strong {
                    color: #1976d2;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                thead {
                    background: linear-gradient(135deg, #1976d2 0%, #2196f3 100%);
                    color: white;
                }
                th {
                    padding: 12px 8px;
                    text-align: left;
                    font-weight: bold;
                    font-size: 12px;
                    border: 1px solid #1565c0;
                }
                td {
                    padding: 10px 8px;
                    border: 1px solid #ddd;
                    font-size: 11px;
                }
                tbody tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                tbody tr:hover {
                    background-color: #e3f2fd;
                }
                .rank {
                    text-align: center;
                    font-weight: bold;
                    color: #1976d2;
                }
                .rank-1 {
                    background-color: #ffd700 !important;
                    font-size: 13px;
                }
                .rank-2 {
                    background-color: #c0c0c0 !important;
                }
                .rank-3 {
                    background-color: #cd7f32 !important;
                }
                .amount {
                    text-align: right;
                    font-weight: bold;
                }
                .quantity {
                    text-align: center;
                    font-weight: bold;
                    color: #1976d2;
                }
                .profit-positive {
                    color: #4caf50;
                }
                .profit-negative {
                    color: #f44336;
                }
                tfoot {
                    background: linear-gradient(135deg, #1976d2 0%, #2196f3 100%);
                    color: white;
                    font-weight: bold;
                    font-size: 13px;
                }
                tfoot td {
                    padding: 12px 8px;
                    border: 2px solid #1565c0;
                }
                .total-label {
                    text-align: right;
                    font-size: 14px;
                    font-weight: bold;
                }
                .no-data {
                    text-align: center;
                    padding: 40px;
                    color: #ff9800;
                    font-size: 18px;
                    font-weight: bold;
                }
                .footer {
                    margin-top: 30px;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                    border-top: 2px solid #ddd;
                    padding-top: 15px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📦 Supplier Purchase Report</h1>
                <p>Period: ${new Date(parseInt(sdate.substring(0, 4)), parseInt(sdate.substring(4, 6)) - 1, parseInt(sdate.substring(6, 8))).toLocaleDateString()} - ${new Date(parseInt(edate.substring(0, 4)), parseInt(edate.substring(4, 6)) - 1, parseInt(edate.substring(6, 8))).toLocaleDateString()}</p>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="summary">
                <div class="summary-item">
                    <strong>Total Suppliers:</strong> ${purchasesArray.length}
                </div>
                <div class="summary-item">
                    <strong>Total Purchases:</strong> ${totals.purchaseCount}
                </div>
                <div class="summary-item">
                    <strong>Total Quantity:</strong> ${totals.totalQuantity}
                </div>
                <div class="summary-item">
                    <strong>Total Purchase Cost:</strong> Rs. ${totals.totalPurchaseCost.toFixed(2)}
                </div>
                <div class="summary-item">
                    <strong>Expected Profit:</strong> Rs. ${totals.expectedProfit.toFixed(2)}
                </div>
            </div>

            ${purchasesArray.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Supplier Name</th>
                        <th>Mobile</th>
                        <th>Purchase Count</th>
                        <th>Total Qty</th>
                        <th>Total Cost</th>
                        <th>Exp. Revenue</th>
                        <th>Exp. Profit</th>
                        <th>Profit Margin %</th>
                    </tr>
                </thead>
                <tbody>
                    ${purchasesArray.map((supplier, index) => {
                        const profitMargin = supplier.totalPurchaseCost > 0 ? ((supplier.expectedProfit / supplier.totalPurchaseCost) * 100) : 0;
                        const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
                        return `
                        <tr class="${rankClass}">
                            <td class="rank">${index + 1}</td>
                            <td>${supplier.supplierName}</td>
                            <td>${supplier.supplierMobile}</td>
                            <td class="quantity">${supplier.purchaseCount}</td>
                            <td class="quantity">${supplier.totalQuantity}</td>
                            <td class="amount">Rs. ${supplier.totalPurchaseCost.toFixed(2)}</td>
                            <td class="amount">Rs. ${supplier.expectedRevenue.toFixed(2)}</td>
                            <td class="amount ${supplier.expectedProfit >= 0 ? 'profit-positive' : 'profit-negative'}">Rs. ${supplier.expectedProfit.toFixed(2)}</td>
                            <td class="amount ${profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">${profitMargin.toFixed(2)}%</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="total-label">TOTAL:</td>
                        <td class="quantity">${totals.purchaseCount}</td>
                        <td class="quantity">${totals.totalQuantity}</td>
                        <td class="amount">Rs. ${totals.totalPurchaseCost.toFixed(2)}</td>
                        <td class="amount">Rs. ${totals.expectedRevenue.toFixed(2)}</td>
                        <td class="amount ${totals.expectedProfit >= 0 ? 'profit-positive' : 'profit-negative'}">Rs. ${totals.expectedProfit.toFixed(2)}</td>
                        <td class="amount">${totals.totalPurchaseCost > 0 ? ((totals.expectedProfit / totals.totalPurchaseCost) * 100).toFixed(2) : 0}%</td>
                    </tr>
                </tfoot>
            </table>
            ` : `
            <div class="no-data">
                ℹ️ No Purchase Data Found for the selected period and filters.
            </div>
            `}

            <div class="footer">
                <p>This report shows all suppliers ranked by total purchase cost (highest to lowest) with expected profit analysis.</p>
                <p>🥇 Gold, 🥈 Silver, 🥉 Bronze indicate top 3 suppliers by purchase volume</p>
            </div>
        </body>
        </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.send(html);

    } catch (error) {
        console.error('Error generating supplier purchase report:', error);
        res.status(500).json({ success: false, message: 'Error generating report', error: error.message });
    }
});

module.exports = router;
