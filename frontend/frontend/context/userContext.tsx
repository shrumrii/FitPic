"use client"; 
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUser } from "@/lib/getUser";
import supabase from "@/lib/supabase";

type UserContextType = { 
    username: string 
    profilePic: string | null
    user_id: string 
    loading: boolean 
    age: string | null
    refreshUser: () => void
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
    // useState for username, profilePic, userID, loading
    // useEffect to fetch user data (same logic as navbar currently)
    // return <UserContext.Provider value={{...}}>{children}</UserContext.Provider>

    const [username, setUsername] = useState(""); 
    const [profilePic, setProfilePic] = useState<string | null>(null)
    const [userID, setUserID] = useState(""); 
    const [loading, setLoading] = useState(true); 
    const [age, setAge] = useState("");

    const fetchInfo = async () => { 
        setLoading(true); 
        try { 

            const user = await getUser(); 
            if (user == null) return; 
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`); 

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
            setAge(result.data.age); 


        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false); 
        }
    }

    useEffect(() => {
        fetchInfo();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
                fetchInfo();
            }
            if (event === "SIGNED_OUT") {
                setUserID("");
                setUsername("");
                setProfilePic(null);
                setAge("");
            }
        });

        return () => subscription.unsubscribe();
    }, [])

    return <UserContext.Provider value={{ username, profilePic, user_id: userID, loading, age, refreshUser: fetchInfo }}>{children}</UserContext.Provider>
}

export function useUser() {
    return useContext(UserContext); 
}

