// controllers/metaAdminController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");

// ✅ Create new admin
exports.createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Only meta-admin can perform this
    if (!req.user?.isMetaAdmin) {
      return res.status(403).json({ message: "Access denied: meta-admin only" });
    }

    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const admin = new User({
      firstName,
      lastName,
      email,
      phone,
      password: hashed,
      role: "admin",
    });

    await admin.save();
    res.status(201).json({ message: "Admin created successfully", admin });
  } catch (err) {
    console.error("Create admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update admin info
exports.updateAdmin = async (req, res) => {
  try {
    if (!req.user?.isMetaAdmin)
      return res.status(403).json({ message: "Access denied: meta-admin only" });

    const { id } = req.params;
    const updates = req.body;

    const admin = await User.findById(id);
    if (!admin || admin.role !== "admin")
      return res.status(404).json({ message: "Admin not found" });

    Object.assign(admin, updates);
    await admin.save();

    res.json({ message: "Admin updated successfully", admin });
  } catch (err) {
    console.error("Update admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    if (!req.user?.isMetaAdmin)
      return res.status(403).json({ message: "Access denied: meta-admin only" });

    const { id } = req.params;
    const admin = await User.findById(id);

    if (!admin || admin.role !== "admin")
      return res.status(404).json({ message: "Admin not found" });

    await admin.deleteOne();
    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error("Delete admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ List all admins (for meta-admin dashboard)
exports.listAdmins = async (req, res) => {
  try {
    if (!req.user?.isMetaAdmin)
      return res.status(403).json({ message: "Access denied: meta-admin only" });

    const admins = await User.find({ role: "admin" }).select("-password");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
