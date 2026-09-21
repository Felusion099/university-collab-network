import { Router } from "express";
import { SearchQuerySchema } from "@app/shared-types";
import { validateQuery } from "../validators/validate.js";
import { requireAuth } from "../middleware/requireAuth.js";
import * as controller from "../controllers/search.controller.js";

const router = Router();

// API_CONTRACT.md §4: "Auth: required (search results respect privacy same
// as profile reads)" — unlike GET /users/:username (§2), search is NOT
// optional-auth.
router.get("/", requireAuth, validateQuery(SearchQuerySchema), controller.search);

export { router as searchRouter };
