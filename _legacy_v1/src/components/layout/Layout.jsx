import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';

export function Layout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden md:block h-full">
                <Sidebar className="h-full" />
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <Sidebar className="relative z-10 w-[80%] max-w-xs shadow-2xl" onClose={() => setIsMobileMenuOpen(false)} />
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-white z-20"
                    >
                        <X size={24} />
                    </button>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Header */}
                <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4 sticky top-0 z-30">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="ml-4 font-bold text-lg">LingoDrift</span>
                    </div>    </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                    <div className="max-w-6xl mx-auto w-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
