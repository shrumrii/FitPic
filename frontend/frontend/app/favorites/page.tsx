"use client";
import Sidebar from "@/components/sidebar"; 
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import Modal from "@/components/modal"
import { useUser } from "@/context/userContext";
import Heart from "@/components/Heart";
import { loggedFetch } from "@/lib/api"; 

export default function Favorites() {

    const { user_id, loading } = useUser() ?? { user_id: "", loading: false};
    const router = useRouter();

    const [loadingFavorites, setLoadingFavorites] = useState(false);
    const [favorites, setFavorites] = useState<{user_id: string, username: string, image_id: string, url: string, created_at: string }[]>([]);
    const [selectedImage, setSelectedImage] = useState<{user_id: string, username: string, image_id: string, url: string, created_at: string } | null>(null);

    useEffect(() => {
        const getFavorites = async () => {
            if (loading) return;
            if (user_id == "") return;

            try { 
                setLoadingFavorites(true); 
                const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`, undefined, user_id)  

                const result = await response.json(); 
                //destructure and flatten favorites list
                setFavorites(result.data.map((item: any) => ({                                                                                             
                    user_id: item.user_id,    
                    username: item.images.users.username,                                                                                                 
                    image_id: item.images.image_id,                                                                                                        
                    url: item.images.url,                                                                                                                  
                    created_at: item.images.created_at,                                                                                                            
                })));    

            } catch (error) { 
                console.error(error); 
            } finally { 
                setLoadingFavorites(false); 
            }
        }
        getFavorites();
    }, [loading, user_id])

    const unfavorite = async (image_id: string) => { 

        try { 

            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites`,
                {
                    method: 'DELETE',
                    headers: {
                        "Content-Type": 'application/json'
                    },
                    body: JSON.stringify({ image_id })
                }, user_id);
            
            if (!response.ok) { 
                console.error("Could not unfavorite image"); 
                throw new Error("Could not unfavorite image"); 
            }

            const result = await response.json(); 

            if (!result.success) { 
                console.log(result.message); 
                throw new Error("Could not unfavorite image - backend endpoint"); 
            }

            // update favorites list state 
            setFavorites((prev) => prev.filter((fav) => fav.image_id !== image_id)); 
            setSelectedImage(null); 


        } catch (error) { 
            console.error(error); 
        } 
    }

    if (loading || loadingFavorites) return <Spinner/>;

    return (
        <div className="flex min-h-screen bg-white dark:bg-black">
            <Sidebar/> 
            <main className="w-full px-6 py-8">
                <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white mb-6">
                    My Favorites
                </h1>

                {favorites.length === 0 ?
                    <div className="flex w-full items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <p className="text-zinc-400 text-sm">Your favorites are empty.</p>
                            <p className="text-zinc-300 dark:text-zinc-600 text-xs">Save posts to see them here.</p>
                        </div>
                    </div>

                    :

                    /* map posts */
                    <div className="grid grid-cols-3 gap-1 w-full">
                        {favorites.map((image) => (
                            <div key={image.image_id} onClick={() => setSelectedImage(image)} className="cursor-pointer aspect-[4/5] relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                <Image src={image.url} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" />
                            </div>
                        ))}
                    </div> 
                }

            </main>

            {selectedImage && (<Modal onClose={() => setSelectedImage(null)}>
                <div className="flex">
                    <div className="relative aspect-[4/5] w-2/3">
                        <Image src={selectedImage.url} alt="fit" fill className="object-cover"/>
                    </div>
                    <div className="flex flex-col gap-2 p-5 w-1/3">
                        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Posted by</p>
                        <p className="text-sm font-medium text-black dark:text-white">{selectedImage.username}</p>
                        <div className="flex items-center justify-between mt-auto">
                                <p className="text-xs text-zinc-400">{new Date(selectedImage.created_at).toLocaleDateString()}</p>
                                <Heart filled={true} onToggle={() => unfavorite(selectedImage.image_id)} />
                                
                                
                            </div>
                    </div>
                </div>
            </Modal>)}
        </div>
    );
}
