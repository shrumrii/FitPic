"use client";
import Navbar from "@/components/navbar"
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import { getUser } from "@/lib/getUser";
import Modal from "@/components/modal"; 
import { useUser } from "@/context/userContext";
import Heart from "@/components/Heart";

export default function Dashboard() {

    const { username, user_id, loading: userLoading } = useUser() ?? { username: "", user_id: "", loading: false };
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [feed, setFeed] = useState<{user_id: string, username: string, image_id: string, url: string, created_at: string}[]>([]);
    const [selectedImage, setSelectedImage] = useState<{user_id: string, username: string, image_id: string, url: string, created_at: string} | null>(null);
    const [favoritedImageIDs, setFavoritedImageIDs] = useState<Set<string>>(new Set());
    const [loadingFavorites, setLoadingFavorites] = useState(false);

    useEffect(() => {
        const getUserFeed = async (user_id: string) => {

            try {

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/feed`);

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
                setFeed(feed);
                console.log(feed); 

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        const populateDashboard = async () => {

            if (userLoading || user_id == "") return;
            setLoading(true);

            try {

                //check if uid in database
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}`);

                if (!response.ok) {
                    console.log(await response.text())
                    throw new Error("Failed to get user id");
                }

                const result = await response.json();

                if (!result.success) {
                    console.log(result.message);
                    router.push("/onboarding");
                    return;
                }

                await Promise.all([getUserFeed(user_id), getFavorites(user_id)]);

            } catch (error) {
                console.error("error", error);
                router.push("/welcome")
            } finally {
                setLoading(false);
            }
        }

        const getFavorites = async (user_id: string) => {

            if (user_id == "") return; 

            try { 
                setLoadingFavorites(true); 
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites?user_id=${user_id}`);
                
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
    }, [userLoading, user_id])

    const setFavorite = async (image_id: string) => { 

        try { 

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`,
                {
                    method: 'POST', 
                    headers: {
                        "Content-Type": 'application/json' 
                    }, 
                    body: JSON.stringify({ user_id, image_id }) 
                });
            
            if (!response.ok) { 
                console.error("Could not favorite image"); 
                throw new Error("Could not favorite image"); 
            }

            const result = await response.json(); 

            if (!result.success) { 
                console.log(result.message); 
                throw new Error("Could not favorite image - backend endpoint"); 
            }

            //update favorited IDs state set 
            const favoritedIDs = new Set<string>([...favoritedImageIDs, image_id])
            setFavoritedImageIDs(favoritedIDs);

        } catch (error) { 
            console.error(error); 
        } 
    }

    const setUnfavorite = async (image_id: string) => { 

        try { 

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`,
                {
                    method: 'DELETE', 
                    headers: {
                        "Content-Type": 'application/json' 
                    }, 
                    body: JSON.stringify({ user_id, image_id }) 
                });
            
            if (!response.ok) { 
                console.error("Could not favorite image"); 
                throw new Error("Could not favorite image"); 
            }

            const result = await response.json(); 

            if (!result.success) { 
                console.log(result.message); 
                throw new Error("Could not favorite image - backend endpoint"); 
            }

            //update favorited IDs state set 
            const favoritedIDs = new Set<string>([...favoritedImageIDs].filter(id => id !== image_id))
            setFavoritedImageIDs(favoritedIDs);

        } catch (error) { 
            console.error(error); 
        } 
    }

    if (loading) return <Spinner/>;

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Navbar/>
            <main className="w-full max-w-4xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white mb-6">
                    My Feed
                </h1>

                {feed.length === 0 ?
                    <div className="flex w-full items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <p className="text-zinc-400 text-sm">Your feed is empty.</p>
                            <p className="text-zinc-300 dark:text-zinc-600 text-xs">Follow friends to see their fits here.</p>
                        </div>
                    </div>

                    :

                    /* map posts */
                    <div className="grid grid-cols-3 gap-1 w-full">
                        {feed.map((image) => (
                            <div key={image.image_id} onClick={() => setSelectedImage(image)} className="cursor-pointer aspect-square relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                <Image src={image.url} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" />
                            </div>
                        ))}
                    </div>
                }

            </main>

            {selectedImage && (<Modal onClose={() => setSelectedImage(null)}>
                <div className="flex">
                    <div className="relative aspect-square w-2/3">
                        <Image src={selectedImage.url} alt="fit" fill className="object-cover"/>
                    </div>
                    <div className="flex flex-col gap-2 p-5 w-1/3">
                        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Posted by</p>
                        <p className="text-sm font-medium text-black dark:text-white">{selectedImage.username}</p>
                        <div className="flex items-center justify-between mt-auto">
                                <p className="text-xs text-zinc-400">{new Date(selectedImage.created_at).toLocaleDateString()}</p>
                                <Heart filled={favoritedImageIDs.has(selectedImage.image_id)} onToggle={() => favoritedImageIDs.has(selectedImage.image_id) ? setUnfavorite(selectedImage.image_id) : setFavorite(selectedImage.image_id)} />
                        </div>
                    </div>
                </div>
            </Modal>)}
        </div>
    );
}
