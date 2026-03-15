"use client";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import { useState } from "react";



export default function Home() {

    
    const [loading, setLoading] = useState(false); 
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ username: "", age: "" });  
    const router = useRouter(); 

    const usernameAge = (e: React.ChangeEvent<HTMLInputElement>) => { 
        const { name, value } = e.target; 
        setFormData(prev => ({ ...prev, [name]: value })); //keep previous form data, but update wtvr field that changed 
    }

    const nextStep = () => { 

        console.log(step); 
        if (step > 2) return;
        if (step == 2) { 
            createUser(); 
            return;
        }
        setStep(prev => prev + 1);
    } 

    //send form data to backend, add user to db 
    const createUser = async () => { 
        setLoading(true); 

        try { 
            
            //get current user from supabase auth
            const { data: { user }, error } = await supabase.auth.getUser(); 
            console.log("data", user); 

            if (error) {
                console.error("Failure to retrieve user from supabase auth", error);
                throw new Error("Failed to retrieve user from supabase auth");
            }

            //redirect to signup if no user 
            if (!user) { 
                console.log("No user found, redirect to signup page"); 
                router.push("/signup"); //idk if this is right... 
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

            router.push("/upload"); //redirect to upload page after successful user creation 
        } catch (error) { 
            console.error(error);
        } finally { 
            setLoading(false); 
        }
    }


    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                    Onboarding. 
                </h1>

                <div> 
                    {step === 1 && 
                        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                            <form> 
                                <input 
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    onChange={usernameAge}/>
                            </form> 
                            <button onClick={nextStep}> Next </button>
                        </div>
                    } 

                    {step === 2 && 
                        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                            <form> 
                                <input 
                                    type="number"
                                    name="age"
                                    placeholder="Age"
                                    onChange={usernameAge}/>
                            </form> 
                            <button onClick={nextStep} disabled={loading}> {loading ? "Creating..." : "Create User"} </button>
                        </div>
                    } 


                </div> 



                </div>
            </main>
        </div>
    ); 
}
