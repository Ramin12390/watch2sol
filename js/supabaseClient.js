// Initialize Supabase Client
const supabase = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY
);

// State
let currentUser = null;
let telegramContext = null;

// Mock TG context if outside telegram (for development)
function getTelegramUser() {
    const tg = window.Telegram.WebApp;
    tg.expand();
    
    // Check if we are actually in telegram
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        return tg.initDataUnsafe.user;
    }
    
    // Mock user for testing in browser
    return {
        id: 7706809220, // Dummy ID
        first_name: "Test User",
        username: "testuser"
    };
}

async function fetchUserFromDb(telegramId) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();
            
        if (error) {
            console.error("Error fetching user:", error);
            // If user doesn't exist, we might want to create them here 
            // though the bot usually handles this.
            return null;
        }
        return data;
    } catch (err) {
        console.error("Fetch API error:", err);
        return null;
    }
}

async function updateUserBalance(telegramId, amountToAdd) {
    try {
        if (!currentUser) return false;
        const newBalance = currentUser.balance + amountToAdd;
        
        const { data, error } = await supabase
            .from('users')
            .update({ balance: newBalance })
            .eq('telegram_id', telegramId)
            .select()
            .single();
            
        if (error) throw error;
        
        currentUser = data; // Update local state
        updateUI(); // Function defined in app.js
        return true;
    } catch (err) {
        console.error("Error updating balance:", err);
        return false;
    }
}
