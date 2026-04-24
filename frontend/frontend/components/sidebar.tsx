"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/userContext";
import { loggedFetch } from "@/lib/api";

export default function Sidebar() {
    const { username, profilePic, user_id } = useUser() ?? { username: "", profilePic: null, user_id: "" };
    const pathname = usePathname();
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [analyzeModalOpen, setAnalyzeModalOpen] = useState(false);

    useEffect(() => {
        if (!user_id) return;
        const fetchCounts = async () => {
            const [followersRes, followingRes] = await Promise.all([
                loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/followers`, undefined, user_id),
                loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/following`, undefined, user_id),
            ]);
            const followers = await followersRes.json();
            const following = await followingRes.json();
            if (followers.success) setFollowerCount(followers.data.length);
            if (following.success) setFollowingCount(following.data.length);
        };
        fetchCounts();
    }, [user_id]);

    const navItems = [
        {
            label: "My Feed",
            href: "/dashboard",
            icon: (
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
            ),
        },
        {
            label: "My Gallery",
            href: "/profile",
            icon: (
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
            ),
        },
        {
            label: "Wardrobe",
            href: "/wardrobe",
            icon: (
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M5 3V2M11 3V2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M2 7h12" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
            ),
        },
        {
            label: "Favorites",
            href: "/favorites",
            icon: (
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M3 2h10v12l-5-3-5 3V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
            ),
        },
        {
            label: "Find Friends",
            href: "/friend",
            icon: (
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1 14c0-3 2-5 5-5s5 2 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M11 7h4M13 5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
            ),
        },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <aside className="w-56 flex-shrink-0 h-screen sticky top-0 bg-white dark:bg-black border-r border-zinc-100 dark:border-zinc-800 flex flex-col py-5">

            {/* profile block */}
            <div className="px-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                <Link href="/profile">
                    <div className="w-11 h-11 rounded-full overflow-hidden mb-3 cursor-pointer">
                        {profilePic ? (
                            <Image src={profilePic} alt={username} width={44} height={44} className="object-cover w-full h-full"/>
                        ) : (
                            <div className="w-11 h-11 rounded-full bg-amber-400 flex items-center justify-center font-semibold text-black">
                                {username[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                </Link>
                <div className="text-sm font-medium text-black dark:text-white">{username}</div>
                <div className="flex gap-3 mt-2">
                    <span className="text-xs text-zinc-500"><span className="font-medium text-black dark:text-white">{followerCount}</span> followers</span>
                    <span className="text-xs text-zinc-500"><span className="font-medium text-black dark:text-white">{followingCount}</span> following</span>
                </div>
            </div>

            {/* main nav */}
            <nav className="flex flex-col gap-0.5 px-2 pt-3 flex-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive(item.href)
                                ? "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-medium"
                                : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* bottom section — separated */}
            <div className="px-2 pb-2 border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-0.5">
                <button
                    onClick={() => setAnalyzeModalOpen(true)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Analyze an Outfit
                </button>
                <Link
                    href="/upload"
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive("/upload")
                            ? "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-medium"
                            : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                    }`}
                >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Upload a FitPic
                </Link>
            </div>

            {/* analyze modal — empty for now */}
            {analyzeModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setAnalyzeModalOpen(false)}>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 w-96 shadow-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-black dark:text-white">Analyze an Outfit</h2>
                            <button onClick={() => setAnalyzeModalOpen(false)} className="text-zinc-400 hover:text-black dark:hover:text-white text-lg">✕</button>
                        </div>
                        <p className="text-sm text-zinc-400">Coming soon — pick an outfit to analyze.</p>
                    </div>
                </div>
            )}

        </aside>
    );
}
