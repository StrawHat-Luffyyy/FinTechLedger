import express from "express";
import { getAccounts } from "../controllers/accountController.js";
import { handleTransfer } from "../controllers/transferController.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { transferSchema } from "../schemas/zodSchemas.js";
import { checkIdempotency } from "../middlewares/idempotency.js";

const router = express.Router();

router.get("/accounts", getAccounts);
router.post("/transfer", validate(transferSchema), checkIdempotency, handleTransfer);

export default router;
