import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, FileText, Filter, Download, Eye, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../configs/api";
import CreateRequirementDialog from "../components/CreateRequirementDialog";
import TraceabilityMatrixDialog from "../components/TraceabilityMatrixDialog";

export default function Requirements() {
    const { t } = useTranslation();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const projectId = searchParams.get('projectId');
    
    const projects = useSelector((state) => state?.workspace?.currentWorkspace?.projects || []);
    const currentProject = projects.find(p => p.id === projectId);
    
    const [requirements, setRequirements] = useState([]);
    const [filteredRequirements, setFilteredRequirements] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isMatrixOpen, setIsMatrixOpen] = useState(false);
    const [selectedRequirement, setSelectedRequirement] = useState(null);
    const [filters, setFilters] = useState({
        status: "ALL",
        priority: "ALL",
        type: "ALL"
    });

    const requirementTypes = ["FUNCTIONAL", "NON_FUNCTIONAL", "BUSINESS", "TECHNICAL"];
    const requirementStatuses = ["DRAFT", "REVIEW", "APPROVED", "IMPLEMENTED", "VERIFIED", "CLOSED"];
    const priorityLevels = ["HIGH", "MEDIUM", "LOW"];

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
        if (projectId) {
            fetchRequirements();
        } else {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        filterRequirements();
    }, [requirements, searchTerm, filters]);

    useEffect(() => {
        if (!projectId) {
            filterProjects();
        }
    }, [projects, searchTerm]);

    const fetchRequirements = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/requirements/project/${projectId}`, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            setRequirements(response.data.requirements);
        } catch (error) {
            toast.error("Failed to fetch requirements");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filterRequirements = () => {
        let filtered = requirements;

        if (searchTerm) {
            filtered = filtered.filter(
                (req) =>
                    req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    req.id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filters.status !== "ALL") {
            filtered = filtered.filter((req) => req.status === filters.status);
        }

        if (filters.priority !== "ALL") {
            filtered = filtered.filter((req) => req.priority === filters.priority);
        }

        if (filters.type !== "ALL") {
            filtered = filtered.filter((req) => req.type === filters.type);
        }

        setFilteredRequirements(filtered);
    };

    const filterProjects = () => {
        let filtered = projects;

        if (searchTerm) {
            filtered = filtered.filter(
                (project) =>
                    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredProjects(filtered);
    };

    const handleViewRequirement = (requirement) => {
        navigate(`/requirement-details?id=${requirement.id}&projectId=${projectId}`);
    };

    const handleProjectSelect = (selectedProjectId) => {
        setSearchParams({ projectId: selectedProjectId });
    };

    const exportRequirements = () => {
        const csv = [
            ["ID", "Title", "Type", "Status", "Priority", "Owner", "Created Date"],
            ...filteredRequirements.map(req => [
                req.id,
                req.title,
                req.type,
                req.status,
                req.priority,
                req.owner.name,
                new Date(req.createdAt).toLocaleDateString()
            ])
        ].map(row => row.join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `requirements-${currentProject?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const projectStatusColors = {
        PLANNING: "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-200",
        ACTIVE: "bg-emerald-200 text-emerald-900 dark:bg-emerald-500 dark:text-emerald-900",
        ON_HOLD: "bg-amber-200 text-amber-900 dark:bg-amber-500 dark:text-amber-900",
        COMPLETED: "bg-blue-200 text-blue-900 dark:bg-blue-500 dark:text-blue-900",
        CANCELLED: "bg-red-200 text-red-900 dark:bg-red-500 dark:text-red-900",
    };

    const projectPriorityColors = {
        HIGH: "text-red-600 dark:text-red-400",
        MEDIUM: "text-yellow-600 dark:text-yellow-400",
        LOW: "text-green-600 dark:text-green-400"
    };

    if (!projectId) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                        {t("requirements.title")}
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm">
                        {t("requirements.subtitle")}
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-400 w-4 h-4" />
                    <input
                        placeholder={t("requirements.searchProjectsPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 text-sm pr-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-zinc-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {t("requirements.noProjectsFound")}
                        </h3>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm">
                            {t("requirements.createFirstProject")}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProjects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => handleProjectSelect(project.id)}
                                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                            {project.name}
                                        </h3>
                                        {project.description && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                {project.description}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ml-2 ${projectStatusColors[project.status]}`}>
                                        {project.status.replace("_", " ")}
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${projectPriorityColors[project.priority]}`}>
                                            {t(`project.priority.${project.priority.toLowerCase()}`).charAt(0).toUpperCase() + t(`project.priority.${project.priority.toLowerCase()}`).slice(1)}
                                        </span>
                                    </div>
                                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                        {t("requirements.viewRequirements")}
                                    </button>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">{t("requirements.project.teamLead")}:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{project.owner?.name || t("requirements.project.notAssigned")}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">{t("requirements.project.members")}:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{project.members?.length || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSearchParams({})}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                            {t("requirements.backToProjects")}
                        </button>
                        <span className="text-gray-400 dark:text-gray-600">/</span>
                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                            {t("requirements.pageTitle", { project: currentProject?.name || "Project" })}
                        </h1>
                    </div>
                    <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
                        {t("requirements.manageTrack")}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsMatrixOpen(true)}
                        className="flex items-center px-4 py-2 text-sm rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                    >
                        <Eye className="size-4 mr-2" /> {t("requirements.traceabilityMatrix")}
                    </button>
                    <button
                        onClick={exportRequirements}
                        className="flex items-center px-4 py-2 text-sm rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                    >
                        <Download className="size-4 mr-2" /> {t("requirements.export")}
                    </button>
                    <button
                        onClick={() => setIsDialogOpen(true)}
                        className="flex items-center px-5 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-90 transition"
                    >
                        <Plus className="size-4 mr-2" /> {t("requirements.newRequirement")}
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-zinc-400 w-4 h-4" />
                    <input
                        placeholder={t("requirements.searchPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 text-sm pr-4 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:border-blue-500 outline-none"
                    />
                </div>
                <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm"
                >
                    <option value="ALL">{t("requirements.allTypes")}</option>
                    {requirementTypes.map(type => (
                        <option key={type} value={type}>{t(`requirements.types.${type.toLowerCase().replace("_", "")}`)}</option>
                    ))}
                </select>
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm"
                >
                    <option value="ALL">{t("requirements.allStatus")}</option>
                    {requirementStatuses.map(status => (
                        <option key={status} value={status}>{t(`requirements.status.${status.toLowerCase()}`)}</option>
                    ))}
                </select>
                <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm"
                >
                    <option value="ALL">{t("requirements.allPriority")}</option>
                    {priorityLevels.map(priority => (
                        <option key={priority} value={priority}>{t(`project.priority.${priority.toLowerCase()}`)}</option>
                    ))}
                </select>
            </div>

            {/* Requirements Table/List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-500 dark:text-zinc-400">{t("common.loading")}</p>
                </div>
            ) : filteredRequirements.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-zinc-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {t("requirements.noRequirementsFound")}
                    </h3>
                    <p className="text-gray-500 dark:text-zinc-400 mb-6 text-sm">
                        {searchTerm || filters.status !== "ALL" || filters.priority !== "ALL" || filters.type !== "ALL"
                            ? t("requirements.adjustFilters")
                            : t("requirements.createFirstRequirement")}
                    </p>
                    {!searchTerm && filters.status === "ALL" && filters.priority === "ALL" && filters.type === "ALL" && (
                        <button
                            onClick={() => setIsDialogOpen(true)}
                            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mx-auto text-sm"
                        >
                            <Plus className="size-4" />
                            {t("requirements.newRequirement")}
                        </button>
                    )}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-zinc-800">
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">{t("requirements.table.id")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">{t("requirements.table.title")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">{t("requirements.table.type")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">{t("requirements.table.status")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">{t("requirements.table.priority")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">{t("requirements.table.owner")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">{t("requirements.table.tasks")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">{t("requirements.table.created")}</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300 text-sm">{t("requirements.table.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                            {filteredRequirements.map((requirement) => (
                                <tr key={requirement.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                                    <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                                        {requirement.id.substring(0, 8)}...
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {requirement.title}
                                        </div>
                                        {requirement.description && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-md">
                                                {requirement.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300">
                                            {t(`requirements.types.${requirement.type.toLowerCase().replace("_", "")}`)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`text-xs px-2 py-1 rounded ${statusColors[requirement.status]}`}>
                                            {t(`requirements.status.${requirement.status.toLowerCase()}`)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`text-xs px-2 py-1 rounded ${priorityColors[requirement.priority]}`}>
                                            {t(`project.priority.${requirement.priority.toLowerCase()}`)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-sm text-gray-900 dark:text-white">
                                            {requirement.owner.name}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {requirement.taskLinks?.length || 0}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(requirement.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <button
                                            onClick={() => handleViewRequirement(requirement)}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
                                        >
                                            {t("requirements.table.view")}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Dialogs */}
            <CreateRequirementDialog 
                isDialogOpen={isDialogOpen} 
                setIsDialogOpen={setIsDialogOpen}
                projectId={projectId}
                onSuccess={fetchRequirements}
            />
            
            <TraceabilityMatrixDialog
                isOpen={isMatrixOpen}
                setIsOpen={setIsMatrixOpen}
                projectId={projectId}
            />
        </div>
    );
}