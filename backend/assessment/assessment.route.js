import express from "express";

import {
    getQualifiedApplicant, postAssessment, getAssessmentCriteriaController, getAssessmentCriteriaControllerOption
} from "./assessment.controller.js";


const router = express.Router();


router.get(
    "/qualified/:applicantId",
    getQualifiedApplicant
);

router.post(
    "/submit",
    postAssessment
);

router.get(
    "/criteria",
    getAssessmentCriteriaController
);

router.get(
    "/criteriaOptions",
    getAssessmentCriteriaControllerOption
);

export default router;