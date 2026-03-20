"use client"; 
import Navbar from "@/components/navbar" 
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

export default function Friend() {
    
    const router = useRouter(); 
    const [loading, setLoading] = useState(false); 
    const [usernameSearchString, setUsernameSearchString] = useState(""); 
    const [usernameList, setUsernameList] = useState<{user_id: string, username: string | null}[]>([]) 
    const [searching, setSearching] = useState(false); 
    const [userID, setUserID] = useState(""); 

    useEffect(() => { 
        const getUserID = async () => { 
            
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
                setUserID(user.id); 

            } catch (error) { 
                console.error(error); 
            } finally { 
                setLoading(false); 
            }
        }
        getUserID(); 
    }, [])

    //when user clicks 
    const handleSearch = async () => { 

        setLoading(true);
        try { 

            const response = await fetch(`http://localhost:8000/users/search?username=${usernameSearchString}`); 
            
            if (!response.ok) { 
                console.log(await response.text())  
                throw new Error("Failed to search for username"); 
            }

            const result = await response.json(); 
            setUsernameList(result.data); 

            setSearching(true); 

        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false); 

        }
    
    }

    return (
        <div className="flex flex-col min-h-screen bg-zinc-100 font-sans dark:bg-black">
            <Navbar/>
            <main className="flex min-h-screen mx-auto w-full flex-col items-center justify-start py-32 px-16 bg-white dark:bg-black">
                <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white sm:text-[5rem]">
                    Find a friend
                </h1>

                <input 
                    type="text"
                    value={usernameSearchString}
                    placeholder="Search for a username..."
                    onChange={(e) => {
                        setUsernameSearchString(e.target.value); 
                        if (!e.target.value) setSearching(false);
                    }}
                    className="border border-zinc-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-amber-400 transition-colors" 
                /> 
                
                {/* input button */} 
                <button className="bg-black text-white rounded-lg px-6 py-3 w-full hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50" 
                    onClick={handleSearch} disabled={!usernameSearchString}> 
                    Search
                </button>

                {/* friends map */}
                {searching && usernameList.length === 0 && (
                    <p className="text-zinc-400">No friends found.</p>
                )}

                {searching && usernameList.length > 0 &&    
                    <div className="flex flex-col gap-1 w-full mt-8 max-w-md mx-auto">
                        {usernameList.map((username) => (
                            <div key={username.user_id} className="flex items-center justify-between w-full">
                                <p> {username.username} </p>
                                <button className="bg-black text-white rounded-lg px-6 py-3 hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50">
                                    Add friend
                                </button>
                            </div> 

                        ))}
                    </div>
                }

            </main>
        </div>
    ); 
}
