const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const db = require('../../db');

router.get('/', async (req, res) => {
  const { period, shop } = req.query;

  if (!shop) {
    return res.status(400).json({ error: "Shop parameter is required" });
  }

  let startDate, endDate, groupBy;
  const today = new Date();

  switch (period) {
    case "day":
      startDate = dayjs().subtract(12, 'day').startOf('day').toDate();
      endDate = dayjs().endOf('day').toDate();
      groupBy = 'day';
      break;
    case "week":
      startDate = dayjs().subtract(84, 'day').startOf('day').toDate();
      endDate = dayjs().endOf('day').toDate();
      groupBy = 'week';
      break;
    case "month":
      startDate = dayjs().subtract(12, 'month').startOf('month').toDate();
      endDate = dayjs().endOf('day').toDate();
      groupBy = 'month';
      break;
    case "year":
      startDate = dayjs().subtract(12, 'year').startOf('year').toDate();
      endDate = dayjs().endOf('day').toDate();
      groupBy = 'year';
      break;
    default:
      return res.status(400).json({ error: "Invalid period" });
  }

  try {
    const [transactions] = await db.query(
      `SELECT trnsType, amount, createdAt
       FROM transactions
       WHERE createdAt BETWEEN ? AND ?
         AND JSON_UNQUOTE(JSON_EXTRACT(currentCustomer, '$.linkedShop')) = ?`,
      [startDate, endDate, shop]
    )

    if (!transactions.length) {
      return res.status(404).json({ error: "No transactions found" });
    }

    const groupTransactions = (transactions, groupBy) => {
      let groupedData = {};
      transactions.forEach((transaction) => {
        const { trnsType, amount, createdAt } = transaction;
        let key;
        if (groupBy === 'day') { key = dayjs(createdAt).format('DD-MMM') }
        else if (groupBy === 'week') { key = `Week ${dayjs(createdAt).week()}` }
        else if (groupBy === 'month') { key = dayjs(createdAt).format('MMM-YYYY') }
        else if (groupBy === 'year') { key = dayjs(createdAt).format('YYYY') }

        if (!groupedData[key]) groupedData[key] = { wasool: 0, mallDia: 0 };
        if (trnsType === 'minus') groupedData[key].wasool += Number(amount);
        else if (trnsType === 'plus') groupedData[key].mallDia += Number(amount);
      });
      return groupedData;
    };

    const groupedData = groupTransactions(transactions, groupBy);
    const data = Object.keys(groupedData).map(key => ({
      label: key,
      wasool: groupedData[key].wasool,
      mallDia: groupedData[key].mallDia,
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
