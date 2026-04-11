"use client"; 
import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from 'next/link'; 
import { useUser } from "@/context/userContext";

export default function Sidebar() { 
    const [isOpen, setIsOpen] = useState(false);


    return (
        <>
            <button onClick={() => setIsOpen(true)} className="text-2xl font-bold cursor-pointer">
                ☰
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
                    <div className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-black border-r border-zinc-100 dark:border-zinc-800 p-6 flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-amber-400 font-semibold text-lg">FitPic</span>
                            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors">✕</button>
                        </div>
                        <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-amber-400 dark:hover:text-amber-400 transition-colors px-2 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900">My Feed</Link>
                        <Link href="/upload" onClick={() => setIsOpen(false)} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-amber-400 dark:hover:text-amber-400 transition-colors px-2 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900">Upload FitPic</Link>
                        <Link href="/friend" onClick={() => setIsOpen(false)} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-amber-400 dark:hover:text-amber-400 transition-colors px-2 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900">Find Friends</Link>
                        <Link href="/favorites" onClick={() => setIsOpen(false)} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-amber-400 dark:hover:text-amber-400 transition-colors px-2 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900">My Favorites</Link>
                        <Link href="/rankings" onClick={() => setIsOpen(false)} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-amber-400 dark:hover:text-amber-400 transition-colors px-2 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900">My Rankings</Link>
                    </div>
                </div>
            )}
            





        </>
    ); 
}