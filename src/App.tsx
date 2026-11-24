import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Events from "./pages/Events";
import Reminders from "./pages/Reminders";
import Documents from "./pages/Documents";
import AppLayout from "./components/AppLayout";

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen">Loading LIFEHUB AI…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Protected><AppLayout><Dashboard /></AppLayout></Protected>} />
      <Route path="/inbox" element={<Protected><AppLayout><Inbox /></AppLayout></Protected>} />
      <Route path="/documents" element={<Protected><AppLayout><Documents /></AppLayout></Protected>} />
      <Route path="/events" element={<Protected><AppLayout><Events /></AppLayout></Protected>} />
      <Route path="/reminders" element={<Protected><AppLayout><Reminders /></AppLayout></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
