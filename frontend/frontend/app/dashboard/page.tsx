"use client"; 
import Navbar from "@/components/navbar" 
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import Spinner from "@/components/spinner"; 

export default function Dashboard() {
    
    const router = useRouter(); 
    const [loading, setLoading] = useState(false); 

    useEffect(() => { 
        const ensureUserLogged = async () => { 
            
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

            } catch (error) { 
                console.error("error", error); 
                router.push("/welcome")
            } finally { 
                setLoading(false); 
            }
        }
        ensureUserLogged(); 
    }, [])

    if (loading) return <Spinner/>; 

    return (
        <div className="flex flex-col min-h-screen bg-zinc-100 font-sans dark:bg-black">
            <Navbar/>
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
            </main>
        </div>
    ); 
}
