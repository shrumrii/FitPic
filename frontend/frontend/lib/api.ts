import { logError } from "./logger"

export async function loggedFetch(url: string, options?: RequestInit, user_id?: string) {                                                                           
    /**
     * Wrapper around fetch that logs errors to backend with user context.  
     * @param {string} url - url to fetch. 
     * @param {RequestInit} options - fetch options.
     * @param {string} user_id - user_id to include in error logs.
     */
    try { 
        const response = await fetch(url, options); 

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