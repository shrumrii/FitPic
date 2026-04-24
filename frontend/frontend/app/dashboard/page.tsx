"use client";
import Navbar from "@/components/navbar"
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import Modal from "@/components/modal"; 
import { useUser } from "@/context/userContext";
import Heart from "@/components/Heart";
import { loggedFetch } from "@/lib/api";
import Sidebar from "@/components/sidebar";

export default function Dashboard() {

    const { username, user_id, loading } = useUser() ?? { username: "", user_id: "", loading: false };
    const router = useRouter();
    const [feed, setFeed] = useState<{user_id: string, username: string, image_id: string, url: string, created_at: string, likes: number }[]>([]);
    const [selectedImage, setSelectedImage] = useState<{user_id: string, username: string, image_id: string, url: string, created_at: string, likes: number} | null>(null);
    const [favoritedImageIDs, setFavoritedImageIDs] = useState<Set<string>>(new Set());
    const [loadingFavorites, setLoadingFavorites] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [dashboardError, setDashboardError] = useState("");
    const [filterMode, setFilterMode] = useState<"recent" | "most_liked">("recent"); 
    const [dropdownOpen, setDropdownOpen] = useState(false); 
    const dropdownRef = useRef<HTMLDivElement>(null); 
    const [filterLoading, setFilterLoading] = useState(false); 

    const filterLabels = {                                                                                                                     
        recent: "Recent",                   
        most_liked: "Most Liked"                                                                                                               
    } 

    useEffect(() => {

        const getUserFeed = async (user_id: string) => {

            try {
                setFilterLoading(true); 
                const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/feed?mode=${filterMode}`, undefined, user_id);

                if (!response.ok) {
                    console.log(await response.text());
                    throw new Error("Failed to get feed");
                }

                const result = await response.json();
                if (!result.success) {
                    console.log(result.message);
                    throw new Error("Failed to get feed");
                }

                const feed = result.data;
                console.log(feed); 
                setFeed(feed); 

            } catch (error) {
                console.error(error);
            } finally {
                setFilterLoading(false); 
            }
        }

        const populateDashboard = async () => {

            console.log("populateDashboard called");
            if (user_id == "") return;

            try {

                const profileRes = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}`, undefined, user_id);
                const profileResult = await profileRes.json();
                if (!profileResult.success) {
                    router.push("/onboarding");
                    return;
                }

                await Promise.all([getUserFeed(user_id), getFavorites(user_id)]);

            } catch (error) {
                console.error("error", error);
                //show dashboard error  
                setDashboardError('Failed to load feed. Try refreshing the page.')
            } finally {
                setFetched(true); 
            }
        }

        const getFavorites = async (user_id: string) => {

            try { 
                setLoadingFavorites(true); 
                const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites?user_id=${user_id}`, undefined, user_id);
                
                if (!response.ok) { 
                    console.log(await response.text());
                    throw new Error("Failed to get favorites")
                }

                const result = await response.json();

                //extract favorited image ids and set to state
                const favoritedIDs = new Set<string>(result.data.map((item: any) => item.images.image_id));
                setFavoritedImageIDs(favoritedIDs);
                console.log("Favorited image IDs:", favoritedIDs);

            } catch (error) { 
                console.error(error);

            } finally { 
                setLoadingFavorites(false); 
            }
        } 

        populateDashboard();
    }, [user_id, loading, filterMode])

    useEffect(() => {   
        //? 
        const handleDropdown = (event: MouseEvent) => { 
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {                                                  
                setDropdownOpen(false);         
            }
        }   

        document.addEventListener("mousedown", handleDropdown);                                                                                
        return () => document.removeEventListener("mousedown", handleDropdown);                                                                
    }, []);

    const setFavorite = async (image_id: string) => { 

        try { 
            //update favorited IDs state set optimistically
            const favoritedIDs = new Set<string>([...favoritedImageIDs, image_id])
            setFavoritedImageIDs(favoritedIDs);

            //optimistically update likes count (for feed and modal) 
            setFeed(prev => prev.map((image) => image.image_id == image_id ? { ...image, likes: image.likes+1} : image)); 
            setSelectedImage(prev => prev && prev.image_id == image_id ? {...prev, likes: prev.likes+1} : prev); 

            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`,
                {
                    method: 'POST',
                    headers: {
                        "Content-Type": 'application/json'
                    },
                    body: JSON.stringify({ user_id, image_id })
                }, user_id);
            
            if (!response.ok) { 
                console.error("Could not favorite image"); 
                throw new Error("Could not favorite image"); 
            }

            const result = await response.json(); 

            if (!result.success) { 
                console.log(result.message); 
                throw new Error("Could not favorite image - backend endpoint"); 
            }

        } catch (error) { 
            console.error(error); 
            //unset favorited ID and like # if error 
            const favoritedIDs = new Set<string>([...favoritedImageIDs].filter(id => id !== image_id))
            setFavoritedImageIDs(favoritedIDs);
            setFeed(prev => prev.map((image) => image.image_id == image_id ? { ...image, likes: Math.max(0, image.likes-1)} : image));
            setSelectedImage(prev => prev && prev.image_id == image_id ? {...prev, likes: Math.max(0, prev.likes-1)} : prev);  
        } 
    }

    const setUnfavorite = async (image_id: string) => { 

        try { 

            //remove image_id from favorited IDs state set 
            const favoritedIDs = new Set<string>([...favoritedImageIDs].filter(id => id !== image_id))
            setFavoritedImageIDs(favoritedIDs);
            setFeed(prev => prev.map((image) => image.image_id == image_id ? { ...image, likes: Math.max(0, image.likes-1)} : image)); 
            setSelectedImage(prev => prev && prev.image_id == image_id ? {...prev, likes: Math.max(0, prev.likes-1)} : prev);  

            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`,
                {
                    method: 'DELETE',
                    headers: {
                        "Content-Type": 'application/json'
                    },
                    body: JSON.stringify({ user_id, image_id })
                }, user_id);
            
            if (!response.ok) { 
                console.error("Could not favorite image"); 
                throw new Error("Could not favorite image"); 
            }

            const result = await response.json(); 

            if (!result.success) { 
                console.log(result.message); 
                throw new Error("Could not favorite image - backend endpoint"); 
            }


        } catch (error) { 
            console.error(error); 
            //add back favorited ID and like count if error 
            const favoritedIDs = new Set<string>([...favoritedImageIDs, image_id])
            setFavoritedImageIDs(favoritedIDs);
            setFeed(prev => prev.map((image) => image.image_id == image_id ? { ...image, likes: image.likes+1} : image)); 
            setSelectedImage(prev => prev && prev.image_id == image_id ? {...prev, likes: prev.likes+1} : prev);
        } 
    }

    if (!fetched) return <Spinner/>;

    return (
        <div className="flex min-h-screen bg-white dark:bg-black">
            <Sidebar/>
            <main className="w-full px-6 py-8">

                {/* Gallery top bar */}
                <div className="flex items-center justify-between"> 
                    <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white mb-6">
                        My Feed
                    </h1>

                    {/* filter slicer */}
                    <div className="relative mb-6" ref={dropdownRef}>
                        <button 
                            onClick={() => setDropdownOpen(prev => !prev)}
                            className="text-sm px-4 py-2 rounded-full border border-zinc-200 text-base text-zinc-600 dark:text-zinc-400 flex items-center gap-2"
                        > 
                            {filterLabels[filterMode]} <span>▾</span>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute top-10 right-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-md z-10 w-36">                                                                                                                                
                                {(["recent", "most_liked"] as const).map((option) => (
                                    <button                                                                                                                    
                                        key={option}            
                                        onClick={() => { setFilterMode(option); setDropdownOpen(false);}}                                                     
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${filterMode === option ?
                        "font-semibold" : "text-zinc-500"}`}                                                                                                       
                                    >                           
                                        {filterLabels[option]}                                                                                                 
                                    </button>                 
                                ))}                                                                                                                            
                            </div> 
                        )}
                    </div>
                </div>

                {feed.length === 0 ?
                    <div className="flex w-full items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <p className="text-zinc-400 text-sm">Your feed is empty.</p>
                            <p className="text-zinc-300 dark:text-zinc-600 text-xs">Follow friends to see their fits here.</p>
                        </div>
                    </div>

                    :

                    filterLoading ? <Spinner/> : 
                        (<div className="grid grid-cols-3 gap-1 w-full">
                            {feed.map((image) => (
                                <div key={image.image_id} onClick={() => setSelectedImage(image)} className="cursor-pointer aspect-[4/5] relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                    <img src={image.url} alt="fit" className="object-cover w-full h-full hover:opacity-90 transition-opacity" />
                                </div>
                            ))}
                        </div>
                    )
                }

                {dashboardError && <p className="text-xs text-red-500">{dashboardError}</p>}

            </main>

            {selectedImage && (<Modal onClose={() => setSelectedImage(null)}>
                <div className="flex">
                    <div className="relative aspect-[4/5] w-2/3">
                        <img src={selectedImage.url} alt="fit" className="object-cover"/>
                    </div>
                    <div className="flex flex-col gap-2 p-5 w-1/3">
                        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Posted by</p>
                        <p className="text-sm font-medium text-black dark:text-white">{selectedImage.username}</p>
                        <div className="flex items-center justify-between mt-auto">
                                <p className="text-sm font-medium text-black dark:text-white">{selectedImage.likes} {selectedImage.likes === 1 ? 'like' : 'likes'}</p>
                                <p className="text-xs text-zinc-400">{new Date(selectedImage.created_at).toLocaleDateString()}</p>
                                <Heart filled={favoritedImageIDs.has(selectedImage.image_id)} onToggle={() => favoritedImageIDs.has(selectedImage.image_id) ? setUnfavorite(selectedImage.image_id) : setFavorite(selectedImage.image_id)} />
                        </div>
                    </div>
                </div>
            </Modal>)}
        </div>
    );
}
