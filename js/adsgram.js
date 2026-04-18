document.addEventListener('DOMContentLoaded', () => {
    let adsgramAd = null;
    
    // Initialize Adsgram SDK
    try {
        if (window.Adsgram) {
            adsgramAd = window.Adsgram.init({ blockId: CONFIG.ADSGRAM_BLOCK_ID });
        }
    } catch(e) {
        console.error("Adsgram failed to init. Are you running inside Telegram?", e);
    }

    document.getElementById('btn-watch-ad').addEventListener('click', async () => {
        if(!currentUser) { alert("User not loaded"); return; }
        
        const statusEl = document.getElementById('ad-status');
        const btn = document.getElementById('btn-watch-ad');
        
        // Calculate dynamic reward
        const currentReward = CONFIG.BASE_EARNING + (currentUser.upgrade_level * CONFIG.UPGRADE_MULTIPLIER);
        
        btn.disabled = true;
        statusEl.innerText = "Loading Ad...";
        statusEl.style.color = "white";

        const simulateAdDev = true; // Set false in production or conditionally detect Telegram
        
        if (adsgramAd) {
            adsgramAd.show().then(async (result) => {
                // Ad completed successfully!
                statusEl.innerText = "Ad watched successfully! Adding balance...";
                
                // Add to balance
                const success = await updateUserBalance(currentUser.telegram_id, currentReward);
                
                if (success) {
                    statusEl.innerText = `+ $${currentReward.toFixed(3)} added to your balance!`;
                    statusEl.style.color = "var(--success-color)";
                    
                    // Show animation on balance
                    const balDisplay = document.getElementById('balance-display');
                    balDisplay.style.transform = 'scale(1.2)';
                    setTimeout(() => balDisplay.style.transform = 'scale(1)', 300);
                } else {
                    statusEl.innerText = "Failed to update balance.";
                    statusEl.style.color = "var(--danger-color)";
                }
                
                btn.disabled = false;
            }).catch((result) => {
                // Ad skipped or error
                console.log("Ad Error/Skip", result);
                statusEl.innerText = "Ad was not completed or an error occurred.";
                statusEl.style.color = "var(--danger-color)";
                btn.disabled = false;
            });
        } else {
            // For Dev Mode local testing without Adsgram SDK
            statusEl.innerText = "[DEV] Simulating Ad view (3s)...";
            setTimeout(async () => {
                const success = await updateUserBalance(currentUser.telegram_id, currentReward);
                if (success) {
                    statusEl.innerText = `[DEV] + $${currentReward.toFixed(3)} added!`;
                    statusEl.style.color = "var(--success-color)";
                }
                btn.disabled = false;
            }, 3000);
        }
    });
});
