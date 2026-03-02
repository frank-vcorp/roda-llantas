"use client";
import { ChevronDown } from "lucide-react";

export function ScrollToSection({ targetId }: { targetId: string }) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <button
            onClick={handleClick}
            className="mt-16 flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors animate-bounce bg-transparent border-0 cursor-pointer"
        >
            <span className="text-xs">Ver más</span>
            <ChevronDown className="h-5 w-5" />
        </button>
    );
}
