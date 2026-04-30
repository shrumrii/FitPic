"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/context/userContext";
import { loggedFetch } from "@/lib/api";
import { useTheme } from "next-themes";

export default function Sidebar() {
    const { username, profilePic, user_id } = useUser() ?? { username: "", profilePic: null, user_id: "" };
    const pathname = usePathname();
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => setMounted(true), []);

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
                    <rect x="1" y="1" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>                                            
                    <circle cx="5.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>                                                            
                    <path d="M1 11l4-4 3 3 2-2 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
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
        <aside className="w-56 flex-shrink-0 h-screen sticky top-0 bg-sidebar border-r border-white/20 flex flex-col py-5">

            {/* profile block */}
            <div className="px-4 pb-5 border-b border-white/20">
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
                <div className="text-sm font-medium text-white">{username}</div>
                <div className="flex gap-3 mt-2">
                    <span className="text-xs text-white/60"><span className="font-medium text-white">{followerCount}</span> followers</span>
                    <span className="text-xs text-white/60"><span className="font-medium text-white">{followingCount}</span> following</span>
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
                                ? "bg-white/20 text-white font-medium"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* bottom section — separated */}
            <div className="px-2 pb-2 border-t border-white/20 pt-2 flex flex-col gap-0.5">
                
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/70">
                    {mounted && (theme === "dark" ? (
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.1 3.1l1 1M11.9 11.9l1 1M11.9 3.1l-1 1M3.1 11.9l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                            <path d="M13.5 10A6 6 0 0 1 6 2.5a6 6 0 1 0 7.5 7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    ))}
                    <span className="flex-1">{mounted ? (theme === "dark" ? "Light mode" : "Dark mode") : "Dark mode"}</span>
                    <button
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className={`w-10 h-5 rounded-full transition-colors duration-300 flex items-center px-0.5 ${
                            mounted && theme === "dark" ? "bg-white/30" : "bg-white/20"
                        }`}
                    >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
                            mounted && theme === "dark" ? "translate-x-5" : "translate-x-0"
                        }`} />
                    </button>
                </div>

                <button
                    onClick={() => router.push("/profile?mode=analyze")}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left text-white/70 hover:bg-white/10 hover:text-white"
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
                            ? "bg-white/20 text-white font-medium"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Upload a FitPic
                </Link>
            </div>

        </aside>
    );
}
