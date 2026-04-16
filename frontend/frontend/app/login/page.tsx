"use client";
import { useState, useRef } from "react";
import supabase from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {

    const [formData, setFormData] = useState({ email: "", password: "" }); //const [email, setEmail] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const errorTimeout = useRef<NodeJS.Timeout | null>(null);
    const router = useRouter();

    const setEmailPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value })); //keep previous form data, but update wtvr field that changed
    }

    const handleLogin = async () => {
        setLoading(true);
        setError("");

        //empty fields
        if (!formData.email || !formData.password) {
            setError("Please fill in all fields");
            if (errorTimeout.current) clearTimeout(errorTimeout.current); 
            errorTimeout.current = setTimeout(() => setError(""), 5000);
            setLoading(false);
            return;
        }

        try {
            //supabase
            const { data, error } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password })
            console.log(data); 

            if (error) {  //supabase error
                console.error(error.message);
                setError(error.message);
                if (errorTimeout.current) clearTimeout(errorTimeout.current); 
                errorTimeout.current = setTimeout(() => setError(""), 5000);
                return
            }

            router.push("/dashboard"); //redirect to root

        } catch (error) {
            console.error("Login failed", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-6">
            <main className="w-full max-w-sm flex flex-col gap-8">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
                        Log in to FitPic
                    </h1>
                </div>

                <div className="flex flex-col gap-4">
                    <form className="flex flex-col gap-3">
                        <input className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:border-amber-400 transition-colors dark:bg-zinc-900 dark:text-white"
                            type="email"
                            name="email"
                            placeholder="Email"
                            onChange={setEmailPassword} />
                        <input className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:border-amber-400 transition-colors dark:bg-zinc-900 dark:text-white"
                            type="password"
                            name="password"
                            placeholder="Password"
                            onChange={setEmailPassword} />
                    </form>

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <button className="bg-black text-white text-sm font-medium rounded-lg px-5 py-2.5 w-full hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50"
                        onClick={handleLogin} disabled={loading}>
                        {loading ? "Logging in..." : "Log in"}
                    </button>

                    <p className="text-center text-sm text-zinc-500">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-black dark:text-white font-medium hover:text-amber-400 transition-colors">Sign up</Link>
                    </p>
                    <p className="text-center text-sm text-zinc-500">
                        Forgot your password?{" "}
                        <Link href="/reset-password" className="text-black dark:text-white font-medium hover:text-amber-400 transition-colors">Reset</Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
