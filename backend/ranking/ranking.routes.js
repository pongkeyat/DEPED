import express from "express";

import {
    getRanking
} from "./ranking.controller.js";

const router = express.Router();

router.get(
    "/ranking/:vacancyId",
    getRanking
);

export default router;