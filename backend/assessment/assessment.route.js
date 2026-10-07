import express from "express";

import {
    getQualifiedApplicant, postAssessment, getAssessmentCriteriaController, getAssessmentCriteriaControllerOption, postPanelistAssessment, getPanelistSubmissionStatus
} from "./assessment.controller.js";
import { protect } from "../users/users.middleware.js";


const router = express.Router();


router.post(
    "/submitPanelistAssessment",
    protect,
    postPanelistAssessment
);

router.get(
    "/submitPanelistAssessment",
    protect,
    getPanelistSubmissionStatus
);


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