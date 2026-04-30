"use client";
import { useDraggable } from '@dnd-kit/react';

export default function DraggableTag({ tag, dimmed }: { tag: string, dimmed?: boolean }) {
    const { ref, isDragging } = useDraggable({ id: tag, data: { tag } });

    return (
        <div
            ref={ref}
            style={{ opacity: isDragging ? 0.4 : dimmed ? 0.4 : 1, cursor: 'grab' }}
            className="text-xs px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 select-none touch-none inline-block"
        >
            {tag}
        </div>
    );
}
