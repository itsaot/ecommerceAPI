const crypto = require("crypto");

const generateResetToken = () => {
const resetToken = crypto.randomBytes(32).toString("hex");
const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
const expires = Date.now() + 60 * 60 * 1000; // 1 hour
return { resetToken, hashedToken, expires };
};

module.exports = { generateResetToken };
