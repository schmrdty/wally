import { Router } from "express";
import { wallyTransfer, wallyBatch } from "../controllers/transferController";
import { setMinThreshold } from "../controllers/tokenwatchcontroller";
// import other controllers as needed

const router = Router();

router.post("/transfer", wallyTransfer);
router.post("/batch", wallyBatch);
router.post("/setMinThreshold", setMinThreshold);
// Add more routes as needed

export default router;