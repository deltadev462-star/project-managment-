import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "@clerk/clerk-react";
import { useTranslation } from "react-i18next";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import toast from "react-hot-toast";
import api from "../configs/api";
import { updateTask, deleteTask as deleteTaskAction } from "../features/workspaceSlice";
import CreateTaskDialog from "../components/CreateTaskDialog";
import {
  Bug, CalendarIcon, GitCommit, MessageSquare, Square, Trash, XIcon, 
  Zap, LayoutList, LayoutGrid, Plus, Filter, ChevronDown, Search,
  User, Clock, Paperclip, Edit2, AlertCircle, CheckCircle,
  Send, FileText, Download
} from "lucide-react";

const typeIcons = {
  BUG: { icon: Bug, color: "text-red-600 dark:text-red-400" },
  FEATURE: { icon: Zap, color: "text-blue-600 dark:text-blue-400" },
  TASK: { icon: Square, color: "text-green-600 dark:text-green-400" },
  IMPROVEMENT: { icon: GitCommit, color: "text-purple-600 dark:text-purple-400" },
  OTHER: { icon: MessageSquare, color: "text-amber-600 dark:text-amber-400" },
};

const priorityStyles = {
  LOW: { background: "bg-blue-100 dark:bg-blue-950", color: "text-blue-600 dark:text-blue-400" },
  MEDIUM: { background: "bg-amber-100 dark:bg-amber-950", color: "text-amber-600 dark:text-amber-400" },
  HIGH: { background: "bg-red-100 dark:bg-red-950", color: "text-red-600 dark:text-red-400" },
};

const statusStyles = {
  TODO: { background: "bg-gray-100 dark:bg-gray-900", color: "text-gray-600 dark:text-gray-400", icon: AlertCircle },
  IN_PROGRESS: { background: "bg-blue-100 dark:bg-blue-950", color: "text-blue-600 dark:text-blue-400", icon: Clock },
  DONE: { background: "bg-green-100 dark:bg-green-950", color: "text-green-600 dark:text-green-400", icon: CheckCircle },
};

