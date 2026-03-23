"use client";
import React from "react";

export default function Modal({ onClose, children }: { onClose: () => void, children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden max-w-2xl w-full relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white text-sm transition-colors"
                >
                    ✕
                </button>
                {children}
            </div>
        </div>
    );
}
