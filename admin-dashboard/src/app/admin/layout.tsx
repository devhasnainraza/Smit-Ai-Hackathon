

import React from "react";
import AdminNavbar from "@/components/AdminNavbar";
import KommunicateWidget from "@/components/KommunicateWidget";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <KommunicateWidget />
      <AdminNavbar />
      <main className="px-4 py-6">{children}</main>
    </div>
  );
}