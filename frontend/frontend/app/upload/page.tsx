"use client";
import Image from "next/image";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { loggedFetch } from "@/lib/api";
import { useUser } from "@/context/userContext";

export default function UploadPage() {

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<{ url: string, id: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [successMessage, setSuccessMessage] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false); 
    const [uploadedImageLoaded, setUploadedImageLoaded] = useState(false); 
    const [analyzeLoading, setAnalyzeLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const { username, user_id, loading } = useUser() ?? { username: "", user_id: "", loading: false };

    const fileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setImageLoaded(false); 
            setUploadedImage(null); 
            setSuccessMessage("");
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        setSuccessMessage("");

        try {
            const formData = new FormData();
            formData.append("image", selectedFile);
            formData.append("user_id", user_id);

            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/upload`, {
                method: "POST",
                body: formData
            }, user_id);

            if (!response.ok) {
                console.log(await response.text());
                throw new Error("Upload failed");
            }

            const result = await response.json();
            if (result.success) {
                setUploadedImage({ url: result.data.url, id: result.data.image_id });
                setSuccessMessage("Image uploaded successfully!");
            } else {
                alert(result.message || "Upload failed. Please try again.");
            }

        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Please try again.");
        }

        setUploading(false);
    };

    const handleAnalyze = async (image_id: string, image_url: string) => { 
        setError(""); 
        try { 
            setAnalyzeLoading(true); 
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image_id}/analyze`, undefined, user_id); 

            if (!response.ok) { 
                console.error("Could not analyze image.")
                throw new Error("Could not analyze image.")
            }
        
            const result = await response.json(); 

            if (!result.success) { 
                setError(result.message); 
                return; 
            }
            router.push(`/analyze/${image_id}?user_id=${user_id}&image_url=${encodeURIComponent(image_url)}&analysis=${encodeURIComponent(result.analysis)}&tags=${encodeURIComponent(JSON.stringify(result.tags))}`);

        } catch (error) { 
            console.error(error); 
            setError(String(error)); 
        } finally { 
            setAnalyzeLoading(false);  
        }
    }

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
                />

                {/* upload zone */}
                <div
                    className="w-full border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center gap-4 py-14 px-6 cursor-pointer hover:border-amber-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {previewUrl ? (
                        <div className="rounded-lg overflow-hidden w-full aspect-[4/5]">
                            <img src={previewUrl} onLoad={() => setImageLoaded(true)} alt="preview" width={400} height={400} className={`w-full object-cover rounded-lg transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-zinc-400 text-sm text-center">Click to choose a photo</p>
                            <p className="text-zinc-300 dark:text-zinc-600 text-xs">JPG, PNG, or WebP</p>
                        </div>
                    )}
                </div>

                {selectedFile && (
                    <button
                        className="mt-4 bg-black text-white text-sm font-medium rounded-lg px-5 py-2.5 w-full enabled:hover:bg-amber-400 enabled:hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50"
                        onClick={handleUpload}
                        disabled={uploading || !!uploadedImage}
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </button>
                )}

                {successMessage && (
                    <>
                        <p className="mt-3 text-center text-sm text-green-600 dark:text-green-400">{successMessage}</p>
                        {uploadedImage && (
                            <div className="rounded-lg overflow-hidden w-full mt-2 aspect-[4/5]">
                                <img src={uploadedImage.url} onLoad={() => setUploadedImageLoaded(true)} alt="uploaded image" width={400} height={400} className={`w-full object-cover rounded-lg transition-opacity duration-300 ${uploadedImageLoaded ? "opacity-100" : "opacity-0"}`} />
                            </div>
                        )}
                    </>
                )}

                {uploadedImage && (
                    <div className="flex flex-col items-center gap-3 mt-6">
                        <button className="mt-4 text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 hover:border-amber-400 hover:text-amber-400 transition-colors disabled:opacity-50 disabled:hover:border-zinc-200 disabled:hover:text-inherit"
                            onClick={() => router.push("/profile")}
                            disabled={analyzeLoading}>
                            View on Profile
                        </button>

                        <button className="text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 hover:border-amber-400 hover:text-amber-400 transition-colors"
                            onClick={() => handleAnalyze(uploadedImage.id, uploadedImage.url)}>
                            {analyzeLoading ? "Analyzing..." : "Analyze this picture"}
                        </button> 
                    </div> 
                )}

                


            </main>
        </div>
    );
}
