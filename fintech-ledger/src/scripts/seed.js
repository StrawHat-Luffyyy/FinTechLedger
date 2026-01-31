import { pool } from "../config/db.js";

const seed = async () => {
  try {
    console.log("Seeding database...");
    // 1 Clear existing data(Optional for development)
    await pool.query(
      "TRUNCATE TABLE ledger_entries, transfers, accounts, users CASCADE",
    );

    // 2 Insert sample users
    const userRes = await pool.query(`
      INSERT INTO users (username, email, password_hash) VALUES 
      ('alice', 'alice@demo.com', 'hashed_pass_1'),
      ('bob', 'bob@demo.com', 'hashed_pass_2')
      RETURNING id, username;
    `);

    const aliceId = userRes.rows[0].id;
    const bobId = userRes.rows[1].id;

    console.log(`Created Users: Alice (${aliceId}), Bob (${bobId})`);

    // 3. Create Accounts (Give Alice ₹1000, Bob ₹0)
    await pool.query(
      `
      INSERT INTO accounts (user_id, name, balance) VALUES 
      ($1, 'Main Wallet', 1000),
      ($2, 'Main Wallet', 0);
      `,
      [aliceId, bobId],
    );

    console.log("Accounts created. Alice has ₹1000, Bob has ₹0.");

    console.log("Seeding Complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding Failed:", err);
    process.exit(1);
  }
};

seed();
