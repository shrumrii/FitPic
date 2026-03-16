"use client"; 
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

export default function Dashboard() {
    
    const router = useRouter(); 
    const [username, setUsername] = useState(""); 
    const [loading, setLoading] = useState(false); 

    useEffect(() => { 
        const getUsername = async () => { 
            
            setLoading(true); 

            try { 
                
                const { data: { user }, error } = await supabase.auth.getUser(); 
                console.log("data", user); 
                
                if (error) { 
                    console.log("Supabase auth error, redirecting to welcome page"); 
                    router.push("/welcome"); 
                    return; 
                }

                if (!user) { 
                    console.log("User not found, redirecting to welcome page"); 
                    router.push("/welcome"); 
                    return; 
                }
                
                //check if uid in database 
                const response = await fetch(`http://localhost:8000/users/${user.id}`); 
                
                if (!response.ok) { 
                    console.log(await response.text())  
                    throw new Error("Failed to get user id"); 
                }

                const result = await response.json();

                if (!result.success) { 
                    console.log(result.message); 
                    console.log(`${user.id} has made an account, but has not created a profile. Redirecting to onboarding.`); 
                    router.push("/onboarding"); 
                    return; 
                }

                setUsername(result.data.username); 

            } catch (error) { 
                console.error("error", error); 
                router.push("/welcome")
            } finally { 
                setLoading(false); 
            }
        }
        getUsername(); 
    }, [])

    return (
        <div className="flex flex-col min-h-screen bg-zinc-100 font-sans dark:bg-black">

            <nav className="w-full bg-white dark:bg-zinc-900 px-8 py-4 flex items-center justify-between"> 
                <h1 className="text-amber-400 font-semibold text-xl"> FitPic </h1>
                <span className="text-amber-400 font-semibold text-xl"> {loading ? "..." : username} </span>
            </nav>

            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        
                
                
            </main>
        </div>
    ); 
}
