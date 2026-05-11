const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// @desc    Get all users
// @route   GET /api/users
// @access  Private - Admin
const getUsers = asyncHandler(async (req, res) => {
  const { status, role } = req.query;
  let query = {};
  if (status) query.status = status;
  if (role) query.role = role;
  const users = await User.find(query).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, users });
});

// @desc    Get pending users count
// @route   GET /api/users/pending-count
// @access  Private - Admin
const getPendingCount = asyncHandler(async (req, res) => {
  const count = await User.countDocuments({ status: "pending" });
  res.json({ success: true, count });
});

// @desc    Approve a user
// @route   PATCH /api/users/:id/approve
// @access  Private - Admin
const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: "active" }, { new: true });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, message: `${user.name} approved`, user });
});

// @desc    Reject a user
// @route   PATCH /api/users/:id/reject
// @access  Private - Admin
const rejectUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, message: `${user.name} rejected`, user });
});

// @desc    Create admin user
// @route   POST /api/users/admin
// @access  Private - Admin
const createAdmin = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !password) {
    res.status(400);
    throw new Error("Name, username and password required");
  }
  const exists = await User.findOne({ username: username.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error("Username already taken");
  }
  const user = await User.create({
    name,
    username: username.toLowerCase(),
    email: email || "",
    password,
    role: "admin",
    status: "active",
  });
  res.status(201).json({
    success: true,
    user: { _id: user._id, name: user.name, username: user.username, role: user.role, status: user.status },
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private - Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user.role === "admin") {
    res.status(400);
    throw new Error("Cannot delete admin users");
  }
  await user.deleteOne();
  res.json({ success: true, message: "User removed" });
});

module.exports = { getUsers, getPendingCount, approveUser, rejectUser, createAdmin, deleteUser };
