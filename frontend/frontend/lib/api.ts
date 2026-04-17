import { logError } from "./logger"

export async function loggedFetch(url: string, options?: RequestInit, user_id?: string) {                                                                           

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