import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon, EditIcon, MessageCircle, Paperclip, History, Link2, UserIcon, CalendarIcon, CheckSquare, FileText } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import api from "../configs/api";
import CreateRequirementDialog from "../components/CreateRequirementDialog";

export default function RequirementDetails() {
    const { t } = useTranslation();
    const { getToken, userId } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requirementId = searchParams.get('id');
    const projectId = searchParams.get('projectId');

    const [requirement, setRequirement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("details");
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [availableTasks, setAvailableTasks] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState("");
    const [isLinkingTask, setIsLinkingTask] = useState(false);

    const statusColors = {
        DRAFT: "bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-gray-200",
        REVIEW: "bg-yellow-200 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-200",
        APPROVED: "bg-green-200 text-green-900 dark:bg-green-600 dark:text-green-200",
        IMPLEMENTED: "bg-blue-200 text-blue-900 dark:bg-blue-600 dark:text-blue-200",
        VERIFIED: "bg-purple-200 text-purple-900 dark:bg-purple-600 dark:text-purple-200",
        CLOSED: "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-200"
    };

    const priorityColors = {
        HIGH: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        LOW: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    };

    useEffect(() => {
        if (requirementId) {
            fetchRequirement();
            fetchProjectTasks();
        }
    }, [requirementId]);

    const fetchRequirement = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/api/requirements/${requirementId}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            setRequirement(data.requirement);
        } catch (error) {
            toast.error("Failed to fetch requirement details");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectTasks = async () => {
        try {
            const { data } = await api.get(`/api/tasks/project/${projectId}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            setAvailableTasks(data.tasks);
        } catch (error) {
            console.error("Failed to fetch project tasks:", error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            setIsSubmittingComment(true);
            const { data } = await api.post(`/api/requirements/${requirementId}/comment`,
                { content: newComment }, 
                { headers: { Authorization: `Bearer ${await getToken()}` } }
            );
            
            setRequirement(prev => ({
                ...prev,
                comments: [data.comment, ...prev.comments]
            }));
            setNewComment("");
            toast.success("Comment added successfully");
        } catch (error) {
            toast.error("Failed to add comment");
            console.error(error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleLinkTask = async () => {
        if (!selectedTaskId) return;

        try {
            setIsLinkingTask(true);
            const { data } = await api.post(`/api/requirements/${requirementId}/link-task`,
                { taskId: selectedTaskId },
                { headers: { Authorization: `Bearer ${await getToken()}` } }
            );
            
            // Refresh requirement to get updated data
            await fetchRequirement();
            setSelectedTaskId("");
            toast.success("Task linked successfully");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to link task");
            console.error(error);
        } finally {
            setIsLinkingTask(false);
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'CREATED': return '🆕';
            case 'STATUS_CHANGED': return '📊';
            case 'PRIORITY_CHANGED': return '🔥';
            case 'TASK_LINKED': return '🔗';
            case 'UPDATED': return '✏️';
            default: return '📝';
        }
    };

    const formatChanges = (changes) => {
        return Object.entries(changes || {}).map(([key, value]) => {
            if (typeof value === 'object' && value.old && value.new) {
                return `${key}: ${value.old} → ${value.new}`;
            }
            return `${key}: ${value}`;
        }).join(', ');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!requirement) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 dark:text-zinc-400 mb-4">Requirement not found</p>
                <button
                    onClick={() => navigate(`/requirements?projectId=${projectId}`)}
                    className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                    Back to Requirements
                </button>
            </div>
        );
    }

    const unlinkedTasks = availableTasks.filter(task => 
        !requirement.taskLinks.some(link => link.task.id === task.id)
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <button 
                        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400" 
                        onClick={() => navigate(`/requirements?projectId=${projectId}`)}
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {requirement.title}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${statusColors[requirement.status]}`}>
                                {requirement.status}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${priorityColors[requirement.priority]}`}>
                                {requirement.priority}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300">
                                {requirement.type.replace("_", " ")}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                v{requirement.version}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditDialogOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded bg-blue-500 text-white hover:bg-blue-600"
                >
                    <EditIcon className="size-4" />
                    Edit
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-zinc-800">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { key: "details", label: "Details", icon: FileText },
                        { key: "comments", label: `Comments (${requirement.comments.length})`, icon: MessageCircle },
                        { key: "history", label: "History", icon: History },
                        { key: "attachments", label: `Attachments (${requirement.attachments.length})`, icon: Paperclip },
                        { key: "traceability", label: "Traceability", icon: Link2 }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                                activeTab === tab.key
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                        >
                            <tab.icon className="size-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 p-6">
                {activeTab === "details" && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                {requirement.description || "No description provided"}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Owner</h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                                        {requirement.owner.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{requirement.owner.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{requirement.owner.email}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Created</h3>
                                <p className="text-sm text-gray-900 dark:text-white">
                                    {new Date(requirement.createdAt).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Last updated: {new Date(requirement.updatedAt).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {requirement.stakeholders.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stakeholders</h3>
                                <div className="space-y-2">
                                    {requirement.stakeholders.map((rel) => (
                                        <div key={rel.stakeholder.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="w-4 h-4 text-gray-500" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {rel.stakeholder.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {rel.stakeholder.role} - {rel.stakeholder.department || 'No Department'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300">
                                                {rel.role}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "comments" && (
                    <div className="space-y-4">
                        <form onSubmit={handleAddComment} className="flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm"
                            />
                            <button
                                type="submit"
                                disabled={isSubmittingComment || !newComment.trim()}
                                className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 text-sm"
                            >
                                {isSubmittingComment ? "Posting..." : "Post"}
                            </button>
                        </form>

                        <div className="space-y-3">
                            {requirement.comments.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    No comments yet. Be the first to comment!
                                </p>
                            ) : (
                                requirement.comments.map((comment) => (
                                    <div key={comment.id} className="border-b border-gray-200 dark:border-zinc-800 pb-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-zinc-700 flex items-center justify-center text-sm">
                                                {comment.user.name[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {comment.user.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(comment.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="space-y-3">
                        {requirement.history.length === 0 ? (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                                No history available
                            </p>
                        ) : (
                            requirement.history.map((entry) => (
                                <div key={entry.id} className="border-b border-gray-200 dark:border-zinc-800 pb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="text-2xl">{getActionIcon(entry.action)}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {entry.user.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(entry.createdAt).toLocaleString()}
                                                </p>
                                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800">
                                                    v{entry.version}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {entry.action.replace(/_/g, ' ').toLowerCase()}
                                            </p>
                                            {Object.keys(entry.changes || {}).length > 0 && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Changes: {formatChanges(entry.changes)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "attachments" && (
                    <div>
                        {requirement.attachments.length === 0 ? (
                            <div className="text-center py-12">
                                <Paperclip className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-zinc-500" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    No attachments yet
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                    Attachment functionality will be implemented with SharePoint integration
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {requirement.attachments.map((attachment) => (
                                    <div key={attachment.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-zinc-800 rounded">
                                        <div className="flex items-center gap-2">
                                            <Paperclip className="w-4 h-4 text-gray-500" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {attachment.fileName}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Uploaded {new Date(attachment.uploadedAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href={attachment.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "traceability" && (
                    <div className="space-y-6">
                        {/* Linked Tasks */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <CheckSquare className="size-4" /> Linked Tasks ({requirement.taskLinks.length})
                                </h3>
                                {unlinkedTasks.length > 0 && (
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedTaskId}
                                            onChange={(e) => setSelectedTaskId(e.target.value)}
                                            className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-zinc-700"
                                        >
                                            <option value="">Select a task to link</option>
                                            {unlinkedTasks.map(task => (
                                                <option key={task.id} value={task.id}>
                                                    {task.title}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleLinkTask}
                                            disabled={!selectedTaskId || isLinkingTask}
                                            className="text-sm px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                                        >
                                            {isLinkingTask ? "Linking..." : "Link Task"}
                                        </button>
                                    </div>
                                )}
                            </div>
                            {requirement.taskLinks.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No tasks linked</p>
                            ) : (
                                <div className="space-y-2">
                                    {requirement.taskLinks.map((link) => (
                                        <div key={link.task.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {link.task.title}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Assigned to: {link.task.assignee.name} • Status: {link.task.status}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/taskDetails?id=${link.task.id}`)}
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                View Task
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Linked Meetings */}
                        <div>
                            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                <CalendarIcon className="size-4" /> Related Meetings ({requirement.meetingLinks.length})
                            </h3>
                            {requirement.meetingLinks.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No meetings linked</p>
                            ) : (
                                <div className="space-y-2">
                                    {requirement.meetingLinks.map((link) => (
                                        <div key={link.meeting.id} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {link.meeting.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Date: {new Date(link.meeting.meetingDate).toLocaleString()}
                                                {link.meeting.location && ` • Location: ${link.meeting.location}`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <CreateRequirementDialog
                isDialogOpen={isEditDialogOpen}
                setIsDialogOpen={setIsEditDialogOpen}
                projectId={projectId}
                requirement={requirement}
                onSuccess={() => {
                    fetchRequirement();
                    setIsEditDialogOpen(false);
                }}
            />
        </div>
    );
}