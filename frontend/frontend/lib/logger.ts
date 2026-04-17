export async function logError(error: unknown, user_id?: string) { 


    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    const timestamp = new Date().toISOString()

    try { 

        //send to backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logs/frontend-error`, {
            method: 'POST', 
            headers: { 
                "Content-Type": 'application/json'
            }, 
            body: JSON.stringify({ timestamp, user_id, message, stack })
        }); 

    } catch { 
        console.error("Failed to send log to backend", error) 
    }

}