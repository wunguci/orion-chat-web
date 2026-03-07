import type React from "react";
import AddFriendSection from "./AddFriendSection";
import SearchResultCard from "./SearchResultCard";
import FriendRequestCard from "./FriendRequestCard";
import SuggestionCard from "./SuggestionCard";
import RecentlyActiveItem from "./RecentlyActiveItem";
import { useState } from "react";
import type {
  Friend,
  FriendRequest,
  RecentlyActive,
  SuggestedFriend,
} from "../../types/friend";

const FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: "req1",
    name: "Jessica Valeska",
    timeAgo: "Requested 2h ago",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHbzXqol30uCEOb5iYQcUiBF4uBjJ8HwbxUmTLsTc8M0AuswH4McOhuGKxglSLF_erheWBL87EcWzlp02gbLsxUdvHS6efZoRRqwI_r6gBpguPq0f852UitIwDa8I3m1m6TISX9fX-Ue8Yk-evFkKn6FlgxrXmOOq1pjGUOe0BYrKFjKldeLfNTzCeiaJ9IUHnscvXCaDzXcfzZaELla65c9zVCO9SdljeZUf3U9wBvg8BfnI-OZBCNXwSeQEjlmGpcT7MOqUwdSw",
    message:
      "Hey! I saw your post in the designers group. Would love to connect!",
  },
  {
    id: "req2",
    name: "Riley Smith",
    timeAgo: "Requested 1d ago",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAV1rMo4VNWKwYyVyQVRt36qJP4H5Vr_ESLci01j5GCJmc7Lf__aBW5OLc-ttFUDiafvHy1i_aVWRfuNrZfQNn7-YaBvMa9v6jsfohpSk5QHA-_HfRj56ayCwES0rZC6GuDdmYp-ZkySoNfcgE0RmLZqaUBBVd_sILgvK06n914e2I0nYsGCIqMFsxQrBKwrkafOTYsziKdZqFoYhT5W5snv_IUhY_vjywcnnOm3eXSkY_TtOth_8CLOsozj_dtT8skjMQ1WT63YlU",
    message:
      "Hi, we met at the tech meetup last Friday. Nice to meet you again!",
  },
];

const SUGGESTED_FRIENDS: SuggestedFriend[] = [
  {
    id: "sug1",
    name: "Jordan Miller",
    mutualFriends: 4,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCu_T7Lz2XnSm71ln-0DV4SzJFiZdcpwJv4tZp3kpfjrhPKzv-YTG53wzqNNXPpzuqySSCXT8zxraI31pQqGJdbjeKRfkLtDv-eebLKy9MKfSmnY_ewFQNwReEuiXoAbzc5GFHfRQVggTNJWN2QwK2I3u9Bmmtk7x-DjJRIHjgv9Q-qvfMNIQcjd7bzesdnrqgHjDnhLi1XfSKg96JwiOW-zKxEYKcbWRcBRsSeZkZxhBZhfNDrsOZiLK35QQVdgaMMIsToIwI5fDY",
  },
  {
    id: "sug2",
    name: "Emma Wilson",
    mutualFriends: 12,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDA5HtZlqphFY3NRo3ZAIMMu5U8WmUfbpJIuK7a5mNS7ZvWdu7vEhH73TeF5MrAsES1d0JP7jTAdCe2iq1ogfnwSE9P1Guj5-GLSmehPPnw187dKDW0CwFK3pAnOZc_oF6JF7EY99AsQXHmQBSkq5Ejq8kRd76fhVPSb1wxD6Uytt7asHEfugmZ3ZTintJoTSHA47fNU5-aIPYS54fvzHmnz7TPh-QIW_qGtSs9VpCMBXDbvVC7VUjhdGUSmzKFUI4PYmPi4F0y27I",
  },
  {
    id: "sug3",
    name: "Tom Holland",
    mutualFriends: 2,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDgHg9h82LAqWzP6Qlf4wO57CTa-TrNYwdz8WhGGk_vIg_YtnfBW8nHTmVnzk6VjXSug2WzL-N_bFOf1EDBT-3PvB6lWMerTOYuoHSFWyIG-hGtzb2Hutc7ffO2IPW1nk3NdYOtG7jx3fwFFfDSq4b-eLLmM3oU6Vyhg7kckCzizUQBxXrR7N0jwdbC6kswRBaWhVy6M1xbrVjK6KFhUAQd_XxgaAXkbnUZYUT7AClFrcP0XECLhCM2N_Scea_dDjg3zOlZxWeqFRs",
  },
];

