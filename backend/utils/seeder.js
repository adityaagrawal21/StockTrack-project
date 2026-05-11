const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Supplier = require("../models/Supplier");
const Transaction = require("../models/Transaction");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected");
};

const seed = async () => {
  await connectDB();
  await Promise.all([User.deleteMany(), Product.deleteMany(), Supplier.deleteMany(), Transaction.deleteMany()]);
  console.log("🗑️  Cleared existing data");

  const users = await User.create([
    { name:"Admin User",   username:"admin",    email:"admin@stocktrack.in",  password:"admin123",   role:"admin",   status:"active" },
    { name:"Rahul Sharma", username:"rahul_mgr",email:"rahul@stocktrack.in",  password:"manager123", role:"manager", status:"active" },
    { name:"Priya Singh",  username:"priya_stf",email:"priya@stocktrack.in",  password:"staff123",   role:"staff",   status:"active" },
    { name:"Ankit Verma",  username:"ankit_v",  email:"ankit@stocktrack.in",  password:"ankit123",   role:"manager", status:"pending" },
    { name:"Sneha Patel",  username:"sneha_p",  email:"sneha@stocktrack.in",  password:"sneha123",   role:"staff",   status:"pending" },
  ]);
  const admin = users[0];
  console.log("✅ Users seeded");

  await Supplier.create([
    { name:"TechCorp Ltd",  contact:"Rohan Mehta",  phone:"9876543210", email:"rohan@techcorp.in",  category:"Electronics",    status:"active",   addedBy:admin._id },
    { name:"FurniCo India", contact:"Sunita Desai", phone:"9123456780", email:"sunita@furnico.in",   category:"Furniture",      status:"active",   addedBy:admin._id },
    { name:"MedSupply",     contact:"Dr. Kapoor",   phone:"9000012345", email:"kapoor@medsupply.in", category:"Health & Safety",status:"active",   addedBy:admin._id },
    { name:"PaperWorld",    contact:"Arjun Nair",   phone:"9988776655", email:"arjun@paper.in",      category:"Stationery",     status:"inactive", addedBy:admin._id },
    { name:"StatioMart",    contact:"Priya Pillai", phone:"9765432100", email:"priya@stationart.in", category:"Stationery",     status:"active",   addedBy:admin._id },
  ]);
  console.log("✅ Suppliers seeded");

  // Products with cost prices (≈ 70-80% of selling price)
  const products = await Product.create([
    { name:"Wireless Headphones Pro",  category:"Electronics",    quantity:45, price:2500,  costPrice:1900, supplier:"TechCorp Ltd",  reorderLevel:10, addedBy:admin._id },
    { name:"Ergonomic Office Chair",   category:"Furniture",      quantity:8,  price:12000, costPrice:9000, supplier:"FurniCo India", reorderLevel:5,  addedBy:admin._id },
    { name:"Hand Sanitizer 500ml",     category:"Health & Safety",quantity:3,  price:150,   costPrice:100,  supplier:"MedSupply",     reorderLevel:20, expiryDate:"2025-12-01", addedBy:admin._id },
    { name:"Adjustable Laptop Stand",  category:"Electronics",    quantity:22, price:1800,  costPrice:1300, supplier:"TechCorp Ltd",  reorderLevel:8,  addedBy:admin._id },
    { name:"A4 Paper Ream 500s",       category:"Stationery",     quantity:2,  price:400,   costPrice:280,  supplier:"PaperWorld",    reorderLevel:15, addedBy:admin._id },
    { name:"USB-C Hub 7-in-1",         category:"Electronics",    quantity:31, price:1200,  costPrice:850,  supplier:"TechCorp Ltd",  reorderLevel:10, addedBy:admin._id },
    { name:"Whiteboard Markers Set",   category:"Stationery",     quantity:0,  price:120,   costPrice:75,   supplier:"StatioMart",    reorderLevel:20, addedBy:admin._id },
    { name:"N95 Face Masks (Box 50)",  category:"Health & Safety",quantity:12, price:800,   costPrice:550,  supplier:"MedSupply",     reorderLevel:10, expiryDate:"2026-06-01", addedBy:admin._id },
    { name:"Standing Desk Frame",      category:"Furniture",      quantity:5,  price:18000, costPrice:13500,supplier:"FurniCo India", reorderLevel:3,  addedBy:admin._id },
  ]);
  console.log("✅ Products seeded");

  // Seed some transactions with profits
  const p0 = products[0], p1 = products[1], p3 = products[3], p5 = products[5], p7 = products[7];
  await Transaction.create([
    { type:"purchase", product:p0._id, productName:p0.name, quantity:20, unitPrice:p0.costPrice, costPrice:p0.costPrice, total:20*p0.costPrice, profit:0, performedBy:admin._id, performedByName:admin.name },
    { type:"sale",     product:p0._id, productName:p0.name, quantity:5,  unitPrice:p0.price, costPrice:p0.costPrice, total:5*p0.price, profit:5*(p0.price-p0.costPrice), profitMargin:Math.round(((p0.price-p0.costPrice)/p0.price)*100), performedBy:users[2]._id, performedByName:users[2].name },
    { type:"sale",     product:p1._id, productName:p1.name, quantity:2,  unitPrice:p1.price, costPrice:p1.costPrice, total:2*p1.price, profit:2*(p1.price-p1.costPrice), profitMargin:Math.round(((p1.price-p1.costPrice)/p1.price)*100), performedBy:users[2]._id, performedByName:users[2].name },
    { type:"purchase", product:p7._id, productName:p7.name, quantity:50, unitPrice:p7.costPrice, costPrice:p7.costPrice, total:50*p7.costPrice, profit:0, performedBy:users[1]._id, performedByName:users[1].name },
    { type:"sale",     product:p3._id, productName:p3.name, quantity:3,  unitPrice:p3.price, costPrice:p3.costPrice, total:3*p3.price, profit:3*(p3.price-p3.costPrice), profitMargin:Math.round(((p3.price-p3.costPrice)/p3.price)*100), performedBy:admin._id, performedByName:admin.name },
    { type:"purchase", product:p5._id, productName:p5.name, quantity:15, unitPrice:p5.costPrice, costPrice:p5.costPrice, total:15*p5.costPrice, profit:0, performedBy:users[1]._id, performedByName:users[1].name },
  ]);
  console.log("✅ Transactions seeded");

  console.log("\n🎉 Database seeded successfully!");
  console.log("─────────────────────────────");
  console.log("Login credentials:");
  console.log("  Admin:   admin     / admin123");
  console.log("  Manager: rahul_mgr / manager123");
  console.log("  Staff:   priya_stf / staff123");
  console.log("─────────────────────────────");
  process.exit(0);
};

seed().catch((e) => { console.error("❌", e.message); process.exit(1); });
