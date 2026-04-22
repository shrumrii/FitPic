"use client";
import Navbar from "@/components/navbar"
import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { loggedFetch } from "@/lib/api";
import { useSearchParams } from "next/navigation";

export default function Analyze({ params }: { params: Promise<{ image_id: string }> }) {

     const { image_id } = use(params);
    const searchParams = useSearchParams();                                                                                                    
    const user_id = searchParams.get("user_id") ?? undefined; 
    const image_url = decodeURIComponent(searchParams.get("image_url") ?? "") || undefined; 
    const analysis = decodeURIComponent(searchParams.get("analysis") ?? "") || undefined;
    const tagsParam = searchParams.get("tags");
    const initialTags = tagsParam ? JSON.parse(decodeURIComponent(tagsParam)) : null;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [imageLoaded, setImageLoaded] = useState(false);
    const router = useRouter();
    const [redoResult, setRedoResult] = useState<{ analysis: string, tags: { color: string, style: string, occasion: string, season: string } } | null>(null);

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

            setRedoResult({ analysis: result.analysis, tags: result.tags });

        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoading(false);   
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Navbar/>
            <main className="w-full max-w-4xl mx-auto px-6 py-8">

                <button onClick={() => router.replace('/profile')} className="text-sm text-zinc-500 hover:text-black dark:hover:text-white mb-6 inline-block">
                    ← Back
                </button>

                <div className="flex gap-8">
                    {image_url && (
                        <img src={image_url} onLoad={() => setImageLoaded(true)} alt="outfit" className={`w-96 flex-shrink-0 rounded-xl object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}/>
                    )}

                    <div className="flex flex-col flex-1">
                        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Style Analysis</h2>

                        {loading ? (
                            <p className="text-sm text-zinc-400">Analyzing your outfit...</p>
                        ) : error ? (
                            <div>
                                <p className="text-sm text-red-500 mb-4">{error}</p>
                                <button className="text-sm text-zinc-500 hover:text-black dark:hover:text-white" onClick={() => analyze()}>Try again</button>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap mb-4">{redoResult?.analysis || analysis}</p>

                                {(redoResult?.tags || initialTags) && (
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {Object.entries(redoResult?.tags || initialTags).map(([key, value]) => (
                                            <span key={key} className="px-3 py-1 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                {String(value)}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <button className="text-sm text-zinc-500 hover:text-black dark:hover:text-white" onClick={() => analyze()}>Analyze again</button>
                            </>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
