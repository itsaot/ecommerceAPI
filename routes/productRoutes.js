const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  setSpecial,
  removeSpecial
} = require('../controllers/productController');

// List all products
router.get('/', getProducts);

// Get single product
router.get('/:id', getProduct);

// Create product
router.post('/', upload.single('image'), createProduct);

// Update product
router.put('/:id', upload.single('image'), updateProduct);

// Delete product
router.delete('/:id', deleteProduct);

// Upload product image
router.post('/:id/upload', upload.single('image'), uploadImage);

// Specials (discount)
router.post('/:productId/special', setSpecial);
router.delete('/:productId/special', removeSpecial);

module.exports = router;
