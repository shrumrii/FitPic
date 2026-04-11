"use client";
import Navbar from "@/components/navbar"
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import { useUser } from "@/context/userContext";


export default function Rankings() {

    const { username, user_id, loading } = useUser() ?? { username: "", user_id: "", loading: false};
    const router = useRouter();
    const items = ["1", "2", "3", "4", "5"];

    const [loadingRankings, setLoadingRankings] = useState(false);
    const [rankings, setRankings] = useState<{image_id: string, rank: Number, url: string}[]>([]);
    const [selectedImage, setSelectedImage] = useState<{image_id: string, rank: Number, url: string} | null>(null);

    useEffect(() => {
        const getRankings = async () => { 

            if (user_id == "") return;

            try { 
                setLoadingRankings(true); 
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/rankings`);

                if (!response.ok) { 
                    console.log(await response.text());
                    throw new Error("Failed to get rankings")
                }

                const result = await response.json(); 
                
                //set rankings and flatten image url from joined table 
                setRankings(result.data.map((item: any) => ({                                                                                              
                    ...item,                                                                                                                               
                    url: item.images.url                                                                                                                   
                })));  

            } catch (error) { 
                console.error(error);
            } finally { 
                setLoadingRankings(false);
            }
        }
        getRankings();
    }, [loading, user_id])

    if (loading || loadingRankings) return <Spinner/>; 

    const first = rankings.find(r => r.rank === 1); 
    const second = rankings.find(r => r.rank === 2);
    const third = rankings.find(r => r.rank === 3);
    const fourth = rankings.find(r => r.rank === 4);
    const fifth = rankings.find(r => r.rank === 5);

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Navbar/>
            <main className="w-full max-w-7xl mx-auto px-6 py-8 relative">
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white mb-6">
                    My Rankings 
                </h1>

                {/* Podium display */}
                <div className="flex flex-col items-center gap-6">
                    {/* Top 3 podium */}
                    <div className="flex items-end gap-4">
                        {/* 2nd place */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="relative w-40 aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg">
                                {second && <Image src={second.url} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" />}
                            </div>
                            <div className="w-40 h-24 bg-gray-300 dark:bg-gray-600 rounded-t-lg flex items-center justify-center text-lg font-bold">2</div>
                        </div>
                        {/* 1st place */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="relative w-40 aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg">
                                {first && <Image src={first.url} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" />}
                            </div>
                            <div className="w-40 h-36 bg-amber-400 rounded-t-lg flex items-center justify-center text-lg font-bold">1</div>
                        </div>
                        {/* 3rd place */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="relative w-40 aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg">
                                {third && <Image src={third.url} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" />}
                            </div>
                            <div className="w-40 h-16 bg-gray-300 dark:bg-gray-600 rounded-t-lg flex items-center justify-center text-lg font-bold">3</div>
                        </div>
                    </div>
                    {/* 4th and 5th */}
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center gap-1">
                            <div className="relative w-40 aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg">
                                {fourth && <Image src={fourth.url} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" />}
                            </div>
                            <span className="text-lg font-bold">4</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="relative w-40 aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg">
                                {fifth && <Image src={fifth.url} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" />}
                            </div>
                            <span className="text-lg font-bold">5</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center mt-6 text-gray-400 hover:text-gray-600">
                    <button onClick={() => router.push('/rankings/edit')}> Edit Rankings </button>
                </div>

            </main>
        </div>
    );
}
