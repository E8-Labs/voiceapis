// CheckCalendarAvailability

import express from "express";

import {
  CheckCalendarAvailability,
  GetKb,
} from "../controllers/action.controller.js";

let actionRouter = express.Router();

// callRouter.post("/gen_summary", GenSummary);
actionRouter.get("/getCustomActionData", GetKb);
actionRouter.get("/checkAvailability", CheckCalendarAvailability);

export default actionRouter;
