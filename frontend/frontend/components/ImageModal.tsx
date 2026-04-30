"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Modal from "@/components/modal";
import Heart from "@/components/Heart";
import { loggedFetch } from "@/lib/api";

type ImageModalProps = {
    image: { image_id: string; url: string; username?: string; likes: number; created_at: string };
    filled: boolean;
    onToggle: () => void;
    onClose: () => void;
    onView?: () => void;
    user_id?: string;
};

type Comment = {
    content: string;
    created_at: string;
    users: { username: string };
};

export default function ImageModal({ image, filled, onToggle, onClose, onView, user_id, showComments = true }: ImageModalProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentInput, setCommentInput] = useState("");
    const [posting, setPosting] = useState(false);
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showComments) return;
        const fetchComments = async () => {
            try {
                const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image.image_id}/comments`, undefined, user_id);
                if (!response.ok) return;
                const result = await response.json();
                if (result.success) setComments(result.data);
            } catch (err) { console.error(err); }
        };
        fetchComments();
    }, [image.image_id]);

    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    const handlePostComment = async () => {
        if (!commentInput.trim()) return;
        try {
            setPosting(true);
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/images/${image.image_id}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ comment: commentInput.trim() })
            }, user_id);
            if (!response.ok) return;
            const result = await response.json();
            if (result.success) {
                setComments(prev => [...prev, { content: commentInput.trim(), created_at: new Date().toISOString(), users: { username: "You" } }]);
                setCommentInput("");
            }
        } catch (err) { console.error(err); } finally { setPosting(false); }
    };

    return (
        <Modal onClose={onClose}>
            <div className="flex" style={{ maxHeight: "80vh" }}>
                <div className="relative aspect-[4/5] w-1/2 flex-shrink-0">
                    <Image src={image.url} alt="fit" fill className="object-cover" />
                </div>
                <div className="flex flex-col w-1/2 border-l border-zinc-100 dark:border-zinc-800">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
                        <div>
                            {image.username && <p className="text-sm font-medium text-black dark:text-white">{image.username}</p>}
                            <p className="text-xs text-zinc-400">{new Date(image.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {onView && (
                                <button onClick={onView} className="text-xs text-zinc-400 hover:text-brand-pink dark:hover:text-brand-orange transition-colors">
                                    View fit
                                </button>
                            )}
                            <div className="flex items-center gap-1">
                                <Heart filled={filled} onToggle={onToggle} />
                                <span className="text-xs text-zinc-400">{image.likes}</span>
                            </div>
                        </div>
                    </div>
                    {showComments && (
                        <>
                            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                                {comments.length === 0 ? (
                                    <p className="text-xs text-zinc-400 text-center mt-4">No comments yet.</p>
                                ) : (
                                    comments.map((c, i) => (
                                        <div key={i}>
                                            <span className="text-xs font-medium text-black dark:text-white mr-2">{c.users.username}</span>
                                            <span className="text-xs text-zinc-600 dark:text-zinc-300">{c.content}</span>
                                            <p className="text-[10px] text-zinc-400 mt-0.5">{new Date(c.created_at).toLocaleDateString()}</p>
                                        </div>
                                    ))
                                )}
                                <div ref={commentsEndRef} />
                            </div>
                            <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 flex-shrink-0">
                                <input
                                    type="text"
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                                    placeholder="Add a comment..."
                                    className="flex-1 text-xs bg-transparent text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 focus:outline-none"
                                />
                                <button
                                    onClick={handlePostComment}
                                    disabled={posting || !commentInput.trim()}
                                    className="text-xs font-medium text-brand-pink dark:text-brand-orange disabled:opacity-40 transition-opacity"
                                >
                                    Post
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
}
