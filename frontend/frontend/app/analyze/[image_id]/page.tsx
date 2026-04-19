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
    const image_url = searchParams.get("image_url") ?? undefined; 
    const [loading, setLoading] = useState(false);  
    const [error, setError] = useState("");
    const errorTimeout = useRef<NodeJS.Timeout | null>(null);
    const [analysis, setAnalysis] = useState(""); 

    const router = useRouter();

    useEffect(() => {
        const analyze = async () => { 
            
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
                    if (errorTimeout.current) clearTimeout(errorTimeout.current); 
                    errorTimeout.current = setTimeout(() => setError(""), 5000);
                    return; 
                }

                setAnalysis(result.analysis); 

            } catch (error) { 
                console.error(error); 
            } finally { 
                setLoading(false);   
            }
        }
        analyze(); 
    }, [])

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Navbar/>
            <main className="w-full max-w-xl mx-auto px-6 py-8">

                <button onClick={() => router.back()} className="text-sm text-zinc-500 hover:text-black dark:hover:text-white mb-6 inline-block">
                    ← Back
                </button>

                {image_url && (
                    <img src={image_url} alt="outfit" className="w-full rounded-xl object-cover mb-6" />
                )}

                <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Style Analysis</h2>

                {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

                {loading ? (
                    <p className="text-sm text-zinc-400">Analyzing your outfit...</p>
                ) : (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{analysis}</p>
                )}

            </main>
        </div>
    );
}
