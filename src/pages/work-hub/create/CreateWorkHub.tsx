import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Users,
  User,
  Image,
  Upload,
  Trash2,
  Megaphone,
  Code,
  Palette,
  TrendingUp,
  Plus,
  Rocket,
  Loader2,
} from "lucide-react";

// ==================== INTERFACES ====================

type WorkspaceType = "business" | "education" | "community" | "personal";
type TemplateType = "marketing" | "development" | "design" | "sales" | null;
type Permission = "view" | "edit" | "admin";

interface WorkspaceTypeOption {
  id: WorkspaceType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface TemplateOption {
  id: TemplateType;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
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

// ==================== Data mẫu ====================

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
    icon: <Briefcase size={22} />,
  },
  {
    id: "education",
    label: "Education",
    description: "For schools, universities, and educational organizations",
    icon: <GraduationCap size={22} />,
  },
  {
    id: "community",
    label: "Community",
    description: "For clubs, groups, and community organizations",
    icon: <Users size={22} />,
  },
  {
    id: "personal",
    label: "Personal",
    description: "For individual use and personal projects",
    icon: <User size={22} />,
  },
];

const BLANK_TEMPLATE: TemplateOption = {
  id: null,
  label: "Blank Workspace",
  description:
    "Start from scratch with an empty workspace. No pre-configured channels or settings.",
  icon: <Plus size={24} />,
  iconClass: "bg-slate-600 text-slate-300",
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
    icon: <Megaphone size={24} />,
    iconClass: "bg-pink-500/15 text-pink-500",
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
    icon: <Code size={24} />,
    iconClass: "bg-indigo-500/15 text-indigo-400",
    features: ["Sprint Planning", "Code Review Board", "Bug Tracking"],
  },
  {
    id: "design",
    label: "Design Team",
    description:
      "Ideal for creative teams with channels for design reviews and feedback",
    icon: <Palette size={24} />,
    iconClass: "bg-amber-500/15 text-amber-400",
    features: ["Design Reviews", "Asset Library", "Client Feedback"],
  },
  {
    id: "sales",
    label: "Sales Team",
    description:
      "Optimized for sales teams tracking leads, deals, and customer relationships",
    icon: <TrendingUp size={24} />,
    iconClass: "bg-emerald-500/15 text-emerald-400",
    features: ["Lead Management", "Deal Pipeline", "Sales Reports"],
  },
];

const COLOR_OPTIONS: ColorOption[] = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Pink" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#10b981", label: "Emerald" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#ef4444", label: "Red" },
  { value: "#06b6d4", label: "Cyan" },
];

const MEMBER_AVATAR_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
];

const MEMBER_PERMISSION_LABELS: Record<MemberPermission, string> = {
  default: "Default (follow workspace)",
  view: "Can view and comment",
  edit: "Can create and edit",
  admin: "Full access (Admin)",
};

const INITIAL_MEMBERS: InvitedMember[] = [
  {
    id: "1",
    email: "hiep@company.com",
    role: "Admin",
    initials: "JD",
    avatarColor: "#6366f1",
    permission: "default",
  },
  {
    id: "2",
    email: "hiep.phan@company.com",
    role: "Member",
    initials: "SJ",
    avatarColor: "#ec4899",
    permission: "default",
  },
  {
    id: "3",
    email: "vannh@company.com",
    role: "Member",
    initials: "MC",
    avatarColor: "#f59e0b",
    permission: "default",
  },
];

