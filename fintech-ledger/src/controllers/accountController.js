import { pool } from '../config/db.js';

export const getAccounts = async (req, res) => {
  try {
    const userId = req.user.userId; // From JWT auth middleware
    const result = await pool.query(
      `SELECT * FROM accounts WHERE user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch accounts:', err);
    res.status(500).json({ error: err.message });
  }
};
