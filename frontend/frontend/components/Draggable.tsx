import {useDraggable} from '@dnd-kit/react';
import Image from 'next/image';

export default function Draggable({ id, url }: { id: string, url?: string }) {
    const {ref} = useDraggable({id});

    return (
        <div ref={ref} className="item relative aspect-square w-40">
            <Image src={url!} alt="fit" fill className="object-cover hover:opacity-90 transition-opacity" /> 
        </div>
    ); 
}