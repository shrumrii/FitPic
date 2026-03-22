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
                    <div className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-zinc-900 p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsOpen(false)} className="self-end text-xl">✕</button>
                        <Link href="/dashboard" onClick={() => setIsOpen(false)}>My Feed</Link>
                        <Link href="/upload" onClick={() => setIsOpen(false)}>Upload FitPic</Link>
                        <Link href="/friend" onClick={() => setIsOpen(false)}>Find Friends</Link>
                    </div>
                </div>
            )}
            





        </>
    ); 
}