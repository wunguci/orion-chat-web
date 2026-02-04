import { Outlet } from "react-router-dom";

export const MainLayout = () => {
  return (
    <div className="relative">
      {/* Main content  */}
      <Outlet />
    </div>
  );
};
