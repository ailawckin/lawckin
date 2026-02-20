import { Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { LawyerReview } from "@/components/admin/LawyerReview";
import { AuditLog } from "@/components/admin/AuditLog";
import { UsersAndFirms } from "@/components/admin/UsersAndFirms";
import { BookingsAndPayments } from "@/components/admin/BookingsAndPayments";
import { Analytics } from "@/components/admin/Analytics";
import { Support } from "@/components/admin/Support";
import { Settings } from "@/components/admin/Settings";
import { ContentModeration } from "@/components/admin/ContentModeration";
import { PracticeAreaManagement } from "@/components/admin/PracticeAreaManagement";

const Admin = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center px-6 bg-background">
            <SidebarTrigger />
            <div className="ml-4">
              <h1 className="text-xl font-bold text-primary">LAWCKIN Admin</h1>
            </div>
          </header>
          <main className="flex-1 p-6 bg-muted/30">
            <Routes>
              <Route index element={<AdminOverview />} />
              <Route path="lawyers" element={<LawyerReview />} />
              <Route path="users" element={<UsersAndFirms />} />
              <Route path="bookings" element={<BookingsAndPayments />} />
              <Route path="moderation" element={<ContentModeration />} />
              <Route path="practice-areas" element={<PracticeAreaManagement />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="support" element={<Support />} />
              <Route path="settings" element={<Settings />} />
              <Route path="audit" element={<AuditLog />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
