import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  Calendar,
  Search,
  SearchCode,
  Package,
  Users,
  LogOut,
  Database,
  UserCog,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/unbilled", label: "Unbilled", icon: FileText },
    { to: "/open-orders", label: "Open Orders", icon: ShoppingCart },
    { to: "/last-7-days", label: "Last 7 Days", icon: Calendar },
    { to: "/invoice-search", label: "Invoice Search", icon: Search },
    { to: "/master-search", label: "Master Search", icon: SearchCode },
    { to: "/stock", label: "Stock", icon: Package },
    { to: "/customers", label: "Customers", icon: Users },
  ];

  const adminLinks = isAdmin
    ? [
        { to: "/admin-data", label: "Admin Data", icon: Database },
        { to: "/admin-users", label: "Admin Users", icon: UserCog },
      ]
    : [];

  const NavContent = () => (
    <>
      <div className="space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          return (
            <Link key={link.to} to={link.to}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                <Icon className="mr-2 h-4 w-4" />
                {link.label}
              </Button>
            </Link>
          );
        })}
      </div>
      {adminLinks.length > 0 && (
        <>
          <div className="my-4 h-px bg-border" />
          <div className="space-y-1">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link key={link.to} to={link.to}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {link.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="flex h-16 items-center px-4 gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-16 items-center border-b px-4">
                <h2 className="font-semibold">Menu</h2>
              </div>
              <div className="p-4 space-y-4">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="text-lg font-semibold">Laxmi Hybrid ERP</h1>
          
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user.email?.split("@")[0]}
              </span>
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {isAdmin ? "Admin" : "User"}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
          <div className="p-4 space-y-4">
            <NavContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
