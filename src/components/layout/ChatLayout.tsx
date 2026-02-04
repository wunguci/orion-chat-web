import { Outlet } from "react-router-dom";

export const ChatLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};