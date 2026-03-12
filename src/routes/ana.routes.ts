import { Router } from "express";
import { getAna } from "../controllers/ana.controller";

const router = Router();

router.get("/", getAna);

export default router;
