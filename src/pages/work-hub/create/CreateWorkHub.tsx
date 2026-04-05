import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { workHubApi } from "../../../features/work-hub/work-hub.api";
import { getUser, isTokenValid } from "../../../utils/token";

// ==================== INTERFACES ====================

type WorkspaceType = "business" | "education" | "community" | "personal";
type TemplateType = "marketing" | "development" | "design" | "sales" | null;
type Permission = "view" | "edit" | "admin";

interface WorkspaceTypeOption {
  id: WorkspaceType;
  label: string;
  description: string;
  icon: string;
}

interface TemplateOption {
  id: TemplateType;
  label: string;
  description: string;
  icon: string;
  iconBg: string;
  features: string[];
}

interface ColorOption {
  value: string;
  label: string;
}

type MemberPermission = "default" | "view" | "edit" | "admin";

interface InvitedMember {
  id: string;
  email: string;
  role: string;
  initials: string;
  avatarColor: string;
  permission: MemberPermission;
}

interface Step1Data {
  name: string;
  description: string;
  type: WorkspaceType;
}

interface Step2Data {
  avatarFile: File | null;
  avatarPreviewUrl: string | null;
  color: string;
  template: TemplateType;
}

interface Step3Data {
  members: InvitedMember[];
  defaultPermission: Permission;
}

interface FormData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  agreedToTerms: boolean;
}

interface ProgressStep {
  number: number;
  label: string;
}

const TOTAL_STEPS = 4;

const PROGRESS_STEPS: ProgressStep[] = [
  { number: 1, label: "Workspace Info" },
  { number: 2, label: "Customize" },
  { number: 3, label: "Team Setup" },
  { number: 4, label: "Review" },
];

const WORKSPACE_TYPE_OPTIONS: WorkspaceTypeOption[] = [
  {
    id: "business",
    label: "Business",
    description:
      "For companies and professional teams working on multiple projects",
    icon: "fa-briefcase",
  },
  {
    id: "education",
    label: "Education",
    description: "For schools, universities, and educational organizations",
    icon: "fa-graduation-cap",
  },
  {
    id: "community",
    label: "Community",
    description: "For clubs, groups, and community organizations",
    icon: "fa-users",
  },
  {
    id: "personal",
    label: "Personal",
    description: "For individual use and personal projects",
    icon: "fa-user",
  },
];

const BLANK_TEMPLATE: TemplateOption = {
  id: null,
  label: "Blank Workspace",
  description:
    "Start from scratch with an empty workspace. No pre-configured channels or settings.",
  icon: "fa-plus",
  iconBg: "bg-gray-100 text-gray-500",
  features: [
    "Fully customizable",
    "No pre-set structure",
    "Build your own workflow",
  ],
};

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: "marketing",
    label: "Marketing Team",
    description:
      "Perfect for marketing teams with channels for campaigns, content, and analytics",
    icon: "fa-bullhorn",
    iconBg: "bg-pink-50 text-pink-500",
    features: [
      "Campaign Management",
      "Content Calendar",
      "Analytics Dashboard",
    ],
  },
  {
    id: "development",
    label: "Software Development",
    description:
      "Built for dev teams with channels for sprints, code reviews, and deployments",
    icon: "fa-code",
    iconBg: "bg-indigo-50 text-indigo-500",
    features: ["Sprint Planning", "Code Review Board", "Bug Tracking"],
  },
  {
    id: "design",
    label: "Design Team",
    description:
      "Ideal for creative teams with channels for design reviews and feedback",
    icon: "fa-palette",
    iconBg: "bg-amber-50 text-amber-500",
    features: ["Design Reviews", "Asset Library", "Client Feedback"],
  },
  {
    id: "sales",
    label: "Sales Team",
    description:
      "Optimized for sales teams tracking leads, deals, and customer relationships",
    icon: "fa-chart-line",
    iconBg: "bg-emerald-50 text-emerald-500",
    features: ["Lead Management", "Deal Pipeline", "Sales Reports"],
  },
];

