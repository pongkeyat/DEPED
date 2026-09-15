import express from "express";

import {
    createPanelist,
    getAllPanelists,
    getPanelistById,
    updatePanelist,
    deletePanelist,
} from "../panelist/panelist.controller.js";

const router = express.Router();

// Create
router.post("/createPanelist", createPanelist);

// Get all
router.get("/getAllPanelists", getAllPanelists);

// Get by ID
router.get("/getPanelistById/:id", getPanelistById);

// Update
router.put("/updatePanelist/:id", updatePanelist);

// Delete
router.delete("/deletePanelist/:id", deletePanelist);

export default router;