import { useState } from "react";
import type { User } from "../../../types/work-hub.types";
import Modal from "../../common/Modal";

interface TaskTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (toUserId: string, reason: string) => void;
  users: User[];
  currentAssignees: User[];
}

const TaskTransferDialog = ({ isOpen, onClose, onTransfer, users, currentAssignees }: TaskTransferDialogProps) => {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [reason, setReason] = useState("");

  const availableUsers = users.filter((u) => !currentAssignees.some((a) => a.id === u.id));

  const handleTransfer = () => {
    if (!selectedUserId || !reason.trim()) return;
    onTransfer(selectedUserId, reason.trim());
    setSelectedUserId("");
    setReason("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Task" size="sm">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Transfer to</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-4 py-2.5 bg-wh-green-bg-light border border-wh-green-border-light rounded-lg text-gray-900 focus:outline-none focus:border-wh-green-primary"
          >
            <option value="">Select a member...</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you transferring this task?"
            rows={3}
            className="w-full px-4 py-2.5 bg-wh-green-bg-light border border-wh-green-border-light rounded-lg text-gray-900 focus:outline-none focus:border-wh-green-primary resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-wh-green-border-light text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={!selectedUserId || !reason.trim()}
            className="px-4 py-2 bg-wh-green-primary text-white rounded-lg hover:bg-wh-green-primary-hover transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-share mr-2"></i>Transfer
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TaskTransferDialog;

