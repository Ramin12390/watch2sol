// Navigation Logic
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active', 'active-glow'));
        // Add active to clicked nav
        this.classList.add('active');
        if(this.dataset.target === 'tab-earn') {
            this.classList.add('active-glow');
        }

        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        
        // Show target tab
        const targetId = this.dataset.target;
        document.getElementById(targetId).classList.add('active');
        
        // If upgrades tab, render upgrades
        if(targetId === 'tab-upgrades') {
            renderUpgrades();
        }
    });
});

function switchWalletTab(tabStr) {
    document.querySelectorAll('.wallet-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.wallet-section').forEach(sec => sec.style.display = 'none');
    
    document.getElementById(`nav-btn-${tabStr}`).classList.add('active');
    document.getElementById(`wallet-${tabStr}`).style.display = 'block';
    document.getElementById(`wallet-${tabStr}`).classList.add('active');
}

// UI Update Logic
function updateUI() {
    if (!currentUser) return;
    
    // Header
    document.getElementById('username-display').innerText = currentUser.username || "User";
    
    // Balance
    const balanceStr = `$${parseFloat(currentUser.balance).toFixed(3)}`;
    document.getElementById('balance-display').innerText = balanceStr;
    
    // Stats
    document.getElementById('lvl-display').innerText = `Lvl ${currentUser.upgrade_level}`;
    
    const currentRate = CONFIG.BASE_EARNING + (currentUser.upgrade_level * CONFIG.UPGRADE_MULTIPLIER);
    const rateStr = `$${currentRate.toFixed(3)}`;
    
    document.getElementById('earn-rate-display').innerText = rateStr;
    document.getElementById('current-reward-display').innerText = rateStr;
}

// Initialization
async function initApp() {
    console.log("Initializing App...");
    telegramContext = getTelegramUser();
    
    if (telegramContext && telegramContext.id) {
        currentUser = await fetchUserFromDb(telegramContext.id);
        
        if (!currentUser) {
            // Need to create dummy user if webapp opened without bot /start for dev purposes
            console.log("User not found in DB. Dev Mode: Creating temporal session.");
            currentUser = {
                telegram_id: telegramContext.id,
                username: telegramContext.username,
                balance: 0,
                upgrade_level: 0
            };
        }
        
        updateUI();
    }
    
    // Hide loader, show app
    document.getElementById('loader').style.display = 'none';
    document.getElementById('app').style.display = 'block';
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
