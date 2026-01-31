import { pool } from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrate = async () => {
  try {
    const sqlPath = path.join(__dirname, "../models/schema.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    console.log("Running migration...");

    //Execurte SQL
    await pool.query(sql);

    console.log("Tables created successfully");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
};

migrate();
