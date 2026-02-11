import type React from "react";
import type { Friend } from "../../types/friend";
import { useState } from "react";
import { FaCheck } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { MdEditNote } from "react-icons/md";
import { MdOutlinePersonAddAlt1, MdOutlineChat } from "react-icons/md";

interface SearchResultCardProps {
  friend: Friend;
  onClose: () => void;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({
  friend,
  onClose,
}) => {
  const [message, setMessage] = useState(
    "Hi! I'd like to connect with you on ConnectApp.",
  );
  const [isSent, setIsSent] = useState(false);

  const handleAddFriend = () => {
    // Mock sending friend request
    console.log(
      `Sending friend request to ${friend.name} with message: ${message}`,
    );
    setIsSent(true);

    // Auto close after send success
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  if (isSent) {
    return (
      <div className="p-8 bg-teal-50 border border-teal-200 rounded-3xl animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white mb-2">
          <FaCheck className="text-2xl" />
        </div>
        <h3 className="text-xl font-bold text-teal-800">Request Sent!</h3>
        <p className="text-teal-600 italic">
          Your friend request with message has been sent to {friend.name}.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 border-2 border-slate-200 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden">
      <div className="absolute top-4 right-4">
        <button
          onClick={onClose}
          className="p-1 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <IoClose className="text-xl" />
        </button>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-full bg-slate-300 bg-cover bg-center border-4 border-white shadow-md"
              style={{ backgroundImage: `url('${friend.avatar}')` }}
            />
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-slate-900">{friend.name}</h3>
            <p className="text-sm text-slate-500">
              {friend.subtext || "User found by phone number"}
            </p>
          </div>
        </div>

        {/* Message Input Section */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 px-1">
            <MdEditNote className="text-sm" />
            Add a personal message
          </label>
          <textarea
            className="w-full p-4 bg-slate-100 border-none outline-none appearance-none shadow-none ring-0
          focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 rounded-sm text-sm transition-all placeholder:text-slate-800"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
          ></textarea>
        </div>

        <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-2">
          <button
            onClick={handleAddFriend}
            className="flex-1 sm:flex-none px-8 py-3 bg-teal-500 text-white font-bold rounded-2xl hover:bg-teal-600 transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <MdOutlinePersonAddAlt1 className="text-xl" />
            Send Friend Request
          </button>

          <button className="flex-1 sm:flex-none px-8 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer">
            <MdOutlineChat className="text-lg" />
            Direct Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchResultCard;
