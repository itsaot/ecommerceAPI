const express = require("express");
const {
createAdmin,
updateAdmin,
deleteAdmin,
listAdmins,
} = require("../controllers/metaAdminController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// 🔐 Only meta-admin routes
router.post("/", auth, createAdmin);
router.put("/:id", auth, updateAdmin);
router.delete("/:id", auth, deleteAdmin);
router.get("/", auth, listAdmins);

module.exports = router;
