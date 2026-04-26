export default function Heart({ filled, onToggle }: { filled: boolean; onToggle: () => void }) {
    
    return (
        
        <button className="text-brand-pink text-2xl hover:scale-110 transition-transform border-none bg-transparent" 
            onClick={onToggle}
        >
            {filled ? "♥" : "♡"}    
        </button>
    )
} 