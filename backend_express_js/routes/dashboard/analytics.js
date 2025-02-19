const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const Transaction = require('../../models/Transaction');  // Adjust path as necessary

// Route to handle fetching transactions
router.get('/', async (req, res) => {
  const { period, shop } = req.query;  // Capture the 'shop' from the query parameters

  // Validate the required parameters
  if (!shop) {
    return res.status(400).json({ error: "Shop parameter is required" });
  }

  // Check if 'shop' is a valid ObjectId (if it's supposed to be)
  if (!mongoose.Types.ObjectId.isValid(shop)) {
    return res.status(400).json({ error: "Invalid shop ID" });
  }

  let startDate, endDate, groupBy;

  // Calculate startDate and endDate based on the period
  const today = new Date();

  switch (period) {
    case "day":
      // Last 12 days including today
      startDate = dayjs().subtract(12, 'day').startOf('day').toDate();
      endDate = dayjs().endOf('day').toDate();
      groupBy = 'day';
      break;

    case "week":
      // Last 12 weeks (each set of 7 days)
      startDate = dayjs().subtract(84, 'day').startOf('day').toDate();
      endDate = dayjs().endOf('day').toDate();
      groupBy = 'week';
      break;

    case "month":
      // Last 12 months including the current ongoing month
      startDate = dayjs().subtract(12, 'month').startOf('month').toDate();
      endDate = dayjs().endOf('day').toDate();
      groupBy = 'month';
      break;

    case "year":
      // Last 12 years including the current ongoing year
      startDate = dayjs().subtract(12, 'year').startOf('year').toDate();
      endDate = dayjs().endOf('day').toDate();
      groupBy = 'year';
      break;

    default:
      return res.status(400).json({ error: "Invalid period" });
  }

  try {
    // Fetch transactions within the time range and filter by the selected shop
    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate },
      'currentCustomer.linkedShop': shop  // Filter by the 'shop' field
    });

    // If no transactions are found
    if (!transactions.length) {
      return res.status(404).json({ error: "No transactions found" });
    }

    // Helper function to group transactions
    const groupTransactions = (transactions, groupBy) => {
      let groupedData = {};

      transactions.forEach((transaction) => {
        const { trnsType, amount, createdAt } = transaction;
        let key;

        // Group by day, week, month, or year
        if (groupBy === 'day') {
          key = dayjs(createdAt).format('DD-MMM');  // "16-Oct"
        } else if (groupBy === 'week') {
          key = `Week ${dayjs(createdAt).week()}`;  // "Week 1", "Week 2", etc.
        } else if (groupBy === 'month') {
          key = dayjs(createdAt).format('MMM-YYYY');  // "Oct-2025"
        } else if (groupBy === 'year') {
          key = dayjs(createdAt).format('YYYY');  // "2025"
        }

        if (!groupedData[key]) {
          groupedData[key] = { wasool: 0, mallDia: 0 };
        }

        // Sum the transactions by type (wasool or mallDia)
        if (trnsType === 'minus') {
          groupedData[key].wasool += amount;
        } else if (trnsType === 'plus') {
          groupedData[key].mallDia += amount;
        }
      });

      return groupedData;
    };

    // Group transactions based on the selected period
    const groupedData = groupTransactions(transactions, groupBy);

    // Convert groupedData to array format
    const data = [];
    Object.keys(groupedData).forEach((key) => {
      data.push({
        label: key, // e.g. "16-Oct" for days or "Week 1" for weeks
        wasool: groupedData[key].wasool,
        mallDia: groupedData[key].mallDia,
      });
    });

    // Return the grouped data
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
