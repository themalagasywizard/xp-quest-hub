
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Target, LineChart, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Target, label: "Quests", path: "/quests" },
  { icon: LineChart, label: "Activity Log", path: "/activity" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed left-0 top-0 bottom-0 w-16 md:w-64 p-4 bg-sidebar border-r border-border flex flex-col gap-2">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-bold hidden md:block">LVL1</h1>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            variant={location.pathname === item.path ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => navigate(item.path)}
          >
            <item.icon className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">{item.label}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
}
