"use client";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { loggedFetch } from "@/lib/api";
import Sidebar from "@/components/sidebar";

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
    const [redoResult, setRedoResult] = useState<{ analysis: string; tags: { color: string[]; style: string[]; season: string } } | null>(null);
    const router = useRouter();

    const displayAnalysis = redoResult?.analysis || analysis;
    const displayTags = redoResult?.tags || initialTags;

    const [saveLoading, setSaveLoading] = useState(false); 
    const [saveError, setSaveError] = useState("");
    const [saved, setSaved] = useState(false);

    useEffect(() => { 
        //run analyze as fallback once on mount 
        if (!analysis) { 
            analyze(false); 
        }
    }, [])

    //refresh param is true if user is clicking "get another take" button, false if it's the initial analyze on page load
    const analyze = async (refresh: boolean) => {
        setError("");
        try {
            setLoading(true);
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image_id}/analyze?refresh=${refresh}`, undefined, user_id);
            if (!response.ok) throw new Error("Could not analyze image.");
            const result = await response.json();
            if (!result.success) {
                setError(result.message);
                return;
            }
            setRedoResult({ analysis: result.analysis, tags: result.tags });
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Try again.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleSaveToWardrobe = async () => { 

        try {
            setSaveLoading(true);
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image_id}/save-to-wardrobe`, {
                method: "POST", 
                body: JSON.stringify({ color: displayTags.color, style: displayTags.style, season: displayTags.season }),
                headers: { "Content-Type": "application/json" }

            }, user_id)
        
            if (!response.ok) { 
                console.error("Could not save to wardrobe.")
                throw new Error("Could not save to wardrobe.")
            }

            const result = await response.json();
            
            if (!result.success) { 
                setSaveError(result.message || "Could not save to wardrobe. Try again.");
                return; 
            }
            
            //save successful 
            setSaved(true); 
            
            

        } catch (error) { 
            console.error("Could not save to wardrobe.", error);
            setSaveError("Could not save to wardrobe. Try again.");
        } finally { 
            setSaveLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-white dark:bg-black">
            <Sidebar />
            <main className="flex-1 px-8 py-8">

                <button
                    onClick={() => router.back()}
                    className="text-xs text-zinc-400 hover:text-brand-pink dark:hover:text-brand-orange mb-6 inline-flex items-center gap-1"
                >
                    ← Back
                </button>

                <div className="grid gap-6 items-start" style={{ gridTemplateColumns: "340px 1fr" }}>

                    {/* left: image + button */}
                    <div>
                        <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                            {image_url ? (
                                <img
                                    src={image_url}
                                    alt="outfit"
                                    onLoad={() => setImageLoaded(true)}
                                    className={`w-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                                />
                            ) : (
                                <div className="w-full aspect-[4/5] bg-zinc-100 dark:bg-zinc-800" />
                            )}
                        </div>

                        <button
                            onClick={() => analyze(displayAnalysis ? true : false)}
                            disabled={loading}
                            className="mt-3 w-full py-3 text-sm font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-85 transition-opacity disabled:opacity-50"
                        >
                            {loading ? "Analyzing..." : displayAnalysis ? "Get another take" : "Run AI analysis"}
                        </button>

                        {error && (
                            <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
                        )}
                    </div>

                    {/* right: results */}
                    <div className="flex flex-col gap-3">
                        {loading ? (
                            <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-10 text-center">
                                <p className="text-sm text-zinc-400">Analyzing your outfit...</p>
                            </div>
                        ) : displayAnalysis || displayTags ? (
                            <>
                                {displayAnalysis && (
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
                                        <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-2.5">Style tip</p>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{displayAnalysis}</p>
                                    </div>
                                )}

                                {displayTags && (
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
                                        <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-3">Tags</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(displayTags).map(([key, value]) => (
                                                <span
                                                    key={key}
                                                    className="text-xs px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                                                >
                                                    {String(value)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button 
                                    className="bg-zinc-900 dark:bg-zinc-800 rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => saved ? router.push("/wardrobe") : handleSaveToWardrobe()}
                                    disabled={saveLoading || !displayAnalysis} 
                                >
                                    {saveLoading ? "Saving to wardrobe..." : saved ? "Saved to wardrobe! Go to wardrobe?" : "Save to wardrobe"}
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 8h10M9 4l4 4-4 4"/>
                                    </svg>
                                </button> 

                                {saveError && (
                                    <p className="mt-2 text-xs text-red-500 text-center">{saveError}</p>
                                )}
                            </>
                        ) : (
                            <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-10 text-center">
                                <p className="text-sm text-zinc-400">Run an analysis to see your style breakdown.</p>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
