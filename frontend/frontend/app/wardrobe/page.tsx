"use client";
import Sidebar from "@/components/sidebar";
import { useState, useEffect, useRef, use } from "react";
import { useUser } from "@/context/userContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Spinner from "@/components/spinner";
import { loggedFetch } from "@/lib/api";


export default function Wardrobe() {

    const { username, user_id, profilePic, loading, age, refreshUser } = useUser() ?? { username: "", user_id: "", profilePic: null, loading: false, age: "", refreshUser: () => {}};
    const [error, setError] = useState("");
    const [recentImagesLoading, setRecentImagesLoading] = useState(false);
    const [imagesCountLoading, setImagesCountLoading] = useState(false);
    const [styleStatsLoading, setStyleStatsLoading] = useState(false);
    const [colorStatsLoading, setColorStatsLoading] = useState(false);
    const [recentImages, setRecentImages] = useState<{ image_id: string, url: string, analyzed_at: string }[]>([]);
    const [imagesCount, setImagesCount] = useState<number | null>(null);
    const [likesCount, setLikesCount] = useState<number | null>(null);
    const [analysesCount, setAnalysesCount] = useState<number | null>(null);
    const [colorStats, setColorStats] = useState<{ top_5_colors: { color: string, count: number }[] }>({
        top_5_colors: []
    });
    const [styleStats, setStyleStats] = useState<{ top_style: string, top_5: { tag_name: string, tag_count: number, percentage: number }[] }>({
   top_style: "—", top_5: [] })
    const [fetched, setFetched] = useState(false); 

    const [recentImagesError, setRecentImagesError] = useState("");

    const stats = [                             
      { label: "Fits Posted", value: imagesCount ?? "—", sub: "" },                                                                          
      { label: "Total Likes", value: likesCount ?? "—", sub: "" },                                                                                          
      { label: "Analyses Run", value: analysesCount ?? "—", sub: "" },                                                                       
      { label: "Top Style", value: styleStats.top_style || "—", sub: "" },                                                                   
    ];   


    const router = useRouter();

    useEffect(() => { 

        const fetchWardrobe = async () => {
            if (loading) return;
            if (user_id == "") { setFetched(true); return; }
            try { 
                await Promise.all([handleRecentImages(), getImageCount(), getStyleStats(), getColorStats()]); 
            } catch (error) { 
                console.error("Error fetching wardrobe data:", error);
            } finally { 
                setFetched(true); 
            }
        }
        fetchWardrobe();
    }, [loading, user_id])

    //load recently analyzed outfits and get analysis count 
    const handleRecentImages = async () => { 

        try { 
            setRecentImagesLoading(true); 
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/analyzed-images`, undefined, user_id);
        
            if (!response.ok) { 
                console.log(await response.text());
                throw new Error("Could not fetch analyzed images");
            }

            const result = await response.json();
            if (!result.success) { 
                setRecentImagesError(result.message || "Could not fetch analyzed images. Try again.");
                return;
            } 
            setRecentImages(result.data);
            const count = result.data.length; 
            setAnalysesCount(count);

        } catch (error) { 
            console.error("Could not fetch analyzed images.", error);
            setRecentImagesError("Could not fetch analyzed images. Try again.");
        } finally {
            setRecentImagesLoading(false);    
        }
    }

    //get uploaded image count  
    const getImageCount = async () => {

        try { 
            setImagesCountLoading(true);
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/images?include_likes=true`, undefined, user_id);
            
            if (!response.ok) { 
                console.log(await response.text());
                throw new Error("Could not fetch image count.");
            }

            const result = await response.json();
            if (!result.success) { 
                return;
            }
            
            console.log(result.data); 
            //get images count 
            const count = result.data.length; 
            setImagesCount(count); 

            //get likes count 
            const likes = result.data.reduce((sum: number, item: any) => sum + (item.favorites?.[0]?.count ?? 0), 0); 
            setLikesCount(likes);

        } catch (error) { 
            console.error("Could not fetch image count.", error);
        } finally { 
            setImagesCountLoading(false);
        }
    } 

    //get style stats 
    const getStyleStats = async () => {

        try { 
            setStyleStatsLoading(true);
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/style-stats`, undefined, user_id);
            
            if (!response.ok) { 
                console.log(await response.text());
                throw new Error("Could not fetch style stats.");
            }

            const result = await response.json();
            if (!result.success) { 
                return;
            }

            setStyleStats(result.data); 
        } catch (error) { 
            console.error("Could not fetch style stats.", error);
        } finally { 
            setStyleStatsLoading(false);
        }
    } 

    //get color stats 
    const getColorStats = async () => {

        try { 
            setColorStatsLoading(true);
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/color-stats`, undefined, user_id);
            if (!response.ok) { 
                console.log(await response.text());
                throw new Error("Could not fetch color stats.");
            }
            
            const result = await response.json(); 

            if (!result.success) { 
                return;
            }

            setColorStats(result.data);

        } catch (error) {
            console.error("Could not fetch color stats.", error);
        } finally { 
            setColorStatsLoading(false);
        }
        
    } 

    if (loading || !fetched) return <Spinner/>;

    return (
        <div className="flex min-h-screen bg-white dark:bg-black">
            <Sidebar />
            <main className="flex-1 px-8 py-8">

                <h1 className="text-lg font-semibold text-black dark:text-white mb-6">My Wardrobe</h1>

                {/* stat grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {stats.map((s) => (
                        <div key={s.label} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl px-4 py-3.5">
                            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
                            <p className="text-2xl font-medium text-black dark:text-white">{s.value}</p>
                            {s.sub && <p className="text-xs text-zinc-400 mt-0.5">{s.sub}</p>}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-4">

                    {/* style profile — spans 2 cols */}
                    <div className="col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
                        <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-4">Style profile</p>
                        <div className="flex flex-col gap-2.5">
                            {styleStats.top_5.length === 0 ? <p className="text-sm text-zinc-400">No style data yet.</p>
                                : styleStats.top_5.map((row, i) => {
                                    const barColors = ["#F88379", "#FF8559", "#FF724C", "#BE5103", "#BE5103"];
                                    return (
                                        <div key={row.tag_name} className="flex items-center gap-3">
                                            <p className="text-sm text-zinc-600 dark:text-zinc-300 w-24 shrink-0">{row.tag_name}</p>
                                            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5">
                                                <div className="h-1.5 rounded-full" style={{ width: `${row.percentage}%`, backgroundColor: barColors[i] }} />
                                            </div>
                                            <p className="text-xs text-zinc-400 w-8 text-right">{row.percentage}%</p>
                                        </div>
                                    );
                                })
                            }   
                        </div>
                    </div>

                    {/* colour palette */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
                        <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-4">Colour palette</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {/* top 5color swatches here */}
                            { colorStats.top_5_colors.length === 0 ? <p className="text-sm text-zinc-400">No colours yet.</p> 
                                : colorStats.top_5_colors.map((c) => (
                                    <div key={c.color} className="flex flex-col items-center gap-1">
                                        <div className="rounded-full" style={{ backgroundColor: c.color, width: 32, height: 32 }} />
                                    </div>
                                ))
                            }
                        </div>

                    </div>

                    {/* recent fits — full width */}
                    <div className="col-span-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400">Recently Analyzed Fits</p>
                            <button className="text-xs text-zinc-400 hover:text-brand-pink dark:hover:text-brand-orange">View all →</button>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {recentImages.length === 0 ? <p className="text-sm text-zinc-400">No fits analyzed yet. </p>
                                : recentImages.map((image) => (
                                    <div key={image.image_id} 
                                        onClick={() => router.push(`/analyze/${image.image_id}?user_id=${user_id}&image_url=${encodeURIComponent(image.url)}`)}
                                        className="cursor-pointer aspect-[4/5] group relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 "> 
                                        <Image src={image.url} alt="recent fit" fill className="object-cover group-hover:opacity-90 transition-opacity"/>
                                    </div> 
                                )) 
                            } 
                        </div>
                    </div>

                    {/* insights */}
                    <div className="col-span-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
                        <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-3">Insights</p>
                        <div className="flex flex-col gap-0">
                            {/* insight rows will go here */}
                            <p className="text-sm text-zinc-400">Insights will appear as you log more fits.</p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
