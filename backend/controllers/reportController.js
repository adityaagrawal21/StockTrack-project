const asyncHandler = require("express-async-handler");
const Transaction = require("../models/Transaction");
const Product = require("../models/Product");

const dateRange = (range) => {
  const now = new Date();
  const start = new Date();
  if (range === "today") { start.setHours(0,0,0,0); }
  else if (range === "7days") { start.setDate(now.getDate() - 7); }
  else if (range === "30days") { start.setDate(now.getDate() - 30); }
  else if (range === "month") { start.setDate(1); start.setHours(0,0,0,0); }
  else { start.setDate(now.getDate() - 7); } // default 7 days
  return start;
};

// @desc  Summary
// @route GET /api/reports/summary
const getSummary = asyncHandler(async (req, res) => {
  const { range = "all", startDate, endDate } = req.query;
  let dateFilter = {};
  if (range !== "all") {
    dateFilter = { $gte: dateRange(range) };
  } else if (startDate || endDate) {
    dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) { const e = new Date(endDate); e.setHours(23,59,59); dateFilter.$lte = e; }
  }
  const txMatch = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

  const [products, salesData, purchaseData, profitData] = await Promise.all([
    Product.find(),
    Transaction.aggregate([
      { $match: { type: "sale", ...txMatch } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 }, profit: { $sum: "$profit" } } }
    ]),
    Transaction.aggregate([
      { $match: { type: "purchase", ...txMatch } },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } }
    ]),
    Transaction.aggregate([
      { $match: { type: "sale", ...txMatch } },
      { $group: { _id: null, totalProfit: { $sum: "$profit" } } }
    ]),
  ]);

  const totalRevenue = salesData[0]?.total || 0;
  const totalSales = salesData[0]?.count || 0;
  const totalPurchaseCost = purchaseData[0]?.total || 0;
  const totalPurchases = purchaseData[0]?.count || 0;
  const totalProfit = profitData[0]?.totalProfit || 0;
  const inventoryValue = products.reduce((s, p) => s + p.quantity * p.price, 0);
  const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity <= p.reorderLevel).length;
  const outOfStockItems = products.filter(p => p.quantity === 0).length;

  res.json({
    success: true,
    summary: {
      totalRevenue, totalSales,
      totalPurchaseCost, totalPurchases,
      totalProfit,
      profitMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0,
      inventoryValue,
      totalProducts: products.length,
      lowStockItems, outOfStockItems,
      netFlow: totalRevenue - totalPurchaseCost,
    },
  });
});

// @desc  Sales trend
// @route GET /api/reports/sales-trend
const getSalesTrend = asyncHandler(async (req, res) => {
  const { range = "7days", startDate, endDate } = req.query;
  let start = dateRange(range);
  if (startDate) start = new Date(startDate);
  let end = new Date();
  if (endDate) { end = new Date(endDate); end.setHours(23,59,59); }

  const trend = await Transaction.aggregate([
    { $match: { type: "sale", createdAt: { $gte: start, $lte: end } } },
    { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      revenue: { $sum: "$total" },
      profit: { $sum: "$profit" },
      count: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ]);
  res.json({ success: true, trend });
});

// @desc  Top products by revenue
// @route GET /api/reports/top-products
const getTopProducts = asyncHandler(async (req, res) => {
  const { range = "all", category } = req.query;
  let txMatch = { type: "sale" };
  if (range !== "all") txMatch.createdAt = { $gte: dateRange(range) };

  let pipeline = [
    { $match: txMatch },
    { $group: {
      _id: "$productName",
      revenue: { $sum: "$total" },
      units: { $sum: "$quantity" },
      profit: { $sum: "$profit" },
    }},
    { $sort: { revenue: -1 } },
    { $limit: 8 },
  ];
  const top = await Transaction.aggregate(pipeline);
  res.json({ success: true, topProducts: top });
});

// @desc  Category value
// @route GET /api/reports/category-value
const getCategoryValue = asyncHandler(async (req, res) => {
  const data = await Product.aggregate([
    { $group: {
      _id: "$category",
      totalValue: { $sum: { $multiply: ["$quantity", "$price"] } },
      count: { $sum: 1 },
    }},
    { $sort: { totalValue: -1 } },
  ]);
  res.json({ success: true, categoryValue: data });
});

// @desc  Low stock
// @route GET /api/reports/low-stock
const getLowStock = asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: { $lte: ["$quantity", "$reorderLevel"] },
  }).sort({ quantity: 1 });
  res.json({ success: true, count: products.length, products });
});

// @desc  Profit analysis
// @route GET /api/reports/profit
const getProfitReport = asyncHandler(async (req, res) => {
  const { range = "7days" } = req.query;
  let start = dateRange(range);

  const profitByProduct = await Transaction.aggregate([
    { $match: { type: "sale", createdAt: { $gte: start } } },
    { $group: {
      _id: "$productName",
      revenue: { $sum: "$total" },
      profit: { $sum: "$profit" },
      units: { $sum: "$quantity" },
    }},
    { $addFields: { margin: { $cond: [{ $gt: ["$revenue", 0] }, { $multiply: [{ $divide: ["$profit", "$revenue"] }, 100] }, 0] } } },
    { $sort: { profit: -1 } },
  ]);
  res.json({ success: true, profitByProduct });
});

module.exports = { getSummary, getSalesTrend, getTopProducts, getCategoryValue, getLowStock, getProfitReport };
