import { logError } from "./logger"
import supabase from "./supabase"

export async function loggedFetch(url: string, options?: RequestInit, user_id?: string) {                                                                           
    /**
     * Wrapper around fetch that logs errors to backend with user context.  
     * @param {string} url - url to fetch. 
     * @param {RequestInit} options - fetch options.
     * @param {string} user_id - user_id to include in error logs.
     */
    try { 
        //get supabase auth session and JWT  
        const session = await supabase.auth.getSession(); 
        const access_token = session.data.session?.access_token;

        //change if some endpoints don't require authentication 
        if (!access_token) throw new Error("User not authenticated."); 

        //merge with options 
        const mergedOptions = { 
            ...options, 
            headers: { 
                ...options?.headers, 
                Authorization: `Bearer ${access_token}` 
            }
        }

        const response = await fetch(url, mergedOptions); 

        if (!response.ok) { 
            const error = new Error(`HTTP ${response.status}`)                                                                                     
            logError(error, user_id)                                                                                                               
            throw error
        }
        return response;

    } catch (error) { 
        logError(error, user_id); 
        throw error;  //rethrow error so component catch still fires 
    }
} 