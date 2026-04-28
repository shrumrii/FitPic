export async function logError(error: unknown, user_id?: string) { 
    /**
     * Logs frontend error to backend with user context. 
     * @param {unknown} error - error to log. 
     * @param {string} user_id - user_id to include in error logs.
     */
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    const timestamp = new Date().toISOString()

    try { 
        //send to backend
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs/frontend-error`, {
            method: 'POST', 
            headers: { 
                "Content-Type": 'application/json'
            }, 
            body: JSON.stringify({ timestamp, user_id, message, stack })
        }); 
        
    } catch (error) { 
        console.error("Failed to send log to backend", error) 
    }

}