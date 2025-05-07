
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarFooter,
  SidebarInset
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  FileInvoice, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  Bell, 
  MessageSquareText,
  LogOut,
  Users,
  PenTool
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center px-2">
              <div className="relative h-10 w-10 overflow-hidden rounded-md bg-blue-500 text-white flex items-center justify-center font-bold text-2xl mr-2">
                NB
              </div>
              <h1 className="text-lg font-semibold">NeoBiz</h1>
            </div>
            <SidebarTrigger />
          </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/dashboard')} 
                  tooltip="Tableau de bord"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Tableau de bord</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/invoices')} 
                  tooltip="Facturation"
                >
                  <FileInvoice className="h-5 w-5" />
                  <span>Facturation</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/tasks')} 
                  tooltip="Tâches"
                >
                  <ClipboardList className="h-5 w-5" />
                  <span>Tâches & Projets</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/ai-assistant')} 
                  tooltip="Assistant IA"
                >
                  <PenTool className="h-5 w-5" />
                  <span>Assistant IA</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/finances')} 
                  tooltip="Finances"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Finances</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/support')} 
                  tooltip="Support"
                >
                  <MessageSquareText className="h-5 w-5" />
                  <span>Support</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={() => navigate('/admin')} 
                    tooltip="Administration"
                  >
                    <Users className="h-5 w-5" />
                    <span>Administration</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => navigate('/settings')} 
                  tooltip="Paramètres"
                >
                  <Settings className="h-5 w-5" />
                  <span>Paramètres</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip="Déconnexion">
                  <LogOut className="h-5 w-5" />
                  <span>Déconnexion</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            <div className="mt-4 flex items-center px-4 pb-4">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" />
                <AvatarFallback>{getInitials(user?.user_metadata?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="ml-3 space-y-0.5 text-sm">
                <div className="font-medium">{user?.user_metadata?.full_name || "Utilisateur"}</div>
                <div className="text-muted-foreground">{user?.email}</div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className="h-16 border-b bg-background flex items-center justify-between px-6">
            <SidebarTrigger />
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={() => navigate('/notifications')}>
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-4rem)] overflow-y-auto p-6">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
