import { Router } from "express";
import { analyzeRepositoryController } from "../controllers/analyzeController.js";

const router = Router();

router.post("/", analyzeRepositoryController);

export default router;