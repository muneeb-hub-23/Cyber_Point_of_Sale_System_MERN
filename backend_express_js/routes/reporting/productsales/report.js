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
        const { startdate, enddate, shopid, customerid, supplierid } = req.headers;
        
        console.log('Product Sales Report Parameters:');
        console.log('  startdate:', startdate);
        console.log('  enddate:', enddate);
        console.log('  shopid:', shopid);
        console.log('  customerid:', customerid);
        console.log('  supplierid:', supplierid);
        
        let sdate = convertToDateFormat(startdate);
        let edate = convertToDateFormat(enddate);
        let datesArray = getDateRange({ sdate, edate });
        
        console.log(`Date range: ${sdate} to ${edate} (${datesArray.length} days)`);

        // Build query for documents
        let docQuery = {
            date: { $in: datesArray },
            status: "processed",
            doctype: "sale"
        };

        if (shopid && shopid !== 'all') {
            docQuery.linkedShop = shopid;
        }

        // Only filter by customer if a specific customer is selected
        // Many sales don't have customers, so we shouldn't filter them out
        if (customerid && customerid !== 'all') {
            docQuery.customer = customerid;
        }

        // Get documents
        const documents = await Document.find(docQuery);
        const documentIds = documents.map(doc => doc._id);

        console.log(`Found ${documents.length} documents for product sales report`);

        // Get document items with product details
        let docItems = await DocItem.find({ document: { $in: documentIds } })
            .populate({
                path: 'product',
                populate: [
                    { path: 'suplier', model: 'customers' },
                    { path: 'shop', model: 'shops' }
                ]
            });

        console.log(`Found ${docItems.length} document items`);

        // Filter by supplier if specified
        if (supplierid && supplierid !== 'all') {
            const originalLength = docItems.length;
            docItems = docItems.filter(item => 
                item.product && item.product.suplier && 
                item.product.suplier._id.toString() === supplierid
            );
            console.log(`Filtered by supplier: ${originalLength} -> ${docItems.length} items`);
        }

        // Aggregate sales by product
        const productSales = {};
        let skippedItems = 0;
        
        for (let item of docItems) {
            if (!item.product) {
                skippedItems++;
                console.log(`Skipping item with missing product reference`);
                continue;
            }

            const productId = item.product._id.toString();
            
            if (!productSales[productId]) {
                productSales[productId] = {
                    productName: item.product.name,
                    itemCode: item.product.itemCode,
                    barCode: item.product.barCode,
                    supplierName: item.product.suplier?.customerName || 'N/A',
                    shopName: item.product.shop?.shopName || 'N/A',
                    unitPrice: item.sale || 0,
                    quantitySold: 0,
                    totalSales: 0,
                    totalCost: 0,
                    profit: 0
                };
            }

            productSales[productId].quantitySold += item.qty;
            productSales[productId].totalSales += item.saleamount;
            productSales[productId].totalCost += item.costamount;
            productSales[productId].profit += (item.saleamount - item.costamount);
        }

        // Convert to array and sort by quantity sold
        const salesArray = Object.values(productSales).sort((a, b) => b.quantitySold - a.quantitySold);

        console.log(`Skipped ${skippedItems} items with missing products`);
        console.log(`Aggregated sales for ${salesArray.length} unique products`);

        // Calculate totals
        const totals = salesArray.reduce((acc, item) => {
            acc.totalQuantity += item.quantitySold;
            acc.totalSales += item.totalSales;
            acc.totalCost += item.totalCost;
            acc.totalProfit += item.profit;
            return acc;
        }, { totalQuantity: 0, totalSales: 0, totalCost: 0, totalProfit: 0 });

        // Generate HTML report
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Product Sales Report</title>
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
                <h1>📊 Product Sales Report</h1>
                <p>Period: ${new Date(parseInt(sdate.substring(0, 4)), parseInt(sdate.substring(4, 6)) - 1, parseInt(sdate.substring(6, 8))).toLocaleDateString()} - ${new Date(parseInt(edate.substring(0, 4)), parseInt(edate.substring(4, 6)) - 1, parseInt(edate.substring(6, 8))).toLocaleDateString()}</p>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="summary">
                <div class="summary-item">
                    <strong>Total Products:</strong> ${salesArray.length}
                </div>
                <div class="summary-item">
                    <strong>Total Quantity Sold:</strong> ${totals.totalQuantity}
                </div>
                <div class="summary-item">
                    <strong>Total Sales:</strong> Rs. ${totals.totalSales.toFixed(2)}
                </div>
                <div class="summary-item">
                    <strong>Total Profit:</strong> Rs. ${totals.totalProfit.toFixed(2)}
                </div>
            </div>

            ${salesArray.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Item Code</th>
                        <th>Product Name</th>
                        <th>Supplier</th>
                        <th>Shop</th>
                        <th>Unit Price</th>
                        <th>Qty Sold</th>
                        <th>Total Sales</th>
                        <th>Total Cost</th>
                        <th>Profit</th>
                    </tr>
                </thead>
                <tbody>
                    ${salesArray.map(product => `
                        <tr>
                            <td>${product.itemCode}</td>
                            <td>${product.productName}</td>
                            <td>${product.supplierName}</td>
                            <td>${product.shopName}</td>
                            <td class="amount">Rs. ${product.unitPrice.toFixed(2)}</td>
                            <td class="quantity">${product.quantitySold}</td>
                            <td class="amount">Rs. ${product.totalSales.toFixed(2)}</td>
                            <td class="amount">Rs. ${product.totalCost.toFixed(2)}</td>
                            <td class="amount ${product.profit >= 0 ? 'profit-positive' : 'profit-negative'}">Rs. ${product.profit.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="5" class="total-label">TOTAL:</td>
                        <td class="quantity">${totals.totalQuantity}</td>
                        <td class="amount">Rs. ${totals.totalSales.toFixed(2)}</td>
                        <td class="amount">Rs. ${totals.totalCost.toFixed(2)}</td>
                        <td class="amount ${totals.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">Rs. ${totals.totalProfit.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
            ` : `
            <div class="no-data">
                ℹ️ No Sales Data Found for the selected period and filters.
            </div>
            `}

            <div class="footer">
                <p>This report shows all products sold during the specified period with quantity and revenue details.</p>
            </div>
        </body>
        </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.send(html);

    } catch (error) {
        console.error('Error generating product sales report:', error);
        res.status(500).json({ success: false, message: 'Error generating report', error: error.message });
    }
});

module.exports = router;
