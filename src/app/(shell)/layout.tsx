import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/components/auth/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGuard>
          <div className="h-screen flex bg-[#F5F7FA] text-slate-900 antialiased overflow-hidden">
            <Sidebar />
            <div className="ml-[230px] flex-1 h-screen flex flex-col min-w-0 bg-[#F5F7FA] overflow-hidden">
              <Topbar />
              <main className="p-6 flex-1 overflow-y-auto min-w-0">{children}</main>
            </div>
          </div>
        </AuthGuard>
      </ToastProvider>
    </AuthProvider>
  );
}
