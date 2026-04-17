"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { getUser } from "@/lib/getUser";
import { loggedFetch } from "@/lib/api";

export default function UploadPage() {

    const [selectedFiles, setSelectedFiles] = useState<File[]>([]); //typescript generic, initially null, but HAS TO be a File object when a file is selected
    const [uploading, setUploading] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<{ url: string, id: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [userID, setUserID] = useState("");
    const router = useRouter();

    useEffect(() => {
        const getUserID = async () => {

            try {

                const user = await getUser();

                if (user == null) {
                    console.log("Redirect to welcome page");
                    router.push("/welcome");
                    return;
                }

                setUserID(user.id);

            } catch (error) {
                console.error(error);
            }
        }
        getUserID();
    }, [])

    const fileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleUpload = async () => {
        if (!selectedFiles) return;
        setUploading(true);
        setSuccessMessage("");

        for (const file of selectedFiles) { 
            const formData = new FormData();
            formData.append("image", file);
            

            try {

                formData.append("user_id", userID);

                const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/upload`, {
                    method: "POST",
                    body: formData
                }, userID)

                if (!response.ok) { //server
                    console.log(await response.text())
                    throw new Error("Upload failed");
                }

                const result = await response.json(); //backend check
                if (result.success) {
                    setUploadedImages(prev => [...prev, { url: result.data.url, id: result.data.image_id }]);
                    console.log("Successfully uploaded image", result.data.url);
                }

            } catch (error) {
                console.error("Upload failed", error);
                alert("Upload failed. Please try again.");
            }
        } 
        setUploading(false);
        setSuccessMessage("All images uploaded successfully!");
    };

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Navbar/>
            <main className="w-full max-w-sm mx-auto px-6 py-8">
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white mb-6">
                    Upload a FitPic
                </h1>

                {/* hidden file input */}
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    ref={fileInputRef}
                    onChange={fileChange}
                    className="hidden"
                    multiple 
                />

                {/* upload zone */}
                <div
                    className="w-full border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-4 py-14 px-6 cursor-pointer hover:border-amber-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >


                    {selectedFiles.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 w-full">
                            {selectedFiles.map((img, index) => (
                                <div key={index} className="rounded-lg overflow-hidden w-full">
                                    <Image src={URL.createObjectURL(img)} alt="preview" width={400} height={400} className="w-full object-cover rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <p className="text-zinc-400 text-sm text-center">Click to choose a photo</p>
                            <p className="text-zinc-300 dark:text-zinc-600 text-xs">JPG, PNG, or WebP</p>
                        </>
                    )}
                </div>

                {selectedFiles.length > 0 && (
                    <button
                        className="mt-4 bg-black text-white text-sm font-medium rounded-lg px-5 py-2.5 w-full enabled:hover:bg-amber-400 enabled:hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50"
                        onClick={handleUpload}
                        disabled={!selectedFiles || uploading || uploadedImages.length > 0}
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </button>
                )}
                
                {successMessage && (
                    <>
                        <p className="mt-3 text-center text-sm text-green-600 dark:text-green-400">{successMessage}</p>

                        <div className="grid grid-cols-1 gap-2 w-full"> 
                            {uploadedImages.map((img) => (
                                <div key={img.id} className="rounded-lg overflow-hidden w-full">
                                    <Image src={img.url} alt="uploaded image" width={400} height={400} className="w-full object-cover rounded-lg" />
                                </div>
                            ))}
                        </div>  
                    </>
                )}

            </main>
        </div>
    );
}
