"use client";
import Navbar from "@/components/navbar"
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/spinner";
import Modal from "@/components/modal"
import { useUser } from "@/context/userContext";
import {DragDropProvider} from '@dnd-kit/react';
import SortableItem from "@/components/SortableItem";
import Draggable from "@/components/Draggable"; 
import Droppable from "@/components/Droppable"; 
import {arrayMove} from '@dnd-kit/helpers'; 


export default function Rankings() {

    const { username, user_id, loading } = useUser() ?? { username: "", user_id: "", loading: false};
    const router = useRouter();
    const items = ["1", "2", "3", "4", "5"];

    const [loadingRankings, setLoadingRankings] = useState(false);
    const [loadingUnranked, setLoadingUnranked] = useState(false);
    const [rankings, setRankings] = useState<{image_id: string, rank: Number, url: string}[]>([]);
    const [unrankedImages, setUnrankedImages] = useState<{image_id: string, url: string}[]>([]);
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

                let unrankedImagesList = await getUnrankedImages(); 
                //filter out ranked images and set state 
                unrankedImagesList = unrankedImagesList.filter((image: any) => !result.data.some((ranking: any) => ranking.image_id === image.image_id));
                setUnrankedImages(unrankedImagesList);



            } catch (error) { 
                console.error(error);
            } finally { 
                setLoadingRankings(false);
            }

        }

        const getUnrankedImages = async () => {

            if (user_id == "") return;

            try { 
                setLoadingUnranked(true);

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/images`);

                if (!response.ok) {
                    console.log(await response.text());
                    throw new Error("Failed to get unranked images");
                }

                const result = await response.json();

                return result.data; 

            } catch (error) {
                console.error(error);
            } finally { 
                setLoadingUnranked(false); 
            }
        } 

        getRankings();
    }, [loading, user_id])

    const clearRankings = async () => { 
        try { 

            //add back ranked images to unranked images state 
            setUnrankedImages(prev => [...prev, ...rankings.map(r => ({ image_id: r.image_id, url: r.url }))]);

            //clear rankings state 
            setRankings([]); 

        } catch (error) { 
            console.error("Error clearing rankings:",error); 
        }
    }


    if (loading || loadingRankings) return <Spinner/>; 

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Navbar/>
            <main className="w-full max-w-4xl mx-auto px-6 py-8 relative">
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white mb-6">
                    My Rankings 
                </h1>


                <DragDropProvider onDragEnd={(event) => {       
                        if (!event.operation.source) return;   
                        if (!event.operation.target) return;

                        const sourceId = event.operation.source.id;                                                                                                
                        const targetId = event.operation.target.id; 

                        if (!sourceId) return;   
                        if (!targetId) return;
                                                                                                                                
                        console.log(event.operation.source.id);                                                                                                      
                        console.log(event.operation.target.id);  

                        const isFromUnranked = unrankedImages.some(img => img.image_id === sourceId);
                        //unranked drag to ranked 
                        if (isFromUnranked) { 

                            setRankings(prev => {
                                const newRankings = [...prev];          
                                const targetIndex = Number(targetId.toString().split("-")[1]);
                                const draggedImage = unrankedImages.find(img => img.image_id === sourceId);
                                if (!draggedImage) return prev; 
                                newRankings[targetIndex] = { image_id: draggedImage.image_id, url: draggedImage.url, rank: targetIndex + 1 };                          
                                return newRankings; 
                            }); 
                        
                            //filter out dragged image from unranked images 
                            setUnrankedImages(prev => prev.filter(img => img.image_id !== sourceId));
                        
                        //sort rank 
                        } else { 
                            const fromIndex = rankings.findIndex(r => r.image_id === sourceId);
                            const toIndex = rankings.findIndex(r => r.image_id === targetId);                                                                          
                            setRankings(arrayMove(rankings, fromIndex, toIndex));
                        }
                    }}
                >   

                    <div className="flex justify-center gap-8"> 

                        <ul className="flex flex-col gap-4">                                                                 
                            {unrankedImages.map((image, index) => ( 
                                <Draggable key={image.image_id} id={image.image_id} url={image.url} />
                            ))}
                            {unrankedImages.length === 0 && <div className="text-gray-500">No unranked images</div>}
                        </ul>
                        
                            
                        <ul className="flex flex-col gap-4">                                                                 
                            
                            {items.map((image, index) => (
                                <SortableItem key={rankings[index]?.image_id ?? `slot-${index}`} id={rankings[index]?.image_id ?? `slot-${index}`} index={index} url={rankings[index]?.url}/>           
                            ))} 


                        </ul>


                        
                        

                        {/*
                        <ul className="flex flex-col gap-4">                                                                 
                            {items.map((item, index) => ( 
                                <Droppable key={rankings[index]?.image_id ?? `slot-${index}`}                                                                             
                                    id={rankings[index]?.image_id ?? `slot-${index}`}
                                    url={rankings[index]?.url}                                                                                                     
                                    rank={index + 1}
                                /> 
                            ))}   
                        </ul>
                        */}

                        <button className="absolute top-4 right-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={clearRankings}>
                            Clear Rankings 
                        </button> 


                        

                    </div> 
                </DragDropProvider> 
                
            </main>
        </div>
    );
}
