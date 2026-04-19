"use client";
import Navbar from "@/components/navbar"
import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/getUser";
import { loggedFetch } from "@/lib/api";
import { useSearchParams } from "next/navigation";

export default function Analyze({ params }: { params: Promise<{ image_id: string }> }) {

     const { image_id } = use(params);
    const searchParams = useSearchParams();                                                                                                    
    const user_id = searchParams.get("user_id") ?? undefined; 
    const image_url = decodeURIComponent(searchParams.get("image_url") ?? "") || undefined; 
    const [loading, setLoading] = useState(false);  
    const [error, setError] = useState("");
    const [analysis, setAnalysis] = useState(""); 
    const [imageLoaded, setImageLoaded] = useState(false); 
    const router = useRouter();

    useEffect(() => {
        analyze(); 
    }, [])

    const analyze = async () => { 
        setError(""); 
        try { 
            setLoading(true); 
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image_id}/analyze`, undefined, user_id); 

            if (!response.ok) { 
                console.error("Could not analyze image.")
                throw new Error("Could not analyze image.")
            }
        
            const result = await response.json(); 

            if (!result.success) { 
                setError(result.message); 
                return; 
            }

            setAnalysis(result.analysis); 

        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false);   
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Navbar/>
            <main className="w-full max-w-xl mx-auto px-6 py-8">

                <button onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-black dark:hover:text-white mb-6 inline-block">
                    ← Back
                </button>

                {image_url && (
                    <img src={image_url} onLoad={() => setImageLoaded(true)} alt="outfit" className={`w-full rounded-xl object-cover mb-6 transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}/>
                )}

                <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Style Analysis</h2>

                {error && (
                    <div> 
                        <p className="text-sm text-red-500 mb-4">{error}</p>
                        <button className="text-sm text-zinc-500 hover:text-black dark:hover:text-white mb-6 inline-block" 
                            onClick={() => analyze()} 
                        >Try again</button>
                    </div>
                )} 

                {loading ? (
                    <p className="text-sm text-zinc-400">Analyzing your outfit...</p>
                ) : (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{analysis}</p>
                )}

            </main>
        </div>
    );
}
