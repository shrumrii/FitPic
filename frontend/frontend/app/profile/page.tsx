"use client";
import { useState, useEffect, useRef } from "react";
import supabase from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Image from "next/image";
import Spinner from "@/components/spinner"; 
import { useUser } from "@/context/userContext";
import Modal from "@/components/modal"; 


export default function Profile() {

    const { username, user_id, profilePic, loading, age, refreshUser } = useUser() ?? { username: "", user_id: "", profilePic: null, loading: false, age: "", refreshUser: () => {}};

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<{image_id: string, url: string, created_at: string}[]>([]); 
    const [followingList, setFollowingList] = useState<{ following_id: string, username: string }[]>([]);
    const [followerList, setFollowerList] = useState<{ follower_id: string, username: string }[]>([]);
    const [selectedImage, setSelectedImage] = useState<{image_id: string, url: string, created_at: string} | null>(null);
    const [followingModal, setFollowingModal] = useState(false); 
    const [followerModal, setFollowerModal] = useState(false); 
    
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
                console.log(`fetching: http://localhost:8000/users/${user_id}/images`)
                const imagesResponse = await fetch(`http://localhost:8000/users/${user_id}/images`); 

                if (!imagesResponse.ok) {
                    console.log(imagesResponse.status)
                    throw new Error("Failed to get user's images");
                }

                const imagesResult = await imagesResponse.json(); 
                //console.log("IMAGES DATA"); 
                //console.log(imagesResult.data); 

                setImages(imagesResult.data); 

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

            const response = await fetch(`http://localhost:8000/users/${user_id}/pfp`, {
                method: "POST",
                body: formData
            });

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
            const response = await fetch(`http://localhost:8000/users/${user_id}/following`); 

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
            const response = await fetch(`http://localhost:8000/users/${user_id}/followers`); 

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

    if (loading) return <Spinner/>; 

    return (
        <div className="flex flex-col min-h-screen bg-zinc-100 font-sans dark:bg-black">
            <Navbar/>
            <main className="flex min-h-screen w-full max-w-4xl mx-auto flex-col items-center justify-start py-8 px-16 bg-white dark:bg-black">

                <div className="flex flex-col gap-4">

                    <div className="flex items-center gap-6">

                        <div className="w-24 h-24 rounded-full overflow-hidden">
                            {profilePic ? <Image src={profilePic} alt={username} width={96} height={96}/> :
                            <div className="w-24 h-24 rounded-full bg-amber-400 flex items-center justify-center font-semibold"> {username[0]?.toUpperCase()}</div>
                            }
                        </div>


                        <div className="flex flex-col gap-1">
                            <div className="flex flex-row gap-2">
                                <p> {username} </p>
                                <p> Age: {age} </p>
                            </div>
                            
                            <div className="flex flex-row gap-2">
                                <button className="bg-black text-white rounded-lg px-6 py-3 hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black"
                                    onClick={getFollowers}> 
                                    Followers
                                </button> 
                                
                                <button className="bg-black text-white rounded-lg px-6 py-3 hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black"
                                    onClick={getFollowing}> 
                                    Following
                                </button> 
                            </div>


                        </div>
                    </div>

                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    <div className="flex gap-3"> 
                        <button
                            className="bg-black text-white rounded-lg px-6 py-3 hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Edit profile picture
                        </button>

                        <button
                            className="bg-black text-white rounded-lg px-6 py-3 hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black"
                            onClick={handleSignout}
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            
                {/* feed grid placeholder, show "No posts yet" text if user has no posts */}
                {images.length === 0 ? 
                    <div className="flex w-full items-center justify-center mt-16">
                        <p className="text-zinc-400">No posts yet.</p>
                    </div>
                    
                    : 
                    
                    /* map posts */ 
                    <div className="grid grid-cols-3 gap-1 w-full mt-8">
                        {images.map((image) => (
                            <div key={image.image_id} onClick={() => setSelectedImage(image)} className="cursor-pointer aspect-square relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 rounded-sm"> 
                                <Image src={image.url} alt="fit" fill className="object-cover" />
                            </div> 
                        ))}
                    </div>
                }   
            </main>

            {followingModal && (<Modal onClose={() => setFollowingModal(false)}>
                {<div className="flex flex-col gap-1 w-full">
                    {followingList.map((user) => (
                        <div key={user.following_id} className="cursor-pointer aspect-square relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 rounded-sm"> 
                            <p> {user.username} </p>
                        </div> 
                    ))}
                </div>}
            </Modal>)} 

            {followerModal && (<Modal onClose={() => setFollowerModal(false)}>
                {<div className="flex flex-col gap-1 w-full">
                    {followerList.map((user) => (
                        <div key={user.follower_id} className="cursor-pointer aspect-square relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 rounded-sm"> 
                            <p> {user.username} </p>
                        </div> 
                    ))}
                </div>}
            </Modal>)} 

            {selectedImage && (<Modal onClose={() => setSelectedImage(null)}>
                {<div className="flex"> 
                    <div className="relative aspect-square w-2/3">
                        <Image src={selectedImage.url} alt="fit" fill className="object-cover"/>
                    </div>

                    <div className="bg-white flex flex-col items-center justify-center text-black w-1/3"> 
                        <p> hi </p>
                    </div>
                </div>}
            </Modal>)}

        </div>
    );
}
