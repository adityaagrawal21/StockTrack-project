const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const { category, status, search } = req.query;
  let query = {};

  if (category) query.category = category;
  if (search) query.name = { $regex: search, $options: "i" };
  if (status === "low") query.$expr = { $and: [{ $gt: ["$quantity", 0] }, { $lte: ["$quantity", "$reorderLevel"] }] };
  if (status === "out") query.quantity = 0;
  if (status === "ok") query.$expr = { $gt: ["$quantity", "$reorderLevel"] };

  const products = await Product.find(query).populate("addedBy", "name username").sort({ createdAt: -1 });
  res.json({ success: true, count: products.length, products });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("addedBy", "name username");
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ success: true, product });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private - Admin only
const createProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, supplier, expiryDate, reorderLevel } = req.body;

  const product = await Product.create({
    name,
    category,
    quantity: Number(quantity),
    price: Number(price),
    supplier,
    expiryDate: expiryDate || null,
    reorderLevel: Number(reorderLevel) || 10,
    addedBy: req.user._id,
  });

  res.status(201).json({ success: true, product });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private - Admin only
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const { name, category, quantity, price, supplier, expiryDate, reorderLevel } = req.body;

  product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name,
      category,
      quantity: Number(quantity),
      price: Number(price),
      supplier,
      expiryDate: expiryDate || null,
      reorderLevel: Number(reorderLevel) || 10,
    },
    { new: true, runValidators: true }
  );

  res.json({ success: true, product });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private - Admin only
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  await product.deleteOne();
  res.json({ success: true, message: "Product deleted" });
});

// @desc    Get all categories
// @route   GET /api/products/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct("category");
  res.json({ success: true, categories });
});

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories };
