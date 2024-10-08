import express from "express";
import multer from "multer";
import {
  BuildYourAi,
  BuildAiScript,
  AddKnowledgebase,
  UpdateYourAi,
  DeleteKb,
  MyAi,
  AddTrait,
  DeleteTrait,
  UpdateTrait,
  AddUserValue,
  DeleteUserValue,
  UpdateUserValue,
  AddUserBelief,
  DeleteUserBelief,
  UpdateUserBelief,
  AddFramework,
  DeleteFramework,
  UpdateFramework,
  AddIntractionExample,
  DeleteIntractionExample,
  UpdateIntractionExample,
} from "../controllers/buildai.controller.js";

import { verifyJwtToken } from "../middleware/jwtmiddleware.js";
const uploadFiles = multer().fields([{ name: "media", maxCount: 1 }]);

let AiRouter = express.Router();

AiRouter.post("/buildAi", verifyJwtToken, uploadFiles, BuildYourAi);
AiRouter.post("/buildAiScript", verifyJwtToken, uploadFiles, BuildAiScript);
AiRouter.post(
  "/addKnowledgebase",
  verifyJwtToken,
  uploadFiles,
  AddKnowledgebase
);
AiRouter.post("/updateAi", verifyJwtToken, uploadFiles, UpdateYourAi);
AiRouter.post("/deleteKb", verifyJwtToken, uploadFiles, DeleteKb);
AiRouter.get("/my_ai", verifyJwtToken, uploadFiles, MyAi);

AiRouter.post("/addTrait", verifyJwtToken, uploadFiles, AddTrait);
AiRouter.post("/deleteTrait", verifyJwtToken, uploadFiles, DeleteTrait);
AiRouter.post("/updateTrait", verifyJwtToken, uploadFiles, UpdateTrait);

AiRouter.post("/addFramework", verifyJwtToken, uploadFiles, AddFramework);
AiRouter.post("/deleteFramework", verifyJwtToken, uploadFiles, DeleteFramework);
AiRouter.post("/updateFramework", verifyJwtToken, uploadFiles, UpdateFramework);

AiRouter.post("/addUserValue", verifyJwtToken, uploadFiles, AddUserValue);
AiRouter.post("/deleteUserValue", verifyJwtToken, uploadFiles, DeleteUserValue);
AiRouter.post("/updateUserValue", verifyJwtToken, uploadFiles, UpdateUserValue);

AiRouter.post("/addUserBelief", verifyJwtToken, uploadFiles, AddUserBelief);
AiRouter.post(
  "/deleteUserBelief",
  verifyJwtToken,
  uploadFiles,
  DeleteUserBelief
);
AiRouter.post(
  "/updateUserBelief",
  verifyJwtToken,
  uploadFiles,
  UpdateUserBelief
);

export default AiRouter;
