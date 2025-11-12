const express = require("express");
const router = express.Router();
const {
  createAdmin,
  updateAdmin,
  deleteAdmin,
  listAdmins,
} = require("../controllers/metaAdminController");

const { auth, isMetaAdmin } = require("../middleware/auth");

// Meta-Admin only routes
router.post("/", auth, isMetaAdmin, createAdmin);
router.put("/:id", auth, isMetaAdmin, updateAdmin);
router.delete("/:id", auth, isMetaAdmin, deleteAdmin);
router.get("/", auth, isMetaAdmin, listAdmins);

module.exports = router;