const INITIAL_FORM_DATA: FormData = {
  step1: {
    name: "Orion Project",
    description:
      "A collaborative workspace for managing projects and team communication.",
    type: "business",
  },
  step2: {
    avatarFile: null,
    avatarPreviewUrl: null,
    color: "#6366f1",
    template: "development",
  },
  step3: {
    members: INITIAL_MEMBERS,
    defaultPermission: "edit",
  },
  agreedToTerms: true,
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

// ==================== COMPONENT ====================

const CreateWorkHub = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Navigation ──────────────────────────────────────────────
  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const progressPercent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  // ── Step 1 handlers ─────────────────────────────────────────
  const updateStep1 = (patch: Partial<Step1Data>) =>
    setFormData((prev) => ({ ...prev, step1: { ...prev.step1, ...patch } }));

  // ── Step 2 handlers ─────────────────────────────────────────
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

  // ── Step 3 handlers ─────────────────────────────────────────
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

  // ── Xử lý submit tạo workhub ───────────────────────────────────────────────────
  const handleCreate = () => {
    if (!formData.agreedToTerms) return;
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      navigate("/work-hub");
    }, 2000);
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

  // ==================== GUI ====================
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/*── Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-10 py-5 bg-slate-800 border-b border-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-bold text-lg text-white">
            O
          </div>
          <span className="text-xl font-bold">Orion</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2 text-sm bg-transparent border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-indigo-500 transition-all">
            <HelpCircle size={15} /> Help
          </button>
          <button
            onClick={() => navigate("/work-hub")}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-transparent border border-slate-600 rounded-lg hover:bg-slate-700 hover:border-indigo-500 transition-all"
          >
            <X size={15} /> Cancel
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-10 py-16">
        <div className="mb-14">
          <div className="relative flex justify-between mb-8">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-600" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-indigo-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
            {PROGRESS_STEPS.map((step) => {
              const isCompleted = step.number < currentStep;
              const isActive = step.number === currentStep;
              return (
                <div
                  key={step.number}
                  className="relative z-10 flex flex-col items-center flex-1"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-3 border-2 transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isActive
                          ? "bg-indigo-500 border-indigo-500 text-white"
                          : "bg-slate-700 border-slate-600 text-slate-400"
                    }`}
                  >
                    {isCompleted ? <Check size={18} /> : step.number}
                  </div>
                  <span
                    className={`text-xs font-medium text-center ${
                      isActive ? "text-slate-100" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════════════
            STEP 1 – Workspace Info
            ════════════════════════════════ */}
        {currentStep === 1 && (
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-10">
            <h2 className="text-3xl font-bold mb-2">Create Your WorkHub</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-9">
              Let's start by setting up the basic information for your
              workspace. This helps your team members identify and find your
              workspace easily.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Workspace Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.step1.name}
                maxLength={50}
                onChange={(e) => updateStep1({ name: e.target.value })}
                placeholder="e.g., Marketing Team, Development Squad"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-700 transition-all"
              />
              <div className="flex justify-between items-center mt-1.5">
                <p className="text-xs text-slate-400">
                  Choose a name that clearly represents your team or project
                </p>
                <span
                  className={`text-xs font-medium ${
                    formData.step1.name.length >= 45
                      ? "text-red-400"
                      : formData.step1.name.length >= 35
                        ? "text-amber-400"
                        : "text-slate-500"
                  }`}
                >
                  {formData.step1.name.length}/50
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Workspace Description
              </label>
              <textarea
                value={formData.step1.description}
                onChange={(e) => updateStep1({ description: e.target.value })}
                rows={4}
                placeholder="Describe what your workspace is about..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-700 transition-all resize-y"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Help others understand the purpose of this workspace
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
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
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-slate-600 bg-slate-900 hover:border-indigo-500"
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                          <Check size={13} className="text-white" />
                        </div>
                      )}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all ${
                          selected
                            ? "bg-indigo-500 text-white"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {opt.icon}
                      </div>
                      <h4 className="text-sm font-semibold mb-1.5">
                        {opt.label}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-slate-600">
              <button
                disabled
                className="flex items-center gap-2 px-6 py-3 text-sm border border-slate-600 rounded-xl opacity-40 cursor-not-allowed"
              >
                <ArrowLeft size={15} /> Back
              </button>
              <button
                onClick={() => goToStep(2)}
                className="flex items-center gap-2 px-8 py-3 text-sm font-medium bg-indigo-500 hover:bg-violet-500 text-white rounded-xl transition-all hover:-translate-y-0.5"
              >
                Continue <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 2 – Customize
            ════════════════════════════════ */}
        {currentStep === 2 && (
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-10">
            <h2 className="text-3xl font-bold mb-2">
              Customize Your Workspace
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-9">
              Make your workspace unique with a custom avatar and color theme.
              This helps your team recognize it instantly.
            </p>

            {/* Avatar Upload */}
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-3">
                Workspace Avatar
              </label>
              <div className="flex gap-6 items-center">
                <div className="w-28 h-28 flex-shrink-0 rounded-2xl bg-slate-900 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-400 overflow-hidden">
                  {formData.step2.avatarPreviewUrl ? (
                    <img
                      src={formData.step2.avatarPreviewUrl}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Image size={30} />
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Upload workspace icon
                  </h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Recommended size: 512×512px. Max file size: 2MB. Formats:
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
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-indigo-500 hover:bg-violet-500 text-white rounded-lg transition-all"
                    >
                      <Upload size={13} /> Upload Image
                    </button>
                    <button
                      onClick={handleRemoveAvatar}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium border border-red-400 text-red-400 rounded-lg hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Theme */}
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-3">
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
                      className={`aspect-square rounded-xl border-[3px] relative transition-all hover:scale-110 ${
                        selected
                          ? "border-white shadow-[0_0_0_2px_#1e293b]"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                    >
                      {selected && (
                        <Check
                          size={18}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400">
                This color will be used for your workspace identity and branding
              </p>
            </div>

            {/* Templates */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-1">
                Choose a Template{" "}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <p className="text-xs text-slate-400 mb-4">
                Start with a pre-configured workspace template to save time
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[BLANK_TEMPLATE, ...TEMPLATE_OPTIONS].map((tmpl) => {
                  const selected = formData.step2.template === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() =>
                        updateStep2({ template: selected ? null : tmpl.id })
                      }
                      className={`relative cursor-pointer rounded-xl p-5 border-2 transition-all duration-200 hover:-translate-y-0.5 ${
                        selected
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-slate-600 bg-slate-900 hover:border-indigo-500"
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                          <Check size={13} className="text-white" />
                        </div>
                      )}
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tmpl.iconClass}`}
                      >
                        {tmpl.icon}
                      </div>
                      <h4 className="text-sm font-semibold mb-2">
                        {tmpl.label}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        {tmpl.description}
                      </p>
                      <ul className="flex flex-col gap-2">
                        {tmpl.features.map((feat) => (
                          <li
                            key={feat}
                            className="flex items-center gap-2 text-xs text-slate-400"
                          >
                            <Check
                              size={12}
                              className="text-indigo-400 flex-shrink-0"
                            />{" "}
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-600">
              <button
                onClick={() => goToStep(1)}
                className="flex items-center gap-2 px-6 py-3 text-sm border border-slate-600 rounded-xl hover:bg-slate-700 transition-all"
              >
                <ArrowLeft size={15} /> Back
              </button>
              <button
                onClick={() => goToStep(3)}
                className="flex items-center gap-2 px-8 py-3 text-sm font-medium bg-indigo-500 hover:bg-violet-500 text-white rounded-xl transition-all hover:-translate-y-0.5"
              >
                Continue <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 3 – Team Setup
            ════════════════════════════════ */}
        {currentStep === 3 && (
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-10">
            <h2 className="text-3xl font-bold mb-2">Invite Your Team</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-9">
              Add team members to your workspace. You can always invite more
              people later from workspace settings.
            </p>

            {/* Invite Input */}
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-3">
                Invite by Email
              </label>
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMember()}
                  placeholder="Enter email address"
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:bg-slate-700 transition-all"
                />
                <button
                  onClick={addMember}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium bg-indigo-500 hover:bg-violet-500 text-white rounded-xl transition-all whitespace-nowrap"
                >
                  <Plus size={15} /> Add
                </button>
              </div>

              {/* Member List */}
              <div className="flex flex-col gap-2.5">
                {formData.step3.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {member.email}
                        </span>
                        <span className="text-xs text-slate-400">
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
                        className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
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
                        className="p-1.5 text-slate-400 rounded-md hover:bg-red-400/10 hover:text-red-400 transition-all"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Default Permissions */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">
                Default Member Permissions
              </label>
              <select
                value={formData.step3.defaultPermission}
                onChange={(e) =>
                  updateStep3({
                    defaultPermission: e.target.value as Permission,
                  })
                }
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-700 transition-all"
              >
                <option value="view">Can view and comment</option>
                <option value="edit">Can create and edit</option>
                <option value="admin">Full access (Admin)</option>
              </select>
              <p className="text-xs text-slate-400 mt-1.5">
                You can customize individual permissions later
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-600">
              <button
                onClick={() => goToStep(2)}
                className="flex items-center gap-2 px-6 py-3 text-sm border border-slate-600 rounded-xl hover:bg-slate-700 transition-all"
              >
                <ArrowLeft size={15} /> Back
              </button>
              <button
                onClick={() => goToStep(4)}
                className="flex items-center gap-2 px-8 py-3 text-sm font-medium bg-indigo-500 hover:bg-violet-500 text-white rounded-xl transition-all hover:-translate-y-0.5"
              >
                Continue <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 4 – Review & Create
            ════════════════════════════════ */}
        {currentStep === 4 && (
          <div className="bg-slate-800 border border-slate-600 rounded-2xl p-10">
            <h2 className="text-3xl font-bold mb-2">
              Review &amp; Create Workspace
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-9">
              Please review your workspace details before creating. You can
              modify these settings later from workspace settings.
            </p>

            {/* Summary Card */}
            <div className="bg-slate-900 border border-slate-600 rounded-xl p-6 mb-6">
              {/* Header */}
              <div className="flex items-center gap-5 mb-6 pb-5 border-b border-slate-600">
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
                  <h3 className="text-2xl font-bold mb-1.5">
                    {formData.step1.name || "Unnamed Workspace"}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {formData.step1.description}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Workspace Type
                  </span>
                  <span className="text-sm font-medium">
                    {selectedTypeName}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Template
                  </span>
                  <span className="text-sm font-medium">
                    {selectedTemplateName}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Team Members
                  </span>
                  <span className="text-sm font-medium">
                    {formData.step3.members.length} member
                    {formData.step3.members.length !== 1 ? "s" : ""} invited
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Member Permissions
                  </span>
                  <span className="text-sm font-medium">
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
                  className="w-4 h-4 cursor-pointer accent-indigo-500"
                />
                <span className="text-sm font-semibold">
                  I agree to the Terms of Service and Privacy Policy
                </span>
              </label>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-600">
              <button
                onClick={() => goToStep(3)}
                className="flex items-center gap-2 px-6 py-3 text-sm border border-slate-600 rounded-xl hover:bg-slate-700 transition-all"
              >
                <ArrowLeft size={15} /> Back
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.agreedToTerms || isCreating}
                className={`flex items-center gap-2 px-8 py-3 text-sm font-medium bg-indigo-500 text-white rounded-xl transition-all ${
                  !formData.agreedToTerms || isCreating
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-violet-500 hover:-translate-y-0.5"
                }`}
              >
                {isCreating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Rocket size={15} /> Create Workspace
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
