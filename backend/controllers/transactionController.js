const asyncHandler = require("express-async-handler");
const Transaction = require("../models/Transaction");
const Product = require("../models/Product");

// @desc  Get all transactions (paginated, filterable)
// @route GET /api/transactions
const getTransactions = asyncHandler(async (req, res) => {
  const { type, limit = 50, page = 1, startDate, endDate } = req.query;
  let query = {};
  if (type && ["sale", "purchase"].includes(type)) query.type = type;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) { const e = new Date(endDate); e.setHours(23,59,59); query.createdAt.$lte = e; }
  }
  const skip = (Number(page) - 1) * Number(limit);
  const total = await Transaction.countDocuments(query);
  const transactions = await Transaction.find(query)
    .populate("performedBy", "name username")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
  res.json({ success: true, count: total, page: Number(page), pages: Math.ceil(total / limit), transactions });
});

// @desc  Record a sale
// @route POST /api/transactions/sale
const recordSale = asyncHandler(async (req, res) => {
  const { productId, quantity, note } = req.body;
  if (!productId || !quantity || Number(quantity) < 1) { res.status(400); throw new Error("Product and valid quantity required"); }
  const product = await Product.findById(productId);
  if (!product) { res.status(404); throw new Error("Product not found"); }
  if (Number(quantity) > product.quantity) { res.status(400); throw new Error(`Insufficient stock. Only ${product.quantity} available`); }

  const qty = Number(quantity);
  const costPer = product.costPrice ?? Math.round(product.price * 0.8);
  const profitAmt = (product.price - costPer) * qty;
  const profitPct = product.price > 0 ? Math.round((profitAmt / (product.price * qty)) * 100) : 0;

  product.quantity -= qty;
  await product.save();

  const transaction = await Transaction.create({
    type: "sale",
    product: product._id,
    productName: product.name,
    quantity: qty,
    unitPrice: product.price,
    costPrice: costPer,
    total: qty * product.price,
    profit: profitAmt,
    profitMargin: profitPct,
    performedBy: req.user._id,
    performedByName: req.user.name,
    note: note || "",
  });
  res.status(201).json({ success: true, transaction, updatedProduct: product });
});

// @desc  Record a purchase
// @route POST /api/transactions/purchase
const recordPurchase = asyncHandler(async (req, res) => {
  const { productId, quantity, note } = req.body;
  if (!productId || !quantity || Number(quantity) < 1) { res.status(400); throw new Error("Product and valid quantity required"); }
  const product = await Product.findById(productId);
  if (!product) { res.status(404); throw new Error("Product not found"); }

  const qty = Number(quantity);
  product.quantity += qty;
  // Update costPrice if not set
  if (!product.costPrice) { product.costPrice = Math.round(product.price * 0.8); }
  await product.save();

  const transaction = await Transaction.create({
    type: "purchase",
    product: product._id,
    productName: product.name,
    quantity: qty,
    unitPrice: product.costPrice,
    costPrice: product.costPrice,
    total: qty * product.costPrice,
    profit: 0,
    performedBy: req.user._id,
    performedByName: req.user.name,
    note: note || "",
  });
  res.status(201).json({ success: true, transaction, updatedProduct: product });
});

// @desc  Recent transactions for dashboard logs
// @route GET /api/transactions/recent
const getRecentTransactions = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const transactions = await Transaction.find()
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .populate("performedBy", "name username");
  res.json({ success: true, transactions });
});

module.exports = { getTransactions, recordSale, recordPurchase, getRecentTransactions };
