"use client";
import { useState, useEffect, useRef } from "react";
import supabase from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Image from "next/image";
import Spinner from "@/components/spinner";
import { useUser } from "@/context/userContext";
import Modal from "@/components/modal";
import ConfirmModal from "@/components/confirmModal"; 
import Heart from "@/components/Heart";
import Link from "next/link";
import { loggedFetch } from "@/lib/api";


export default function Profile() {

    const { username, user_id, profilePic, loading, age, refreshUser } = useUser() ?? { username: "", user_id: "", profilePic: null, loading: false, age: "", refreshUser: () => {}};

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

    //update profile pic
    const changeProfilePicture = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append("image", file);

            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/pfp`, {
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
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/images/${image_id}`, {method: 'DELETE'}, user_id);

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

    if (!fetched) return <Spinner/>;

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Navbar/>
            <main className="w-full max-w-4xl mx-auto px-6 py-8">

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
                            <button className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-amber-400 transition-colors font-medium" onClick={getFollowers}>
                                Followers
                            </button>
                            <button className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-amber-400 transition-colors font-medium" onClick={getFollowing}>
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
                            className={`text-sm font-medium border rounded-lg px-4 py-2 transition-colors ${editMode ? "border-amber-400 text-amber-400" : "border-zinc-200 dark:border-zinc-700 hover:border-amber-400 hover:text-amber"}`}
                            onClick={() => setEditMode(!editMode)}
                        >
                            Edit Mode
                        </button>
                        <button
                            className="text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 hover:border-amber-400 hover:text-amber-400 transition-colors"
                            onClick={() => router.push("/change_password")}
                        >
                            Change Password
                        </button>
                        <button
                            className="text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 hover:border-amber-400 hover:text-amber-400 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Edit photo
                        </button>
                        <button
                            className="text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 hover:border-red-400 hover:text-red-400 transition-colors"
                            onClick={handleSignout}
                        >
                            Sign out
                        </button>
                    </div>
                </div>

                {/* divider */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 mb-6" />

                {/* posts grid */}
                {images.length === 0 ?
                    <div className="flex w-full items-center justify-center py-24">
                        <p className="text-sm text-zinc-400">No posts yet.</p>
                    </div>

                    :

                    /* map posts */
                    <div className="grid grid-cols-3 gap-1 w-full">
                        {images.map((image) => (
                            <div key={image.image_id} onClick={() => setSelectedImage(image)} className="cursor-pointer aspect-square relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                <Image src={image.url} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" />

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
                <Modal onClose={() => setSelectedImage(null)}>
                    <div className="flex">
                        <div className="relative aspect-square w-2/3">
                            <Image src={selectedImage.url} alt="fit" fill className="object-cover"/>
                        </div>
                        <div className="flex flex-col gap-2 p-5 w-1/3">
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
