
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Dashboard from "@/pages/Dashboard";
import Quests from "@/pages/Quests";
import Settings from "@/pages/Settings";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Activity from "@/pages/Activity";
import Profile from "@/pages/Profile";
import Perks from "@/pages/Perks";

// Handle root level redirects
function RootRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is a Strava callback
    if (location.search.includes('code=')) {
      navigate(`/settings${location.search}`, { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [location, navigate]);

  return null;
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Router>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/quests" element={<Quests />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/perks" element={<Perks />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
