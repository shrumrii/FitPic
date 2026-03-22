"use client"; 
import Navbar from "@/components/navbar" 
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner"; 
import { getUser } from "@/lib/getUser"; 

export default function Dashboard() {
    
    const router = useRouter(); 
    const [loading, setLoading] = useState(false);  
    const [feed, setFeed] = useState<{user_id: string, image_id: string, url: string, created_at: string}[]>([]); 

    useEffect(() => { 
        const getUserFeed = async (id: string) => { 

            setLoading(true);

            try { 

                const response = await fetch(`http://localhost:8000/users/${id}/feed`); 
                
                if (!response.ok) { 
                    console.log(await response.text()); 
                    throw new Error("Failed to get feed"); 
                }

                const result = await response.json(); 
                if (!result.success) { 
                    console.log(await result.text());
                    throw new Error("Failed to get feed"); 
                }

                const feed = result.data; 
                setFeed(feed); 

            } catch (error) { 
                console.error(error);
            } finally { 
                setLoading(false); 
            }
        }

        const populateDashboard = async () => { 
            
            setLoading(true); 

            try { 
                
                const user = await getUser(); 

                if (user == null) { 
                    console.log("Redirect to welcome page"); 
                    router.push("/welcome"); 
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
                    router.push("/onboarding"); 
                    return; 
                }
                
                getUserFeed(user.id);

            } catch (error) { 
                console.error("error", error); 
                router.push("/welcome")
            } finally { 
                setLoading(false); 
            }
        }
        populateDashboard(); 
    }, [])

    if (loading) return <Spinner/>; 

    return (
        <div className="flex flex-col min-h-screen bg-zinc-100 font-sans dark:bg-black">
            <Navbar/>
            <main className="flex min-h-screen w-full max-w-3xl mx-auto flex-col items-center justify-start py-32 px-16 bg-white dark:bg-black">

                {
                    feed.length === 0 ? 
                        <div className="flex w-full items-center justify-center mt-16">
                            <p className="text-zinc-400">Nothing in the feed.</p>
                        </div>

                        :

                        /* map posts */ 
                        <div className="grid grid-cols-3 gap-1 w-full mt-8">
                            {feed.map((image) => (
                                <div key={image.image_id} className="aspect-square relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 rounded-sm"> 
                                    <Image src={image.url} alt="fit" fill className="object-cover" />
                                </div> 
                            ))}
                        </div>

                }

            </main>
        </div>
    ); 
}
