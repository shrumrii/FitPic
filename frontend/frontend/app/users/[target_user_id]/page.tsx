"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/navbar";
import Image from "next/image";
import Spinner from "@/components/spinner";
import { useUser } from "@/context/userContext";
import Modal from "@/components/modal";
import Heart from "@/components/Heart";
import Link from "next/link";
import { loggedFetch } from "@/lib/api";


export default function Profile() {

    //target profile user info
    const params = useParams<{ target_user_id: string }>();
    const { target_user_id } = params;

    const [targetUsername, setTargetUsername] = useState("");
    const [targetProfilePic, setTargetProfilePic] = useState<string | null>(null);
    const [targetAge, setTargetAge] = useState("");
    const [loadingProfile, setLoadingProfile] = useState(true);

    //current logged in user info
    const { user_id: logged_user_id, loading} = useUser() ?? { user_id: "", loading: false};

    const [images, setImages] = useState<{image_id: string, url: string, created_at: string, likes: number}[]>([]);
    const [favoritedImageIDs, setFavoritedImageIDs] = useState<Set<string>>(new Set());
    const [followingList, setFollowingList] = useState<{ following_id: string, username: string }[]>([]);
    const [followerList, setFollowerList] = useState<{ follower_id: string, username: string }[]>([]);
    const [selectedImage, setSelectedImage] = useState<{image_id: string, url: string, created_at: string, likes: number} | null>(null);
    const [followingModal, setFollowingModal] = useState(false);
    const [followerModal, setFollowerModal] = useState(false);
    const [fetched, setFetched] = useState(false); 

    const router = useRouter();

    useEffect(() => {

        const getProfileInfo = async () => {
            if (!target_user_id) return;

            try {
                const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${target_user_id}`, undefined, logged_user_id);

                if (!response.ok) {
                    console.log(await response.text());
                    throw new Error("Failed to get user info")
                }

                const result = await response.json();

                if (!result.success) {
                    console.log(result.message);
                    throw new Error("Failed to get user info");
                }

                setTargetUsername(result.data.username);
                setTargetProfilePic(result.data.pfp_url);
                setTargetAge(result.data.age);
                await Promise.all([getProfileFeed(), getFavorites()]); 

            } catch (error) {
                console.error(error);
            } finally {
                setFetched(true); 
            }
        }

        const getProfileFeed = async () => {
            try {
                const imagesResponse = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${target_user_id}/images?include_likes=true`, undefined, logged_user_id);

                if (!imagesResponse.ok) {
                    console.log(imagesResponse.status)
                    throw new Error("Failed to get user's images");
                }

                const imagesResult = await imagesResponse.json();
                setImages(imagesResult.data.map((item: any) => ({...item, likes: item.favorites?.[0]?.count ?? 0})));

            } catch (error) {
                console.error(error);
            }
        }

        const getFavorites = async () => {
            if (!logged_user_id) return;

            try {
                const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites?user_id=${logged_user_id}`, undefined, logged_user_id);

                if (!response.ok) {
                    console.log(await response.text());
                    throw new Error("Failed to get favorites")
                }

                const result = await response.json();
                const favoritedIDs = new Set<string>(result.data.map((item: any) => item.images.image_id));
                setFavoritedImageIDs(favoritedIDs);

            } catch (error) {
                console.error(error);
            }
        }

        getProfileInfo();
    }, [loading, target_user_id]);

    const getFollowing = async () => {
        try {
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${target_user_id}/following`, undefined, logged_user_id);

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

        } catch (error) {
            console.error(error);
        }
    }

    const getFollowers = async () => {
        try {
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${target_user_id}/followers`, undefined, logged_user_id);

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
                    body: JSON.stringify({ user_id: logged_user_id, image_id })
                }, target_user_id);
            
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
                    body: JSON.stringify({ user_id: logged_user_id, image_id })
                }, target_user_id);
            
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

    if (!fetched) return <Spinner/>

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Navbar/>
            <main className="w-full max-w-4xl mx-auto px-6 py-8">

                {/* profile header */}
                <div className="flex items-center gap-6 mb-8">

                    {/* avatar */}
                    <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                        {targetProfilePic
                            ? <Image src={targetProfilePic} alt={targetUsername} width={80} height={80} className="object-cover w-full h-full"/>
                            : <div className="w-20 h-20 rounded-full bg-amber-400 flex items-center justify-center text-lg font-semibold">{targetUsername[0]?.toUpperCase()}</div>
                        }
                    </div>

                    {/* info */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-baseline gap-3">
                            <p className="text-lg font-semibold text-black dark:text-white">{targetUsername}</p>
                            {targetAge && <p className="text-sm text-zinc-400">Age {targetAge}</p>}
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
                </div>

                {/* divider */}
                <div className="border-t border-zinc-100 dark:border-zinc-800 mb-6" />

                {/* posts grid */}
                {images.length === 0 ?
                    <div className="flex w-full items-center justify-center py-24">
                        <p className="text-sm text-zinc-400">This user has no posts.</p>
                    </div>
                    :
                    <div className="grid grid-cols-3 gap-1 w-full">
                        {images.map((image) => (
                            <div key={image.image_id} onClick={() => setSelectedImage(image)} className="cursor-pointer aspect-[4/5] relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                <Image src={image.url} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" />
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
                            ? <p className="text-sm text-zinc-400">This user is not following anyone yet.</p>
                            : <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                                {followingList.map((user) => (
                                    <div key={user.following_id} className="py-3">
                                        <Link href={`/users/${user.following_id}`} className="text-sm font-medium text-black dark:text-white hover:text-amber-400">
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
                            ? <p className="text-sm text-zinc-400">This user has no followers yet.</p>
                            : <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                                {followerList.map((user) => (
                                    <div key={user.follower_id} className="py-3">
                                        <Link href={`/users/${user.follower_id}`} className="text-sm font-medium text-black dark:text-white hover:text-amber-400">
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
                        <div className="relative aspect-[4/5] w-2/3">
                            <Image src={selectedImage.url} alt="fit" fill className="object-cover"/>
                        </div>
                        <div className="flex flex-col gap-2 p-5 w-1/3">
                            <div className="flex items-center justify-between mt-auto">
                                <p className="text-sm font-medium text-black dark:text-white">{selectedImage.likes} {selectedImage.likes === 1 ? 'like' : 'likes'}</p>
                                <p className="text-xs text-zinc-400">{new Date(selectedImage.created_at).toLocaleDateString()}</p>
                                <Heart
                                    filled={favoritedImageIDs.has(selectedImage.image_id)}
                                    onToggle={() => favoritedImageIDs.has(selectedImage.image_id) ? setUnfavorite(selectedImage.image_id) : setFavorite(selectedImage.image_id)}
                                />
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

        </div>
    );
}
