const User = require("../models/User");
const Product = require("../models/Product");

// 🧑‍💼 Create another admin or user
const createAdmin = async (req, res, next) => {
try {
const { firstName, lastName, email, password, role } = req.body;

```
const existing = await User.findOne({ email });
if (existing) return res.status(400).json({ message: "Email already exists" });

const user = await User.create({
  firstName,
  lastName,
  email,
  password,
  role: role || "admin",
});

res.status(201).json({ message: "Admin created", user });
```

} catch (err) {
next(err);
}
};

// 📋 Get all users
const getAllUsers = async (req, res, next) => {
try {
const users = await User.find().select("-password");
res.json(users);
} catch (err) {
next(err);
}
};

// ❌ Delete user
const deleteUser = async (req, res, next) => {
try {
const user = await User.findByIdAndDelete(req.params.id);
if (!user) return res.status(404).json({ message: "User not found" });
res.json({ message: "User deleted" });
} catch (err) {
next(err);
}
};

// 🏭 Get all products (admin)
const getAllProducts = async (req, res, next) => {
try {
const products = await Product.find();
res.json(products);
} catch (err) {
next(err);
}
};

// 🗑 Delete product
const deleteProduct = async (req, res, next) => {
try {
const product = await Product.findByIdAndDelete(req.params.id);
if (!product) return res.status(404).json({ message: "Product not found" });
res.json({ message: "Product deleted" });
} catch (err) {
next(err);
}
};

module.exports = {
createAdmin,
getAllUsers,
deleteUser,
getAllProducts,
deleteProduct,
};
