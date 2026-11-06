import { Router } from "express";
import { getRepositoryIssues } from "../controllers/githubController.js";

const router = Router();

router.get("/issues", getRepositoryIssues);

export default router;