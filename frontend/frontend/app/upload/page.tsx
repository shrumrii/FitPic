"use client"; 
import Image from "next/image";
import { useState } from "react"; 
import supabase from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";

export default function UploadPage() {
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null); //typescript generic, initially null, but HAS TO be a File object when a file is selected
  const [uploading, setUploading] = useState(false); 
  const [uploadedImage, setUploadedImage] = useState<{ url: string, id: string } | null>(null);  
  const router = useRouter(); 
  
  const fileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return; 
    setUploading(true);
  
    const formData = new FormData(); 
    formData.append("image", selectedFile);
    
    
    //response 
    try { 
      const { data: { user }, error } = await supabase.auth.getUser(); 

      if (!user) { 
        console.log('User does not exist.');
        router.push("/welcome");  
        return; 
      }

      formData.append("user_id", user.id); 

      const response = await fetch("http://localhost:8000/images/upload", {
        method: "POST", 
        body: formData
      })

      if (!response.ok) { //server 
        console.log(await response.text())  
        throw new Error("Upload failed"); 
      }

      const result = await response.json(); //backend check
      if (result.success) { 
        setUploadedImage(result.data); 
      } 

    } catch (error) { 
      console.error("Upload failed", error);
      alert("Upload failed. Please try again."); 
    } finally { 
      setUploading(false); 
    }
  }; 
  
  return (
    <div className="flex flex-col min-h-screen bg-zinc-100 font-sans dark:bg-black">
      <Navbar/>
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-5xl font-bold tracking-tight text-black dark:text-white sm:text-[5rem]">
          Upload Your Image
        </h1>

        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          {/* file input */}
          <input 
            type="file"
            accept="image/*" 
            onChange={fileChange}  
          />
        

          {/* upload button */}
          <button className="bg-black text-white rounded-lg px-6 py-3 w-full hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50" 
            onClick={handleUpload} disabled={!selectedFile || uploading}> 
            {uploading ? "Uploading..." : "Upload"}
          </button>

          {/* see uploaded image */}
          {uploadedImage && (
            <div className="mt-6 rounded-xl overflow-hidden shadow-md">
              <Image src={uploadedImage.url} alt="Uploadedfit" width={400} height={400} /> 
            </div>
          )}    
        </div> 
      </main>
    </div>
  );
} 
