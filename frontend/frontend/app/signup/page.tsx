"use client";  
import { useState } from "react";
import supabase from "@/lib/supabase" 
import { useRouter } from "next/navigation"

export default function Signup() {
    
    const [formData, setFormData] = useState({ email: "", password: "" }); //const [email, setEmail] = useState<string | null>(null); 
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(""); 
    const router = useRouter(); 

    const setEmailPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target; 
        setFormData(prev => ({ ...prev, [name]: value })); //keep previous form data, but update wtvr field that changed 
    }; 

    //handle signup 
    const handleSignup = async () => { 
        setLoading(true); 
        setError(""); 

        //empty fields 
        if (!formData.email || !formData.password) {
            setError("Please fill in all fields");
            setLoading(false); 
            return;
        } 

        try { 
            //supabase 
            const { data, error } = await supabase.auth.signUp({ email:formData.email, password:formData.password })
            
            if (error) {  //supabase error 
                console.error(error.message); 
                setError(error.message);
                setLoading(false);
                return
            }

            router.push("/onboarding"); //redirect to upload after successful signup 
        } catch (error) { 
            console.error("Signup failed", error); 
        } finally { 
            setLoading(false); 
        } 
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-100 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black">
                <div className="flex flex-col items-center gap-6 text-center">
                    <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                    Sign up to FitPic 
                    </h1>
                </div> 

                <div className="flex flex-col items-center gap-6 text-center">
                    <form className="flex flex-col gap-3 w-full"> 
                        <input className="border border-zinc-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-amber-400 transition-colors dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
                            type="email"
                            name="email"
                            placeholder="Email"
                            onChange={setEmailPassword}/>
                        <input className="border border-zinc-300 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-amber-400 transition-colors dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
                            type="password"
                            name="password"
                            placeholder="Password"
                            onChange={setEmailPassword}/>
                    </form> 

                    <p className="text-sm text-red-500">{error}</p>
                
                    <button className="bg-black text-white rounded-lg px-6 py-3 w-full hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50"
                        onClick={handleSignup} disabled={loading}> {loading ? "Signing up..." : "Sign up"} 
                    </button>
                </div>
            </main> 
        </div>
    ); 
}
