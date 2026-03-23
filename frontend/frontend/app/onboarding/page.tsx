"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getUser } from "@/lib/getUser";

export default function Onboarding() {

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ username: "", age: "" });
    const [error, setError] = useState("");
    const router = useRouter();

    const usernameAge = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value })); //keep previous form data, but update wtvr field that changed
    }

    const nextStep = () => {

        console.log(step);
        if (step > 2) return;

        if (step === 1 && !formData.username) {
            setError("Please enter a username");
            return;
        }

        if (step == 2) {
            createUser();
            return;
        }
        setError("");
        setStep(prev => prev + 1);
    }

    //send form data to backend, add user to db
    const createUser = async () => {
        setLoading(true);

        if (formData.age && Number(formData.age) <= 0) {
            setError("Please enter a valid age");
            setLoading(false);
            return;
        }

        try {

            //get user
            const user = await getUser();
            if (user == null) {
                console.log("Redirect to welcome page");
                router.push("/welcome");
                return;
            }

            //combine with form data and send to backend
            const response = await fetch("http://localhost:8000/users/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, age: formData.age === "" ? null : Number(formData.age), id: user.id, email: user.email })
            })
            //age overrwriten after spreading formData if called again. if age is empty, send null, else convert to number.

            if (!response.ok) {
                console.log(await response.text())
                throw new Error("Failed to create user");
            }

            const result = await response.json();
            if (!result.success) {
                console.log(result.message);
                throw new Error("Failed to create user and push user to database");
            }

            router.push("/dashboard"); //redirect to upload page after successful user creation
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-6">
            <main className="w-full max-w-sm flex flex-col gap-8">

                {/* step indicator */}
                <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                        <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-amber-400" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                        <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-amber-400" : "bg-zinc-200 dark:bg-zinc-700"}`} />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
                        {step === 1 ? "Choose a username" : "How old are you?"}
                    </h1>
                    {step === 2 && <p className="text-sm text-zinc-500">Optional — you can skip this.</p>}
                </div>

                <div className="flex flex-col gap-4">
                    {step === 1 &&
                        <input className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:border-amber-400 transition-colors dark:bg-zinc-900 dark:text-white"
                            type="text"
                            name="username"
                            placeholder="Username"
                            onChange={usernameAge} />
                    }

                    {step === 2 &&
                        <input className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:border-amber-400 transition-colors dark:bg-zinc-900 dark:text-white"
                            type="number"
                            name="age"
                            placeholder="Age"
                            onChange={usernameAge} />
                    }

                    {error && <p className="text-xs text-red-500">{error}</p>}

                    <button className="bg-black text-white text-sm font-medium rounded-lg px-5 py-2.5 w-full hover:bg-amber-400 hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50"
                        onClick={nextStep} disabled={loading}>
                        {loading ? "Creating profile..." : step === 2 ? "Create Profile" : "Next"}
                    </button>
                </div>
            </main>
        </div>
    );
}
