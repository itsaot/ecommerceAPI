// routes/metaAdminRoutes.js
import express from "express";
import {
  createAdmin,
  updateAdmin,
  deleteAdmin,
  listAdmins,
} from "../controllers/metaAdminController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// 🔐 Only meta-admin routes
router.post("/", auth, createAdmin);
router.put("/:id", auth, updateAdmin);
router.delete("/:id", auth, deleteAdmin);
router.get("/", auth, listAdmins);

export default router;
