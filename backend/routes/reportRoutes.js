const express = require("express");
const router = express.Router();
const { getSummary, getSalesTrend, getTopProducts, getCategoryValue, getLowStock, getProfitReport } = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const { managerUp } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(managerUp);

router.get("/summary", getSummary);
router.get("/sales-trend", getSalesTrend);
router.get("/top-products", getTopProducts);
router.get("/category-value", getCategoryValue);
router.get("/low-stock", getLowStock);
router.get("/profit", getProfitReport);

module.exports = router;
