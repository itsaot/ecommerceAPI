const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cartController');
const { auth } = require('../middleware/auth');

router.get('/', auth, ctrl.getCart);
router.post('/', auth, ctrl.addItem);
router.put('/', auth, ctrl.updateCart);
router.delete('/:productId', auth, ctrl.removeItem);

module.exports = router;
