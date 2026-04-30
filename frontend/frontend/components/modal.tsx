"use client";
import React from "react";

export default function Modal({ onClose, children }: { onClose: () => void, children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden max-w-2xl w-full relative" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}
