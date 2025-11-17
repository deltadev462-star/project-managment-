import prisma from "../configs/prisma.js";

// Create stakeholder
export const createStakeholder = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId, name, email, role, department, phone, notes } = req.body;

        // Check if user has permission
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { 
                workspace: { 
                    include: { 
                        members: true 
                    } 
                },
                members: true 
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isWorkspaceAdmin = project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectLead = project.team_lead === userId;

        if (!isWorkspaceAdmin && !isProjectLead) {
            return res.status(403).json({ message: "You don't have permission to create stakeholders in this project" });
        }

        const stakeholder = await prisma.stakeholder.create({
            data: {
                projectId,
                name,
                email,
                role,
                department,
                phone,
                notes
            }
        });

        res.json({ stakeholder, message: "Stakeholder created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get project stakeholders
export const getProjectStakeholders = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;

        // Check project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { 
                workspace: { include: { members: true } },
                members: true 
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isWorkspaceMember = project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this project" });
        }

        const stakeholders = await prisma.stakeholder.findMany({
            where: { projectId },
            include: {
                requirements: {
                    include: {
                        requirement: true
                    }
                },
                meetings: {
                    include: {
                        meeting: true
                    }
                }
            }
        });

        res.json({ stakeholders });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update stakeholder
export const updateStakeholder = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { stakeholderId } = req.params;
        const { name, email, role, department, phone, notes } = req.body;

        // Get stakeholder with project info
        const stakeholder = await prisma.stakeholder.findUnique({
            where: { id: stakeholderId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } }
                    }
                }
            }
        });

        if (!stakeholder) {
            return res.status(404).json({ message: "Stakeholder not found" });
        }

        // Check permissions
        const isWorkspaceAdmin = stakeholder.project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectLead = stakeholder.project.team_lead === userId;

        if (!isWorkspaceAdmin && !isProjectLead) {
            return res.status(403).json({ message: "You don't have permission to update this stakeholder" });
        }

        const updatedStakeholder = await prisma.stakeholder.update({
            where: { id: stakeholderId },
            data: {
                name,
                email,
                role,
                department,
                phone,
                notes
            }
        });

        res.json({ stakeholder: updatedStakeholder, message: "Stakeholder updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Delete stakeholder
export const deleteStakeholder = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { stakeholderId } = req.params;

        const stakeholder = await prisma.stakeholder.findUnique({
            where: { id: stakeholderId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } }
                    }
                }
            }
        });

        if (!stakeholder) {
            return res.status(404).json({ message: "Stakeholder not found" });
        }

        // Check permissions
        const isWorkspaceAdmin = stakeholder.project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectLead = stakeholder.project.team_lead === userId;

        if (!isWorkspaceAdmin && !isProjectLead) {
            return res.status(403).json({ message: "You don't have permission to delete this stakeholder" });
        }

        await prisma.stakeholder.delete({
            where: { id: stakeholderId }
        });

        res.json({ message: "Stakeholder deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Create meeting
export const createMeeting = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { 
            projectId, 
            title, 
            description, 
            meetingDate, 
            duration, 
            location, 
            notes,
            participantIds,
            requirementIds
        } = req.body;

        // Check if user has permission
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { 
                workspace: { 
                    include: { 
                        members: true 
                    } 
                },
                members: true 
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isWorkspaceMember = project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have permission to create meetings in this project" });
        }

        const meeting = await prisma.meeting.create({
            data: {
                projectId,
                title,
                description,
                meetingDate: new Date(meetingDate),
                duration,
                location,
                notes
            }
        });

        // Add participants
        if (participantIds && participantIds.length > 0) {
            const participants = participantIds.map(stakeholderId => ({
                meetingId: meeting.id,
                stakeholderId
            }));

            await prisma.meetingParticipant.createMany({
                data: participants
            });
        }

        // Link requirements
        if (requirementIds && requirementIds.length > 0) {
            const requirementLinks = requirementIds.map(requirementId => ({
                meetingId: meeting.id,
                requirementId
            }));

            await prisma.meetingRequirement.createMany({
                data: requirementLinks
            });
        }

        // Fetch complete meeting data
        const completeMeeting = await prisma.meeting.findUnique({
            where: { id: meeting.id },
            include: {
                participants: {
                    include: {
                        stakeholder: true
                    }
                },
                requirements: {
                    include: {
                        requirement: true
                    }
                }
            }
        });

        res.json({ meeting: completeMeeting, message: "Meeting created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get project meetings
export const getProjectMeetings = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;

        // Check project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { 
                workspace: { include: { members: true } },
                members: true 
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const isWorkspaceMember = project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this project" });
        }

        const meetings = await prisma.meeting.findMany({
            where: { projectId },
            include: {
                participants: {
                    include: {
                        stakeholder: true
                    }
                },
                requirements: {
                    include: {
                        requirement: true
                    }
                }
            },
            orderBy: { meetingDate: 'desc' }
        });

        res.json({ meetings });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};