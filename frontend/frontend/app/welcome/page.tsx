"use client";
import { useRouter } from "next/navigation";

export default function Welcome() {

    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-6">
            <main className="w-full max-w-sm flex flex-col gap-8">
                <div className="flex flex-col gap-2 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white">
                        FitPic
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Post your outfits and share with your friends.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button className="bg-black text-white text-sm font-medium rounded-lg px-5 py-2.5 w-full hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black" onClick={() => router.push("/signup")}>
                        Sign Up
                    </button>
                    <button className="border border-zinc-200 dark:border-zinc-700 text-black dark:text-white text-sm font-medium rounded-lg px-5 py-2.5 w-full hover:border-amber-400 hover:text-amber-400 transition-colors" onClick={() => router.push("/login")}>
                        Log In
                    </button>
                </div>
            </main>
        </div>
    );
}
