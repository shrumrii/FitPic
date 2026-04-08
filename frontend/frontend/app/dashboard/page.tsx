"use client";
import Navbar from "@/components/navbar"
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import { getUser } from "@/lib/getUser";
import Modal from "@/components/modal"

export default function Dashboard() {

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [feed, setFeed] = useState<{user_id: string, username: string, image_id: string, url: string, created_at: string, favorite: boolean}[]>([]);
    const [selectedImage, setSelectedImage] = useState<{user_id: string, username: string, image_id: string, url: string, created_at: string, favorite: boolean} | null>(null);

    useEffect(() => {
        const getUserFeed = async (id: string) => {

            try {

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}/feed`);

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

            setLoading(true);

            try {

                const user = await getUser();

                if (user == null) {
                    console.log("Redirect to welcome page");
                    router.push("/welcome");
                    return;
                }

                //check if uid in database
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}`);

                if (!response.ok) {
                    console.log(await response.text())
                    throw new Error("Failed to get user id");
                }

                const result = await response.json();

                if (!result.success) {
                    console.log(result.message);
                    console.log(`${user.id} has made an account, but has not created a profile. Redirecting to onboarding.`);
                    router.push("/onboarding");
                    return;
                }

                await getUserFeed(user.id);

            } catch (error) {
                console.error("error", error);
                router.push("/welcome")
            } finally {
                setLoading(false);
            }
        }
        populateDashboard();
    }, [])

    const toggleFavorite = async ( image_id: string) => { 

        try { 
            //toggle favorite status 
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image_id}/toggle-favorite`, 
                {
                    method: 'PATCH', 
                    headers: {
                        "Content-Type": 'application/json' 
                    }, 
                    body: JSON.stringify({ favorite: !selectedImage?.favorite }) 
                });
            
            if (!response.ok) { 
                console.error("Could not toggle favorite");
                throw new Error("Could not toggle favorite");
            }

            const result = await response.json(); 
            if (!result.success) { 
                console.log(result.message); 
                throw new Error("Could not toggle favorite - backend endpoint"); 
            }

            // update feed and selected image state 
            setFeed((prev) => prev.map((item) => item.image_id === image_id ? { ...item, favorite: !item.favorite } : item)); 
            setSelectedImage((prev) => prev && prev.image_id === image_id ? { ...prev, favorite: !prev.favorite } : prev); 
            

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
                                {/* <button onClick={() => toggleFavorite(selectedImage.image_id)} className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer transition-colors"> {selectedImage.favorite ? "Unfavorite" : "Favorite"} </button> */}
                        </div>
                    </div>
                </div>
            </Modal>)}
        </div>
    );
}
