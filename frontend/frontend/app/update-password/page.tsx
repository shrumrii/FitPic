"use client";
import { useState, useRef } from "react";
import supabase from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UpdatePassword() {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [password, setPassword] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const errorTimeout = useRef<NodeJS.Timeout | null>(null); 
    const router = useRouter(); 

    const enterPassword = (e: React.ChangeEvent<HTMLInputElement>) => { 
        setError(""); 

        const password = e.target.value;
        setPassword(password); 
    }
    
    const submitPassword = async () => { 

        //check if email is valid/not empty 
        if (!password) { 
            setError("Please enter a valid (for now) password");
            if (errorTimeout.current) clearTimeout(errorTimeout.current); 
            errorTimeout.current = setTimeout(() => setError(""), 5000);
            return;
        }

        try { 
            setLoading(true);
            const { data, error } = await supabase.auth.updateUser({ password });

            if (error) { 
                setError(error.message);
                //clear error after 5 seconds, being mindful of multiple errors overriding each other 
                if (errorTimeout.current) clearTimeout(errorTimeout.current); 
                errorTimeout.current = setTimeout(() => setError(""), 5000);
                console.error("Error sending reset password email", error);
                return;
            } else { 
                setSuccessMessage("Your password has been updated successfully. Redirecting to login page..."); 
                setTimeout(() => router.push("/login"), 3000); 
            }


        } catch (error) { 
            console.error("Error sending reset password email", error);
        } finally { 
            setLoading(false);
        }
    } 

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-6">
            <main className="w-full max-w-sm flex flex-col gap-8">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
                        Reset Password
                    </h1>
                </div>

                <div className="flex flex-col gap-4">
                    <form className="flex flex-col gap-3">
                        <input disabled={successMessage !== ""} className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:border-amber-400 transition-colors dark:bg-zinc-900 dark:text-white"
                            type="password"
                            name="password"
                            placeholder="Password"
                            onChange={enterPassword} />
                    </form>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <button className="bg-black text-white text-sm font-medium rounded-lg px-5 py-2.5 w-full hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50"
                        onClick={submitPassword} 
                        disabled={loading || successMessage !== ""}>
                        {loading ? "Updating password..." : "Update Password"}
                    </button>

                    {successMessage && <p className="text-xs text-green-500">{successMessage}</p>}
                </div>
            </main>
        </div>
    );
}
