"use client";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { loggedFetch } from "@/lib/api";
import Sidebar from "@/components/sidebar";
import DragObject from "@/components/DragObject";
import { DragDropProvider } from '@dnd-kit/react';

export default function Analyze({ params }: { params: Promise<{ image_id: string }> }) {
    const { image_id } = use(params);
    const searchParams = useSearchParams();
    const user_id = searchParams.get("user_id") ?? undefined;
    const image_url = decodeURIComponent(searchParams.get("image_url") ?? "") || undefined;
    const [imageUrl, setImageUrl] = useState(image_url);
    const analysis = decodeURIComponent(searchParams.get("analysis") ?? "") || undefined;
    const tagsParam = searchParams.get("tags");
    const initialTags = tagsParam ? JSON.parse(decodeURIComponent(tagsParam)) : null;
    const [activeTab, setActiveTab] = useState<"ai" | "journal">("ai");

    const [loading, setLoading] = useState(false);
    const [journalLoading, setJournalLoading] = useState(false); 
    const [error, setError] = useState("");
    const [imageLoaded, setImageLoaded] = useState(false);
    const [redoAnalysis, setRedoAnalysis] = useState<{ analysis: string } | null>(null);
    const router = useRouter();

    const [aiTags, setAiTags] = useState<string[]>(initialTags ?? []); //ai tags are ephemeral  
    const [userTags, setUserTags] = useState<string[]>([]); 
    const displayAnalysis = redoAnalysis?.analysis || analysis;
    const displayTags = [...aiTags, ...userTags]; 

    const [notes, setNotes] = useState(""); 
    const [description, setDescription] = useState(""); 
    const [rating, setRating] = useState<number | null>(null);

    const [saveLoading, setSaveLoading] = useState(false); 
    const [saveError, setSaveError] = useState("");

    useEffect(() => {   
        //fetch previously saved journal info on mount                                                                                                   
        getJournalInfo();   
    }, [])

    //return previous journal/analysis information 
    const getJournalInfo = async () => { 

        try { 
            setJournalLoading(true); 
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image_id}/journal`, undefined, user_id); 
            if (!response.ok) throw new Error("Could not analyze image.");
            const result = await response.json(); 
            if (!result.success) {
                console.error("error");
                return;  
            }
            console.log(result.data); 

            setUserTags(result.data.tags ?? []);                                                                                                       
            setNotes(result.data.notes ?? "");                                                                                                         
            setDescription(result.data.description ?? "");                                                                                             
            setRating(result.data.rating ?? null);                                                                                                     
            if (!imageUrl) setImageUrl(result.data.url); 
            if (result.data.analysis) setRedoAnalysis({ analysis: result.data.analysis });

        } catch (error) { 
            console.error(error); 
        } finally { 
            setJournalLoading(false); 
        }

    }

    const analyze = async () => {
        setError("");
        try {
            setLoading(true);
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image_id}/analyze`, undefined, user_id);

            if (response.status === 429) {
                setError("Too many requests. Please try again later.");
                return;
            }
            if (!response.ok) throw new Error("Could not analyze image.");

            const result = await response.json();
            if (!result.success) {
                setError(result.message);
                return;
            }

            setAiTags(result.tags);
            setRedoAnalysis({ analysis: result.analysis });

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
                body: JSON.stringify({ tags: userTags, analysis: displayAnalysis }),
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
            
            //save successful, push to wardrobe 
            router.push("/wardrobe")
            
        } catch (error) { 
            
            console.error("Could not save to wardrobe.", error);
            setSaveError("Could not save to wardrobe. Try again.");
        } finally { 
            setSaveLoading(false);
        }
    }

    //move ai tag to user tag if no duplicates are found - for drag and drop 
    const onTagMove = (tag: string) => { 
        if (!userTags.includes(tag)) { 
            setUserTags(prev => [...prev, tag]); 
        }
    }

    const handleSaveJournal = async () => {
        try {
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image_id}/journal`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes, description, rating })
            }, user_id);
            if (!response.ok) throw new Error("Could not save journal.");
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
        } catch (error) {
            console.error(error);
        }
    }

    const handleRating = async (star: number) => {
        setRating(star);
        try {
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image_id}/journal`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes, description, rating: star })
            }, user_id);
            if (!response.ok) throw new Error("Could not save rating.");
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
        } catch (error) {
            console.error(error);
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
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt="outfit"
                                    ref={(el) => { if (el?.complete) setImageLoaded(true); }}                                                                              
                                    onLoad={() => setImageLoaded(true)}
                                    className={`w-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                                />
                            ) : (
                                <div className="w-full aspect-[4/5] bg-zinc-100 dark:bg-zinc-800" />
                            )}
                        </div>

                        <button
                            onClick={analyze}
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

                        {/* tab switcher */}
                        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
                            <button
                                onClick={() => setActiveTab("ai")}
                                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === "ai" ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
                            >
                                AI Analysis
                            </button>
                            <button
                                onClick={() => setActiveTab("journal")}
                                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === "journal" ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
                            >
                                My Journal
                            </button>
                        </div>

                        {/* AI Analysis tab */}
                        {activeTab === "ai" && (
                            <>
                                {loading ? (
                                    <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-10 text-center">
                                        <p className="text-sm text-zinc-400">Analyzing your outfit...</p>
                                    </div>
                                ) : displayAnalysis || displayTags.length > 0 ? (
                                    <>
                                        {displayAnalysis && (
                                            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
                                                <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-2.5">Style tip</p>
                                                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{displayAnalysis}</p>
                                            </div>
                                        )}

                                        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
                                            <DragDropProvider onDragEnd={(e) => {
                                                if (e.operation.source) {
                                                    onTagMove(e.operation.source.id as string);
                                                }
                                            }}>
                                                <DragObject aiTags={aiTags} userTags={userTags} onClearTags={() => setUserTags([])} />
                                            </DragDropProvider>
                                        </div>

                                        <button
                                            className="bg-zinc-900 dark:bg-zinc-800 rounded-xl px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
                                            onClick={handleSaveToWardrobe}
                                            disabled={saveLoading || !displayAnalysis}
                                        >
                                            {saveLoading ? "Saving to wardrobe..." : "Save to wardrobe"}
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
                            </>
                        )}

                        {/* My Journal tab */}
                        {activeTab === "journal" && (
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5 flex flex-col gap-4">
                                <div>
                                    <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-2">Description</p>
                                    <input
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}   
                                        onBlur={handleSaveJournal}
                                        type="text"
                                        placeholder="Maison Margiela Gats, Lemaire shirt..."
                                        className="w-full text-sm bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400"
                                    />
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-2">Notes</p>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        onBlur={handleSaveJournal}
                                        placeholder="How did this fit feel? Where did you wear it?"
                                        rows={4}
                                        className="w-full text-sm bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 resize-none"
                                    />
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-2">Rating</p>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => handleRating(star)}
                                                className={`text-2xl transition-colors hover:text-amber-400 ${rating && star <= rating ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"}`}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                </div>
            </main>
        </div>
    );
}
