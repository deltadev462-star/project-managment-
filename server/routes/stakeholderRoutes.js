import express from "express";
import { 
    createStakeholder, 
    getProjectStakeholders, 
    updateStakeholder, 
    deleteStakeholder,
    createMeeting,
    getProjectMeetings 
} from "../controllers/stakeholderController.js";

const stakeholderRouter = express.Router();

// Stakeholders CRUD
stakeholderRouter.post("/", createStakeholder);
stakeholderRouter.get("/project/:projectId", getProjectStakeholders);
stakeholderRouter.put("/:stakeholderId", updateStakeholder);
stakeholderRouter.delete("/:stakeholderId", deleteStakeholder);

// Meetings
stakeholderRouter.post("/meetings", createMeeting);
stakeholderRouter.get("/meetings/project/:projectId", getProjectMeetings);

export default stakeholderRouter;