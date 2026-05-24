import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * GroupCallPage
 * Hiển thị giao diện group video call
 */
const GroupCallPage: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/chat", { replace: true });
  }, [navigate]);

  return null;
};

export default GroupCallPage;
