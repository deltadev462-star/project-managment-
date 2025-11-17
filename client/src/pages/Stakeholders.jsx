import { useEffect, useState } from "react";
import {
  Users2Icon,
  Search,
  UserPlus,
  Mail,
  Building2,
  Briefcase,
  Star,
  Filter,
  X,
  Phone,
  MapPin,
  Calendar,
  Link2,
  Paperclip,
  Clock,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Activity,
  MessageSquare,
  FileText,
  MoreVertical,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

const Stakeholders = () => {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const [stakeholders, setStakeholders] = useState([]);
  const [selectedStakeholder, setSelectedStakeholder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [filters, setFilters] = useState({
    influence: [],
    interest: [],
    organization: [],
    role: [],
    project: [],
  });

  const currentWorkspace = useSelector(
    (state) => state?.workspace?.currentWorkspace || null
  );
  const projects = currentWorkspace?.projects || [];

  // Mock stakeholders data with more details
  useEffect(() => {
    const mockStakeholders = [
      {
        id: 1,
        name: "John Smith",
        role: "Project Sponsor",
        organization: "ABC Corporation",
        email: "john.smith@abccorp.com",
        phone: "+1 234 567 8900",
        location: "New York, USA",
        influence: "high",
        interest: "high",
        projects: ["Project Alpha", "Project Beta"],
        joinedDate: "2024-01-15",
        lastActivity: "2024-03-20",
        attachments: [
          {
            id: 1,
            name: "Contract.pdf",
            size: "2.5 MB",
            uploadDate: "2024-01-15",
          },
          {
            id: 2,
            name: "Requirements.docx",
            size: "1.2 MB",
            uploadDate: "2024-02-10",
          },
        ],
        activities: [
          {
            id: 1,
            type: "meeting",
            description: "Quarterly review meeting",
            date: "2024-03-20",
            status: "completed",
          },
          {
            id: 2,
            type: "email",
            description: "Feedback on project deliverables",
            date: "2024-03-15",
            status: "completed",
          },
          {
            id: 3,
            type: "call",
            description: "Budget discussion",
            date: "2024-03-25",
            status: "scheduled",
          },
        ],
        notes:
          "Key decision maker for budget approvals. Prefers executive summaries.",
        tags: ["decision-maker", "budget-holder", "executive"],
      },
      {
        id: 2,
        name: "Sarah Johnson",
        role: "Product Owner",
        organization: "Tech Solutions Inc.",
        email: "sarah.j@techsolutions.com",
        phone: "+1 234 567 8901",
        location: "San Francisco, USA",
        influence: "high",
        interest: "high",
        projects: ["Project Alpha"],
        joinedDate: "2024-01-20",
        lastActivity: "2024-03-22",
        attachments: [
          {
            id: 3,
            name: "Product_Roadmap.pdf",
            size: "3.1 MB",
            uploadDate: "2024-01-20",
          },
        ],
        activities: [
          {
            id: 4,
            type: "meeting",
            description: "Sprint planning session",
            date: "2024-03-22",
            status: "completed",
          },
          {
            id: 5,
            type: "review",
            description: "Feature approval",
            date: "2024-03-18",
            status: "completed",
          },
        ],
        notes:
          "Technical background, focuses on user experience and feature delivery.",
        tags: ["product-owner", "technical", "agile"],
      },
      {
        id: 3,
        name: "Michael Chen",
        role: "Technical Advisor",
        organization: "Innovation Labs",
        email: "m.chen@innovationlabs.com",
        phone: "+1 234 567 8902",
        location: "Seattle, USA",
        influence: "medium",
        interest: "high",
        projects: ["Project Beta", "Project Gamma"],
        joinedDate: "2024-02-01",
        lastActivity: "2024-03-19",
        attachments: [],
        activities: [
          {
            id: 6,
            type: "review",
            description: "Architecture review",
            date: "2024-03-19",
            status: "completed",
          },
        ],
        notes: "Expert in cloud architecture and scalability.",
        tags: ["technical-expert", "advisor", "cloud"],
      },
      {
        id: 4,
        name: "Emma Davis",
        role: "Business Analyst",
        organization: "ABC Corporation",
        email: "emma.davis@abccorp.com",
        phone: "+1 234 567 8903",
        location: "Chicago, USA",
        influence: "medium",
        interest: "medium",
        projects: ["Project Alpha"],
        joinedDate: "2024-02-15",
        lastActivity: "2024-03-21",
        attachments: [
          {
            id: 4,
            name: "Process_Flow.vsd",
            size: "1.8 MB",
            uploadDate: "2024-02-20",
          },
        ],
        activities: [
          {
            id: 7,
            type: "document",
            description: "Requirements document update",
            date: "2024-03-21",
            status: "completed",
          },
        ],
        notes:
          "Strong analytical skills, liaison between business and technical teams.",
        tags: ["analyst", "requirements", "process"],
      },
    ];
    setStakeholders(mockStakeholders);
  }, [currentWorkspace]);

  const filteredStakeholders = stakeholders.filter((stakeholder) => {
    // Text search
    const matchesSearch =
      !searchTerm ||
      stakeholder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stakeholder.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stakeholder.organization
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      stakeholder.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by influence
    const matchesInfluence =
      filters.influence.length === 0 ||
      filters.influence.includes(stakeholder.influence);

    // Filter by interest
    const matchesInterest =
      filters.interest.length === 0 ||
      filters.interest.includes(stakeholder.interest);

    // Filter by organization
    const matchesOrganization =
      filters.organization.length === 0 ||
      filters.organization.includes(stakeholder.organization);

    // Filter by role
    const matchesRole =
      filters.role.length === 0 || filters.role.includes(stakeholder.role);

    return (
      matchesSearch &&
      matchesInfluence &&
      matchesInterest &&
      matchesOrganization &&
      matchesRole
    );
  });

  const getInfluenceColor = (level) => {
    switch (level) {
      case "high":
        return "bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      case "low":
        return "bg-green-100 dark:bg-green-500/20 text-green-500 dark:text-green-400";
      default:
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400";
    }
  };

  const getInterestColor = (level) => {
    switch (level) {
      case "high":
        return "bg-blue-100 dark:bg-blue-500/20 text-blue-500 dark:text-blue-400";
      case "medium":
        return "bg-purple-100 dark:bg-purple-500/20 text-purple-500 dark:text-purple-400";
      case "low":
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400";
      default:
        return "bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400";
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "meeting":
        return <Calendar className="size-4" />;
      case "email":
        return <Mail className="size-4" />;
      case "call":
        return <Phone className="size-4" />;
      case "document":
        return <FileText className="size-4" />;
      case "review":
        return <Eye className="size-4" />;
      default:
        return <Activity className="size-4" />;
    }
  };

  const uniqueOrganizations = [
    ...new Set(stakeholders.map((s) => s.organization)),
  ];
  const uniqueRoles = [...new Set(stakeholders.map((s) => s.role))];
  const highInfluenceCount = stakeholders.filter(
    (s) => s.influence === "high"
  ).length;

  const toggleFilter = (category, value) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((v) => v !== value)
        : [...prev[category], value],
    }));
  };

  const clearFilters = () => {
    setFilters({
      influence: [],
      interest: [],
      organization: [],
      role: [],
      project: [],
    });
  };

  const openStakeholderDetail = (stakeholder) => {
    setSelectedStakeholder(stakeholder);
    setShowDetailView(true);
    setActiveTab("profile");
  };

  // Create/Edit Modal Component
  const StakeholderModal = ({ isOpen, onClose, stakeholder = null }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-xl bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b dark:border-zinc-700 border-gray-300  ">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {stakeholder ? t("stakeholders.editStakeholder") : t("stakeholders.addNewStakeholder")}
            </h2>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.nameRequired")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  defaultValue={stakeholder?.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.emailRequired")}
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  defaultValue={stakeholder?.email}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.role")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  defaultValue={stakeholder?.role}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.organization")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  defaultValue={stakeholder?.organization}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.phone")}
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  defaultValue={stakeholder?.phone}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.location")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  defaultValue={stakeholder?.location}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.influenceLevel")}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  defaultValue={stakeholder?.influence || "medium"}
                >
                  <option value="high">{t("stakeholders.high")}</option>
                  <option value="medium">{t("stakeholders.medium")}</option>
                  <option value="low">{t("stakeholders.low")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                  {t("stakeholders.interestLevel")}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                  defaultValue={stakeholder?.interest || "medium"}
                >
                  <option value="high">{t("stakeholders.high")}</option>
                  <option value="medium">{t("stakeholders.medium")}</option>
                  <option value="low">{t("stakeholders.low")}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                {t("stakeholders.notes")}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md focus:outline-none focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                rows="3"
                defaultValue={stakeholder?.notes}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1">
                {t("stakeholders.linkToProjects")}
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {projects.map((project) => (
                  <label key={project.id} className="flex items-center">
                    <input
                      type="checkbox"
                      className="mx-2"
                      defaultChecked={stakeholder?.projects?.includes(
                        project.name
                      )}
                    />
                    <span className="text-sm text-gray-700 dark:text-zinc-300">
                      {project.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-300 dark:border-zinc-700  flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
            >
              {t("stakeholders.cancel")}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition"
            >
              {stakeholder ? t("stakeholders.saveChanges") : t("stakeholders.addStakeholder")}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Stakeholder Detail View Component
  const StakeholderDetailView = () => {
    if (!showDetailView || !selectedStakeholder) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-xl  bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700  rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-300 dark:border-zinc-700 ">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-medium">
                  {selectedStakeholder.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedStakeholder.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    {selectedStakeholder.role} at{" "}
                    {selectedStakeholder.organization}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition">
                  <Edit2 className="size-4" />
                </button>
                <button
                  onClick={() => setShowDetailView(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-300 dark:border-zinc-700 ">
            <div className="flex gap-8 px-6">
              {["profile", "projects", "attachments", "timeline"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 border-b-2 transition capitalize ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-500"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-zinc-400"
                  }`}
                >
                  {t(`stakeholders.tabs.${tab}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2">
                      {t("stakeholders.contactInformation")}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="size-4 text-gray-400" />
                        <span className="text-sm">
                          {selectedStakeholder.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 text-gray-400" />
                        <span className="text-sm">
                          {selectedStakeholder.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-gray-400" />
                        <span className="text-sm">
                          {selectedStakeholder.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2">
                      {t("stakeholders.engagementLevels")}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-zinc-300">
                          {t("stakeholders.influence")}:
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-md capitalize ${getInfluenceColor(
                            selectedStakeholder.influence
                          )}`}
                        >
                          {selectedStakeholder.influence}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-zinc-300">
                          {t("stakeholders.interest")}:
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-md capitalize ${getInterestColor(
                            selectedStakeholder.interest
                          )}`}
                        >
                          {selectedStakeholder.interest}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2">
                    {t("stakeholders.notes")}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-zinc-300">
                    {selectedStakeholder.notes}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2">
                    {t("stakeholders.tags")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedStakeholder.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "projects" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2">
                  {t("stakeholders.linkedProjects")} ({selectedStakeholder.projects.length})
                </h3>
                {selectedStakeholder.projects.map((project, index) => (
                  <div
                    key={index}
                    className="p-4 border dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {project}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
                          {t("stakeholders.activeProject")}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-gray-400" />
                    </div>
                  </div>
                ))}
                <button className="w-full p-3 border-2 border-dashed dark:border-zinc-700 rounded-lg text-sm text-gray-500 dark:text-zinc-400 hover:border-gray-400 dark:hover:border-zinc-600 transition">
                  + {t("stakeholders.linkToAnotherProject")}
                </button>
              </div>
            )}

            {activeTab === "attachments" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400">
                    {t("stakeholders.attachments")} ({selectedStakeholder.attachments.length})
                  </h3>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition">
                    <Upload className="size-4" />
                    {t("stakeholders.uploadFile")}
                  </button>
                </div>

                {selectedStakeholder.attachments.length === 0 ? (
                  <div className="text-center py-12">
                    <Paperclip className="size-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                      {t("stakeholders.noAttachments")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedStakeholder.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 border dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="size-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">
                              {attachment.size} • Uploaded{" "}
                              {attachment.uploadDate}
                            </p>
                          </div>
                        </div>
                        <button className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition">
                          <Download className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-4">
                  {t("stakeholders.activityTimeline")}
                </h3>
                <div className="space-y-3">
                  {selectedStakeholder.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition"
                    >
                      <div className="p-2 rounded-full bg-gray-100 dark:bg-zinc-800">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-zinc-400">
                            {activity.date}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${
                              activity.status === "completed"
                                ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
                                : "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                            }`}
                          >
                            {t(`stakeholders.status.${activity.status}`)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">
            {t("stakeholders.title") || "Stakeholders"}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">
            {t("stakeholders.subtitle") ||
              "Manage and track project stakeholders"}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-5 py-2 rounded text-sm bg-gradient-to-br from-blue-500 to-blue-600 hover:opacity-90 text-white transition"
        >
          <UserPlus className="w-4 h-4 mx-2" />{" "}
          {t("stakeholders.addStakeholder") || "Add Stakeholder"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className=" dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between gap-8 md:gap-22">
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                {t("stakeholders.totalStakeholders") || "Total Stakeholders"}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stakeholders.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/10">
              <Users2Icon className="size-4 text-blue-500 dark:text-blue-200" />
            </div>
          </div>
        </div>

        <div className="  dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between gap-8 md:gap-22">
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                {t("stakeholders.highInfluence") || "High Influence"}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {highInfluenceCount}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/10">
              <Star className="size-4 text-red-500 dark:text-red-200" />
            </div>
          </div>
        </div>

        <div className=" dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between gap-8 md:gap-22">
            <div>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                {t("stakeholders.organizations") || "Organizations"}
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {uniqueOrganizations.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/10">
              <Building2 className="size-4 text-purple-500 dark:text-purple-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2  transform -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3" />
          <input
            placeholder={
              t("stakeholders.searchPlaceholder") || "Search stakeholders..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 w-full text-sm rounded-md border border-gray-300 dark:border-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-zinc-800 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
        >
          <Filter className="size-4" />
          <span className="text-sm">{t("stakeholders.filters")}</span>
          {Object.values(filters).flat().length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full">
              {Object.values(filters).flat().length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className="p-4 border border-gray-200 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {t("stakeholders.filters")}
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-500 hover:underline"
            >
              {t("stakeholders.clearAll")}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                {t("stakeholders.influence")}
              </p>
              <div className="space-y-2">
                {["high", "medium", "low"].map((level) => (
                  <label key={level} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.influence.includes(level)}
                      onChange={() => toggleFilter("influence", level)}
                      className="mx-2"
                    />
                    <span className="text-sm capitalize">{t(`stakeholders.${level}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                {t("stakeholders.interest")}
              </p>
              <div className="space-y-2">
                {["high", "medium", "low"].map((level) => (
                  <label key={level} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.interest.includes(level)}
                      onChange={() => toggleFilter("interest", level)}
                      className="mx-2"
                    />
                    <span className="text-sm capitalize">{t(`stakeholders.${level}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                {t("stakeholders.organization")}
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {uniqueOrganizations.map((org) => (
                  <label key={org} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.organization.includes(org)}
                      onChange={() => toggleFilter("organization", org)}
                      className="mx-2"
                    />
                    <span className="text-sm">{org}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stakeholders List */}
      <div className="w-full">
       
        {filteredStakeholders.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <Users2Icon className="w-12 h-12 text-gray-400 dark:text-zinc-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {stakeholders.length === 0
                ? t("stakeholders.noStakeholders") || "No stakeholders yet"
                : t("stakeholders.noStakeholdersMatch") ||
                  "No stakeholders match your filters"}
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 mb-6">
              {stakeholders.length === 0
                ? t("stakeholders.addFirstStakeholder") ||
                  "Add your first stakeholder to get started"
                : t("stakeholders.adjustSearch") ||
                  "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          <>
            {/* ======= DESKTOP TABLE ======= */}
            <div className="w-full overflow-hidden rounded-md border border-gray-200 dark:border-zinc-800 hidden md:block">
              <div className="overflow-x-auto">
                <table
                  className="w-full divide-y divide-gray-200 dark:divide-zinc-800"
                  style={{ minWidth: "900px" }}
                >
                  <thead className="bg-gray-50 dark:bg-zinc-900/50">
                    <tr>
                      <th className="px-3 py-2 md:px-6 md:py-2.5 text-left font-medium text-sm">
                        {t("stakeholders.name") || "Name"}
                      </th>
                      <th className="px-3 py-2 md:px-6 md:py-2.5 text-left font-medium text-sm">
                        {t("stakeholders.role") || "Role"}
                      </th>
                      <th className="px-3 py-2 md:px-6 md:py-2.5 text-left font-medium text-sm whitespace-nowrap">
                        {t("stakeholders.organization") || "Organization"}
                      </th>
                      <th className="px-3 py-2 md:px-6 md:py-2.5 text-left font-medium text-sm whitespace-nowrap">
                        {t("stakeholders.contact") || "Contact"}
                      </th>
                      <th className="px-3 py-2 md:px-6 md:py-2.5 text-left font-medium text-sm whitespace-nowrap">
                        {t("stakeholders.influence") || "Influence"}
                      </th>
                      <th className="px-3 py-2 md:px-6 md:py-2.5 text-left font-medium text-sm whitespace-nowrap">
                        {t("stakeholders.interest") || "Interest"}
                      </th>
                      <th className="px-3 py-2 md:px-6 md:py-2.5 text-left font-medium text-sm whitespace-nowrap">
                        {t("stakeholders.projects") || "Projects"}
                      </th>
                      <th className="px-3 py-2 md:px-6 md:py-2.5 text-center font-medium text-sm whitespace-nowrap">
                        {t("stakeholders.actions")}
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                    {filteredStakeholders.map((stakeholder) => (
                      <tr
                        key={stakeholder.id}
                        className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="px-3 py-2 md:px-6 md:py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                              {stakeholder.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <button
                              onClick={() => openStakeholderDetail(stakeholder)}
                              className="text-sm text-zinc-800 dark:text-white font-medium hover:text-blue-500 dark:hover:text-blue-400"
                            >
                              {stakeholder.name}
                            </button>
                          </div>
                        </td>

                        <td className="px-3 py-2 md:px-6 md:py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Briefcase className="size-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-zinc-300">
                              {stakeholder.role}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-2 md:px-6 md:py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Building2 className="size-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-zinc-300">
                              {stakeholder.organization}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-2 md:px-6 md:py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Mail className="size-3.5 text-gray-400" />
                            <a
                              href={`mailto:${stakeholder.email}`}
                              className="text-sm text-blue-500 hover:underline"
                            >
                              {stakeholder.email}
                            </a>
                          </div>
                        </td>

                        <td className="px-3 py-2 md:px-6 md:py-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-md capitalize ${getInfluenceColor(
                              stakeholder.influence
                            )}`}
                          >
                            {stakeholder.influence}
                          </span>
                        </td>

                        <td className="px-3 py-2 md:px-6 md:py-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-md capitalize ${getInterestColor(
                              stakeholder.interest
                            )}`}
                          >
                            {stakeholder.interest}
                          </span>
                        </td>

                        <td className="px-3 py-2 md:px-6 md:py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Link2 className="size-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-zinc-300">
                              {stakeholder.projects.length}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-2 md:px-6 md:py-2.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openStakeholderDetail(stakeholder)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                              title={t("stakeholders.viewDetails")}
                            >
                              <Eye className="size-4 text-gray-600 dark:text-zinc-400" />
                            </button>
                            <button
                              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                              title={t("stakeholders.edit")}
                            >
                              <Edit2 className="size-4 text-gray-600 dark:text-zinc-400" />
                            </button>
                            <button
                              className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition"
                              title={t("stakeholders.delete")}
                            >
                              <Trash2 className="size-4 text-red-500 dark:text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile scroll indicator */}
              <div className="md:hidden text-center py-2 text-xs text-gray-500 dark:text-zinc-400 border-t dark:border-zinc-800">
                <span className="flex items-center justify-center gap-1">
                  <ChevronRight className="size-3" />
                  {t("stakeholders.swipeToSeeMore")}
                </span>
              </div>
            </div>

            {/* ======= MOBILE CARDS ======= */}
            <div className="md:hidden space-y-3 mt-4">
              {filteredStakeholders.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="size-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      {s.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>

                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.role}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-1">
                    <strong>{t("stakeholders.org")}:</strong> {s.organization}
                  </p>
                  <p className="text-xs text-gray-500 mb-1">
                    <strong>{t("stakeholders.email")}:</strong> {s.email}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-md ${getInfluenceColor(
                        s.influence
                      )}`}
                    >
                      {s.influence}
                    </span>

                    <span
                      className={`px-2 py-1 text-xs rounded-md ${getInterestColor(
                        s.interest
                      )}`}
                    >
                      {s.interest}
                    </span>

                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Link2 className="size-3" /> {s.projects.length}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 mt-3">
                    <button onClick={() => openStakeholderDetail(s)}>
                      <Eye className="size-4 text-gray-600 dark:text-zinc-300" />
                    </button>
                    <button>
                      <Edit2 className="size-4 text-gray-600 dark:text-zinc-300" />
                    </button>
                    <button>
                      <Trash2 className="size-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <StakeholderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <StakeholderDetailView />
    </div>
  );
};

export default Stakeholders;
