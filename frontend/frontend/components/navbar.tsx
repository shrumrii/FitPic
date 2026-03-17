"use client"; 
import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from 'next/link'; 

export default function Navbar() {

    const [username, setUsername] = useState(""); 
    const [loading, setLoading] = useState(false); 
    const [profilePic, setProfilePic] = useState<string | null>(null); 
    const router = useRouter(); 
    

    useEffect(() => { 
        const getUsername = async () => { 
            
            setLoading(true); 

            try { 
                
                const { data: { user }, error } = await supabase.auth.getUser(); 
                console.log("data", user); 
                
                if (error) { 
                    console.log("Supabase auth error, redirecting to welcome page"); 
                    return; 
                }

                if (!user) { 
                    console.log("User not found, redirecting to welcome page"); 
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
                    return; 
                }

                setUsername(result.data.username); 
                setProfilePic(result.data.pfp_url)

            } catch (error) { 
                console.error("error", error); 
            } finally { 
                setLoading(false); 
            }
        }
        getUsername(); 
    }, [])


    return (<nav className="w-full bg-white dark:bg-zinc-900 px-8 py-4 flex items-center justify-between"> 
                <Link href="/dashboard"> <h1 className="text-amber-400 font-semibold text-xl"> FitPic </h1> </Link>
                
                <div className="flex items-center gap-3">

                    <button className="bg-black text-white rounded-lg px-6 py-3 hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50" 
                        onClick={() => router.push("/upload")}> Upload FitPic
                    </button>  

                    <span className="text-amber-400 font-semibold text-xl"> {username} </span>

                    <Link href="/profile"> <div className="w-10 h-10 rounded-full overflow-hidden">
                        {profilePic ? <Image src={profilePic} alt={username[0]} width={40} height={40}/> : 
                        <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center font-semibold"> {username[0]?.toUpperCase()}</div>
                        } 
                    </div> </Link>
                        
                </div> 


                
            </nav>); 
}   