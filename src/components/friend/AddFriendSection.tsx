import type React from "react";
import { useState } from "react";
import { MdPhoneIphone, MdOutlinePersonAddAlt } from "react-icons/md";
import type { Friend } from "../../types/friend";

interface AddFriendSectionProps {
  onSearchResult: (friend: Friend | null) => void;
}

const AddFriendSection: React.FC<AddFriendSectionProps> = ({ onSearchResult }) => {
  const [phone, setPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!phone.trim()) return;

    setIsSearching(true);
    // Mock search delay
    setTimeout(() => {
      const foundFriend: Friend = {
        id: "found-" + Date.now(),
        name: phone.includes("88") ? "Linh Nguyễn" : "Trần Minh Tuấn",
        status: "online",
        subtext: phone.includes("88")
          ? "Working at Design Lab"
          : "Just accessed",
        avatar: phone.includes("88")
          ? "https://lh3.googleusercontent.com/aida-public/AB6AXuCo_FmthT5KcRxZKh5mdWJxjZaRvaTgWSeX4a0_RbbJ93WBNzZrJ_HEvN5hbKQMEHOW1tElufbHiR64bT-k4IvbTTP6mEykGaU1tcJnY6f_4lFAihGGK5uBdRIedI69-H6r4shqxUhua2gje0c4JPt_qCs53YEFF39X6-oZDiIzh09iTSgriusXU-UGVYxdhqzQeFLgda8j5QJXIuZSEzgkrvSfSrjk4ZBv8FRZkue-a8SZ2ElYvq42gxcGu2bSCMlGlMUIsz4ghGc"
          : "https://lh3.googleusercontent.com/aida-public/AB6AXuDgHg9h82LAqWzP6Qlf4wO57CTa-TrNYwdz8WhGGk_vIg_YtnfBW8nHTmVnzk6VjXSug2WzL-N_bFOf1EDBT-3PvB6lWMerTOYuoHSFWyIG-hGtzb2Hutc7ffO2IPW1nk3NdYOtG7jx3fwFFfDSq4b-eLLmM3oU6Vyhg7kckCzizUQBxXrR7N0jwdbC6kswRBaWhVy6M1xbrVjK6KFhUAQd_XxgaAXkbnUZYUT7AClFrcP0XECLhCM2N_Scea_dDjg3zOlZxWeqFRs",
      };

      onSearchResult(foundFriend);
      setIsSearching(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Add New Friend</h2>
        <p className="text-slate-500">
          Search for your friends by their phone number to connect.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MdPhoneIphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
          <input
            type="tel"
            className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none outline-none appearance-none shadow-none ring-0
          focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 rounded-sm text-[18px] transition-all placeholder:text-slate-800"
            placeholder="Enter phone number..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <button 
            onClick={handleSearch}
            disabled={isSearching || !phone.trim()}
        className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-2.5 rounded-2xl font-bold transition-all shadow-lg shadow-slate-50 flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer">
          {isSearching ? "Searching..." : "Find & Connect"}
          {!isSearching && <MdOutlinePersonAddAlt className="text-xl" />}
        </button>
      </div>
    </section>
  );
};

export default AddFriendSection;