const Tasks = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { getToken, user } = useAuth();
  const { currentWorkspace, loading } = useSelector((state) => state.workspace);

  const [view, setView] = useState("list"); // list or board
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    type: "",
    priority: "",
    assignee: "",
    project: "",
    dateRange: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingField, setEditingField] = useState({ taskId: null, field: null });
  const [editValue, setEditValue] = useState("");

  // Task comments and attachments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [attachments, setAttachments] = useState([]);

  // Get all tasks from all projects
  const allTasks = useMemo(() => {
    if (!currentWorkspace?.projects) return [];
    return currentWorkspace.projects.flatMap(project => 
      (project.tasks || []).map(task => ({
        ...task,
        projectName: project.name,
        projectId: project.id
      }))
    );
  }, [currentWorkspace]);

  // Get unique assignees
  const assigneeList = useMemo(
    () => Array.from(new Set(allTasks.map((t) => t.assignee?.name).filter(Boolean))),
    [allTasks]
  );

  // Get project list
  const projectList = useMemo(
    () => currentWorkspace?.projects || [],
    [currentWorkspace]
  );

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const { search, status, type, priority, assignee, project, dateRange } = filters;
      
      // Search filter
      if (search && !task.title.toLowerCase().includes(search.toLowerCase()) && 
          !task.description?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (status && task.status !== status) return false;
      
      // Type filter
      if (type && task.type !== type) return false;
      
      // Priority filter
      if (priority && task.priority !== priority) return false;
      
      // Assignee filter
      if (assignee && task.assignee?.name !== assignee) return false;
      
      // Project filter
      if (project && task.projectId !== project) return false;
      
      // Date range filter
      if (dateRange) {
        const taskDate = new Date(task.due_date);
        const today = new Date();
        
        switch(dateRange) {
          case "overdue":
            if (!isBefore(taskDate, startOfDay(today))) return false;
            break;
          case "today":
            if (!isAfter(taskDate, startOfDay(today)) || !isBefore(taskDate, endOfDay(today))) return false;
            break;
          case "week":
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            if (!isAfter(taskDate, startOfDay(today)) || !isBefore(taskDate, endOfDay(weekFromNow))) return false;
            break;
        }
      }
      
      return true;
    });
  }, [filters, allTasks]);

  // Group tasks by status for board view
  const tasksByStatus = useMemo(() => {
    const grouped = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: []
    };
    
    filteredTasks.forEach(task => {
      grouped[task.status].push(task);
    });
    
    return grouped;
  }, [filteredTasks]);

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: "",
      status: "",
      type: "",
      priority: "",
      assignee: "",
      project: "",
      dateRange: "",
    });
  };

  // Handle inline edit
  const handleInlineEdit = async (taskId, field, value) => {
    try {
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;

      toast.loading(t("common.updating"));
      const token = await getToken();

      const updateData = { [field]: field === "due_date" ? new Date(value) : value };
      await api.put(`/api/tasks/${taskId}`, updateData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      const updatedTask = { ...task, ...updateData };
      dispatch(updateTask(updatedTask));

      toast.dismissAll();
      toast.success(t("common.success"));
      setEditingField({ taskId: null, field: null });
    } catch (error) {
      toast.dismissAll();
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  // Handle delete tasks
  const handleDeleteTasks = async () => {
    try {
      const confirm = window.confirm(t("projectTasks.table.confirmDelete"));
      if (!confirm) return;

      const token = await getToken();
      toast.loading(t("projectTasks.table.deletingTasks"));

      await api.post("/api/tasks/delete", { tasksIds: selectedTasks }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      dispatch(deleteTaskAction(selectedTasks));
      setSelectedTasks([]);

      toast.dismissAll();
      toast.success(t("projectTasks.table.tasksDeleted"));
    } catch (error) {
      toast.dismissAll();
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  // Load comments for selected task
  const loadComments = async (taskId) => {
    if (!taskId) return;
    setLoadingComments(true);
    try {
      const token = await getToken();
      const { data } = await api.get(`/api/comments/${taskId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setComments(data.comments || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    } finally {
      setLoadingComments(false);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;

    try {
      toast.loading(t("common.loading"));
      const token = await getToken();
      
      const { data } = await api.post(
        `/api/comments`,
        { taskId: selectedTask.id, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setComments(prev => [...prev, data.comment]);
      setNewComment("");
      toast.dismissAll();
      toast.success(t("common.success"));
    } catch (error) {
      toast.dismissAll();
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  // Open task drawer
  const openTaskDrawer = (task) => {
    setSelectedTask(task);
    setShowTaskDrawer(true);
    loadComments(task.id);
  };

  // Close task drawer
  const closeTaskDrawer = () => {
    setSelectedTask(null);
    setShowTaskDrawer(false);
    setComments([]);
    setNewComment("");
  };

  // Task Card Component
  const TaskCard = ({ task, isDragging }) => {
    const { icon: Icon, color } = typeIcons[task.type] || {};
    const { background: priorityBg, color: priorityColor } = priorityStyles[task.priority] || {};
    
    return (
      <div
        className={`bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 
          cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : ''}`}
        onClick={() => openTaskDrawer(task)}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
            {task.title}
          </h4>
          <input
            type="checkbox"
            className="size-4 accent-zinc-600 dark:accent-zinc-500"
            onChange={(e) => {
              e.stopPropagation();
              setSelectedTasks(prev => 
                prev.includes(task.id) 
                  ? prev.filter(id => id !== task.id)
                  : [...prev, task.id]
              );
            }}
            checked={selectedTasks.includes(task.id)}
            onClick={e => e.stopPropagation()}
          />
        </div>

        {task.description && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          {Icon && <Icon className={`size-4 ${color}`} />}
          <span className={`text-xs ${color}`}>{task.type}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${priorityBg} ${priorityColor}`}>
            {task.priority}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <>
                <img 
                  src={task.assignee.image} 
                  alt={task.assignee.name} 
                  className="size-5 rounded-full "
                />
                <span className="text-zinc-700 dark:text-zinc-300">{task.assignee.name}</span>
              </>
            ) : (
              <span className="text-zinc-500 dark:text-zinc-400">{t("createTask.unassigned")}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
            <CalendarIcon className="size-3" />
            {format(new Date(task.due_date), "dd MMM")}
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {task.projectName}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t("navigation.tasks")}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded ${view === "list" 
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
                : "text-zinc-600 dark:text-zinc-400"}`}
            >
              <LayoutList className="size-4" />
            </button>
            <button
              onClick={() => setView("board")}
              className={`p-2 rounded ${view === "board" 
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm" 
                : "text-zinc-600 dark:text-zinc-400"}`}
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 
              text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <Filter className="size-4" />
            <span className="text-sm">{t("common.filter")}</span>
            {Object.values(filters).filter(Boolean).length > 0 && (
              <span className="size-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
            <ChevronDown className={`size-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          {/* Selected Actions */}
          {selectedTasks.length > 0 && (
            <button 
              onClick={handleDeleteTasks}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash className="size-4" />
              <span className="text-sm">{t("common.delete")} ({selectedTasks.length})</span>
            </button>
          )}
        </div>

        {/* New Task Button */}
        <button
          onClick={() => {
            setSelectedProject(projectList[0]?.id || null);
            setShowCreateTask(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 
            text-white hover:shadow-lg transition-shadow"
        >
          <Plus className="size-4" />
          <span className="text-sm">{t("projectDetails.newTask")}</span>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                placeholder={t("navbar.searchPlaceholder")}
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 
                  bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 
                bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
            >
              <option value="">{t("projectTasks.filters.allStatuses")}</option>
              <option value="TODO">{t("task.status.todo")}</option>
              <option value="IN_PROGRESS">{t("task.status.inProgress")}</option>
              <option value="DONE">{t("task.status.done")}</option>
            </select>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange("type", e.target.value)}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 
                bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
            >
              <option value="">{t("projectTasks.filters.allTypes")}</option>
              <option value="TASK">{t("task.type.task")}</option>
              <option value="BUG">{t("task.type.bug")}</option>
              <option value="FEATURE">{t("task.type.feature")}</option>
              <option value="IMPROVEMENT">{t("task.type.improvement")}</option>
              <option value="OTHER">{t("task.type.other")}</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange("priority", e.target.value)}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 
                bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
            >
              <option value="">{t("projectTasks.filters.allPriorities")}</option>
              <option value="LOW">{t("project.priority.low")}</option>
              <option value="MEDIUM">{t("project.priority.medium")}</option>
              <option value="HIGH">{t("project.priority.high")}</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={filters.assignee}
              onChange={(e) => handleFilterChange("assignee", e.target.value)}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 
                bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
            >
              <option value="">{t("projectTasks.filters.allAssignees")}</option>
              {assigneeList.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            {/* Project Filter */}
            <select
              value={filters.project}
              onChange={(e) => handleFilterChange("project", e.target.value)}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 
                bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
            >
              <option value="">{t("common.all")} {t("navigation.projects")}</option>
              {projectList.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 
                bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
            >
              <option value="">{t("common.all")} Dates</option>
              <option value="overdue">{t("stats.overdue")}</option>
              <option value="today">Due Today</option>
              <option value="week">Due This Week</option>
            </select>

            {/* Reset Button */}
            <button
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg 
                bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
            >
              <XIcon className="size-4" />
              <span className="text-sm">{t("projectTasks.filters.reset")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Task Views */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 dark:text-zinc-400">{t("projectTasks.table.noTasksFound")}</p>
        </div>
      ) : view === "list" ? (
        /* List View */
        <div className="overflow-auto rounded-lg border border-zinc-300 dark:border-zinc-800">
          <table className="min-w-full text-sm text-left bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-300">
            <thead className="text-xs uppercase bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="pl-4 pr-2 py-3">
                  <input
                    type="checkbox"
                    className="size-4 accent-zinc-600 dark:accent-zinc-500"
                    onChange={() => 
                      selectedTasks.length === filteredTasks.length 
                        ? setSelectedTasks([])
                        : setSelectedTasks(filteredTasks.map(t => t.id))
                    }
                    checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                  />
                </th>
                <th className="px-4 py-3">{t("projectTasks.table.title")}</th>
                <th className="px-4 py-3">{t("navigation.projects")}</th>
                <th className="px-4 py-3">{t("projectTasks.table.type")}</th>
                <th className="px-4 py-3">{t("projectTasks.table.priority")}</th>
                <th className="px-4 py-3">{t("projectTasks.table.status")}</th>
                <th className="px-4 py-3">{t("projectTasks.table.assignee")}</th>
                <th className="px-4 py-3">{t("projectTasks.table.dueDate")}</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredTasks.map((task) => {
                const { icon: Icon, color } = typeIcons[task.type] || {};
                const { background, color: priorityColor } = priorityStyles[task.priority] || {};
                const isEditingStatus = editingField.taskId === task.id && editingField.field === "status";
                const isEditingDueDate = editingField.taskId === task.id && editingField.field === "due_date";

                return (
                  <tr 
                    key={task.id} 
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <td className="pl-4 pr-2 py-3">
                      <input
                        type="checkbox"
                        className="size-4 accent-zinc-600 dark:accent-zinc-500"
                        onChange={() =>
                          setSelectedTasks(prev =>
                            prev.includes(task.id)
                              ? prev.filter(id => id !== task.id)
                              : [...prev, task.id]
                          )
                        }
                        checked={selectedTasks.includes(task.id)}
                      />
                    </td>
                    <td 
                      className="px-4 py-3 font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => openTaskDrawer(task)}
                    >
                      {task.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {task.projectName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className={`size-4 ${color}`} />}
                        <span className={`uppercase text-xs ${color}`}>{task.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded ${background} ${priorityColor}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isEditingStatus ? (
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleInlineEdit(task.id, "status", editValue)}
                          onKeyPress={(e) => e.key === "Enter" && handleInlineEdit(task.id, "status", editValue)}
                          className="px-2 py-1 rounded text-sm border border-zinc-300 dark:border-zinc-700 
                            bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200"
                          autoFocus
                        >
                          <option value="TODO">{t("task.status.todo")}</option>
                          <option value="IN_PROGRESS">{t("task.status.inProgress")}</option>
                          <option value="DONE">{t("task.status.done")}</option>
                        </select>
                      ) : (
                        <div
                          className="flex items-center gap-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700
                            rounded px-2 py-1 inline-flex"
                          onClick={() => {
                            setEditingField({ taskId: task.id, field: "status" });
                            setEditValue(task.status);
                          }}
                        >
                          {(() => {
                            const StatusIcon = statusStyles[task.status]?.icon;
                            return StatusIcon && (
                              <StatusIcon className={`size-4 ${statusStyles[task.status].color}`} />
                            );
                          })()}
                          <span className={`text-xs ${statusStyles[task.status]?.color}`}>
                            {t(`task.status.${task.status.toLowerCase()}`)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {task.assignee ? (
                          <>
                            <img 
                              // src={task.assignee.image} 
                              alt={task.assignee.name} 
                              className="size-6 rounded-full w-50"
                            />
                            <span className="text-sm">{task.assignee.name}</span>
                          </>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditingDueDate ? (
                        <input
                          type="date"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleInlineEdit(task.id, "due_date", editValue)}
                          onKeyPress={(e) => e.key === "Enter" && handleInlineEdit(task.id, "due_date", editValue)}
                          className="px-2 py-1 rounded text-sm border border-zinc-300 dark:border-zinc-700 
                            bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400 cursor-pointer 
                            hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded px-2 py-1 inline-flex"
                          onClick={() => {
                            setEditingField({ taskId: task.id, field: "due_date" });
                            setEditValue(format(new Date(task.due_date), "yyyy-MM-dd"));
                          }}
                        >
                          <CalendarIcon className="size-4" />
                          <span className="text-sm">{format(new Date(task.due_date), "dd MMM yyyy")}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openTaskDrawer(task)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Board View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Object.entries(tasksByStatus).map(([status, tasks]) => (
            <div key={status} className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const StatusIcon = statusStyles[status]?.icon;
                    return StatusIcon && (
                      <StatusIcon className={`size-5 ${statusStyles[status].color}`} />
                    );
                  })()}
                  <h3 className="font-medium text-zinc-900 dark:text-white">
                    {t(`task.status.${status.toLowerCase()}`)}
                  </h3>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">({tasks.length})</span>
                </div>
              </div>

              <div className="space-y-3 min-h-[200px]">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {tasks.length === 0 && (
                  <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-8">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Drawer */}
      {showTaskDrawer && selectedTask && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/30" onClick={closeTaskDrawer} />
          
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-zinc-900 shadow-xl">
            <div className="flex flex-col h-full">
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {selectedTask.title}
                  </h2>
                  <button 
                    onClick={closeTaskDrawer}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                  >
                    <XIcon className="size-5 text-zinc-500 dark:text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {/* Task Details */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
                      Details
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Status, Type, Priority */}
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs ${statusStyles[selectedTask.status].background} ${statusStyles[selectedTask.status].color}`}>
                          {t(`task.status.${selectedTask.status.toLowerCase()}`)}
                        </span>
                        <div className="flex items-center gap-1">
                          {(() => {
                            const TypeIcon = typeIcons[selectedTask.type]?.icon;
                            return TypeIcon && (
                              <TypeIcon className={`size-4 ${typeIcons[selectedTask.type].color}`} />
                            );
                          })()}
                          <span className={`text-xs ${typeIcons[selectedTask.type]?.color}`}>
                            {selectedTask.type}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${priorityStyles[selectedTask.priority].background} ${priorityStyles[selectedTask.priority].color}`}>
                          {selectedTask.priority}
                        </span>
                      </div>

                      {/* Project */}
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Project</p>
                        <p className="text-sm text-zinc-900 dark:text-zinc-100">{selectedTask.projectName}</p>
                      </div>

                      {/* Assignee */}
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Assignee</p>
                        {selectedTask.assignee ? (
                          <div className="flex items-center gap-2">
                            <img 
                              src={selectedTask.assignee.image} 
                              alt={selectedTask.assignee.name} 
                              className="size-6 rounded-full"
                            />
                            <span className="text-sm text-zinc-900 dark:text-zinc-100">
                              {selectedTask.assignee.name}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("createTask.unassigned")}</p>
                        )}
                      </div>

                      {/* Due Date */}
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Due Date</p>
                        <div className="flex items-center gap-2 text-sm text-zinc-900 dark:text-zinc-100">
                          <CalendarIcon className="size-4 text-zinc-500 dark:text-zinc-400" />
                          {format(new Date(selectedTask.due_date), "dd MMM yyyy")}
                        </div>
                      </div>

                      {/* Description */}
                      {selectedTask.description && (
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Description</p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                            {selectedTask.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attachments Section */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
                      <Paperclip className="size-4" />
                      Attachments
                    </h3>
                    
                    <div className="space-y-2">
                      {attachments.length > 0 ? (
                        attachments.map((attachment) => (
                          <div 
                            key={attachment.id} 
                            className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-700"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="size-5 text-zinc-500 dark:text-zinc-400" />
                              <div>
                                <p className="text-sm text-zinc-900 dark:text-zinc-100">{attachment.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                  {attachment.size} • {attachment.uploadedAt}
                                </p>
                              </div>
                            </div>
                            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                              <Download className="size-4 text-zinc-500 dark:text-zinc-400" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-sm text-zinc-500 dark:text-zinc-400">
                          <Paperclip className="size-8 mx-auto mb-2 opacity-50" />
                          <p>No attachments yet</p>
                          <p className="text-xs mt-1">Attachment functionality will be implemented with SharePoint integration</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div>
                    <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
                      <MessageSquare className="size-4" />
                      Comments ({comments.length})
                    </h3>

                    {loadingComments ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                          {comments.length > 0 ? (
                            comments.map((comment) => (
                              <div 
                                key={comment.id} 
                                className={`p-3 rounded-lg ${
                                  comment.user.id === user?.id 
                                    ? "bg-blue-50 dark:bg-blue-950/30 ml-8" 
                                    : "bg-zinc-100 dark:bg-zinc-800 mr-8"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <img 
                                    src={comment.user.image} 
                                    alt={comment.user.name} 
                                    className="size-5 rounded-full"
                                  />
                                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                    {comment.user.name}
                                  </span>
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {format(new Date(comment.createdAt), "dd MMM, HH:mm")}
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                  {comment.content}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-4">
                              No comments yet. Be the first to comment!
                            </p>
                          )}
                        </div>

                        {/* Add Comment */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                            placeholder="Write a comment..."
                            className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 
                              bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                          />
                          <button
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white 
                              disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="size-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Dialog */}
      {showCreateTask && selectedProject && (
        <CreateTaskDialog
          showCreateTask={showCreateTask}
          setShowCreateTask={setShowCreateTask}
          projectId={selectedProject}
        />
      )}
    </div>
  );
};

export default Tasks;