import { Outlet } from "react-router-dom";

export const AuthLayout = () => {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        {/* Container  */}
        <div className="w-full max-w-md px-4">
          {/* Logo/Branding  */}

          {/* Auth Card  */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <Outlet />
          </div>

          {/* Footer  */}
        </div>
      </div>
    );
};