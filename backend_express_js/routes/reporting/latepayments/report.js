const express = require('express');
const router = express.Router();
const Transaction = require('../../../models/Transaction');
const Customer = require('../../../models/Customer');
const Shop = require('../../../models/Shop');

router.get('/', async (req, res) => {
    try {
        const { shopid, customerid } = req.headers;
        
        // Build query for transactions with debit payments that have payment terms
        let query = {
            transactionType: 'malldia',
            trnsType: 'plus',
            daysToClear: { $gt: 0 }
        };

        // Get all debit transactions with payment terms
        let transactions = await Transaction.find(query)
            .populate({
                path: 'currentCustomer',
                populate: {
                    path: 'linkedShop',
                    model: 'shops'
                }
            })
            .sort({ createdAt: -1 });

        // Calculate late payments
        let latePayments = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let transaction of transactions) {
            if (!transaction.currentCustomer) continue;

            // Apply filters
            if (shopid && shopid !== 'all' && transaction.currentCustomer.linkedShop?._id.toString() !== shopid) {
                continue;
            }
            if (customerid && customerid !== 'all' && transaction.currentCustomer._id?.toString() !== customerid) {
                continue;
            }

            // Parse transaction date (format: YYYYMMDD)
            const transDateStr = transaction.date;
            const transYear = parseInt(transDateStr.substring(0, 4));
            const transMonth = parseInt(transDateStr.substring(4, 6)) - 1;
            const transDay = parseInt(transDateStr.substring(6, 8));
            const transactionDate = new Date(transYear, transMonth, transDay);

            // Calculate due date
            const dueDate = new Date(transactionDate);
            dueDate.setDate(dueDate.getDate() + transaction.daysToClear);

            // Check if payment is late
            if (today > dueDate) {
                // Calculate days late
                const diffTime = Math.abs(today - dueDate);
                const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Get current customer balance to check if fully paid
                const customer = await Customer.findById(transaction.currentCustomer._id);
                
                // If customer still has positive balance (owes money), include in late payments
                if (customer && customer.balance > 0) {
                    latePayments.push({
                        customerName: transaction.currentCustomer.customerName || 'N/A',
                        customerMobileNumber: transaction.currentCustomer.customerMobileNumber || 'N/A',
                        shopName: transaction.currentCustomer.linkedShop?.shopName || 'N/A',
                        transactionDate: transactionDate.toLocaleDateString(),
                        dueDate: dueDate.toLocaleDateString(),
                        totalBillAmount: transaction.amount || 0,
                        currentBalance: customer.balance || 0,
                        paidAmount: (transaction.amount - customer.balance) || 0,
                        remainingAmount: customer.balance || 0,
                        daysLate: daysLate,
                        daysToClear: transaction.daysToClear,
                        remarks: transaction.remarks || 'N/A'
                    });
                }
            }
        }

        // Sort by days late (descending)
        latePayments.sort((a, b) => b.daysLate - a.daysLate);

        // Generate HTML report
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Late Payments Report</title>
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
                    color: #d32f2f;
                    margin: 0;
                    font-size: 28px;
                }
                .header p {
                    color: #666;
                    margin: 5px 0 0 0;
                }
                .summary {
                    background: #ffebee;
                    border: 2px solid #d32f2f;
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
                    color: #d32f2f;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                thead {
                    background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%);
                    color: white;
                }
                th {
                    padding: 12px 8px;
                    text-align: left;
                    font-weight: bold;
                    font-size: 12px;
                    border: 1px solid #c62828;
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
                    background-color: #ffebee;
                }
                .late-urgent {
                    background-color: #ffcdd2 !important;
                    font-weight: bold;
                }
                .late-warning {
                    background-color: #fff9c4 !important;
                }
                .amount {
                    text-align: right;
                    font-weight: bold;
                }
                .days-late {
                    color: #d32f2f;
                    font-weight: bold;
                    text-align: center;
                }
                .no-data {
                    text-align: center;
                    padding: 40px;
                    color: #4caf50;
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
            </style>
        </head>
        <body>
            <div class="header">
                <h1>⚠️ Late Payments Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="summary">
                <div class="summary-item">
                    <strong>Total Late Payments:</strong> ${latePayments.length}
                </div>
                <div class="summary-item">
                    <strong>Total Outstanding:</strong> Rs. ${latePayments.reduce((sum, p) => sum + p.remainingAmount, 0).toFixed(2)}
                </div>
            </div>

            ${latePayments.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Mobile</th>
                        <th>Shop</th>
                        <th>Trans. Date</th>
                        <th>Due Date</th>
                        <th>Total Bill</th>
                        <th>Paid</th>
                        <th>Remaining</th>
                        <th>Days Late</th>
                        <th>Payment Terms</th>
                        <th>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    ${latePayments.map(payment => `
                        <tr class="${payment.daysLate > 7 ? 'late-urgent' : payment.daysLate > 3 ? 'late-warning' : ''}">
                            <td>${payment.customerName}</td>
                            <td>${payment.customerMobileNumber}</td>
                            <td>${payment.shopName}</td>
                            <td>${payment.transactionDate}</td>
                            <td>${payment.dueDate}</td>
                            <td class="amount">Rs. ${payment.totalBillAmount.toFixed(2)}</td>
                            <td class="amount">Rs. ${payment.paidAmount.toFixed(2)}</td>
                            <td class="amount">Rs. ${payment.remainingAmount.toFixed(2)}</td>
                            <td class="days-late">${payment.daysLate} days</td>
                            <td style="text-align: center;">${payment.daysToClear} days</td>
                            <td>${payment.remarks}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="5" class="total-label">TOTAL:</td>
                        <td class="amount">Rs. ${latePayments.reduce((sum, p) => sum + p.totalBillAmount, 0).toFixed(2)}</td>
                        <td class="amount">Rs. ${latePayments.reduce((sum, p) => sum + p.paidAmount, 0).toFixed(2)}</td>
                        <td class="amount">Rs. ${latePayments.reduce((sum, p) => sum + p.remainingAmount, 0).toFixed(2)}</td>
                        <td colspan="3"></td>
                    </tr>
                </tfoot>
            </table>
            ` : `
            <div class="no-data">
                ✓ No Late Payments Found! All customers are up to date.
            </div>
            `}

            <div class="footer">
                <p>This report shows customers with outstanding debit payments past their due date.</p>
                <p>Color coding: <span style="background: #ffcdd2; padding: 2px 8px;">Urgent (>7 days)</span> 
                <span style="background: #fff9c4; padding: 2px 8px; margin-left: 10px;">Warning (>3 days)</span></p>
            </div>
        </body>
        </html>
        `;

        // Return HTML directly for iframe display
        res.setHeader('Content-Type', 'text/html');
        res.send(html);

    } catch (error) {
        console.error('Error generating late payments report:', error);
        res.status(500).json({ success: false, message: 'Error generating report', error: error.message });
    }
});

module.exports = router;
