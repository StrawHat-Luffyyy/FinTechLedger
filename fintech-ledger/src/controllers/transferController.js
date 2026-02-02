import { pool } from "../config/db.js";
import { transferMoney } from "../services/transferService.js";

export const handleTransfer = async (req, res) => {
  const { fromAccountId, toAccountId, amount } = req.body;
  if (!fromAccountId || !toAccountId || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return res.status(400).json({ error: "Amount must be a valid number" });
  }
  if (amount <= 0) {
    return res
      .status(400)
      .json({ error: "Transfer amount must be greater than zero" });
  }
  if (fromAccountId === toAccountId) {
    return res
      .status(400)
      .json({ error: "Cannot transfer to the same account" });
  }
  try {
    // SECURITY CHECK: Does the logged-in user own the 'from' account?
    const accountCheck = await pool.query(
      `SELECT user_id FROM accounts WHERE id = $1`,
      [fromAccountId],
    );
    if (accountCheck.rows.length === 0) {
      return res.status(404).json({ error: "Sender account not found" });
    }
    if (accountCheck.rows[0].user_id !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized access to sender account" });
    }
    const result = await transferMoney(fromAccountId, toAccountId, amount);
    res.json(result);
  } catch (err) {
    if (err.code === "ACCOUNT_NOT_FOUND") {
      return res.status(404).json({ error: "Account not found" });
    }
    if (err.code === "INSUFFICIENT_FUNDS") {
      return res.status(422).json({ error: "Insufficient funds" });
    }
    // Log the full error internally, return generic message to client
    console.error("Transfer failed:", err);
    res.status(500).json({ error: "Transfer failed" });
  }
};
