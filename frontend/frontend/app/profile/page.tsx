"use client";
import { useState, useEffect, useRef } from "react";
import supabase from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Image from "next/image";
import Spinner from "@/components/spinner"; 


export default function Profile() {

    const [username, setUsername] = useState("");
    const [user_id, setUserID] = useState("");
    const [age, setAge] = useState("");
    const [loading, setLoading] = useState(false);
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [images, setImages] = useState<{image_id: string, url: string, created_at: string}[]>([])
    const router = useRouter();

    useEffect(() => {

        //load user profile 
        const getUserData = async () => {
            setLoading(true);

            try {

                const { data: { user }, error } = await supabase.auth.getUser();

                if (!user) {
                    console.log("User not found, redirecting to welcome page");
                    router.push("/welcome");
                    return;
                }

                const response = await fetch(`http://localhost:8000/users/${user.id}`);

                if (!response.ok) {
                    throw new Error("Failed to get user id");
                }

                const result = await response.json();

                if (!result.success) {
                    console.log(result.message);
                    router.push("/onboarding");
                    return;
                }

                setUsername(result.data.username);
                setAge(result.data.age);
                setProfilePic(result.data.pfp_url);
                setUserID(user.id);

                //load images 
                console.log(`fetching: http://localhost:8000/users/${user.id}/images`)
                const imagesResponse = await fetch(`http://localhost:8000/users/${user.id}/images`); 

                if (!imagesResponse.ok) {
                    throw new Error("Failed to get user's images");
                }

                const imagesResult = await imagesResponse.json(); 
                //console.log("IMAGES DATA"); 
                //console.log(imagesResult.data); 

                setImages(imagesResult.data); 
                router.refresh()

            } catch (error) {
                console.error(error); 
            } finally {
                setLoading(false);
            }
        }
        getUserData();
    }, []);

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
                setProfilePic(result.updated_row.pfp_url);
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

    if (loading) return <Spinner/>; 

    return (
        <div className="flex flex-col min-h-screen bg-zinc-100 font-sans dark:bg-black">
            <Navbar/>
            <main className="flex min-h-screen w-full max-w-4xl mx-auto flex-col items-center justify-start py-8 px-16 bg-white dark:bg-black items:center">

                <div className="flex flex-col gap-4">

                    <div className="flex items-center gap-6">

                        <div className="w-24 h-24 rounded-full overflow-hidden">
                            {profilePic ? <Image src={profilePic} alt={username} width={96} height={96}/> :
                            <div className="w-24 h-24 rounded-full bg-amber-400 flex items-center justify-center font-semibold"> {username[0]?.toUpperCase()}</div>
                            }
                        </div>

                        <div className="flex flex-col gap-1">
                            <p> {username} </p>
                            <p> Age: {age} </p>
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
                            <div key={image.image_id} className="aspect-square relative overflow-hidden bg-zinc-200 dark:bg-zinc-800 rounded-sm"> 
                                <Image src={image.url} alt="fit" fill className="object-cover" />
                            </div> 
                        ))}
                    </div>
                }   


                

            </main>
        </div>
    );
}
