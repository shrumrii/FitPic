"use client";
import Navbar from "@/components/navbar"
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import { getUser } from "@/lib/getUser";
import Modal from "@/components/modal"
import { useUser } from "@/context/userContext";


export default function Favorites() {

    const { username, user_id, loading } = useUser() ?? { username: "", user_id: "", loading: false};
    const router = useRouter();

    const [loadingFavorites, setLoadingFavorites] = useState(false);
    const [favorites, setFavorites] = useState<{username: string, image_id: string, url: string, created_at: string, favorite: boolean }[]>([]);
    const [selectedImage, setSelectedImage] = useState<{username: string, image_id: string, url: string, created_at: string, favorite: boolean } | null>(null);
    

    useEffect(() => {
        const getFavorites = async () => {

            if (user_id == "") return; 

            try { 
                setLoadingFavorites(true); 
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/favorites`);
                
                if (!response.ok) { 
                    console.log(await response.text());
                    throw new Error("Failed to get favorites")
                }

                const result = await response.json(); 
                setFavorites(result.data); 

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

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image_id}/toggle-favorite`, 
                {
                    method: 'PATCH', 
                    headers: {
                        "Content-Type": 'application/json' 
                    }, 
                    body: JSON.stringify({ favorite: !selectedImage?.favorite }) 
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


        } catch (error) { 
            console.error(error); 
        } 
    }

    if (loading || loadingFavorites) return <Spinner/>;

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Navbar/>
            <main className="w-full max-w-4xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white mb-6">
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
                                <button onClick={() => unfavorite(selectedImage.image_id)} className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer transition-colors"> Unfavorite </button>
                            </div>
                    </div>
                </div>
            </Modal>)}
        </div>
    );
}
