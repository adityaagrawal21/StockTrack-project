const asyncHandler = require("express-async-handler");
const Supplier = require("../models/Supplier");

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private - Admin
const getSuppliers = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let query = {};
  if (status) query.status = status;
  const suppliers = await Supplier.find(query).populate("addedBy", "name").sort({ createdAt: -1 });
  res.json({ success: true, count: suppliers.length, suppliers });
});

// @desc    Create supplier
// @route   POST /api/suppliers
// @access  Private - Admin
const createSupplier = asyncHandler(async (req, res) => {
  const { name, contact, phone, email, category, status } = req.body;
  if (!name || !contact) {
    res.status(400);
    throw new Error("Company name and contact person are required");
  }
  const supplier = await Supplier.create({ name, contact, phone, email, category, status: status || "active", addedBy: req.user._id });
  res.status(201).json({ success: true, supplier });
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private - Admin
const updateSupplier = asyncHandler(async (req, res) => {
  let supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    res.status(404);
    throw new Error("Supplier not found");
  }
  supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, supplier });
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private - Admin
const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) {
    res.status(404);
    throw new Error("Supplier not found");
  }
  await supplier.deleteOne();
  res.json({ success: true, message: "Supplier removed" });
});

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier };
