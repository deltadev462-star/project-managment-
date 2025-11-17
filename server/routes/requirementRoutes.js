import express from "express";
import { 
    createRequirement, 
    getProjectRequirements, 
    getRequirement, 
    updateRequirement, 
    deleteRequirement,
    addRequirementComment,
    linkRequirementToTask,
    getTraceabilityMatrix 
} from "../controllers/requirementController.js";

const requirementRouter = express.Router();

// Requirements CRUD
requirementRouter.post("/", createRequirement);
requirementRouter.get("/project/:projectId", getProjectRequirements);
requirementRouter.get("/:requirementId", getRequirement);
requirementRouter.put("/:requirementId", updateRequirement);
requirementRouter.delete("/:requirementId", deleteRequirement);

// Comments
requirementRouter.post("/:requirementId/comment", addRequirementComment);

// Traceability
requirementRouter.post("/:requirementId/link-task", linkRequirementToTask);
requirementRouter.get("/project/:projectId/traceability-matrix", getTraceabilityMatrix);

export default requirementRouter;