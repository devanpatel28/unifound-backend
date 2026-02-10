'use client';

import { AdminProvider } from '@/contexts/AdminContext';
import { Toaster } from '@/components/ui/sonner';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
                <AdminProvider>
        <div className="flex h-screen overflow-hidden">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto bg-slate-50">
                    {children}
                    <Toaster />
            </main>
        </div>
                </AdminProvider>

    );
}
