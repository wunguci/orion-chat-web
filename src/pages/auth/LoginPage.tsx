import { useState } from "react";
import SettingModal from "../../components/setting-chat/SettingModal";

export const LoginPage = () => {
  const [isSettingOpen, setIsSettingOpen] = useState(false);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Login Page</h1>
      <button
        onClick={() => setIsSettingOpen(true)}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        Open Settings Modal
      </button>

      <SettingModal
        isOpen={isSettingOpen}
        onClose={() => setIsSettingOpen(false)}
      />
    </div>
  );
};
