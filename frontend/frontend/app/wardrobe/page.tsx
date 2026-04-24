"use client";
import Sidebar from "@/components/sidebar";

const stats = [
    { label: "Fits posted", value: "—", sub: "" },
    { label: "Avg. likes", value: "—", sub: "" },
    { label: "Analyses run", value: "—", sub: "" },
    { label: "Top style", value: "—", sub: "" },
];

export default function Wardrobe() {
    return (
        <div className="flex min-h-screen bg-white dark:bg-black">
            <Sidebar />
            <main className="flex-1 px-8 py-8">

                <h1 className="text-lg font-semibold text-black dark:text-white mb-6">My Wardrobe</h1>

                {/* stat grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {stats.map((s) => (
                        <div key={s.label} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl px-4 py-3.5">
                            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
                            <p className="text-2xl font-medium text-black dark:text-white">{s.value}</p>
                            {s.sub && <p className="text-xs text-zinc-400 mt-0.5">{s.sub}</p>}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-4">

                    {/* style profile — spans 2 cols */}
                    <div className="col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
                        <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-4">Style profile</p>
                        <div className="flex flex-col gap-2.5">
                            {/* bar rows will go here */}
                            <p className="text-sm text-zinc-400">No data yet — analyze some fits first.</p>
                        </div>
                    </div>

                    {/* colour palette */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
                        <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-4">Colour palette</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {/* color swatches will go here */}
                        </div>
                        <p className="text-sm text-zinc-400">No colours yet.</p>
                    </div>

                    {/* recent fits — full width */}
                    <div className="col-span-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400">Recent fits</p>
                            <button className="text-xs text-zinc-400 hover:text-black dark:hover:text-white">View all →</button>
                        </div>
                        <div className="flex gap-2">
                            {/* fit thumbnails will go here */}
                            <p className="text-sm text-zinc-400">No fits analyzed yet.</p>
                        </div>
                    </div>

                    {/* insights */}
                    <div className="col-span-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3.5">
                        <p className="text-[11px] font-medium tracking-widest uppercase text-zinc-400 mb-3">Insights</p>
                        <div className="flex flex-col gap-0">
                            {/* insight rows will go here */}
                            <p className="text-sm text-zinc-400">Insights will appear as you log more fits.</p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
