"use client"; 
import { useRouter } from "next/navigation";

export default function Welcome() {
    
    const router = useRouter(); 

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-100 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black">
                <div className="flex flex-col items-center gap-6 text-center">
                <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                    Welcome to FitPic.  
                </h1>
                <p className="text-lg text-gray-600 dark:text-zinc-400">
                    Post your outfits and share with your friends.
                </p>

                <div className="flex flex-col items-center gap-6 text-center">
                    <button className = "bg-black w-full text-white rounded-lg px-6 py-3 dark:bg-white dark:text-black hover:bg-amber-400 hover:text-black transition-colors" onClick={() => router.push("/signup")}> Sign Up </button>
                    <button className = "border border-black w-full text-black rounded-lg px-6 py-3 dark:border-white dark:text-white hover:border-amber-400 hover:text-amber-400 transition-colors" onClick={() => router.push("/login")}> Log In </button>
                </div>
                
                </div>
            </main>
        </div>
    ); 
}
