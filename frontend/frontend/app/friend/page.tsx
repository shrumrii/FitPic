"use client"; 
import Navbar from "@/components/navbar" 
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/getUser"; 


export default function Friend() {
    
    const router = useRouter(); 
    const [loading, setLoading] = useState(false); 
    const [usernameSearchString, setUsernameSearchString] = useState(""); 
    const [usernameList, setUsernameList] = useState<{user_id: string, username: string | null}[]>([]); 
    const [searching, setSearching] = useState(false); 
    const [userID, setUserID] = useState(""); 
    const [adding, setAdding] = useState(false); 
    const [popupMessage, setPopupMessage] = useState("");  
    const [followedList, setFollowedList] = useState<string[]>([]); 


    useEffect(() => { 
        const getUserID = async () => { 
            
            setLoading(true); 
            try { 
                
                const user = await getUser(); 

                if (user == null) { 
                    console.log("Redirect to welcome page"); 
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

    const addFriend = async (followingID: string) => { 
        setAdding(true); 

        try { 

            const response = await fetch(`http://localhost:8000/users/${userID}/follow`, {
                method: "POST", 
                headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify({ following_id: followingID })
            }); 

            if (!response.ok) { 
                console.log(await response.text()) 
                throw new Error("error"); 
            }

            const result = await response.json(); 

            //if log into database not successful, send popup msg 
            if (!result.success) { 
                console.log("Add friend not successful"); 
            } else { 
                console.log(`${result.data.following_id} successfully added`); 
                if (!followedList.includes(result.data.following_id)) { 
                    setFollowedList([...followedList, result.data.following_id]) 
                }
            }

        } catch (error) { 
            console.error(error); 
        } finally { 
            setAdding(false); 
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-zinc-100 font-sans dark:bg-black">
            <Navbar/>
            <main className="flex min-h-screen mx-auto w-full flex-col items-center justify-start py-32 px-16 bg-white dark:bg-black">
                <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white sm:text-[5rem]">
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
                                <button className="bg-black text-white rounded-lg px-6 py-3 hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50"
                                    onClick={() => addFriend(username.user_id)}>
                                    {followedList.includes(username.user_id) ? "Following" : "Follow"}
                                </button>
                            </div> 

                        ))}
                    </div>
                }

            </main>
        </div>
    ); 
}
