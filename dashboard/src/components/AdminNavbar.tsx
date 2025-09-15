"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/", label: "Home" },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-500 shadow-lg px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Logo / Title */}
        <span className="text-xl sm:text-2xl font-extrabold tracking-wider text-white drop-shadow">
          Admin Dashboard
        </span>

        {/* Hamburger for mobile */}
        <button
          className="sm:hidden flex flex-col gap-[5px] focus:outline-none"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle Menu"
          aria-controls="admin-mobile-menu"
          aria-expanded={menuOpen}
        >
          <span className="w-6 h-[3px] bg-white rounded"></span>
          <span className="w-6 h-[3px] bg-white rounded"></span>
          <span className="w-6 h-[3px] bg-white rounded"></span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden sm:flex gap-4 md:gap-6">
          {navLinks.map((link) => (
            <Link
              key={`desktop-${link.href}`}
              href={link.href}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 ${
                isActive(link.href)
                  ? "bg-white text-blue-700 shadow font-bold"
                  : "text-white hover:bg-blue-800 hover:text-yellow-200"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <div
          id="admin-mobile-menu"
          className="sm:hidden mt-3 flex flex-col gap-2"
          role="menu"
        >
          {navLinks.map((link) => (
            <Link
              key={`mobile-${link.href}`}
              href={link.href}
              className={`block px-4 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                isActive(link.href)
                  ? "bg-white text-blue-700 font-bold"
                  : "text-white hover:bg-blue-800 hover:text-yellow-200"
              }`}
              role="menuitem"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
