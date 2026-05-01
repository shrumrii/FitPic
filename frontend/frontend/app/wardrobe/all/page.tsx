"use client";
import Sidebar from "@/components/sidebar"; 
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import { useUser } from "@/context/userContext";
import { loggedFetch } from "@/lib/api"; 


export default function All() {

    const { user_id, loading } = useUser() ?? { user_id: "", loading: false};
    const router = useRouter();

    const [analyzedLoading, setAnalyzedLoading] = useState(false); 
    const [images, setImages] = useState<{image_id: string, url: string, analyzed_at: string}[]>([])
    
    useEffect(() => {

        getAnalyzed(); 
    }, [loading, user_id])

    const getAnalyzed = async () => { 
        if (loading || !user_id) return; 

        setAnalyzedLoading(true); 
        try { 
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/analyzed-images`, undefined, user_id); 
            
            if (!response.ok) throw new Error("Could not fetch analyzed images."); 
            const result = await response.json(); 
            if (!result.success) { 
                console.error("Could not fetch analyzed images."); 
                return; 
            }

            setImages(result.data); 

        } catch (error) { 
            console.error(error); 
        } finally { 
            setAnalyzedLoading(false); 
        }
    } 

    if (loading || analyzedLoading) return <Spinner/>;

    return (
        <div className="flex min-h-screen bg-white dark:bg-black">
            <Sidebar/> 
            <main className="w-full px-6 py-8">
                <button onClick={() => router.push("/wardrobe")} className="text-xs text-zinc-400 hover:text-brand-pink dark:hover:text-brand-orange transition-colors mb-4">
                    ← Back to Wardrobe
                </button>
                <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white mb-6">
                    My Analyzed Images
                </h1>

                {images.length === 0 ?
                    <div className="flex w-full items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <p className="text-zinc-400 text-sm">You have no analyzed images.</p>
                            <p className="text-zinc-300 dark:text-zinc-600 text-xs">Analyze and journal posts to see them here.</p>
                        </div>
                    </div>

                    :

                    /* map posts */
                    <div className="grid grid-cols-3 gap-1 w-full">
                        {images.map((image) => (
                            <div key={image.image_id} onClick={() => router.push(`/analyze/${image.image_id}?image_url=${encodeURIComponent(image.url)}`)} 
                                className="cursor-pointer aspect-[4/5] relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                <Image src={image.url} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" />
                            </div>
                        ))}
                    </div> 
                }

            </main>
        </div>
    );
}
