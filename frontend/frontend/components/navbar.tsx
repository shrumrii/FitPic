"use client"; 
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from 'next/link'; 
import { useUser } from "@/context/userContext";
import Sidebar from "@/components/sidebar"; 

export default function Navbar() {

    const { username, profilePic } = useUser() ?? { username: "", profilePic: null };
    const router = useRouter(); 

    return (<nav className="w-full bg-white dark:bg-black border-b border-zinc-100 dark:border-zinc-800 px-6 py-3 flex items-center justify-between">
                <div className="flex flex-row items-center gap-2"> 
                    <Sidebar />
                    <Link href="/dashboard"> <h1 className="text-amber-400 font-semibold text-xl"> FitPic </h1> </Link>
                </div>

                <div className="flex items-center gap-3">

                    <span className="text-amber-400 font-semibold text-xl"> {username} </span>

                    <Link href="/profile"> <div className="w-10 h-10 rounded-full overflow-hidden">
                        {profilePic ? <Image src={profilePic} alt={username[0]} width={40} height={40}/> : 
                        <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center font-semibold"> {username[0]?.toUpperCase()}</div>
                        } 
                    </div> </Link>
                        
                </div> 
            </nav>); 
}   