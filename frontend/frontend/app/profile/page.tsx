"use client";
import { useState, useEffect, useRef } from "react";
import supabase from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/navbar";
import Image from "next/image";
import Spinner from "@/components/spinner";
import { useUser } from "@/context/userContext";
import Modal from "@/components/modal";
import ConfirmModal from "@/components/confirmModal"; 
import Heart from "@/components/Heart";
import Link from "next/link";
import { loggedFetch } from "@/lib/api";
import Sidebar from "@/components/sidebar";
import DismissButton from "@/components/dismissButton";


export default function Profile() {

    const { username, user_id, profilePic, loading, age, refreshUser } = useUser() ?? { username: "", user_id: "", profilePic: null, loading: false, age: "", refreshUser: () => {}};
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") ?? undefined;
    const [bannerDismissed, setBannerDismissed] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<{image_id: string, url: string, created_at: string, likes: number }[]>([]);
    const [followingList, setFollowingList] = useState<{ following_id: string, username: string }[]>([]);
    const [followerList, setFollowerList] = useState<{ follower_id: string, username: string }[]>([]);
    const [selectedImage, setSelectedImage] = useState<{image_id: string, url: string, created_at: string, likes: number} | null>(null);
    const [followingModal, setFollowingModal] = useState(false);
    const [followerModal, setFollowerModal] = useState(false);
    const [editMode, setEditMode] = useState(false); 
    const [confirmModal, setConfirmModal] = useState(false); 
    const [imageToDelete, setImageToDelete] = useState<string | null>(null); 
    const [favoritedImageIDs, setFavoritedImageIDs] = useState<Set<string>>(new Set());
    const [fetched, setFetched] = useState(false);
    const [error, setError] = useState(""); 
    const errorTimeout = useRef<NodeJS.Timeout | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false); 
    const dropdownRef = useRef<HTMLDivElement>(null); 


    const router = useRouter();

    useEffect(() => {

        //load user profile
        const getProfileInfo = async () => {

            if (user_id == "") return;

            if (user_id == "" && loading == false) {
                console.log("No user info found, redirecting to welcome page");
                router.push("/welcome");
                return;
            }

            try {

                //load images
                const imagesResponse = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/images?include_likes=true`, undefined, user_id);

                if (!imagesResponse.ok) {
                    console.log(imagesResponse.status)
                    throw new Error("Failed to get user's images");
                }

                const imagesResult = await imagesResponse.json();
                setImages(imagesResult.data.map((item: any) => ({...item, likes: item.favorites?.[0]?.count ?? 0})));
                await getFavorites(); 

            } catch (error) {
                console.error(error);
            } finally { 
                setFetched(true); 
            }
        }

        const getFavorites = async () => {

            if (user_id == "") return; 

            try { 
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
            } 
        } 
        getProfileInfo();
    }, [loading, user_id]);

    useEffect(() => {   
        const handleDropdown = (event: MouseEvent) => { 
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {                                                  
                setDropdownOpen(false);         
            }
        }   

        document.addEventListener("mousedown", handleDropdown);                                                                                
        return () => document.removeEventListener("mousedown", handleDropdown);                                                                
    }, []);

    //update profile pic
    const changeProfilePicture = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/pfp`, {
                method: "POST",
                body: formData
            }, user_id);

            if (!response.ok) {
                console.error("Error during request");
                throw new Error("Upload failed");
            }

            const result = await response.json();
            if (result.success) {
                refreshUser();
            }

        } catch (error) {
            console.error("Failed to update profile picture", error);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            changeProfilePicture(file);
        }
    }

    //sign out handler
    const handleSignout = async () => {
        await supabase.auth.signOut();
        router.push("/welcome");
    }

    const getFollowing = async () => {
        try {
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/following`, undefined, user_id);

            if (!response.ok) {
                console.error("Could not get following");
                throw new Error("Could not get following");
            }

            const result = await response.json();

            setFollowingList(result.data.map((item: any) => ({
                following_id: item.following_id,
                username: item.users.username
            })));
            setFollowingModal(true);
            console.log(result.data); 

        } catch (error) {
            console.error(error);
        }
    }

    const getFollowers = async () => {
        try {
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/followers`, undefined, user_id);

            if (!response.ok) {
                console.error("Could not get followers");
                throw new Error("Could not get followers");
            }

            const result = await response.json();

            setFollowerList(result.data.map((item: any) => ({
                follower_id: item.follower_id,
                username: item.users.username
            })));
            setFollowerModal(true);
            console.log(result.data); 

        } catch (error) {
            console.error(error);
        }
    }

    const deleteImage = async (image_id: string) => { 

        if (!confirm("Delete this post?")) return;  // add this  
        try { 
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image_id}`, {method: 'DELETE'}, user_id);

            if (!response.ok) {
                console.error("Could not delete image");
                throw new Error("Could not delete image");
            }

            const result = await response.json(); 

            if (!result.success) { 
                console.log(result.message); 
                throw new Error("Could not delete image"); 
            }

            setImages(images.filter(img => img.image_id !== image_id));


        } catch (error) { 
            console.error(error); 
        }
    }

    const setFavorite = async (image_id: string) => { 

        try { 

            //update image_id from favorited IDs state set 
            const favoritedIDs = new Set<string>([...favoritedImageIDs, image_id])
            setFavoritedImageIDs(favoritedIDs);
            setImages(prev => prev.map((image) => image.image_id == image_id ? { ...image, likes: image.likes+1} : image)); 
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
            //add back favorited ID and like count if error 
            const favoritedIDs = new Set<string>([...favoritedImageIDs].filter(id => id !== image_id))
            setFavoritedImageIDs(favoritedIDs);
            setSelectedImage(prev => prev && prev.image_id == image_id ? {...prev, likes: Math.max(0, prev.likes-1)} : prev); 
            setImages(prev => prev.map((image) => image.image_id == image_id ? { ...image, likes: Math.max(0, image.likes-1)} : image)) 
        } 
    }

    const setUnfavorite = async (image_id: string) => { 

        try { 

            //remove image_id from favorited IDs state set 
            const favoritedIDs = new Set<string>([...favoritedImageIDs].filter(id => id !== image_id))
            setFavoritedImageIDs(favoritedIDs);
            setImages(prev => prev.map((image) => image.image_id == image_id ? { ...image, likes: Math.max(0, image.likes-1)} : image)); 
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
            setImages(prev => prev.map((image) => image.image_id == image_id ? { ...image, likes: image.likes+1} : image)); 
            setSelectedImage(prev => prev && prev.image_id == image_id ? {...prev, likes: prev.likes+1} : prev);
        } 
    }

    const handleAnalyze = (image_id: string, image_url: string) => {
        router.push(`/analyze/${image_id}?user_id=${user_id}&image_url=${encodeURIComponent(image_url)}`);
    }

    if (!fetched) return <Spinner/>;

    return (
        <div className="flex min-h-screen bg-white dark:bg-black">
            <Sidebar/> 
            <main className="w-full px-6 py-8">

                {/* profile header */}
                <div className="flex items-center gap-6 mb-8">

                    {/* avatar */}
                    <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                        {profilePic
                            ? <Image src={profilePic} alt={username} width={80} height={80} className="object-cover w-full h-full"/>
                            : <div className="w-20 h-20 rounded-full bg-amber-400 flex items-center justify-center text-lg font-semibold">{username[0]?.toUpperCase()}</div>
                        }
                    </div>

                    {/* info */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-baseline gap-3">
                            <p className="text-lg font-semibold text-black dark:text-white">{username}</p>
                            {age && <p className="text-sm text-zinc-400">Age {age}</p>}
                        </div>

                        <div className="flex gap-4">
                            <button className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-pink dark:hover:text-brand-orange transition-colors font-medium" onClick={getFollowers}>
                                Followers
                            </button>
                            <button className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-pink dark:hover:text-brand-orange transition-colors font-medium" onClick={getFollowing}>
                                Following
                            </button>
                        </div>
                    </div>

                    {/* actions — pushed to right */}
                    <div className="ml-auto flex gap-2">
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <button
                            className={`text-sm font-medium border rounded-lg px-4 py-1.5 w-28 transition-colors ${editMode ? "text-brand-pink border-brand-pink dark:text-brand-orange dark:border-brand-orange" : "border-zinc-200 dark:border-zinc-700 hover:text-brand-pink hover:border-brand-pink dark:hover:text-brand-orange dark:hover:border-brand-orange"}`}
                            onClick={() => setEditMode(!editMode)}
                        >
                            Edit Mode
                        </button>

                        <button
                            className="text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-1.5 w-28 hover:text-brand-pink hover:border-brand-pink dark:hover:text-brand-orange dark:hover:border-brand-orange transition-colors"
                            onClick={handleSignout}
                        >
                            Sign out
                        </button>

                        {/* dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(prev => !prev)}
                                className="text-sm font-medium px-4 py-1.5 w-28 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 flex items-center justify-between"
                            > 
                                Update <span>▾</span>
                            </button>

                            {dropdownOpen && (
                                <div className="absolute top-10 left-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-md z-10 w-36">                                                                                                                                
                                    <button onClick={() => { router.push("/change_password"); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm         
                                        text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">                                                                                   
                                            Change Password                                                                                                                        
                                        </button>                                                                                                                                  
                                        <button onClick={() => { fileInputRef.current?.click(); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm           
                                        text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">                                                                                   
                                            Edit Photo
                                    </button>                                                                                                   
                                </div> 
                            )}
                        </div>
                    </div>
                </div>

                {/* divider */}
                <div className="border-t border-zinc-100 dark:border-zinc-800" />

                {/* analyze mode banner - came from sidebar analyze button */}
                {mode === "analyze" && !bannerDismissed && (
                    <div className="w-full bg-brand-pink dark:bg-brand-orange-dark border border-brand-pink dark:border-brand-orange-dark rounded-xl px-4 py-3 flex items-center justify-between mb-6"> 
                        <div className="flex items-center gap-2"> 
                            <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">                                                               
                                <path d="M8 1l1.8 5h5.2l-4.2 3 1.6 5L8 11l-4.4 3 1.6-5L1 6h5.2z"/>                                                                     
                            </svg> 
                            <p> Pick an outfit to analyze</p>
                        </div> 
                        <DismissButton onDismiss={() => setBannerDismissed(true)}/>
                    </div>
                )}

                {/* posts grid */}
                {images.length === 0 ?
                    <div className="flex w-full items-center justify-center py-24">
                        <p className="text-sm text-zinc-400">No posts yet.</p>
                    </div>

                    :

                    /* map posts */
                    <div className="grid grid-cols-3 gap-1 w-full">
                        {images.map((image) => (
                            <div key={image.image_id} onClick={() => setSelectedImage(image)} className="cursor-pointer aspect-[4/5] group relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 ">
                                <Image src={image.url} alt="fit" fill className="object-cover group-hover:opacity-90 transition-opacity" />
                                
                                {/* hover mode - show like heart and analyze button */}
                                <div className="absolute inset-0 transition-colors flex items-center justify-center p-3 bg-black/0 group-hover:bg-black/40 opacity-0 group-hover:opacity-100">
                                    <button
                                        onClick={(e) => {e.stopPropagation(); handleAnalyze(image.image_id, image.url);}}
                                        className="text-sm text-white bg-white/20 hover:bg-brand-pink/80 dark:hover:bg-brand-orange/80 hover:text-white rounded-full px-4 py-2 w-fit transition-colors">
                                        View
                                    </button>
                                </div> 

                                {/* add x button if in editMode */} 
                                {editMode && (                                                                                                                             
                                    <button
                                        className="absolute top-1 right-1 z-10 w-5 h-5 bg-black/60 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center transition-colors"
                                        onClick={(e) => { e.stopPropagation(); 
                                            setConfirmModal(true); 
                                            setImageToDelete(image.image_id);
                                        }}
                                    >
                                        ✕
                                    </button>                                                                                                                              
                                )}  
                            </div>


                        ))}
                    </div>
                }
            </main>

            {/* following modal */}
            {followingModal && (
                <Modal onClose={() => setFollowingModal(false)}>
                    <div className="p-6">
                        <h2 className="text-base font-semibold text-black dark:text-white mb-4">Following</h2>
                        {followingList.length === 0
                            ? <p className="text-sm text-zinc-400">Not following anyone yet.</p>
                            : <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                            
                            
                                {followingList.map((user) => (
                                    <div key={user.following_id} className="py-3">
                                        <Link href={`/users/${user.following_id}`} className="text-sm font-medium text-black dark:text-white">
                                            {user.username}
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>
                </Modal>
            )}

            {/* followers modal */}
            {followerModal && (
                <Modal onClose={() => setFollowerModal(false)}>
                    <div className="p-6">
                        <h2 className="text-base font-semibold text-black dark:text-white mb-4">Followers</h2>
                        {followerList.length === 0
                            ? <p className="text-sm text-zinc-400">No followers yet.</p>
                            : <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                                {followerList.map((user) => (
                                    <div key={user.follower_id} className="py-3">
                                        <Link href={`/users/${user.follower_id}`} className="text-sm font-medium text-black dark:text-white">
                                            {user.username}
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        }
                    </div>
                </Modal>
            )}

            {/* image detail modal */}
            {selectedImage && (
                <Modal onClose={() => {setSelectedImage(null); setError("");}}>
                    <div className="flex">
                        <div className="relative aspect-[4/5] w-2/3">
                            <Image src={selectedImage.url} alt="fit" fill className="object-cover"/>
                        </div>
                        <div className="flex flex-col gap-2 p-5 pt-10 w-1/3">
                            <button className="text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 hover:border-amber-400 hover:text-amber-400 transition-colors"
                                onClick={() => handleAnalyze(selectedImage.image_id, selectedImage.url)}>
                                View
                            </button> 
                            {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
                            <div className="flex items-center justify-between mt-auto">
                                <p className="text-sm font-medium text-black dark:text-white">{selectedImage.likes} {selectedImage.likes === 1 ? 'like' : 'likes'}</p>
                                <p className="text-xs text-zinc-400">{new Date(selectedImage.created_at).toLocaleDateString()}</p>
                                <Heart filled={favoritedImageIDs.has(selectedImage.image_id)} onToggle={() => favoritedImageIDs.has(selectedImage.image_id) ? setUnfavorite(selectedImage.image_id) : setFavorite(selectedImage.image_id)} />
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* delete confirm modal */}
            {confirmModal && (
                <ConfirmModal 
                    message="Are you sure you want to delete this post?"
                    onConfirm={() => deleteImage(imageToDelete!)}
                    onClose={() => { setConfirmModal(false); setImageToDelete(null); }}
                />
            )}

            

        </div>
    );
}
