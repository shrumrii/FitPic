"use client"; 
import {useSortable} from '@dnd-kit/react/sortable';
import Image from 'next/image';

export default function SortableItem({ id, index, url }: { id: string, index: number, url?: string }) {

    const {ref} = useSortable({id, index});

    return (
        <div ref={ref} className="item relative flex items-center gap-2">
            <span> {index + 1}</span>
            <div className="relative aspect-square w-40"> 
                {url ? <Image src={url!} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" /> 
                : 
                <div className="bg-gray-200 dark:bg-gray-700 border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">{index+1}</div>
                }
            </div> 
        </div>
    ); 
} 