const RECENTLY_ACTIVE: RecentlyActive[] = [
  {
    id: "rec1",
    name: "Clara",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCo_FmthT5KcRxZKh5mdWJxjZaRvaTgWSeX4a0_RbbJ93WBNzZrJ_HEvN5hbKQMEHOW1tElufbHiR64bT-k4IvbTTP6mEykGaU1tcJnY6f_4lFAihGGK5uBdRIedI69-H6r4shqxUhua2gje0c4JPt_qCs53YEFF39X6-oZDiIzh09iTSgriusXU-UGVYxdhqzQeFLgda8j5QJXIuZSEzgkrvSfSrjk4ZBv8FRZkue-a8SZ2ElYvq42gxcGu2bSCMlGlMUIsz4ghGc",
    isActive: true,
  },
  {
    id: "rec2",
    name: "James",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB9xwEk1iftDlzWRBCT_vINkDm6CGjR6Y6y7jqF5genoxShRt1bPTakn5DvJIYKzY51EAo_7zR6C-FMI28u5YnWFKY-QHonxrLwdlQ8KY18h1oFkMz6VVDAeLWSAVVnZCqiFlJ-CvvmIfsmha70lrTsSB6TL2J96FSDoQJ8vS-S_yiTJM36dxxFOSI1G3Kobws6C7Q3-NQfiNzLCXed5VyuRbIQI2GU0tfxzOlupZnf1HAGbbBe1FV1vS3LZKwepmR0VowY68A8FDE",
  },
  {
    id: "rec3",
    name: "Sophia",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDLGV76FNydU8mQQTn9kJhTPcRs4d4nC5ry_gwIpYuyhNb_LmcIijs9YK5Zkt05kt4AoU6F1NT1fAmMou98zQnZx2y0-zXDBxXOaTpFMXDa1D_mBlhwb9yOznpNhGJlV07OMeNiQa6XjVq_IVzp_82lJpc13oKdVdwyvdDL2aRHprN_4whjcj-AIcUYPejETj_f6yUVqed71MuIbHhAnbLGutXIKbX1LzhXtsg5DJFT0SYtcjXOatxTONpQaNPqeWJHd9PcLOrWKmc",
  },
];

const MainContent: React.FC = () => {
  const [searchResult, setSearchResult] = useState<Friend | null>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-white p-8 hide-scrollbar">
      <div className="max-w-4xl mx-auto space-y-12">
        <AddFriendSection onSearchResult={setSearchResult} />

        {/* Search Result Section - Chỉ hiển thị khi tìm thấy bạn */}
        {searchResult && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">
                Search Result
              </h2>
            </div>
            <SearchResultCard
              friend={searchResult}
              onClose={() => setSearchResult(null)}
            />
          </section>
        )}

        {/* Friend Requests Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight">
                Friend Requests
              </h2>
              <span className="bg-teal-100 text-green-secondary text-xs font-bold px-2 py-1 rounded-full">
                {FRIEND_REQUESTS.length} Pending
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FRIEND_REQUESTS.map((request) => (
              <FriendRequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>

        {/* Suggested Friends Section */}
        <section>
          <h2 className="mb-6 text-xl font-bold tracking-tight">
            Suggested for you
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {SUGGESTED_FRIENDS.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </section>

        {/* Recently Active Friends Section */}
        <section className="pb-12">
          <h2 className="text-xl font-bold mb-6 tracking-tight">
            Recently Active
          </h2>
          <div className="flex flex-wrap gap-4">
            {RECENTLY_ACTIVE.map((active) => (
              <RecentlyActiveItem key={active.id} item={active} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MainContent;
