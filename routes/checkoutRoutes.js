const express = require("express");
const { createPaystackPayment } = require("../controllers/checkoutController");

const router = express.Router();

router.post("/paystack", createPaystackPayment);

module.exports = router;
