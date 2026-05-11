// Format currency
export const fmt = (n) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

// Format date
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Format time
export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

// Stock status badge class
export const stockBadge = (qty, reorder) => {
  if (qty === 0) return "badge badge-out";
  if (qty <= reorder) return "badge badge-low";
  return "badge badge-ok";
};

// Stock status text
export const stockLabel = (qty, reorder) => {
  if (qty === 0) return "Out of Stock";
  if (qty <= reorder) return "Low Stock";
  return "In Stock";
};

// Role badge class
export const roleBadge = (role) => `badge badge-${role}`;

// Status badge class
export const statusBadge = (status) => `badge badge-${status}`;

// Get user initials
export const initials = (name) =>
  name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

// Greeting by time
export const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

// Error message extractor
export const errMsg = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";
