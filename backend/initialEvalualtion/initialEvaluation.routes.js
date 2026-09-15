import express from "express";

import {
    postInitialScreening
} from "./initialEvaluation.controller.js";

const router = express.Router();


router.post("/initial-evaluation",postInitialScreening);


export default router;