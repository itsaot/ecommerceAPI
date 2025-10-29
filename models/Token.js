// models/Token.js
import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  token: { type: String, required: true },
  type: { type: String, enum: ["refresh", "verify"], required: true },
  expiresAt: { type: Date, required: true },
});

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-delete expired

export default mongoose.model("Token", tokenSchema);
