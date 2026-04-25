export default function Spinner() { 

    return (
        <div className="flex flex-col min-h-screen items-center justify-center gap-6 text-center">
            <div className="w-8 h-8 rounded-full border-4 border-brand-pink dark:border-brand-orange border-t-transparent animate-spin"></div>
        </div>
    )
}