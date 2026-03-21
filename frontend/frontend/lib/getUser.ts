
import supabase from "@/lib/supabase";

export async function getUser() {

    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user) {
        console.log("User not found.");
        return;
    }

    if (error) { 
        console.log(error); 
        return; 
    }

    return user; 
}

