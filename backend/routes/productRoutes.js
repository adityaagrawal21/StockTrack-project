const express = require("express");
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getCategories } = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

router.use(protect);

router.get("/categories", getCategories);
router.route("/").get(getProducts).post(adminOnly, createProduct);
router.route("/:id").get(getProduct).put(adminOnly, updateProduct).delete(adminOnly, deleteProduct);

module.exports = router;
