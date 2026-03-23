"use client";
import Navbar from "@/components/navbar"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/getUser";


export default function Friend() {

    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [usernameSearchString, setUsernameSearchString] = useState("");
    const [usernameList, setUsernameList] = useState<{user_id: string, username: string | null}[]>([]);
    const [searching, setSearching] = useState(false);
    const [userID, setUserID] = useState("");
    const [adding, setAdding] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [followedList, setFollowedList] = useState<string[]>([]);


    useEffect(() => {
        const populateFriendPage = async () => {

            setLoading(true);
            try {

                const user = await getUser();

                if (user == null) {
                    console.log("Redirect to welcome page");
                    router.push("/welcome");
                    return;
                }

                setUserID(user.id);

                const response = await fetch(`http://localhost:8000/users/${user.id}/following`);

                if (!response.ok) {
                    console.log(await response.text())
                    throw new Error("error");
                }

                const result = await response.json();

                //map followedList to just be a list of following ids
                setFollowedList(result.data.map((item: {following_id: string}) => item.following_id));


            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        populateFriendPage();
    }, [])

    //when user clicks
    const handleSearch = async () => {

        setLoading(true);
        try {

            const response = await fetch(`http://localhost:8000/users/search?username=${usernameSearchString}`);

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
            setLoading(false);
        }
    }

    const addFriend = async (followingID: string) => {
        setAdding(true);

        try {

            const response = await fetch(`http://localhost:8000/users/${userID}/follow`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ following_id: followingID })
            });

            if (!response.ok) {
                console.log(await response.text())
                throw new Error("error");
            }

            const result = await response.json();

            //if log into database not successful, send popup msg
            if (!result.success) {
                console.log("Add friend not successful");
            } else {
                console.log(`${result.data.following_id} successfully added`);
                //add to the followedList state if clicked (and doesnt exist in state already)
                if (!followedList.includes(result.data.following_id)) {
                    setFollowedList([...followedList, result.data.following_id])
                }
            }

        } catch (error) {
            console.error(error);
        } finally {
            setAdding(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            <Navbar/>
            <main className="w-full max-w-xl mx-auto px-6 py-8">
                <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white mb-6">
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
                        className="border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-2.5 w-full text-sm focus:outline-none focus:border-amber-400 transition-colors dark:bg-zinc-900 dark:text-white"
                    />
                    <button
                        className="bg-black text-white text-sm font-medium rounded-lg px-5 py-2.5 enabled:hover:bg-amber-400 enabled:hover:text-black transition-colors dark:bg-white dark:text-black disabled:opacity-50 whitespace-nowrap"
                        onClick={handleSearch}
                        disabled={!usernameSearchString}
                    >
                        Search
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
                                            className="text-sm font-medium rounded-lg px-4 py-1.5 transition-colors disabled:opacity-50 bg-black text-white hover:bg-amber-400 hover:text-black dark:bg-white dark:text-black disabled:bg-zinc-100 disabled:text-zinc-400 disabled:dark:bg-zinc-800 disabled:dark:text-zinc-500"
                                            disabled={followedList.includes(user.user_id)}
                                            onClick={() => addFriend(user.user_id)}
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
