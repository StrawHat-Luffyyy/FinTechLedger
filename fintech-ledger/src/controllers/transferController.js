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
