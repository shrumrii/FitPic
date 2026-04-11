import {useDroppable} from '@dnd-kit/react';
import Image from 'next/image'; 

export default function Droppable( {id, url, rank}: { id: string, url?: string, rank: number } ) {
    const {isDropTarget, ref} = useDroppable({id});

    return (
        <div ref={ref} className="item relative aspect-square w-40">
            {url ? <Image src={url!} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" /> 
            : 
            <div className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">{rank}</div>
            }
        </div>
    ); 
}