import { useState } from "react";
import FriendSidebar from "../../components/friend/FriendSidebar";
import MainContent from "../../components/friend/MainContent";

const FriendListPage = () => {
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  return (
    <div className="flex h-screen bg-white transition-colors">
      <FriendSidebar searchQuery={friendSearchQuery} setSearchQuery={setFriendSearchQuery} />
      <MainContent />
    </div>
  );
};

export default FriendListPage;
