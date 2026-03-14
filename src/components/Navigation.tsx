'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronRight } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  const navItems: NavItem[] = [
    { label: '대시보드', href: '/' },
    { label: '공모일정', href: '/calendar' },
    { label: '수익률 분석', href: '/analysis' },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto glass-morphism px-6 md:px-8 py-3 flex justify-between items-center bg-black/40 border-white/10 relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white italic group-hover:scale-110 transition-transform">M</div>
          <span className="text-xl font-black uppercase tracking-tighter premium-gradient-text">IPO Master</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide text-slate-300">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="hover:text-blue-400 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button 
            onClick={toggleMenu}
            className="p-2 text-slate-300 hover:text-white transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-4 md:hidden overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 p-2 space-y-1 border border-white/20 bg-[#0f172a] rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between w-full px-5 py-4 rounded-2xl hover:bg-white/10 text-slate-200 font-bold transition-all group/item"
              >
                <span className="group-hover/item:text-blue-400 transition-colors">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover/item:text-blue-400 transition-all translate-x-0 group-hover/item:translate-x-1" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
