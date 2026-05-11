const express = require("express");
const router = express.Router();
const { getUsers, getPendingCount, approveUser, rejectUser, createAdmin, deleteUser } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(adminOnly);

router.get("/pending-count", getPendingCount);
router.route("/").get(getUsers).post(createAdmin);
router.patch("/:id/approve", approveUser);
router.patch("/:id/reject", rejectUser);
router.delete("/:id", deleteUser);

module.exports = router;
