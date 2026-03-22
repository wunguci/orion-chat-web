import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  MOCK_CHANNELS,
  MOCK_CHANNEL_MESSAGES,
  MOCK_USERS,
} from "../../../data/work-hub-mock";
import type { Channel, ChannelMessage } from "../../../types/work-hub.types";

const ChannelsPage = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [selectedChannelId, setSelectedChannelId] = useState<string>("ch1");
  const [messageInput, setMessageInput] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");

  const selectedChannel = MOCK_CHANNELS.find((c) => c.id === selectedChannelId);
  const channelMessages = MOCK_CHANNEL_MESSAGES.filter(
    (m) => m.channelId === selectedChannelId,
  );

  const filteredChannels = MOCK_CHANNELS.filter((c) =>
    c.name.toLowerCase().includes(channelSearch.toLowerCase()),
  );

  const publicChannels = filteredChannels.filter((c) => c.type === "public");
  const privateChannels = filteredChannels.filter((c) => c.type === "private");

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderChannelItem = (channel: Channel) => {
    const isActive = channel.id === selectedChannelId;
    return (
      <button
        key={channel.id}
        onClick={() => setSelectedChannelId(channel.id)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left mb-0.5 ${
          isActive
            ? "bg-wh-green-primary text-white"
            : "text-gray-600 hover:bg-wh-green-bg-heavy"
        }`}
      >
        <span
          className={`text-sm ${isActive ? "text-white/80" : "text-gray-400"}`}
        >
          {channel.type === "private" ? (
            <i className="fas fa-lock text-xs"></i>
          ) : (
            <span className="font-bold">#</span>
          )}
        </span>
        <span className="flex-1 text-sm font-medium truncate">
          {channel.name}
        </span>
        {channel.unreadCount > 0 && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"
            }`}
          >
            {channel.unreadCount}
          </span>
        )}
      </button>
    );
  };

  const renderMessage = (msg: ChannelMessage) => (
    <div
      key={msg.id}
      className="flex items-start gap-3 px-6 py-2 hover:bg-gray-50 group transition-colors"
    >
      <img
        src={msg.author.avatar}
        alt=""
        className="w-9 h-9 rounded-full mt-0.5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm text-gray-900">
            {msg.author.name}
          </span>
          <span className="text-[11px] text-gray-400">
            {formatTime(msg.createdAt)}
          </span>
        </div>
        <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">
          {msg.text}
        </p>

        {/* Reactions */}
        {msg.reactions.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            {msg.reactions.map((r, idx) => (
              <button
                key={idx}
                className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs transition-colors"
              >
                <span>{r.emoji}</span>
                <span className="text-gray-600 font-medium">
                  {r.users.length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Thread replies */}
        {msg.threadReplyCount > 0 && (
          <button className="flex items-center gap-2 mt-2 text-xs text-wh-green-primary hover:underline">
            <div className="flex -space-x-1">
              {msg.threadReplies.slice(0, 3).map((r) => (
                <img
                  key={r.id}
                  src={r.author.avatar}
                  alt=""
                  className="w-4 h-4 rounded-full border border-white"
                />
              ))}
            </div>
            <span>{msg.threadReplyCount} replies</span>
          </button>
        )}
      </div>

      {/* Message actions */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
        <button
          className="p-1 rounded hover:bg-gray-200 text-gray-400 text-xs"
          title="Emoji"
        >
          <i className="far fa-smile"></i>
        </button>
        <button
          className="p-1 rounded hover:bg-gray-200 text-gray-400 text-xs"
          title="Reply in thread"
        >
          <i className="fas fa-reply"></i>
        </button>
        <button
          className="p-1 rounded hover:bg-gray-200 text-gray-400 text-xs"
          title="Pin"
        >
          <i className="fas fa-thumbtack"></i>
        </button>
        <button
          className="p-1 rounded hover:bg-gray-200 text-gray-400 text-xs"
          title="More"
        >
          <i className="fas fa-ellipsis-h"></i>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Channel sidebar */}
      <div className="w-60 border-r border-wh-green-border-light bg-white flex flex-col">
        <div className="p-3 border-b border-wh-green-border-light">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm text-gray-900">Channels</h2>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="text-wh-green-text-muted hover:text-wh-green-primary transition-colors"
              title="Create Channel"
            >
              <i className="fas fa-plus text-xs"></i>
            </button>
          </div>
          <div className="relative">
            <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]"></i>
            <input
              type="text"
              placeholder="Search channels..."
              value={channelSearch}
              onChange={(e) => setChannelSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-wh-green-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* Public channels */}
          {publicChannels.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                Public
              </div>
              {publicChannels.map(renderChannelItem)}
            </div>
          )}

          {/* Private channels */}
          {privateChannels.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                Private
              </div>
              {privateChannels.map(renderChannelItem)}
            </div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedChannel ? (
          <>
            {/* Channel header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-wh-green-border-light">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold">#</span>
                <h2 className="font-semibold text-gray-900">
                  {selectedChannel.name}
                </h2>
                {selectedChannel.description && (
                  <>
                    <div className="w-px h-4 bg-gray-200"></div>
                    <span className="text-sm text-gray-500 truncate max-w-xs">
                      {selectedChannel.description}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  title="Search"
                >
                  <i className="fas fa-search"></i>
                </button>
                <button
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  title="Pinned messages"
                >
                  <i className="fas fa-thumbtack"></i>
                </button>
                <button
                  onClick={() => setShowChannelInfo(!showChannelInfo)}
                  className={`p-2 rounded-lg transition-colors text-sm ${
                    showChannelInfo
                      ? "bg-wh-green-bg-heavy text-wh-green-primary"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                  title="Channel info"
                >
                  <i className="fas fa-info-circle"></i>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4">
              {channelMessages.length > 0 && (
                <div className="flex items-center px-6 mb-4">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="px-3 text-xs text-gray-400 font-medium">
                    {formatDate(channelMessages[0].createdAt)}
                  </span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
              )}
              {channelMessages.map(renderMessage)}
              {channelMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <i className="fas fa-comments text-4xl mb-3 text-gray-300"></i>
                  <p className="font-medium text-gray-500">No messages yet</p>
                  <p className="text-sm">Be the first to say something!</p>
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="px-6 pb-4">
              <div className="border border-wh-green-border-medium rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-wh-green-primary focus-within:border-transparent">
                <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100">
                  <button className="p-1 rounded hover:bg-gray-100 text-gray-400 text-sm">
                    <i className="fas fa-bold"></i>
                  </button>
                  <button className="p-1 rounded hover:bg-gray-100 text-gray-400 text-sm">
                    <i className="fas fa-italic"></i>
                  </button>
                  <button className="p-1 rounded hover:bg-gray-100 text-gray-400 text-sm">
                    <i className="fas fa-strikethrough"></i>
                  </button>
                  <div className="w-px h-4 bg-gray-200 mx-1"></div>
                  <button className="p-1 rounded hover:bg-gray-100 text-gray-400 text-sm">
                    <i className="fas fa-list-ul"></i>
                  </button>
                  <button className="p-1 rounded hover:bg-gray-100 text-gray-400 text-sm">
                    <i className="fas fa-code"></i>
                  </button>
                  <button className="p-1 rounded hover:bg-gray-100 text-gray-400 text-sm">
                    <i className="fas fa-link"></i>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={`Message #${selectedChannel.name}`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="w-full px-4 py-3 text-sm focus:outline-none"
                />
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 text-sm"
                      title="Attach file"
                    >
                      <i className="fas fa-paperclip"></i>
                    </button>
                    <button
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 text-sm"
                      title="Emoji"
                    >
                      <i className="far fa-smile"></i>
                    </button>
                    <button
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 text-sm"
                      title="Mention"
                    >
                      <i className="fas fa-at"></i>
                    </button>
                  </div>
                  <button
                    className={`p-2 rounded-lg transition-colors ${
                      messageInput.trim()
                        ? "bg-wh-green-primary text-white hover:bg-wh-green-primary-hover"
                        : "bg-gray-100 text-gray-400"
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
            <p>Select a channel to start chatting</p>
          </div>
        )}
      </div>

      {/* Channel info panel */}
      {showChannelInfo && selectedChannel && (
        <div className="w-72 border-l border-wh-green-border-light bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-900">
                Channel Info
              </h3>
              <button
                onClick={() => setShowChannelInfo(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold text-gray-400">#</span>
              <span className="font-semibold text-gray-900">
                {selectedChannel.name}
              </span>
              {selectedChannel.type === "private" && (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                  Private
                </span>
              )}
            </div>
            {selectedChannel.description && (
              <p className="text-sm text-gray-600 mb-4">
                {selectedChannel.description}
              </p>
            )}

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-900">
                  {formatDate(selectedChannel.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Created by</span>
                <div className="flex items-center gap-1.5">
                  <img
                    src={selectedChannel.createdBy.avatar}
                    alt=""
                    className="w-4 h-4 rounded-full"
                  />
                  <span className="text-gray-900">
                    {selectedChannel.createdBy.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900">
                  Members ({selectedChannel.members.length})
                </h4>
                <button className="text-wh-green-primary text-xs hover:underline">
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {selectedChannel.members.map((user) => (
                  <div key={user.id} className="flex items-center gap-2.5">
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt=""
                        className="w-7 h-7 rounded-full"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          user.status === "online"
                            ? "bg-green-400"
                            : user.status === "away"
                              ? "bg-yellow-400"
                              : "bg-gray-300"
                        }`}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-700">{user.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100">
            <button className="w-full text-left text-sm text-gray-500 hover:text-gray-700 py-1.5">
              <i className="fas fa-bell mr-2"></i> Notification preferences
            </button>
            <button className="w-full text-left text-sm text-red-500 hover:text-red-700 py-1.5">
              <i className="fas fa-sign-out-alt mr-2"></i> Leave channel
            </button>
          </div>
        </div>
      )}

      {/* Create channel modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Create Channel
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Channels are where your team communicates
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    #
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. design-team"
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wh-green-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="What's this channel about?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wh-green-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-wh-green-primary transition-colors">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      defaultChecked
                      className="text-wh-green-primary"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Public
                      </div>
                      <div className="text-xs text-gray-500">
                        Everyone can join
                      </div>
                    </div>
                  </label>
                  <label className="flex-1 flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-wh-green-primary transition-colors">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      className="text-wh-green-primary"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Private
                      </div>
                      <div className="text-xs text-gray-500">Invite only</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateChannel(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateChannel(false)}
                className="px-4 py-2 text-sm bg-wh-green-primary text-white rounded-lg hover:bg-wh-green-primary-hover transition-colors font-medium"
              >
                Create Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelsPage;

