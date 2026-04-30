"use client";
import DraggableTag from '@/components/DraggableTag';

export default function DragObject({ aiTags, userTags, onClearTags }: { aiTags: string[], userTags: string[], onClearTags: () => void }) {
    return (
        <>
            <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-2">AI Suggestions</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {aiTags.map((tag) => (
                    <DraggableTag key={tag} tag={tag} dimmed={userTags.includes(tag)} />
                ))}
            </div>

            <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-2">My Tags</p>
            <div className="flex flex-wrap gap-2 min-h-10 rounded-xl p-3 border-2 border-dashed border-zinc-200 dark:border-zinc-700">
                {userTags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">{tag}</span>
                ))}
            </div>
            
            {/* Clear tags button */}
            <button
                className="mt-2 text-xs text-zinc-400 hover:text-red-400 transition-colors"
                onClick={onClearTags}
            >
                Clear all tags 
            </button> 
        </>
    );
}
