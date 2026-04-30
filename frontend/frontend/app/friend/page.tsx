"use client";
import { useState, useEffect } from "react";
import { loggedFetch } from "@/lib/api";
import Sidebar from "@/components/sidebar";
import { useUser } from "@/context/userContext";


export default function Friend() {

    const { user_id, loading } = useUser() ?? { user_id: "", loading: false };
    const [searchLoading, setSearchLoading] = useState(false);
    const [usernameSearchString, setUsernameSearchString] = useState("");
    const [usernameList, setUsernameList] = useState<{user_id: string, username: string | null}[]>([]);
    const [searching, setSearching] = useState(false);
    const [followedList, setFollowedList] = useState<string[]>([]);

    useEffect(() => {
        const populateFriendPage = async () => {
            if (loading) return;
            if (user_id == "") return;

            try {
                const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${user_id}/following`, undefined, user_id);

                if (!response.ok) {
                    console.log(await response.text())
                    throw new Error("error");
                }

                const result = await response.json();
                setFollowedList(result.data.map((item: {following_id: string}) => item.following_id));

            } catch (error) {
                console.error(error);
            }
        }
        populateFriendPage();
    }, [loading, user_id])

    const handleSearch = async () => {

        try {
            setSearchLoading(true);
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/search?username=${usernameSearchString}`, undefined, user_id);

            if (!response.ok) {
                console.log(await response.text())
                throw new Error("Failed to search for username");
            }

            const result = await response.json();
            setUsernameList(result.data);
            setSearching(true);

        } catch (error) {
            console.error(error);
        } finally {
            setSearchLoading(false);
        }
    }

    const addFriend = async (followingID: string) => {

        try {
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/follow`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ following_id: followingID })
            }, user_id);

            if (!response.ok) {
                console.log(await response.text())
                throw new Error("error");
            }

            const result = await response.json();

            if (!result.success) {
                console.log("Add friend not successful");
            } else {
                console.log(`${result.data.following_id} successfully added`);
                if (!followedList.includes(result.data.following_id)) {
                    setFollowedList([...followedList, result.data.following_id])
                }
            }

        } catch (error) {
            console.error(error);
        }
    }

    const removeFriend = async (followingID: string) => {

        try {
            const response = await loggedFetch(`${process.env.NEXT_PUBLIC_API_URL}/users/unfollow/${followingID}`, {
                method: "DELETE"
            }, user_id);

            if (!response.ok) {
                console.log(await response.text());
                throw new Error("error");
            }

            const result = await response.json();

            if (!result.success) {
                console.log("Remove friend not successful");
                return;
            }

            console.log(`${followingID} successfully removed`);
            setFollowedList(followedList.filter(id => id !== followingID));

        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="flex min-h-screen bg-white dark:bg-black">
            <Sidebar/>
            <main className="w-full max-w-sm mx-auto px-6 py-8 px-8">
                <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-white mb-6">
                    Find Friends
                </h1>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={usernameSearchString}
                        placeholder="Search by username..."
                        onChange={(e) => {
                            setUsernameSearchString(e.target.value);
                            if (!e.target.value) setSearching(false);
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter" && usernameSearchString) handleSearch(); }}
                        className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:border-brand-pink dark:focus:border-brand-orange transition-colors dark:bg-zinc-900 dark:text-white"
                    />
                    <button
                        className="bg-black text-white text-sm font-medium rounded-lg px-5 py-2.5 enabled:hover:bg-brand-pink dark:enabled:hover:bg-brand-orange enabled:hover:text-white transition-colors dark:bg-white dark:text-black disabled:opacity-50 whitespace-nowrap"
                        onClick={handleSearch}
                        disabled={!usernameSearchString || searchLoading}
                    >
                        {searchLoading ? "Searching..." : "Search"}
                    </button>
                </div>

                {/* results */}
                {searching && (
                    <div className="mt-6">
                        {usernameList.length === 0 ? (
                            <p className="text-sm text-zinc-400">No users found.</p>
                        ) : (
                            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                                {usernameList.map((user) => (
                                    <div key={user.user_id} className="flex items-center justify-between py-3">
                                        <p className="text-sm font-medium text-black dark:text-white">{user.username}</p>
                                        <button
                                            className="text-sm font-medium rounded-lg px-4 py-1.5 transition-colors bg-black text-white hover:bg-brand-pink dark:hover:bg-brand-orange hover:text-white dark:bg-white dark:text-black"
                                            onClick={() => followedList.includes(user.user_id) ? removeFriend(user.user_id) : addFriend(user.user_id)}
                                        >
                                            {followedList.includes(user.user_id) ? "Following" : "Follow"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
}
