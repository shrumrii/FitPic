"use client"; 
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { useState, useEffect } from "react";

export default function Home() { 

    const router = useRouter(); 
    const [loading, setLoading] = useState(true); 

    useEffect(() => { 
        const checkUser = async () => { 
            const { data: { user }, error } = await supabase.auth.getUser(); 
            console.log("user", user); 
             

            if (error) { 
                console.error("Failure to retrieve user from supabase auth", error);
            }
            setLoading(false);

            if (!user) { 
                console.log("No user found, redirect to welcome page"); 
                router.push("/welcome");
            } else { 
                console.log("User found, redirect to onboarding page");
                router.push("/welcome"); 
            }
        }
        checkUser(); 
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                    {loading ? <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"></div> : null}
                </div>
            </main>
        </div>
    ); 
}