const COLOR_OPTIONS: ColorOption[] = [
  { value: "#0d9488", label: "Teal" },
  { value: "#1a4f4f", label: "Dark Teal" },
  { value: "#10b981", label: "Emerald" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
];

const MEMBER_AVATAR_COLORS = [
  "#0d9488",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
];

const MEMBER_PERMISSION_LABELS: Record<MemberPermission, string> = {
  default: "Default (follow workspace)",
  view: "Can view and comment",
  edit: "Can create and edit",
  admin: "Full access (Admin)",
};

const INITIAL_MEMBERS: InvitedMember[] = [];

const INITIAL_FORM_DATA: FormData = {
  step1: {
    name: "",
    description: "",
    type: "business",
  },
  step2: {
    avatarFile: null,
    avatarPreviewUrl: null,
    color: "#0d9488",
    template: null,
  },
  step3: {
    members: INITIAL_MEMBERS,
    defaultPermission: "edit",
  },
  agreedToTerms: false,
};

// ==================== HELPERS ====================

function getInitials(email: string): string {
  const parts = email.split("@")[0].split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return email.substring(0, 2).toUpperCase();
}

function getRandomAvatarColor(): string {
  return MEMBER_AVATAR_COLORS[
    Math.floor(Math.random() * MEMBER_AVATAR_COLORS.length)
  ];
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TEST_OWNER_FULL_NAME = "PHan phước HIệp";

function getStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseJson(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === "object")
      return parsed as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

function getIdFromObject(data: Record<string, unknown> | null): string | null {
  if (!data) return null;

  const direct = data.userId ?? data.id ?? data.sub;
  if (typeof direct === "string" && direct) return direct;

  const user = data.user;
  if (user && typeof user === "object") {
    const nested = user as Record<string, unknown>;
    const nestedId = nested.userId ?? nested.id ?? nested.sub;
    if (typeof nestedId === "string" && nestedId) return nestedId;
  }

  return null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    return parseJson(decoded);
  } catch {
    return null;
  }
}

function getCurrentUserId(): string | null {
  const objectKeys = ["auth", "user", "currentUser", "profile", "authUser"];
  for (const key of objectKeys) {
    const id = getIdFromObject(parseJson(getStorageItem(key)));
    if (id) return id;
  }

  const tokenKeys = [
    "accessToken",
    "token",
    "authToken",
    "jwt",
    "access_token",
  ];
  for (const key of tokenKeys) {
    const token = getStorageItem(key);
    if (!token) continue;
    const id = getIdFromObject(decodeJwtPayload(token));
    if (id) return id;
  }

  const auth = parseJson(getStorageItem("auth"));
  const tokenInAuth = auth?.accessToken ?? auth?.token;
  if (typeof tokenInAuth === "string") {
    const id = getIdFromObject(decodeJwtPayload(tokenInAuth));
    if (id) return id;
  }

  return null;
}

async function getFallbackOwnerIdFromBackend(): Promise<string | null> {
  try {
    const res = await fetch("https://aracelis-provable-grammatically.ngrok-free.dev/users");
    if (!res.ok) return null;

    const users: unknown = await res.json();
    if (!Array.isArray(users)) return null;

    for (const user of users) {
      if (!user || typeof user !== "object") continue;
      const id = (user as Record<string, unknown>).userId;
      if (typeof id === "string" && UUID_REGEX.test(id)) {
        return id;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function getTestOwnerIdByName(fullName: string): Promise<string | null> {
  try {
    const res = await fetch("https://aracelis-provable-grammatically.ngrok-free.dev/users");
    if (!res.ok) return null;

    const users: unknown = await res.json();
    if (!Array.isArray(users)) return null;

    const target = normalizeName(fullName);
    for (const user of users) {
      if (!user || typeof user !== "object") continue;

      const mapped = user as Record<string, unknown>;
      const id = mapped.userId;
      const name = mapped.fullName;

      if (
        typeof id === "string" &&
        UUID_REGEX.test(id) &&
        typeof name === "string" &&
        normalizeName(name) === target
      ) {
        return id;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ==================== COMPONENT ====================

const CreateWorkHub = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check auth on mount
  useEffect(() => {
    if (!isTokenValid()) {
      navigate("/auth/login");
    }
  }, [navigate]);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  const updateStep1 = (patch: Partial<Step1Data>) =>
    setFormData((prev) => ({ ...prev, step1: { ...prev.step1, ...patch } }));

  const updateStep2 = (patch: Partial<Step2Data>) =>
    setFormData((prev) => ({ ...prev, step2: { ...prev.step2, ...patch } }));

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateStep2({ avatarFile: file, avatarPreviewUrl: url });
  };

  const handleRemoveAvatar = () => {
    updateStep2({ avatarFile: null, avatarPreviewUrl: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateStep3 = (patch: Partial<Step3Data>) =>
    setFormData((prev) => ({ ...prev, step3: { ...prev.step3, ...patch } }));

  const addMember = () => {
    const email = inviteEmail.trim();
    if (!email) return;
    const already = formData.step3.members.some((m) => m.email === email);
    if (already) return;
    const newMember: InvitedMember = {
      id: Date.now().toString(),
      email,
      role: "Member",
      initials: getInitials(email),
      avatarColor: getRandomAvatarColor(),
      permission: "default",
    };
    updateStep3({ members: [...formData.step3.members, newMember] });
    setInviteEmail("");
  };

  const removeMember = (id: string) =>
    updateStep3({ members: formData.step3.members.filter((m) => m.id !== id) });

  const updateMemberPermission = (id: string, permission: MemberPermission) =>
    updateStep3({
      members: formData.step3.members.map((m) =>
        m.id === id ? { ...m, permission } : m,
      ),
    });

  const handleCreate = async () => {
    if (!formData.agreedToTerms) return;

    const user = getUser();
    if (!user || !user.id) {
      navigate("/auth/login");
      return;
    }

    setIsCreating(true);
    try {
      const response = await workHubApi.createWorkspace({
        workspaceName: formData.step1.name,
        description: formData.step1.description,
        type: formData.step1.type.toUpperCase(),
        color: formData.step2.color,
        ownerId: user.id,
      });
      navigate(`/work-hub/${response.workspaceId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setIsCreating(false);
    }
  };

  const selectedTypeName =
    WORKSPACE_TYPE_OPTIONS.find((t) => t.id === formData.step1.type)?.label ??
    "-";
  const selectedTemplateName =
    TEMPLATE_OPTIONS.find((t) => t.id === formData.step2.template)?.label ??
    "None";
  const permissionLabel: Record<Permission, string> = {
    view: "Can view and comment",
    edit: "Can create and edit",
    admin: "Full access (Admin)",
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full overflow-y-auto bg-wh-green-bg-light font-sans"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 relative bg-white border-b border-wh-green-border-light shadow-sm">
        <div className="flex items-center justify-between px-10 py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-wh-green-primary rounded-xl flex items-center justify-center font-bold text-lg text-white">
              O
            </div>
            <span className="text-xl font-bold text-gray-800">Orion</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-5 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
              <i className="fas fa-question-circle"></i> Help
            </button>

            <button
              onClick={() => navigate("/work-hub")}
              className="flex items-center gap-2 px-5 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-200">
          <div
            className="h-full bg-wh-green-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-10 py-4">
        {/* Progress Bar */}
        <div className="mb-4 hidden">
          <div className="flex items-center justify-between mb-3">
            {PROGRESS_STEPS.map((step) => {
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;

              return (
                <div
                  key={step.number}
                  className="flex items-center gap-2 flex-1"
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 text-sm font-semibold rounded-full transition-all
              ${
                isCompleted
                  ? "bg-wh-green-primary text-white"
                  : isActive
                    ? "bg-wh-green-primary text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
                  >
                    {isCompleted ? (
                      <i className="fas fa-check text-xs"></i>
                    ) : (
                      step.number
                    )}
                  </div>

                  <span
                    className={`text-xs font-medium whitespace-nowrap
              ${isActive ? "text-wh-green-primary" : "text-gray-400"}`}
                  >
                    {step.label}
                  </span>

                  {step.number !== TOTAL_STEPS && (
                    <div className="flex-1 h-[2px] bg-gray-200 mx-2"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1 – Workspace Info */}
        {currentStep === 1 && (
          <div className="bg-white border border-wh-green-border-light rounded-2xl p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Create Your WorkHub
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-9">
              Let's start by setting up the basic information for your
              workspace. This helps your team members identify and find your
              workspace easily.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Workspace Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.step1.name}
                maxLength={50}
                onChange={(e) => updateStep1({ name: e.target.value })}
                placeholder="e.g., Marketing Team, Development Squad"
                className="w-full px-4 py-3 bg-wh-green-bg-light border border-wh-green-border-light rounded-xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-wh-green-primary focus:ring-1 focus:ring-wh-green-primary transition-all"
              />
              <div className="flex justify-between items-center mt-1.5">
                <p className="text-xs text-gray-400">
                  Choose a name that clearly represents your team or project
                </p>
                <span
                  className={`text-xs font-medium ${
                    formData.step1.name.length >= 45
                      ? "text-red-400"
                      : formData.step1.name.length >= 35
                        ? "text-amber-500"
                        : "text-gray-400"
                  }`}
                >
                  {formData.step1.name.length}/50
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Workspace Description
              </label>
              <textarea
                value={formData.step1.description}
                onChange={(e) => updateStep1({ description: e.target.value })}
                rows={4}
                placeholder="Describe what your workspace is about..."
                className="w-full px-4 py-3 bg-wh-green-bg-light border border-wh-green-border-light rounded-xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-wh-green-primary focus:ring-1 focus:ring-wh-green-primary transition-all resize-y"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Help others understand the purpose of this workspace
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Workspace Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {WORKSPACE_TYPE_OPTIONS.map((opt) => {
                  const selected = formData.step1.type === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => updateStep1({ type: opt.id })}
                      className={`relative cursor-pointer rounded-xl p-5 border-2 transition-all duration-200 hover:-translate-y-0.5 ${
                        selected
                          ? "border-wh-green-primary bg-wh-green-bg-light"
                          : "border-gray-200 bg-white hover:border-wh-green-border-medium"
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-wh-green-primary flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                      )}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${
                          selected
                            ? "bg-wh-green-primary text-white"
                            : "bg-wh-green-bg-heavy text-wh-green-primary"
                        }`}
                      >
                        <i className={`fas ${opt.icon} text-lg`}></i>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-1.5">
                        {opt.label}
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-wh-green-border-light">
              <button
                disabled
                className="flex items-center gap-2 px-6 py-3 text-sm border border-gray-200 rounded-xl opacity-40 cursor-not-allowed text-gray-400"
              >
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button
                onClick={() => goToStep(2)}
                className="flex items-center gap-2 px-8 py-3 text-sm font-medium bg-wh-green-primary hover:bg-wh-green-primary-hover text-white rounded-xl transition-all hover:-translate-y-0.5"
              >
                Continue <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 – Customize */}
        {currentStep === 2 && (
          <div className="bg-white border border-wh-green-border-light rounded-2xl p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Customize Your Workspace
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-9">
              Make your workspace unique with a custom avatar and color theme.
              This helps your team recognize it instantly.
            </p>

            {/* Avatar Upload */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Workspace Avatar
              </label>
              <div className="flex gap-6 items-center">
                <div className="w-28 h-28 flex-shrink-0 rounded-2xl bg-wh-green-bg-light border-2 border-dashed border-wh-green-border-medium flex flex-col items-center justify-center text-gray-400 overflow-hidden">
                  {formData.step2.avatarPreviewUrl ? (
                    <img
                      src={formData.step2.avatarPreviewUrl}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <i className="fas fa-image text-2xl text-wh-green-text-muted"></i>
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Upload workspace icon
                  </h4>
                  <p className="text-xs text-gray-400 mb-4">
                    Recommended size: 512x512px. Max file size: 2MB. Formats:
                    JPG, PNG, SVG
                  </p>
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/svg+xml"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-wh-green-primary hover:bg-wh-green-primary-hover text-white rounded-lg transition-all"
                    >
                      <i className="fas fa-upload"></i> Upload Image
                    </button>
                    <button
                      onClick={handleRemoveAvatar}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition-all"
                    >
                      <i className="fas fa-trash"></i> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Theme */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Workspace Color Theme
              </label>
              <div className="grid grid-cols-8 gap-3 mb-2">
                {COLOR_OPTIONS.map((color) => {
                  const selected = formData.step2.color === color.value;
                  return (
                    <button
                      key={color.value}
                      title={color.label}
                      onClick={() => updateStep2({ color: color.value })}
                      className={`aspect-square rounded-xl border-[3px] relative transition-all hover:scale-102 ${
                        selected
                          ? "border-wh-green-primary shadow-md"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                    >
                      {selected && (
                        <i className="fas fa-check absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-sm"></i>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400">
                This color will be used for your workspace identity and branding
              </p>
            </div>

            {/* Templates */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Choose a Template{" "}
                <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <p className="text-xs text-gray-400 mb-4">
                Start with a pre-configured workspace template to save time
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[BLANK_TEMPLATE, ...TEMPLATE_OPTIONS].map((tmpl) => {
                  const selected = formData.step2.template === tmpl.id;
                  return (
                    <div
                      key={tmpl.id ?? "blank"}
                      onClick={() =>
                        updateStep2({ template: selected ? null : tmpl.id })
                      }
                      className={`relative cursor-pointer rounded-xl p-5 border-2 transition-all duration-200 hover:-translate-y-0.5 ${
                        selected
                          ? "border-wh-green-primary bg-wh-green-bg-light"
                          : "border-gray-200 bg-white hover:border-wh-green-border-medium"
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-wh-green-primary flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                      )}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tmpl.iconBg}`}
                      >
                        <i className={`fas ${tmpl.icon} text-lg`}></i>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">
                        {tmpl.label}
                      </h4>
                      <p className="text-xs text-gray-400 leading-relaxed mb-4">
                        {tmpl.description}
                      </p>
                      <ul className="flex flex-col gap-2">
                        {tmpl.features.map((feat) => (
                          <li
                            key={feat}
                            className="flex items-center gap-2 text-xs text-gray-500"
                          >
                            <i className="fas fa-check text-wh-green-primary text-[10px]"></i>{" "}
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-wh-green-border-light">
              <button
                onClick={() => goToStep(1)}
                className="flex items-center gap-2 px-6 py-3 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button
                onClick={() => goToStep(3)}
                className="flex items-center gap-2 px-8 py-3 text-sm font-medium bg-wh-green-primary hover:bg-wh-green-primary-hover text-white rounded-xl transition-all hover:-translate-y-0.5"
              >
                Continue <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 – Settup */}
        {currentStep === 3 && (
          <div className="bg-white border border-wh-green-border-light rounded-2xl p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Invite Your Team
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-9">
              Add team members to your workspace. You can always invite more
              people later from workspace settings.
            </p>

            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Invite by Email
              </label>
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMember()}
                  placeholder="Enter email address"
                  className="flex-1 px-4 py-3 bg-wh-green-bg-light border border-wh-green-border-light rounded-xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-wh-green-primary focus:ring-1 focus:ring-wh-green-primary transition-all"
                />
                <button
                  onClick={addMember}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-wh-green-primary hover:bg-wh-green-primary-hover text-white rounded-xl transition-all whitespace-nowrap"
                >
                  <i className="fas fa-plus"></i> Add
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {formData.step3.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-4 py-3 bg-wh-green-bg-light border border-wh-green-border-light rounded-xl gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {member.email}
                        </span>
                        <span className="text-xs text-gray-400">
                          {member.role}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={member.permission}
                        onChange={(e) =>
                          updateMemberPermission(
                            member.id,
                            e.target.value as MemberPermission,
                          )
                        }
                        className="px-3 py-1.5 bg-white border border-wh-green-border-light rounded-lg text-gray-700 text-xs focus:outline-none focus:border-wh-green-primary transition-all cursor-pointer"
                      >
                        {(
                          Object.entries(MEMBER_PERMISSION_LABELS) as [
                            MemberPermission,
                            string,
                          ][]
                        ).map(([val, lbl]) => (
                          <option key={val} value={val}>
                            {lbl}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeMember(member.id)}
                        className="p-1.5 text-gray-400 rounded-md hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Default Member Permissions
              </label>
              <select
                value={formData.step3.defaultPermission}
                onChange={(e) =>
                  updateStep3({
                    defaultPermission: e.target.value as Permission,
                  })
                }
                className="w-full px-4 py-3 bg-wh-green-bg-light border border-wh-green-border-light rounded-xl text-gray-800 text-sm focus:outline-none focus:border-wh-green-primary focus:ring-1 focus:ring-wh-green-primary transition-all"
              >
                <option value="view">Can view and comment</option>
                <option value="edit">Can create and edit</option>
                <option value="admin">Full access (Admin)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1.5">
                You can customize individual permissions later
              </p>
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-wh-green-border-light">
              <button
                onClick={() => goToStep(2)}
                className="flex items-center gap-2 px-6 py-3 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button
                onClick={() => goToStep(4)}
                className="flex items-center gap-2 px-8 py-3 text-sm font-medium bg-wh-green-primary hover:bg-wh-green-primary-hover text-white rounded-xl transition-all hover:-translate-y-0.5"
              >
                Continue <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 – Xem lại và Táo */}
        {currentStep === 4 && (
          <div className="bg-white border border-wh-green-border-light rounded-2xl p-10 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Review &amp; Create Workspace
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-9">
              Please review your workspace details before creating. You can
              modify these settings later from workspace settings.
            </p>

            {/* Summary Card */}
            <div className="bg-wh-green-bg-light border border-wh-green-border-light rounded-xl p-6 mb-6">
              <div className="flex items-center gap-5 mb-6 pb-5 border-b border-wh-green-border-light">
                <div
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 overflow-hidden"
                  style={{ backgroundColor: formData.step2.color }}
                >
                  {formData.step2.avatarPreviewUrl ? (
                    <img
                      src={formData.step2.avatarPreviewUrl}
                      alt="Workspace avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    formData.step1.name.substring(0, 2).toUpperCase() || "WH"
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1.5">
                    {formData.step1.name || "Unnamed Workspace"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formData.step1.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Workspace Type
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedTypeName}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Template
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedTemplateName}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Team Members
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {formData.step3.members.length} member
                    {formData.step3.members.length !== 1 ? "s" : ""} invited
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                    Member Permissions
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {permissionLabel[formData.step3.defaultPermission]}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      agreedToTerms: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 cursor-pointer accent-[#0d9488]"
                />
                <span className="text-sm font-semibold text-gray-700">
                  I agree to the Terms of Service and Privacy Policy
                </span>
              </label>
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-wh-green-border-light">
              <button
                onClick={() => goToStep(3)}
                className="flex items-center gap-2 px-6 py-3 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.agreedToTerms || isCreating}
                className={`flex items-center gap-2 px-8 py-3 text-sm font-medium bg-wh-green-primary text-white rounded-xl transition-all ${
                  !formData.agreedToTerms || isCreating
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-wh-green-primary-hover hover:-translate-y-0.5"
                }`}
              >
                {isCreating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-rocket"></i> Create Workspace
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CreateWorkHub;

