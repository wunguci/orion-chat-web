import {
  Settings,
  Search,
  Video,
  MoreVertical,
  Plus,
  Smile,
  Send,
  Bell,
  Pin,
  Trash2,
  ChevronRight,
  UserRound,
  MessageSquareWarning,
  LogOut,
  NotebookText,
  AlarmClockCheck,
  Clock7,
  EyeOff,
  Link,
  Copy,
  Share,
  UserRoundPlus,
  UserRoundPlusIcon,
  ArrowLeft,
  Users,
  RefreshCw,
  HelpCircle,
  KeyRound,
  UserPlus,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ToggleSwitch from "../common/ToggleSwitch";
import Checkbox from "../common/Checkbox";
import AddMemberModal from "./AddMemberModal";
import AppSidebar from "../common/AppSidebar";

interface Message {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  image?: string;
  imageCaption?: string;
  time: string;
  isOwn: boolean;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline?: boolean;
}

const chats: Chat[] = [
  {
    id: "1",
    name: "Olivia Isabella",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    lastMessage: "The weather will be perfect",
    time: "9:41 AM",
    unread: 0,
    isOnline: true,
  },
  {
    id: "2",
    name: "Athena",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    lastMessage: "That's a good idea 🔥",
    time: "9:41 AM",
    unread: 0,
  },
  {
    id: "3",
    name: "Photographers",
    avatar:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=100&h=100&fit=crop",
    lastMessage: "Here's my latest drone shot...",
    time: "9:16 AM",
    unread: 3,
  },
  {
    id: "4",
    name: "Lela Walsh",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    lastMessage: "Next time it's my turn!",
    time: "Yesterday",
    unread: 0,
  },
];

const messages: Message[] = [
  {
    id: "1",
    sender: "Olivia Isabella",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    content: "Who was that philosopher you shared with me recently?",
    time: "2:14 PM",
    isOwn: false,
  },
  {
    id: "2",
    sender: "You",
    avatar:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=40&h=40&fit=crop",
    content: "Roland Barthes",
    time: "2:16 PM",
    isOwn: true,
  },
  {
    id: "3",
    sender: "Olivia Isabella",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    content: "That's him!",
    time: "2:18 PM",
    isOwn: false,
  },
  {
    id: "4",
    sender: "Olivia Isabella",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop",
    content: "What was his vision statement?",
    time: "2:18 PM",
    isOwn: false,
  },
  {
    id: "5",
    sender: "You",
    avatar:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=40&h=40&fit=crop",
    content:
      '"Ultimately in order to see a photograph well, it is best to look away or close your eyes."',
    time: "2:20 PM",
    isOwn: true,
  },
  {
    id: "6",
    sender: "You",
    avatar:
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=40&h=40&fit=crop",
    content: "",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    imageCaption:
      "Aerial photograph from the Helsinki urban environment division.",
    time: "2:20 PM",
    isOwn: true,
  },
];

const images = [
  "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1518932945147-142a57949186?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop",
];

export default function GroupChat() {
  const [selectedChat, setSelectedChat] = useState<Chat>(chats[0]);
  const [messageInput, setMessageInput] = useState("");
  const [currentView, setCurrentView] = useState<
    "chat" | "contacts" | "notes" | "calendar" | "friends" | "aichat"
  >("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGroupManagement, setIsGroupManagement] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isCreateGroup, setIsCreateGroup] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    images: true,
    files: true,
    links: true,
  });
  const [groupPermissions, setGroupPermissions] = useState({
    changeNameAvatar: true,
    pinMessages: true,
    createNotes: true,
    createPolls: true,
    sendMessages: true,
  });
  const [groupSettings, setGroupSettings] = useState({
    approveNewMembers: false,
    markLeaderMessages: true,
    allowReadRecentMessages: true,
    allowJoinLink: true,
  });
  const sidebarRef = useRef<HTMLDivElement>(null);

  const toggleSection = (section: "images" | "files" | "links") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  const handleAddMembers = (selectedMembers: string[]) => {
    console.log("Selected members:", selectedMembers);
  };

  return (
    <div className="flex h-screen bg-white">
      <AddMemberModal
        isCreateGroup={isCreateGroup}
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onConfirm={handleAddMembers}
      />

      <div className="w-80 border-r border-green-border-light flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center gap-2 p-4">
          <div className=" border-b border-green-border-light">
            {/* Search */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-green-border-light text-sm text-gray-primary placeholder-gray-400 focus:outline-none focus:border-green-primary"
              />
            </div>
          </div>

          <button className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600">
            <UserPlus size={20} />
          </button>
          <button
            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600"
            onClick={() => {
              setIsAddMemberModalOpen(true);
              setIsCreateGroup(true);
            }}
          >
            <UserRoundPlus size={20} />
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`w-full p-4 border-b border-green-border-light flex gap-3 items-start transition-colors ${
                selectedChat.id === chat.id ? "bg-white" : "hover:bg-white/50"
              }`}
            >
              <div className="relative shrink-0">
                <img
                  src={chat.avatar || "/placeholder.svg"}
                  alt={chat.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
                {chat.unread > 0 && (
                  <div className="absolute -top-1 -right-1 bg-green-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {chat.unread > 9 ? "9+" : chat.unread}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-left">
                <h3 className="font-semibold text-gray-primary">{chat.name}</h3>
                <p className="text-sm text-gray-500 truncate">
                  {chat.lastMessage}
                </p>
              </div>

              <span className="text-xs text-gray-400 shrink-0">
                {chat.time}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Center - Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-green-border-light bg-green-bg-light px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={selectedChat.avatar || "/placeholder.svg"}
              alt={selectedChat.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h2 className="font-semibold text-gray-primary">
                {selectedChat.name}
              </h2>
              <p className="text-xs text-gray-500">4 members, 2 online</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsAddMemberModalOpen(true);
                setIsCreateGroup(false);
              }}
              className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600"
            >
              <UserRoundPlusIcon size={20} />
            </button>
            <button className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600">
              <Video size={20} />
            </button>
            <button className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600">
              <Search size={20} />
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex gap-3 max-w-md ${msg.isOwn ? "flex-row-reverse" : ""}`}
              >
                <img
                  src={msg.avatar || "/placeholder.svg"}
                  alt={msg.sender}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />

                <div
                  className={`space-y-2 ${msg.isOwn ? "items-end flex flex-col" : ""}`}
                >
                  {msg.image ? (
                    <div
                      className={`rounded-lg overflow-hidden ${
                        msg.isOwn ? "bg-white" : "bg-white"
                      }`}
                    >
                      <img
                        src={msg.image || "/placeholder.svg"}
                        alt="shared"
                        className="w-full h-48 object-cover"
                      />
                      <p className="text-sm text-gray-600 p-3">
                        {msg.imageCaption}
                      </p>
                    </div>
                  ) : msg.content.startsWith('"') ? (
                    <div
                      className={`px-4 py-3 rounded-lg italic border-l-4 ${
                        msg.isOwn
                          ? "bg-green-primary text-white border-white"
                          : "bg-green-bg-heavy text-green-primary border-green-primary"
                      }`}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        msg.isOwn
                          ? "bg-green-primary text-white"
                          : "bg-green-bg-heavy text-gray-primary"
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}

                  <span className="text-xs text-gray-400 px-2">{msg.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="h-20 border-t border-green-border-light bg-green-bg-light px-6 flex items-center gap-3">
          <button className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600">
            <Plus size={20} />
          </button>

          <input
            type="text"
            placeholder="Type your message here..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1 px-4 py-2 bg-white rounded-lg border border-green-border-light text-sm text-gray-primary placeholder-gray-400 focus:outline-none focus:border-green-primary"
          />

          <button className="p-2 hover:bg-white rounded-lg transition-colors text-gray-600">
            <Smile size={20} />
          </button>

          <button className="p-3 bg-green-primary hover:bg-orange-700 rounded-lg transition-colors text-white">
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Sidebar Right - Conversation Info */}
      {isSidebarOpen && (
        <div
          ref={sidebarRef}
          className="w-90 border-l border-green-border-light bg-green-bg-light flex flex-col overflow-y-auto"
        >
          {!isGroupManagement ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-green-border-light flex flex-col gap-3">
                <span className="text-lg font-semibold text-gray-primary">
                  Thông tin nhóm
                </span>

                <div className="flex flex-col gap-3 items-center">
                  <img
                    src={selectedChat.avatar || "/placeholder.svg"}
                    alt={selectedChat.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <span className="font-semibold text-gray-primary">
                    {selectedChat.name}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 flex gap-3 justify-center border-b border-green-border-light">
                <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors flex-1">
                  <Bell size={20} className="text-green-primary" />
                  <span className="text-xs text-gray-primary">
                    Tắt thông báo
                  </span>
                </button>
                <button className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors flex-1">
                  <Pin size={20} className="text-green-primary" />
                  <span className="text-xs text-gray-primary">
                    Ghi hội thoại
                  </span>
                </button>
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors flex-1"
                >
                  <UserRoundPlus size={20} className="text-green-primary" />
                  <span className="text-xs text-gray-primary">
                    Thêm thành viên
                  </span>
                </button>
                <button
                  onClick={() => setIsGroupManagement(true)}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-white transition-colors flex-1"
                >
                  <Settings size={20} className="text-green-primary" />
                  <span className="text-xs text-gray-primary">
                    Quản lý nhóm
                  </span>
                </button>
              </div>

              {/* Images Section */}
              <div className="p-4 border-b flex flex-col gap-4 border-green-border-light">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-primary">
                    Images/Video
                  </span>
                  <button
                    onClick={() => toggleSection("images")}
                    className="p-1 hover:bg-white rounded transition-colors"
                  >
                    <ChevronRight
                      size={20}
                      className={`text-gray-primary transition-transform ${expandedSections.images ? "rotate-90" : ""}`}
                    />
                  </button>
                </div>

                {expandedSections.images && (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img || "/placeholder.svg"}
                          alt="chat"
                          className="w-full h-16 rounded-lg object-cover hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                      {images.length < 4 && (
                        <div className="flex items-center justify-center h-16 rounded-lg bg-white border border-green-border-light text-2xl font-bold text-green-primary">
                          +{images.length}
                        </div>
                      )}
                    </div>
                    <button className="py-2 rounded-lg font-semibold bg-white border border-green-primary hover:bg-white transition-colors text-green-primary text-[14px] my-1">
                      Xem tất cả
                    </button>
                  </>
                )}
              </div>

              {/* File/Folder Section */}
              <div className="p-4 border-b flex flex-col gap-4 border-green-border-light">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-primary">
                    File/Folder
                  </span>
                  <button
                    onClick={() => toggleSection("files")}
                    className="p-1 hover:bg-white rounded transition-colors"
                  >
                    <ChevronRight
                      size={20}
                      className={`text-gray-primary transition-transform ${expandedSections.files ? "rotate-90" : ""}`}
                    />
                  </button>
                </div>

                {expandedSections.files && (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img || "/placeholder.svg"}
                          alt="chat"
                          className="w-full h-16 rounded-lg object-cover hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                      {images.length < 4 && (
                        <div className="flex items-center justify-center h-16 rounded-lg bg-white border border-green-border-light text-2xl font-bold text-green-primary">
                          +{images.length}
                        </div>
                      )}
                    </div>
                    <button className="py-2 rounded-lg font-semibold bg-white border border-green-primary hover:bg-white transition-colors text-green-primary text-[14px] my-1">
                      Xem tất cả
                    </button>
                  </>
                )}
              </div>

              {/* Link Section */}
              <div className="p-4 border-b flex flex-col gap-4 border-green-border-light">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-primary">Link</span>
                  <button
                    onClick={() => toggleSection("links")}
                    className="p-1 hover:bg-white rounded transition-colors"
                  >
                    <ChevronRight
                      size={20}
                      className={`text-gray-primary transition-transform ${expandedSections.links ? "rotate-90" : ""}`}
                    />
                  </button>
                </div>

                {expandedSections.links && (
                  <>
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img || "/placeholder.svg"}
                          alt="chat"
                          className="w-full h-16 rounded-lg object-cover hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      ))}
                      {images.length < 4 && (
                        <div className="flex items-center justify-center h-16 rounded-lg bg-white border border-green-border-light text-2xl font-bold text-green-primary">
                          +{images.length}
                        </div>
                      )}
                    </div>
                    <button className="py-2 rounded-lg font-semibold bg-white border border-green-primary hover:bg-white transition-colors text-green-primary text-[14px] my-1">
                      Xem tất cả
                    </button>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {/* Member Section Left Bar */}
                <div className="p-3 flex flex-col gap-1 bg-green-bg-light border-b border-green-border-light">
                  <span className="font-semibold">Thành viên</span>
                  <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                    <UserRound size={20} />
                    <span className="text-[15px]">5 thành viên</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                    <Link size={20} />
                    <div className="flex flex-col items-start">
                      <span className="text-[15px]">Link tham gia nhóm</span>
                      <span className="text-[12px] text-blue-dark text-left">
                        orionchat.com/groupchat-test
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <Copy size={18} />
                      <Share size={18} />
                    </div>
                  </button>
                </div>

                {/* Group News */}
                <div className="p-3 flex flex-col gap-1 bg-green-bg-light border-b border-green-border-light">
                  <span className="font-semibold">Bảng tin nhóm</span>
                  <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                    <AlarmClockCheck size={20} />
                    <span className="text-[15px]">Danh sách nhắc hẹn</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                    <NotebookText size={20} />
                    <span className="text-[15px]">
                      Ghi chú, ghim, bình chọn
                    </span>
                  </button>
                </div>

                {/* Auto Delete Messages */}
                <div className="p-3 flex flex-col gap-1 bg-green-bg-light border-b border-green-border-light">
                  <span className="font-semibold">Thiết lập bảo mật</span>
                  <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                    <Clock7 size={20} />
                    <div className="flex flex-col items-start">
                      <span className="text-[15px]">Tin nhắn tự xóa</span>
                      <span className="text-[12px] text-gray-secondary">
                        Không bao giờ
                      </span>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                    <EyeOff size={20} />
                    <span className="text-[15px]">Ẩn trò chuyện</span>
                  </button>
                </div>

                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors text-gray-primary">
                  <MessageSquareWarning size={20} />
                  <span className="text-[15px]">Báo xấu</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors text-red-500">
                  <Trash2 size={20} />
                  <span className="text-[15px]">Xóa lịch sử trò chuyện</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-colors text-red-500">
                  <LogOut size={20} />
                  <span className="text-[15px]">Rời nhóm</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Group Management View */}
              <div className="flex flex-col h-full">
                {/* Header with Back Button */}
                <div className="p-4 border-b border-green-border-light flex items-center gap-3">
                  <button
                    onClick={() => setIsGroupManagement(false)}
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <ArrowLeft size={20} className="text-gray-primary" />
                  </button>
                  <span className="text-lg font-semibold text-gray-primary">
                    Quản lý nhóm
                  </span>
                </div>

                {/* Permissions Section */}
                <div className="p-4 border-b border-green-border-light flex flex-col gap-4">
                  <span className="font-semibold text-gray-primary">
                    Cho phép các thành viên trong nhóm:
                  </span>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-primary">
                        Thay đổi tên & ảnh đại diện của nhóm
                      </span>
                      <Checkbox
                        checked={groupPermissions.changeNameAvatar}
                        onChange={() =>
                          setGroupPermissions({
                            ...groupPermissions,
                            changeNameAvatar:
                              !groupPermissions.changeNameAvatar,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-primary">
                        Ghim tin nhắn, ghi chú, bình chọn lên đầu hội thoại
                      </span>
                      <Checkbox
                        checked={groupPermissions.pinMessages}
                        onChange={() =>
                          setGroupPermissions({
                            ...groupPermissions,
                            pinMessages: !groupPermissions.pinMessages,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-primary">
                        Tạo mới ghi chú, nhắc hẹn
                      </span>
                      <Checkbox
                        checked={groupPermissions.createNotes}
                        onChange={() =>
                          setGroupPermissions({
                            ...groupPermissions,
                            createNotes: !groupPermissions.createNotes,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-primary">
                        Tạo mới bình chọn
                      </span>
                      <Checkbox
                        checked={groupPermissions.createPolls}
                        onChange={() =>
                          setGroupPermissions({
                            ...groupPermissions,
                            createPolls: !groupPermissions.createPolls,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-primary">
                        Gửi tin nhắn
                      </span>
                      <Checkbox
                        checked={groupPermissions.sendMessages}
                        onChange={() =>
                          setGroupPermissions({
                            ...groupPermissions,
                            sendMessages: !groupPermissions.sendMessages,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Toggle Settings */}
                <div className="p-4 border-b border-green-border-light flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-primary">
                        Chế độ phê duyệt thành viên mới
                      </span>
                      <HelpCircle size={16} className="text-gray-400" />
                    </div>
                    <div className="scale-75 origin-right">
                      <ToggleSwitch
                        checked={groupSettings.approveNewMembers}
                        onChange={() =>
                          setGroupSettings({
                            ...groupSettings,
                            approveNewMembers: !groupSettings.approveNewMembers,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-primary">
                        Đánh dấu tin nhắn từ trưởng/phó nhóm
                      </span>
                      <HelpCircle size={16} className="text-gray-400" />
                    </div>
                    <div className="scale-75 origin-right">
                      <ToggleSwitch
                        checked={groupSettings.markLeaderMessages}
                        onChange={() =>
                          setGroupSettings({
                            ...groupSettings,
                            markLeaderMessages:
                              !groupSettings.markLeaderMessages,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-primary">
                        Cho phép thành viên mới đọc tin nhắn gần nhất
                      </span>
                      <HelpCircle size={16} className="text-gray-400" />
                    </div>
                    <div className="scale-75 origin-right">
                      <ToggleSwitch
                        checked={groupSettings.allowReadRecentMessages}
                        onChange={() =>
                          setGroupSettings({
                            ...groupSettings,
                            allowReadRecentMessages:
                              !groupSettings.allowReadRecentMessages,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-primary">
                        Cho phép dùng link tham gia nhóm
                      </span>
                      <HelpCircle size={16} className="text-gray-400" />
                    </div>
                    <div className="scale-75 origin-right">
                      <ToggleSwitch
                        checked={groupSettings.allowJoinLink}
                        onChange={() =>
                          setGroupSettings({
                            ...groupSettings,
                            allowJoinLink: !groupSettings.allowJoinLink,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Group Link */}
                <div className="p-4 border-b border-green-border-light">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <span className="flex-1 text-sm text-blue-600">
                      zalo.me/g/zwnrhx701
                    </span>
                    <button className="p-1 hover:bg-green-bg-light rounded transition-colors">
                      <Copy size={18} className="text-gray-primary" />
                    </button>
                    <button className="p-1 hover:bg-green-bg-light rounded transition-colors">
                      <Share size={18} className="text-gray-primary" />
                    </button>
                    <button className="p-1 hover:bg-green-bg-light rounded transition-colors">
                      <RefreshCw size={18} className="text-gray-primary" />
                    </button>
                  </div>
                </div>

                {/* Block from Group */}
                <div className="p-4 border-b border-green-border-light flex flex-col gap-2">
                  <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                    <Users size={20} />
                    <span className="text-[15px]">Chặn khỏi nhóm</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors text-gray-primary">
                    <KeyRound size={20} />
                    <span className="text-[15px]">Trưởng & phó nhóm</span>
                  </button>
                </div>

                {/* Group Link */}
                <div className="p-4 mt-auto mb-2">
                  <div className="flex items-center justify-center p-2 bg-[#FDECEC] rounded-md">
                    <span className="text-[16px] text-[#DC264C] font-semibold">
                      Giải tán nhóm
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
