const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { generateToken } = require("../middleware/authMiddleware");

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error("Please provide username and password");
  }

  const user = await User.findOne({ username: username.toLowerCase() }).select("+password");

  if (!user) {
    res.status(401);
    throw new Error("Invalid username or password");
  }

  if (user.status === "pending") {
    res.status(401);
    throw new Error("Account pending admin approval");
  }

  if (user.status === "rejected") {
    res.status(401);
    throw new Error("Account rejected. Contact administrator.");
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid username or password");
  }

  res.json({
    success: true,
    token: generateToken(user._id),
    user: {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    },
  });
});

// @desc    Register new user (pending approval)
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password, role } = req.body;

  if (!name || !username || !password) {
    res.status(400);
    throw new Error("Name, username and password are required");
  }

  if (!["staff", "manager"].includes(role)) {
    res.status(400);
    throw new Error("You can only register as staff or manager");
  }

  const usernameExists = await User.findOne({ username: username.toLowerCase() });
  if (usernameExists) {
    res.status(400);
    throw new Error("Username already taken");
  }

  const user = await User.create({
    name,
    username: username.toLowerCase(),
    email: email || "",
    password,
    role,
    status: "pending",
  });

  res.status(201).json({
    success: true,
    message: "Registration successful. Await admin approval.",
    user: { name: user.name, username: user.username, role: user.role, status: user.status },
  });
});

// @desc    Generate OTP for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { username } = req.body;

  const user = await User.findOne({ username: username?.toLowerCase() });
  if (!user || user.status !== "active") {
    res.status(404);
    throw new Error("No active account with that username");
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  user.resetOTP = otp;
  user.resetOTPExpiry = expiry;
  await user.save({ validateBeforeSave: false });

  // In real app: send email. Here we return OTP in response (simulated).
  res.json({
    success: true,
    message: "OTP generated (simulated — no email sent)",
    otp, // Remove in production! Only for demo purposes.
    expiresIn: "10 minutes",
  });
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { username, otp } = req.body;

  const user = await User.findOne({ username: username?.toLowerCase() }).select("+resetOTP +resetOTPExpiry");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (!user.resetOTP || user.resetOTP !== otp) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  if (user.resetOTPExpiry < new Date()) {
    res.status(400);
    throw new Error("OTP has expired. Request a new one.");
  }

  res.json({ success: true, message: "OTP verified" });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { username, otp, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const user = await User.findOne({ username: username?.toLowerCase() }).select("+resetOTP +resetOTPExpiry +password");
  if (!user || user.resetOTP !== otp || user.resetOTPExpiry < new Date()) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  user.password = newPassword;
  user.resetOTP = undefined;
  user.resetOTPExpiry = undefined;
  await user.save();

  res.json({ success: true, message: "Password reset successfully" });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @desc    Update own profile
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email, phone },
    { new: true, runValidators: true }
  );
  res.json({ success: true, user });
});

// @desc    Change own password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error("Current password is incorrect");
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: "Password changed successfully" });
});

module.exports = { login, register, forgotPassword, verifyOTP, resetPassword, getMe, updateMe, changePassword };
