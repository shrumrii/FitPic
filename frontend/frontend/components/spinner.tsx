export default function Spinner() { 

    return (
        <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"></div>
        </div>
    )
}