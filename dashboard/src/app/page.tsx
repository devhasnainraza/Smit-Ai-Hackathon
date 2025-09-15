import Link from "next/link";
import KommunicateWidget from "@/components/KommunicateWidget";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-[#6f7b6f] p-4">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#556155] mb-6 text-center">Welcome to Foodi Admin Dashboard!</h1>
      <Link href="/admin/orders" className="px-4 sm:px-6 py-2 sm:py-3 bg-[#556155] text-white rounded shadow hover:bg-[#475247] transition text-sm sm:text-base">Go to Admin Dashboard</Link>
      <KommunicateWidget />
    </div>
  );
}