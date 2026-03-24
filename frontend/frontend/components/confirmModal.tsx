"use client";

export default function ConfirmModal({ onConfirm, onClose, message }: {onConfirm: () => void, onClose: () => void, message: string }) { 
    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-sm w-full flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                <p className="text-sm font-medium text-black dark:text-white">{message}</p>
                <div className="flex gap-2 justify-end">
                    <button className="text-sm font-medium border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-400 transition-colors" 
                        onClick={onClose}>
                        Cancel
                    </button>
                    <button className="text-sm font-medium bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600 transition-colors" 
                        onClick={() => { onConfirm(); onClose(); }}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}