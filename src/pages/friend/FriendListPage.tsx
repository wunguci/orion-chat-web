import { useState } from "react";
import FriendSidebar from "../../components/friend/FriendSidebar";

const FriendListPage = () => {
  const [friendSearchQuery, setFriendSearchQuery] = useState("");

  return (
    <div className="flex h-screen bg-white transition-colors">
      <FriendSidebar searchQuery={friendSearchQuery} setSearchQuery={setFriendSearchQuery} />
    </div>
  );
};

export default FriendListPage;
