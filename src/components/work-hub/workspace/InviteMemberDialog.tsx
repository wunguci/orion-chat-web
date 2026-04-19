import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Modal from "../../common/Modal";

type InviteType = "phone" | "name";

interface InviteLinkData {
  inviteUrl: string;
  qrData: string;
  expiresAt: string;
}

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: { type: InviteType; value: string }) => Promise<void>;
  onGenerateLink: () => Promise<void>;
  inviteLinkData: InviteLinkData | null;
}

const InviteMemberDialog = ({
  isOpen,
  onClose,
  onInvite,
  onGenerateLink,
  inviteLinkData,
}: InviteMemberDialogProps) => {
  const [activeTab, setActiveTab] = useState<"phone" | "name" | "link">("phone");
  const [inputValue, setInputValue] = useState("");
  const [busy, setBusy] = useState(false);

  const tabs = [
    { id: "phone" as const, label: "By Phone", icon: "fa-phone" },
    { id: "name" as const, label: "By Name", icon: "fa-user" },
    { id: "link" as const, label: "By Link", icon: "fa-link" },
  ];

  const handleInvite = async () => {
    if (!inputValue.trim()) return;

    if (activeTab === "link") return;

    try {
      setBusy(true);
      await onInvite({ type: activeTab, value: inputValue.trim() });
      setInputValue("");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateLink = async () => {
    try {
      setBusy(true);
      await onGenerateLink();
    } finally {
      setBusy(false);
    }
  };

  const placeholders = {
    phone: "Enter phone number...",
    name: "Enter member name...",
    link: "Invite link will be generated",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Members" size="sm">
      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setInputValue(""); }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-wh-green-primary text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <i className={`fas ${tab.icon} text-xs`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Input */}
        {activeTab === "link" ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-wh-green-border-light bg-wh-green-bg-light p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-700">Invite Link</div>
                <button
                  onClick={handleGenerateLink}
                  disabled={busy}
                  className="text-xs px-2.5 py-1.5 rounded-md bg-wh-green-primary text-white hover:bg-wh-green-primary-hover disabled:opacity-60"
                >
                  {busy ? "Generating..." : "Generate"}
                </button>
              </div>

              {inviteLinkData ? (
                <>
                  <div className="flex items-center gap-2 p-2.5 bg-white border border-wh-green-border-light rounded-lg">
                    <i className="fas fa-link text-wh-green-text-muted"></i>
                    <span className="text-sm text-gray-600 flex-1 truncate">
                      {inviteLinkData.inviteUrl}
                    </span>
                    <button
                      onClick={() =>
                        navigator.clipboard?.writeText(inviteLinkData.inviteUrl)
                      }
                      className="text-xs text-wh-green-primary hover:text-wh-green-primary-hover font-medium"
                    >
                      <i className="fas fa-copy mr-1"></i>Copy
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-center rounded-lg border border-dashed border-wh-green-border-light bg-white p-4">
                    <QRCodeSVG value={inviteLinkData.qrData} size={160} />
                  </div>

                  <p className="text-[11px] text-gray-500 mt-2">
                    Expires: {new Date(inviteLinkData.expiresAt).toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-500">
                  Generate a secure invite link and share this QR for quick join.
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Share this link or QR with people you want to invite to this workspace.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type={activeTab === "phone" ? "tel" : "text"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholders[activeTab]}
              className="w-full px-4 py-3 bg-wh-green-bg-light border border-wh-green-border-light rounded-lg text-sm text-gray-900 focus:outline-none focus:border-wh-green-primary focus:ring-2 focus:ring-wh-green-primary/20"
            />
            <button
              onClick={() => {
                void handleInvite();
              }}
              disabled={!inputValue.trim() || busy}
              className="w-full px-4 py-2.5 bg-wh-green-primary text-white rounded-lg text-sm font-medium hover:bg-wh-green-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <i className="fas fa-paper-plane"></i>
              Send Invite
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default InviteMemberDialog;

