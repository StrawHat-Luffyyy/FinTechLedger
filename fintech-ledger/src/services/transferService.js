import { pool } from '../config/db.js';
import Decimal from 'decimal.js';

export const transferMoney = async (fromAccountId, toAccountId, amount) => {
  if (fromAccountId === toAccountId) {
    throw new Error('Cannot transfer to the same account');
  }
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    const senderRes = await client.query(
      `SELECT id, balance FROM accounts WHERE id = $1 FOR UPDATE`,
      [fromAccountId]
    );
    if (senderRes.rows.length === 0) {
      const error = new Error('Sender account not found');
      error.code = 'ACCOUNT_NOT_FOUND';
      throw error;
    }
    const sender = senderRes.rows[0];

    // Use Decimal for precise monetary comparison to avoid floating-point errors
    const senderBalance = new Decimal(sender.balance);
    const transferAmount = new Decimal(amount);

    if (senderBalance.lessThan(transferAmount)) {
      const error = new Error('Insufficient funds');
      error.code = 'INSUFFICIENT_FUNDS';
      throw error;
    }
    await client.query(
      `UPDATE accounts SET balance = balance - $1 WHERE id = $2`,
      [amount, fromAccountId]
    );
    // Add money to receiver's account
    await client.query(
      `UPDATE accounts SET balance = balance + $1 WHERE id = $2`,
      [amount, toAccountId]
    );
    // Record the transaction
    const transferRes = await client.query(
      `INSERT INTO transfers (source_account_id, dest_account_id, amount, status) 
      VALUES ($1, $2, $3, 'COMPLETED') RETURNING id`,
      [fromAccountId, toAccountId, amount]
    );
    const transferId = transferRes.rows[0].id;

    // 8. Ledger Entry: DEBIT Sender
    await client.query(
      `INSERT INTO ledger_entries (transfer_id, account_id, amount, type) 
      VALUES ($1, $2, $3, 'DEBIT')`,
      [transferId, fromAccountId, -amount]
    );

    // 9. Ledger Entry: CREDIT Receiver
    await client.query(
      `INSERT INTO ledger_entries (transfer_id, account_id, amount, type) 
      VALUES ($1, $2, $3, 'CREDIT')`,
      [transferId, toAccountId, amount]
    );
    await client.query('COMMIT');
    return { transferId, status: 'COMPLETED' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
