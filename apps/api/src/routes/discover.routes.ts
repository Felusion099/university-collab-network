import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/discover.controller.js";

const router = Router();

router.get("/", requireAuth, controller.discover);

export { router as discoverRouter };
