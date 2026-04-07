import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  MOCK_DM_THREADS,
  MOCK_DM_MESSAGES,
  MOCK_USERS,
} from "../../../data/work-hub-mock";

const DirectMessagesPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [selectedThreadId, setSelectedThreadId] = useState<string>("dm1");
  const [messageInput, setMessageInput] = useState("");
  const [searchDm, setSearchDm] = useState("");

  const currentUserId = "u1";

  const selectedThread = MOCK_DM_THREADS.find((t) => t.id === selectedThreadId);
  const threadMessages = MOCK_DM_MESSAGES.filter(
    (m) => m.threadId === selectedThreadId,
  );

  const getOtherUser = (thread: (typeof MOCK_DM_THREADS)[0]) => {
    return (
      thread.participants.find((p) => p.id !== currentUserId) ||
      thread.participants[0]
    );
  };

  const filteredThreads = MOCK_DM_THREADS.filter((t) => {
    const otherUser = getOtherUser(t);
    return otherUser.name.toLowerCase().includes(searchDm.toLowerCase());
  });

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* DM thread list */}
      <div className="w-72 border-r border-wh-green-border-light bg-white flex flex-col">
        <div className="p-4 border-b border-wh-green-border-light">
          <h2 className="font-semibold text-gray-900 mb-3">Direct Messages</h2>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
            <input
              type="text"
              placeholder="Search people..."
              value={searchDm}
              onChange={(e) => setSearchDm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-wh-green-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredThreads.map((thread) => {
            const otherUser = getOtherUser(thread);
            const isActive = thread.id === selectedThreadId;
            const lastMsg = thread.lastMessage;

            return (
              <button
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left border-b border-gray-50 ${
                  isActive
                    ? "bg-wh-green-bg-light"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={otherUser.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      otherUser.status === "online"
                        ? "bg-green-400"
                        : otherUser.status === "away"
                          ? "bg-yellow-400"
                          : "bg-gray-300"
                    }`}
                  ></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold truncate ${
                        thread.unreadCount > 0
                          ? "text-gray-900"
                          : "text-gray-700"
                      }`}
                    >
                      {otherUser.name}
                    </span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                      {lastMsg ? timeAgo(lastMsg.createdAt) : ""}
                    </span>
                  </div>
                  {lastMsg && (
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        thread.unreadCount > 0
                          ? "text-gray-700 font-medium"
                          : "text-gray-500"
                      }`}
                    >
                      {lastMsg.author.id === currentUserId ? "You: " : ""}
                      {lastMsg.text}
                    </p>
                  )}
                </div>
                {thread.unreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-wh-green-primary text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {thread.unreadCount}
                  </span>
                )}
              </button>
            );
          })}

          {filteredThreads.length === 0 && (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <i className="fas fa-search text-2xl mb-2 text-gray-300"></i>
              <p className="text-sm">No conversations found</p>
            </div>
          )}
        </div>

        {/* New DM button */}
        <div className="p-3 border-t border-wh-green-border-light">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-wh-green-border-medium text-wh-green-primary rounded-lg hover:bg-wh-green-bg-light transition-colors text-sm font-medium">
            <i className="fas fa-plus text-xs"></i>
            New Message
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedThread ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-wh-green-border-light">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={getOtherUser(selectedThread).avatar}
                    alt=""
                    className="w-9 h-9 rounded-full"
                  />
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      getOtherUser(selectedThread).status === "online"
                        ? "bg-green-400"
                        : getOtherUser(selectedThread).status === "away"
                          ? "bg-yellow-400"
                          : "bg-gray-300"
                    }`}
                  ></div>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm">
                    {getOtherUser(selectedThread).name}
                  </h2>
                  <span
                    className={`text-xs capitalize ${
                      getOtherUser(selectedThread).status === "online"
                        ? "text-green-500"
                        : getOtherUser(selectedThread).status === "away"
                          ? "text-yellow-500"
                          : "text-gray-400"
                    }`}
                  >
                    {getOtherUser(selectedThread).status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  title="Search messages"
                >
                  <i className="fas fa-search"></i>
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  title="Info"
                >
                  <i className="fas fa-info-circle"></i>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 px-6">
              {threadMessages.map((msg) => {
                const isOwn = msg.author.id === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 mb-4 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    {!isOwn && (
                      <img
                        src={msg.author.avatar}
                        alt=""
                        className="w-7 h-7 rounded-full flex-shrink-0"
                      />
                    )}
                    <div
                      className={`max-w-[65%] ${isOwn ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isOwn
                            ? "bg-wh-green-primary text-white rounded-br-md"
                            : "bg-gray-100 text-gray-800 rounded-bl-md"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <div
                        className={`flex items-center gap-1.5 mt-1 ${isOwn ? "justify-end" : ""}`}
                      >
                        <span className="text-[10px] text-gray-400">
                          {formatTime(msg.createdAt)}
                        </span>
                        {isOwn && (
                          <i
                            className={`fas fa-check-double text-[10px] ${msg.isRead ? "text-wh-green-primary" : "text-gray-300"}`}
                          ></i>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message input */}
            <div className="px-6 pb-4">
              <div className="flex items-center gap-3 border border-wh-green-border-medium rounded-xl overflow-hidden px-4 py-2 focus-within:ring-2 focus-within:ring-wh-green-primary focus-within:border-transparent">
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <i className="fas fa-paperclip"></i>
                </button>
                <input
                  type="text"
                  placeholder={`Message ${getOtherUser(selectedThread).name}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 py-1.5 text-sm focus:outline-none"
                />
                <div className="flex items-center gap-1">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                    <i className="far fa-smile"></i>
                  </button>
                  <button
                    className={`p-2 rounded-lg transition-colors ${
                      messageInput.trim()
                        ? "bg-wh-green-primary text-white hover:bg-wh-green-primary-hover"
                        : "text-gray-300"
                    }`}
                  >
                    <i className="fas fa-paper-plane text-sm"></i>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <i className="fas fa-comments text-5xl mb-3 text-gray-300"></i>
              <p className="font-medium text-gray-500">
                No conversation selected
              </p>
              <p className="text-sm">
                Choose a conversation or start a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectMessagesPage;

