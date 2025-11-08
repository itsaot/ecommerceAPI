const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../middleware/auth");
const {
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  setSpecial,
  removeSpecial,
  getProducts,
  getProduct,
  getProductsByCategory,
  getActiveSpecials,
  searchProducts,
} = require("../controllers/productController");

const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// Public
router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/category/:categoryName", getProductsByCategory);
router.get("/specials/active", getActiveSpecials);
router.get("/:id", getProduct);

// Admin
router.post("/", auth, isAdmin, upload.single("image"), createProduct);
router.put("/:id", auth, isAdmin, upload.single("image"), updateProduct);
router.delete("/:id", auth, isAdmin, deleteProduct);
router.post("/:id/images", auth, isAdmin, upload.single("image"), uploadImage);

// Specials
router.put("/:productId/special", auth, isAdmin, setSpecial);
router.delete("/:productId/special", auth, isAdmin, removeSpecial);

module.exports = router;
