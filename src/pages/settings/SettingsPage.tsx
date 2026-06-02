import React, { useState } from "react";
import SettingsModal from "../../components/settings/SettingsModal";

export const SettingsPage = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full h-full">
      <SettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};

export default SettingsPage;
