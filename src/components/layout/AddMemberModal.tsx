import { X, Search } from "lucide-react";
import { useState } from "react";

interface Contact {
  id: string;
  name: string;
  avatar: string;
  category?: string;
  isParticipant?: boolean;
}

interface AddMemberModalProps {
  isCreateGroup?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedMembers: string[]) => void;
}

const mockContacts: Contact[] = [
  {
    id: "1",
    name: "Duyên",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    id: "2",
    name: "Nhân",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    id: "3",
    name: "Dũ",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
  {
    id: "4",
    name: "Trần Văn Lồ",
    avatar:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100&h=100&fit=crop",
  },
  {
    id: "5",
    name: "Hịp",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    category: "Đã tham gia",
    isParticipant: true,
  },
  {
    id: "6",
    name: "Hằng",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  },
  {
    id: "7",
    name: "Nguyễn Thị Nựng",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
  },
];

const categories = [
  "Tất cả",
  "Khách hàng",
  "Gia đình",
  "Công việc",
  "Bạn bè",
  "Trả lời sau",
];

export default function AddMemberModal({
  isCreateGroup,
  isOpen,
  onClose,
  onConfirm,
}: AddMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedMembers);
    setSelectedMembers([]);
    setSearchQuery("");
    onClose();
  };

  const handleCancel = () => {
    setSelectedMembers([]);
    setSearchQuery("");
    onClose();
  };

  // Group contacts by first letter or number
  const groupedContacts = mockContacts.reduce(
    (acc, contact) => {
      const firstChar = contact.name.charAt(0).toUpperCase();
      const key = /[0-9]/.test(firstChar)
        ? "0-9"
        : /[A-Z]/.test(firstChar)
          ? firstChar
          : "#";

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(contact);
      return acc;
    },
    {} as Record<string, Contact[]>,
  );

  const sortedGroups = Object.entries(groupedContacts).sort(([a], [b]) => {
    if (a === "0-9") return -1;
    if (b === "0-9") return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-orange-border-light flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-primary">
            {isCreateGroup ? "Tạo nhóm mới" : "Thêm thành viên"}
          </h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-primary" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-orange-border-light">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Nhập tên, số điện thoại, hoặc danh sách số điện thoại"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-gray-300 text-sm text-gray-primary placeholder-gray-400 focus:outline-none focus:border-orange-primary"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-6 py-4 border-b border-orange-border-light overflow-x-auto">
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "bg-orange-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-primary mb-4">
            Trò chuyện gần đây
          </h3>

          {sortedGroups.map(([letter, contacts]) => (
            <div key={letter} className="mb-4">
              <h4 className="text-lg font-bold text-gray-primary mb-2">
                {letter === "0-9" ? "2" : letter}
              </h4>
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <label
                    key={contact.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-bg-light cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedMembers.includes(contact.id) ||
                        (!isCreateGroup && contact.isParticipant) ||
                        false
                      }
                      onChange={() => toggleMember(contact.id)}
                      disabled={!isCreateGroup && contact.isParticipant}
                      className="w-5 h-5 rounded-full border-2 border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed accent-orange-primary"
                    />
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-primary">
                        {contact.name}
                      </p>
                      {!isCreateGroup && contact.category && (
                        <p className="text-xs text-gray-500">
                          {contact.category}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-orange-border-light flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedMembers.length === 0}
            className="px-6 py-3 bg-orange-primary text-white rounded-lg hover:orange-primary font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
