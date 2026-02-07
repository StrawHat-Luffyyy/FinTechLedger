import axios from "axios";

const API_URL = "http://localhost:3000/api";
const AUTH_URL = "http://localhost:3000/auth";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  // 1. Signup 2 Users (Sender & Receiver)
  const suffix = Date.now();
  const senderCreds = {
    username: `sender_${suffix}`,
    email: `sender_${suffix}@test.com`,
    password: "password123",
  };
  const receiverCreds = {
    username: `receiver_${suffix}`,
    email: `receiver_${suffix}@test.com`,
    password: "password123",
  };

  console.log("1.Registering Users...");
  await axios.post(`${AUTH_URL}/signup`, senderCreds);
  await axios.post(`${AUTH_URL}/signup`, receiverCreds);

  // 2. Login
  console.log("2.Logging in...");
  const senderLogin = await axios.post(`${AUTH_URL}/login`, {
    email: senderCreds.email,
    password: senderCreds.password,
  });
  const receiverLogin = await axios.post(`${AUTH_URL}/login`, {
    email: receiverCreds.email,
    password: receiverCreds.password,
  });

  const senderToken = senderLogin.data.data.token;
  const receiverToken = receiverLogin.data.data.token;
  const senderId = senderLogin.data.data.user.id;
  const receiverId = receiverLogin.data.data.user.id;
  
  console.log(`   Sender User ID: ${senderId}`);
  console.log(`   Receiver User ID: ${receiverId}`);
  console.log(`   Tokens are ${senderToken === receiverToken ? "SAME " : "DIFFERENT "}`);
  // We need Account IDs, not User IDs

  // 3. Get Account IDs
  const senderAccounts = await axios.get(`${API_URL}/accounts`, {
    headers: { Authorization: `Bearer ${senderToken}` },
  });
  
  if (!senderAccounts.data || senderAccounts.data.length === 0) {
    console.error("Sender has no accounts!");
    process.exit(1);
  }
  
  const senderAccountId = senderAccounts.data[0].id;
  console.log(`   Sender has ${senderAccounts.data.length} account(s) `);

  // We need Receiver Account ID (Login as receiver to get it)
  const receiverAccounts = await axios.get(`${API_URL}/accounts`, {
    headers: { Authorization: `Bearer ${receiverToken}` },
  });
  
  if (!receiverAccounts.data || receiverAccounts.data.length === 0) {
    console.error("Receiver has no accounts!");
    process.exit(1);
  }
  
  const receiverAccountId = receiverAccounts.data[0].id;
  console.log(`   Receiver has ${receiverAccounts.data.length} account(s) ✅`);

  console.log(`   Sender Account: ${senderAccountId}`);
  console.log(`   Receiver Account: ${receiverAccountId}`);
  
  if (senderAccountId === receiverAccountId) {
    console.error("ERROR: Sender and Receiver have the SAME account ID!");
    console.error("Check if both users are properly created as separate users.");
    process.exit(1);
  }

  // 4. PAUSE FOR MANUAL INTERVENTION
  console.log("\nPAUSE: Go to PgAdmin now!");
  console.log(
    `Run this SQL: UPDATE accounts SET balance = 1000 WHERE id = '${senderAccountId}';`,
  );
  console.log("Waiting 15 seconds for you to do this...");
  await sleep(15000); // Give you 15s to update DB

  // 5. Verify Balance
  const verify = await axios.get(`${API_URL}/accounts`, {
    headers: { Authorization: `Bearer ${senderToken}` },
  });
  const initialBalance = parseFloat(verify.data[0].balance);
  console.log(`\n Sender Balance Verified: ${initialBalance}`);

  if (initialBalance < 500) {
    console.error("Balance too low! Did you run the SQL?");
    process.exit(1);
  }

  // 6. ATTACK! 50 Requests at once
  console.log("\n FIRING 50 CONCURRENT REQUESTS...");
  const requests = [];
  for (let i = 0; i < 50; i++) {
    // We push the PROMISE into an array, we do NOT await here!
    requests.push(
      axios.post(
        `${API_URL}/transfer`,
        {
          fromAccountId: senderAccountId,
          toAccountId: receiverAccountId,
          amount: 10,
        },
        {
          headers: { Authorization: `Bearer ${senderToken}` },
          // Note: We are NOT sending Idempotency-Key, so the DB must handle the locks.
        },
      ),
    );
  }

  // 7. Wait for all to settle
  try {
    await Promise.all(requests);
    console.log("All 50 requests sent.");
  } catch (e) {
    console.log(
      "Some requests failed (this is okay if expected):",
      e.message,
    );
  }

  // 8. Final Check
  console.log("\nVerifying Final Balance...");
  await sleep(2000); // Wait for DB to settle
  const finalRes = await axios.get(`${API_URL}/accounts`, {
    headers: { Authorization: `Bearer ${senderToken}` },
  });
  const finalBalance = parseFloat(finalRes.data[0].balance);

  console.log(`   Initial: ${initialBalance}`);
  console.log(`   Expected: ${initialBalance - 500}`);
  console.log(`   Actual:   ${finalBalance}`);

  if (finalBalance === initialBalance - 500) {
    console.log("\n SUCCESS: ACID Compliance Verified! No Race Conditions.");
  } else {
    console.log(
      "\n FAILED: Race Condition Detected. Money lost/created out of thin air.",
    );
  }
};

run();
