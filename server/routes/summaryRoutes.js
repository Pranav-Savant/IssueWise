import { Router } from "express";
import { summarizeIssue } from "../controllers/summaryController.js";

const router = Router();

router.post("/", summarizeIssue);

export default router;