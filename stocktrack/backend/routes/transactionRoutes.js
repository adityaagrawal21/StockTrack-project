const express = require("express");
const router = express.Router();
const { getTransactions, recordSale, recordPurchase, getRecentTransactions } = require("../controllers/transactionController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getTransactions);
router.get("/recent", getRecentTransactions);
router.post("/sale", recordSale);
router.post("/purchase", recordPurchase);

module.exports = router;
