import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Calendar,
  BarChart3,
  MessageSquare,
  Settings,
  FileText,
  Shield,
  Scale,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Lawyer Review", url: "/admin/lawyers", icon: UserCheck },
  { title: "Users & Firms", url: "/admin/users", icon: Users },
  { title: "Bookings & Payments", url: "/admin/bookings", icon: Calendar },
  { title: "Content Moderation", url: "/admin/moderation", icon: Shield },
  { title: "Practice Areas", url: "/admin/practice-areas", icon: Scale },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Support", url: "/admin/support", icon: MessageSquare },
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "Audit Log", url: "/admin/audit", icon: FileText },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.exact}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
