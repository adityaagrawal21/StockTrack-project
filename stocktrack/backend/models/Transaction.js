const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["sale", "purchase"], required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },     // selling price per unit
    costPrice: { type: Number, default: 0 },          // cost/purchase price per unit
    total: { type: Number, required: true },           // qty * unitPrice
    profit: { type: Number, default: 0 },              // (unitPrice - costPrice) * qty  [sales only]
    profitMargin: { type: Number, default: 0 },        // profit / total * 100
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    performedByName: { type: String, required: true },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
