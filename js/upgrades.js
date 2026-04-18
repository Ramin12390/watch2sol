const UPGRADE_COSTS = [1.0, 3.0, 5.0, 10.0, 20.0, 50.0];

function renderUpgrades() {
    if (!currentUser) return;
    
    const container = document.getElementById('upgrades-list');
    container.innerHTML = '';
    
    for (let i = 0; i < UPGRADE_COSTS.length; i++) {
        const level = i + 1;
        const cost = UPGRADE_COSTS[i];
        
        // Define if user has this upgrade, or it's next, or it's locked
        const hasUpgrade = currentUser.upgrade_level >= level;
        const isNext = currentUser.upgrade_level + 1 === level;
        
        let btnHtml = '';
        if (hasUpgrade) {
            btnHtml = `<button class="btn-buy" disabled>Owned</button>`;
        } else if (isNext) {
            btnHtml = `<button class="btn-buy" onclick="buyUpgrade(${level}, ${cost})">Buy $${cost}</button>`;
        } else {
            btnHtml = `<button class="btn-buy" disabled>Locked</button>`;
        }
        
        const currentRate = CONFIG.BASE_EARNING + (level * CONFIG.UPGRADE_MULTIPLIER);

        const cardHtml = `
            <div class="upgrade-card">
                <div class="upgrade-info">
                    <h4>Level ${level} Multiplexer</h4>
                    <p>Earn $${currentRate.toFixed(3)} per ad</p>
                </div>
                ${btnHtml}
            </div>
        `;
        container.innerHTML += cardHtml;
    }
}

async function buyUpgrade(levelToBuy, cost) {
    if(!currentUser) return;
    
    const statusEl = document.getElementById('upgrade-status');
    
    if (currentUser.balance < cost) {
        statusEl.innerText = "❌ Insufficient balance. Please deposit funds.";
        statusEl.style.color = "var(--danger-color)";
        return;
    }
    
    // Process Purchase
    try {
        statusEl.innerText = "Processing...";
        statusEl.style.color = "#fff";
        
        const newBalance = currentUser.balance - cost;
        const newLevel = levelToBuy;
        
        const { data, error } = await supabase
            .from('users')
            .update({ 
                balance: newBalance,
                upgrade_level: newLevel
            })
            .eq('telegram_id', currentUser.telegram_id)
            .select()
            .single();
            
        if (error) throw error;
        
        currentUser = data; // update local
        updateUI(); // update header
        renderUpgrades(); // re-render list
        
        statusEl.innerText = `✅ Successfully upgraded to Level ${newLevel}!`;
        statusEl.style.color = "var(--success-color)";
        
        setTimeout(() => { statusEl.innerText = ""; }, 3000);
        
    } catch(err) {
        console.error(err);
        statusEl.innerText = "❌ Transaction failed.";
        statusEl.style.color = "var(--danger-color)";
    }
}
