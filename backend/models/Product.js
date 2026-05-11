const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true },
    category: { type: String, required: [true, "Category is required"], trim: true },
    quantity: { type: Number, required: true, min: [0, "Cannot be negative"], default: 0 },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Cannot be negative"] },
    // costPrice = purchase cost per unit (for profit calc). Defaults to 80% of selling price.
    costPrice: { type: Number, default: null },
    supplier: { type: String, required: [true, "Supplier is required"], trim: true },
    expiryDate: { type: Date, default: null },
    reorderLevel: { type: Number, default: 10, min: 0 },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Virtual helpers
productSchema.virtual("stockStatus").get(function () {
  if (this.quantity === 0) return "out";
  if (this.quantity <= this.reorderLevel) return "low";
  return "ok";
});
productSchema.virtual("totalValue").get(function () { return this.quantity * this.price; });
productSchema.virtual("effectiveCostPrice").get(function () {
  return this.costPrice ?? Math.round(this.price * 0.8);
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
