// CheckCalendarAvailability

import express from "express";

import { CheckCalendarAvailability } from "../controllers/action.controller.js";

let actionRouter = express.Router();

// callRouter.post("/gen_summary", GenSummary);
actionRouter.get("/getCustomActionData", CheckCalendarAvailability);

export default actionRouter;
