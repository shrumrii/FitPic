"use client"; 
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUser } from "@/lib/getUser"; 

type UserContextType = { 
    username: string 
    profilePic: string | null
    user_id: string 
    loading: boolean 
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
    // useState for username, profilePic, userID, loading
    // useEffect to fetch user data (same logic as navbar currently)
    // return <UserContext.Provider value={{...}}>{children}</UserContext.Provider>

    const [username, setUsername] = useState(""); 
    const [profilePic, setProfilePic] = useState<string | null>(null)
    const [userID, setUserID] = useState(""); 
    const [loading, setLoading] = useState(false); 

    useEffect(() => { 


        const fetchInfo = async () => { 
            setLoading(true); 
            try { 

                const user = await getUser(); 
                if (user == null) return; 
                
                const response = await fetch(`http://localhost:8000/users/${user.id}`); 

                if (!response.ok) { 
                    console.log(await response.text()); 
                    throw new Error("Failed to get user info"); 
                }

                const result = await response.json(); 
                if (!result.success) { 
                    console.log(result.message);
                    throw new Error("Failed to get user info"); 
                }

                setUserID(user.id); 
                setUsername(result.data.username); 
                setProfilePic(result.data.pfp_url);


            } catch (error) { 
                console.error(error); 
            } finally { 
                setLoading(false); 
            }


        }
        fetchInfo(); 
    }, []) 

    return <UserContext.Provider value={{ username, profilePic, user_id: userID, loading }}>{children}</UserContext.Provider>
}

export function useUser() {
    return useContext(UserContext); 
}

