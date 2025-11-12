const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', auth, ctrl.getMe);
router.put('/me', auth, ctrl.updateMe);
router.post('/me/address', auth, ctrl.addAddress);
router.get("/profile", auth, userController.getProfile);

module.exports = router;
