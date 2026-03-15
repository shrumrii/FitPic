"use client";  
import { useState } from "react";
import supabase from "@/lib/supabase" 
import { useRouter } from "next/navigation"

export default function Signup() {
    
    const [formData, setFormData] = useState({ email: "", password: "" }); //const [email, setEmail] = useState<string | null>(null); 
    const [loading, setLoading] = useState(false); 
    const router = useRouter(); 

    const setEmailPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target; 
        setFormData(prev => ({ ...prev, [name]: value })); //keep previous form data, but update wtvr field that changed 
    }; 

    //handle signup 
    const handleSignup = async () => { 
        setLoading(true); 
        try { 
            //supabase 
            const { data, error } = await supabase.auth.signUp({ email:formData.email, password:formData.password })
            
            if (error) {  //supabase error 
                console.error(error.message); 
                alert(error.message); 
                return
            }

            router.push("/upload"); //redirect to upload after successful signup 
        } catch (error) { 
            console.error("Signup failed", error); 
        } finally { 
            setLoading(false); 
        } 
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                    <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                    Signup
                    </h1>
                </div> 

                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                    <form> 
                        <input 
                            type="email"
                            name="email"
                            placeholder="Email"
                            onChange={setEmailPassword}/>
                        <input 
                            type="password"
                            name="password"
                            placeholder="Password"
                            onChange={setEmailPassword}/>
                    </form> 
                
                    <button onClick={handleSignup} disabled={loading}> {loading ? "Signing up..." : "Sign up"} </button>
                </div>


                
            </main> 
        </div>
    ); 
}
