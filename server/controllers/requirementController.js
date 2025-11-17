import prisma from "../configs/prisma.js";

// Create requirement
export const createRequirement = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { 
            projectId, 
            title, 
            description, 
            type, 
            priority, 
            status,
            stakeholderIds 
        } = req.body;

        // Check if user is project member or admin
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
        const isProjectMember = project.members.some(member => member.userId === userId);
        const isProjectLead = project.team_lead === userId;

        if (!isWorkspaceAdmin && !isProjectMember && !isProjectLead) {
            return res.status(403).json({ message: "You don't have permission to create requirements in this project" });
        }

        // Create requirement with initial history entry
        const requirement = await prisma.requirement.create({
            data: {
                projectId,
                title,
                description,
                type: type || "FUNCTIONAL",
                priority: priority || "MEDIUM",
                status: status || "DRAFT",
                ownerId: userId,
                history: {
                    create: {
                        userId,
                        action: "CREATED",
                        version: 1,
                        changes: {
                            title,
                            description,
                            type: type || "FUNCTIONAL",
                            priority: priority || "MEDIUM",
                            status: status || "DRAFT"
                        }
                    }
                }
            }
        });

        // Add stakeholder relationships if provided
        if (stakeholderIds && stakeholderIds.length > 0) {
            const stakeholderRelations = stakeholderIds.map(stakeholderId => ({
                requirementId: requirement.id,
                stakeholderId,
                role: "REVIEWER"
            }));

            await prisma.stakeholderRequirement.createMany({
                data: stakeholderRelations
            });
        }

        // Fetch the complete requirement with relations
        const completeRequirement = await prisma.requirement.findUnique({
            where: { id: requirement.id },
            include: {
                owner: true,
                stakeholders: {
                    include: {
                        stakeholder: true
                    }
                },
                history: true
            }
        });

        res.json({ requirement: completeRequirement, message: "Requirement created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get requirements for a project
export const getProjectRequirements = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { projectId } = req.params;
        const { status, priority, type } = req.query;

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

        // Build filter conditions
        const filterConditions = { projectId };
        if (status) filterConditions.status = status;
        if (priority) filterConditions.priority = priority;
        if (type) filterConditions.type = type;

        const requirements = await prisma.requirement.findMany({
            where: filterConditions,
            include: {
                owner: true,
                stakeholders: {
                    include: {
                        stakeholder: true,
                        user: true
                    }
                },
                attachments: true,
                comments: {
                    include: {
                        user: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 3
                },
                taskLinks: {
                    include: {
                        task: true
                    }
                },
                meetingLinks: {
                    include: {
                        meeting: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ requirements });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get single requirement
export const getRequirement = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId } = req.params;

        const requirement = await prisma.requirement.findUnique({
            where: { id: requirementId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } },
                        members: true
                    }
                },
                owner: true,
                stakeholders: {
                    include: {
                        stakeholder: true,
                        user: true
                    }
                },
                attachments: true,
                comments: {
                    include: {
                        user: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                history: {
                    include: {
                        user: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                taskLinks: {
                    include: {
                        task: {
                            include: {
                                assignee: true
                            }
                        }
                    }
                },
                meetingLinks: {
                    include: {
                        meeting: {
                            include: {
                                participants: {
                                    include: {
                                        stakeholder: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!requirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        // Check access
        const isWorkspaceMember = requirement.project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = requirement.project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to this requirement" });
        }

        res.json({ requirement });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Update requirement
export const updateRequirement = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId } = req.params;
        const { title, description, type, priority, status } = req.body;

        // Get current requirement to check permissions and track changes
        const currentRequirement = await prisma.requirement.findUnique({
            where: { id: requirementId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } },
                        members: true
                    }
                }
            }
        });

        if (!currentRequirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        // Check permissions
        const isWorkspaceAdmin = currentRequirement.project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectLead = currentRequirement.project.team_lead === userId;
        const isOwner = currentRequirement.ownerId === userId;

        if (!isWorkspaceAdmin && !isProjectLead && !isOwner) {
            return res.status(403).json({ message: "You don't have permission to update this requirement" });
        }

        // Track changes for history
        const changes = {};
        if (title !== undefined && title !== currentRequirement.title) changes.title = { old: currentRequirement.title, new: title };
        if (description !== undefined && description !== currentRequirement.description) changes.description = { old: currentRequirement.description, new: description };
        if (type !== undefined && type !== currentRequirement.type) changes.type = { old: currentRequirement.type, new: type };
        if (priority !== undefined && priority !== currentRequirement.priority) changes.priority = { old: currentRequirement.priority, new: priority };
        if (status !== undefined && status !== currentRequirement.status) changes.status = { old: currentRequirement.status, new: status };

        if (Object.keys(changes).length === 0) {
            return res.status(400).json({ message: "No changes detected" });
        }

        // Determine action for history
        let action = "UPDATED";
        if (status !== undefined && status !== currentRequirement.status) {
            action = "STATUS_CHANGED";
        } else if (priority !== undefined && priority !== currentRequirement.priority) {
            action = "PRIORITY_CHANGED";
        }

        // Update requirement with history
        const updatedRequirement = await prisma.requirement.update({
            where: { id: requirementId },
            data: {
                title,
                description,
                type,
                priority,
                status,
                version: currentRequirement.version + 1,
                history: {
                    create: {
                        userId,
                        action,
                        version: currentRequirement.version + 1,
                        changes
                    }
                }
            },
            include: {
                owner: true,
                stakeholders: {
                    include: {
                        stakeholder: true
                    }
                }
            }
        });

        res.json({ requirement: updatedRequirement, message: "Requirement updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Delete requirement
export const deleteRequirement = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId } = req.params;

        const requirement = await prisma.requirement.findUnique({
            where: { id: requirementId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } }
                    }
                }
            }
        });

        if (!requirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        // Check permissions - only workspace admin or project lead can delete
        const isWorkspaceAdmin = requirement.project.workspace.members.some(
            member => member.userId === userId && member.role === "ADMIN"
        );
        const isProjectLead = requirement.project.team_lead === userId;

        if (!isWorkspaceAdmin && !isProjectLead) {
            return res.status(403).json({ message: "You don't have permission to delete this requirement" });
        }

        await prisma.requirement.delete({
            where: { id: requirementId }
        });

        res.json({ message: "Requirement deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Add comment to requirement
export const addRequirementComment = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId } = req.params;
        const { content } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Comment content is required" });
        }

        // Check if requirement exists and user has access
        const requirement = await prisma.requirement.findUnique({
            where: { id: requirementId },
            include: {
                project: {
                    include: {
                        workspace: { include: { members: true } },
                        members: true
                    }
                }
            }
        });

        if (!requirement) {
            return res.status(404).json({ message: "Requirement not found" });
        }

        const isWorkspaceMember = requirement.project.workspace.members.some(member => member.userId === userId);
        const isProjectMember = requirement.project.members.some(member => member.userId === userId);

        if (!isWorkspaceMember && !isProjectMember) {
            return res.status(403).json({ message: "You don't have access to comment on this requirement" });
        }

        const comment = await prisma.requirementComment.create({
            data: {
                requirementId,
                userId,
                content
            },
            include: {
                user: true
            }
        });

        res.json({ comment, message: "Comment added successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Link requirement to task
export const linkRequirementToTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { requirementId } = req.params;
        const { taskId } = req.body;

        // Verify requirement and task exist in same project
        const requirement = await prisma.requirement.findUnique({
            where: { id: requirementId }
        });

        const task = await prisma.task.findUnique({
            where: { id: taskId }
        });

        if (!requirement || !task) {
            return res.status(404).json({ message: "Requirement or task not found" });
        }

        if (requirement.projectId !== task.projectId) {
            return res.status(400).json({ message: "Requirement and task must be in the same project" });
        }

        // Check if link already exists
        const existingLink = await prisma.requirementTask.findUnique({
            where: {
                requirementId_taskId: {
                    requirementId,
                    taskId
                }
            }
        });

        if (existingLink) {
            return res.status(400).json({ message: "This requirement is already linked to this task" });
        }

        const link = await prisma.requirementTask.create({
            data: {
                requirementId,
                taskId
            },
            include: {
                task: {
                    include: {
                        assignee: true
                    }
                }
            }
        });

        // Add history entry
        await prisma.requirementHistory.create({
            data: {
                requirementId,
                userId,
                action: "TASK_LINKED",
                version: requirement.version,
                changes: { taskId, taskTitle: task.title }
            }
        });

        res.json({ link, message: "Requirement linked to task successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Get traceability matrix
export const getTraceabilityMatrix = async (req, res) => {
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

        // Get all requirements with their relationships
        const requirements = await prisma.requirement.findMany({
            where: { projectId },
            include: {
                owner: true,
                stakeholders: {
                    include: {
                        stakeholder: true
                    }
                },
                taskLinks: {
                    include: {
                        task: {
                            include: {
                                assignee: true
                            }
                        }
                    }
                },
                meetingLinks: {
                    include: {
                        meeting: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        const matrix = requirements.map(req => ({
            id: req.id,
            title: req.title,
            type: req.type,
            status: req.status,
            priority: req.priority,
            owner: req.owner.name,
            stakeholders: req.stakeholders.map(s => ({
                id: s.stakeholder.id,
                name: s.stakeholder.name,
                role: s.role
            })),
            tasks: req.taskLinks.map(link => ({
                id: link.task.id,
                title: link.task.title,
                status: link.task.status,
                assignee: link.task.assignee.name
            })),
            meetings: req.meetingLinks.map(link => ({
                id: link.meeting.id,
                title: link.meeting.title,
                date: link.meeting.meetingDate
            }))
        }));

        res.json({ matrix, project: { id: project.id, name: project.name } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};