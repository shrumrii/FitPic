"use client";
import { useState } from "react";
import supabase from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";

export default function ChangePassword() {

    const [formData, setFormData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setError("");
        setSuccess("");

        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        setLoading(true);

        try {
            // verify current password by re-signing in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) {
                setError("Could not retrieve user. Please log in again.");
                return;
            }

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: formData.currentPassword,
            });

            if (signInError) {
                setError("Current password is incorrect.");
                return;
            }

            // update to new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.newPassword,
            });

            if (updateError) {
                setError(updateError.message);
                return;
            }

            setSuccess("Password changed successfully! Redirecting...");
            setTimeout(() => router.push("/profile"), 2000);

        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Navbar />
            <main className="w-full max-w-sm mx-auto px-6 py-8">
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white mb-6">
                    Change Password
                </h1>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3">
                        <input
                            className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:border-amber-400 transition-colors dark:bg-zinc-900 dark:text-white"
                            type="password"
                            name="currentPassword"
                            placeholder="Current Password"
                            onChange={handleChange}
                        />
                        <input
                            className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:border-amber-400 transition-colors dark:bg-zinc-900 dark:text-white"
                            type="password"
                            name="newPassword"
                            placeholder="New Password"
                            onChange={handleChange}
                        />
                        <input
                            className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:border-amber-400 transition-colors dark:bg-zinc-900 dark:text-white"
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm New Password"
                            onChange={handleChange}
                        />
                    </div>

                    {error && <p className="text-xs text-red-500">{error}</p>}
                    {success && <p className="text-xs text-green-600 dark:text-green-400">{success}</p>}

                    <button
                        className="bg-black text-white text-sm font-medium rounded-lg px-5 py-2.5 w-full hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Updating..." : "Change Password"}
                    </button>

                    <button
                        className="text-sm text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                        onClick={() => router.push("/profile")}
                    >
                        Cancel
                    </button>
                </div>
            </main>
        </div>
    );
}
