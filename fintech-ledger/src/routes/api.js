import express from "express";
import { getAccounts } from "../controllers/accountController.js";
import { handleTransfer } from "../controllers/transferController.js";

const router = express.Router();

router.get("/accounts", getAccounts);
router.post("/transfer", handleTransfer);

export default router;
