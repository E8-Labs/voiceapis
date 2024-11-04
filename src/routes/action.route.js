// CheckCalendarAvailability

import express from "express";
import multer from "multer";
import { verifyJwtToken } from "../middleware/jwtmiddleware.js";
const uploadFiles = multer().fields([{ name: "media", maxCount: 1 }]);

import {
  CheckCalendarAvailability,
  GetKb,
  AddCalendar,
} from "../controllers/action.controller.js";

let actionRouter = express.Router();

// callRouter.post("/gen_summary", GenSummary);
actionRouter.get("/getCustomActionData", GetKb);
actionRouter.get("/checkAvailability", CheckCalendarAvailability);
actionRouter.post("/getCalendars", verifyJwtToken, uploadFiles, AddCalendar);

export default actionRouter;
