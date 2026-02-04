/**
 * Sidebar Component with Collapsible Functionality
 * 
 * @author SOFIA - Builder
 * @id IMPL-20260204-SIDEBAR
 * @ref context/SPEC-UX-UI.md
 */

"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { DashboardNav } from "@/components/dashboard/nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { UserRole } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

interface SidebarProps {
    userRole?: UserRole | null;
    userEmail?: string | null;
}

export function Sidebar({ userRole, userEmail }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const pathname = usePathname();

    // Hydration fix & LocalStorage persistence
    useEffect(() => {
        const stored = localStorage.getItem("sidebar_collapsed");
        if (stored) {
            setIsCollapsed(JSON.parse(stored));
        }
        setIsHydrated(true);
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar_collapsed", JSON.stringify(newState));
    };

    // Only render after hydration to avoid mismatch
    if (!isHydrated) {
        return (
            <aside className="hidden md:flex w-72 flex-col bg-card border-r border-border/50 p-6 z-20 shadow-2xl shadow-black/5 h-screen sticky top-0">
                {/* Loading skeleton or empty state */}
            </aside>
        );
    }

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col bg-card border-r border-border/50 z-20 shadow-xl shadow-black/5 h-screen sticky top-0 transition-all duration-300 ease-in-out relative group",
                isCollapsed ? "w-20 p-4" : "w-72 p-6"
            )}
        >
            {/* Toggle Button - Visible only on hover or when collapsed */}
            <Button
                variant="outline"
                size="icon"
                className="absolute -right-3 top-20 h-6 w-6 rounded-full shadow-md z-50 opacity-0 group-hover:opacity-100 transition-opacity bg-background border-border"
                onClick={toggleSidebar}
            >
                {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </Button>

            {/* Header / Logo */}
            <div className={cn("flex items-center gap-3 mb-10 transition-all duration-300", isCollapsed ? "px-0 justify-center" : "px-2")}>
                <div className="h-10 w-10 bg-primary rounded-2xl flex shrink-0 items-center justify-center shadow-lg shadow-primary/20">
                    <span className="text-primary-foreground font-black text-lg">R</span>
                </div>

                {!isCollapsed && (
                    <div className="overflow-hidden whitespace-nowrap fade-in animate-in duration-300">
                        <h1 className="text-lg font-black tracking-tight leading-none">Roda Llantas</h1>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Admin Panel</span>
                    </div>
                )}
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <DashboardNav userRole={userRole} variant="sidebar" isCollapsed={isCollapsed} />
            </div>

            {/* Footer / User Profile */}
            <div className={cn("mt-auto transition-all duration-300", isCollapsed ? "pt-4" : "pt-6 border-t border-border/50")}>
                <div className={cn("bg-muted/30 rounded-3xl flex items-center transition-all duration-300", isCollapsed ? "p-2 justify-center bg-transparent" : "p-4 justify-between")}>

                    {!isCollapsed && (
                        <div className="overflow-hidden whitespace-nowrap fade-in animate-in duration-300">
                            <p className="text-xs font-bold truncate max-w-[120px]">{userEmail?.split('@')[0]}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{userRole || 'Vendedor'}</p>
                        </div>
                    )}

                    <UserNav email={userEmail} role={userRole} align={isCollapsed ? "start" : "end"} />
                </div>
            </div>
        </aside>
    );
}
