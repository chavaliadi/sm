import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logoutUser } from "@/api/auth";
import {
  Menu,
  X,
  Search,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  LayoutGrid,
  Building2,
  FileCheck,
  CheckSquare,
  Users,
  Anchor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutGrid,
    href: "/",
  },
  {
    label: "Projects",
    icon: Building2,
    href: "/projects",
  },
  {
    label: "DPR Approvals",
    icon: FileCheck,
    href: "/dprs",
  },
  {
    label: "Tasks",
    icon: CheckSquare,
    href: "/tasks",
  },
  {
    label: "Stakeholders",
    icon: Users,
    href: "/stakeholders",
  },
  {
    label: "Meetings",
    icon: Users,
    href: "/meetings",
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login", { replace: true });
  };

  // Modernized app layout shell consistent with ERP visual system
  return (
    <div className="app-shell flex h-screen flex-col overflow-hidden text-slate-900">
      {/* Header - Fixed at top */}
      <header className="app-header z-30 flex-shrink-0 border-b">
        <div className="flex items-center gap-4 px-4 py-3 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3">
            <div className="app-brand-mark flex h-10 w-10 items-center justify-center rounded-xl">
              <Anchor className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-500">MoPSW PORTAL</p>
              <p className="text-sm font-semibold">Sagarmala 2.0 Command Center</p>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden h-8 lg:block" />

          <div className="relative ml-auto hidden w-[320px] items-center lg:flex">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder="Search projects..." />
          </div>

          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-slate-100 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt="User" />
                    <AvatarFallback className="bg-blue-600 text-white font-medium">AD</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium md:inline text-slate-700">Administrator</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-lg rounded-xl">
                <DropdownMenuLabel className="text-xs text-slate-400">Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer hover:bg-slate-50">Profile</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-slate-50">Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Body - Sidebar and Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Scrolls independently */}
        <aside
          className={cn(
            "app-sidebar fixed left-0 top-0 z-50 h-full w-64 transform border-r transition-transform lg:static lg:z-auto lg:h-auto lg:w-64 lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-200/10 p-4 lg:hidden">
              <span className="font-semibold text-white">Navigation</span>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="hidden border-b border-white/10 p-4 lg:block">
              <div className="flex items-center gap-3">
                <div className="app-brand-mark flex h-11 w-11 items-center justify-center rounded-xl">
                  <Anchor className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/60">SAGARMALA 2.0</p>
                  <p className="text-sm font-semibold text-white">Port Control Portal</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "app-sidebar-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium leading-5 transition-colors",
                      active ? "app-sidebar-item-active text-white" : "text-white/70 hover:text-white"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    <span className="min-w-0 flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content - Scrolls independently */}
        <main className="app-main flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
