"use client"; 
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { useState, useEffect } from "react";
import { loggedFetch } from "@/lib/api";

export default function Home() { 

    const router = useRouter(); 
    const [loading, setLoading] = useState(true); 

    useEffect(() => { 
        const checkUser = async () => { 

            try { 
                const { data: { user }, error } = await supabase.auth.getUser(); 
                console.log("user", user); 

                if (error) { 
                    router.push("/welcome"); 
                    return; 
                }

                if (!user) { 
                    console.log("No user found, redirect to welcome page");
                    router.push("/welcome");
                    return; 
                } 

                const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`, undefined, user.id);
                const result = await response.json();

                if (result.success) { 
                    console.log("User exists in database, redirect to dashboard");
                    router.push("/dashboard"); 
                } else { 
                    console.log("User not found in database, redirect to onboarding page");
                    router.push("/onboarding"); 
                }
            } catch (error) {
                console.error(error);
                router.push("/welcome");
            } finally { 
                setLoading(false); 
            }
        }
        checkUser(); 
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-100 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black">
                <div className="flex flex-col items-center gap-6 text-center">
                    {loading ? <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"></div> : null}
                </div>
            </main>
        </div>
    ); 
}