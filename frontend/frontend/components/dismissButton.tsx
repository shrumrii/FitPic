export default function DismissButton({ onDismiss }: {onDismiss: () => void}) { 
    return (                                                                                                                               
        <button onClick={onDismiss} className="text-black hover:text-zinc-600 dark:text-white dark:hover:text-white/60">✕</button>                      
    )   
}