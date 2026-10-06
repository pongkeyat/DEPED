import express from "express";

import {
    getApplicantSummaryReport
} from "./report.controller.js";

const router = express.Router();


// ============================================================
// APPLICANT SUMMARY REPORT
// ============================================================

router.get(
    "/applicant-summary",
    getApplicantSummaryReport
);


export default router;