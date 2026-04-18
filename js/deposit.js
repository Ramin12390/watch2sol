function copyDepositAddress() {
    const addr = document.getElementById('deposit-address').innerText;
    navigator.clipboard.writeText(addr);
    alert("Address copied to clipboard!");
}

document.addEventListener('DOMContentLoaded', () => {
    // Deposit Handler
    document.getElementById('btn-submit-deposit').addEventListener('click', async () => {
        if(!currentUser) { alert("User not loaded!"); return; }
        
        const amountInput = document.getElementById('deposit-amount').value;
        const proofFile = document.getElementById('deposit-proof').files[0];
        const statusEl = document.getElementById('deposit-status');
        
        if (!amountInput || parseFloat(amountInput) <= 0) {
            alert("Please enter a valid amount.");
            return;
        }
        if (!proofFile) {
            alert("Please select a screenshot proving your payment.");
            return;
        }
        
        statusEl.innerText = "Uploading proof...";
        statusEl.style.color = "white";
        
        try {
            // 1. Upload to Supabase Storage
            const fileExt = proofFile.name.split('.').pop();
            const fileName = `${currentUser.telegram_id}_${Date.now()}.${fileExt}`;
            const filePath = `receipts/${fileName}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('proofs')
                .upload(filePath, proofFile);
                
            if (uploadError) throw uploadError;
            
            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from('proofs')
                .getPublicUrl(filePath);
                
            const proofUrl = publicUrlData.publicUrl;
            
            statusEl.innerText = "Saving request...";
            
            // 2. Insert into deposits table
            const { data: insertData, error: insertError } = await supabase
                .from('deposits')
                .insert({
                    telegram_id: currentUser.telegram_id,
                    amount: parseFloat(amountInput),
                    payment_proof_url: proofUrl,
                    status: 'pending'
                })
                .select()
                .single();
                
            if (insertError) throw insertError;
            
            // 3. Notify Admin via Backend API (Vercel Node Function)
            try {
                await fetch(`${CONFIG.ADMIN_API_URL}/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'deposit',
                        id: insertData.id,
                        telegram_id: currentUser.telegram_id,
                        username: currentUser.username,
                        amount: amountInput,
                        proof: proofUrl
                    })
                });
            } catch(e) {
                console.error("Webhook trigger failed, but deposit saved.", e);
            }
            
            statusEl.innerText = "✅ Deposit submitted! Pending admin approval.";
            statusEl.style.color = "var(--success-color)";
            document.getElementById('deposit-amount').value = '';
            document.getElementById('deposit-proof').value = '';
            
        } catch (err) {
            console.error(err);
            statusEl.innerText = "❌ Failed to submit deposit. Ensure 'proofs' bucket is public.";
            statusEl.style.color = "var(--danger-color)";
        }
    });

    // Withdraw Handler
    document.getElementById('btn-submit-withdraw').addEventListener('click', async () => {
        if(!currentUser) { alert("User not loaded!"); return; }
        
        const amountInput = document.getElementById('withdraw-amount').value;
        const addressInput = document.getElementById('withdraw-address').value;
        const statusEl = document.getElementById('withdraw-status');
        
        const amount = parseFloat(amountInput);
        
        if (!amount || amount < 0.50) {
            alert("Minimum withdrawal is $0.50");
            return;
        }
        if (!addressInput) {
            alert("Please enter a valid Solana address.");
            return;
        }
        if (currentUser.balance < amount) {
            alert("Insufficient balance!");
            return;
        }
        
        statusEl.innerText = "Processing withdrawal request...";
        statusEl.style.color = "white";
        
        try {
            // First deduct balance
            const success = await updateUserBalance(currentUser.telegram_id, -amount);
            if (!success) throw new Error("Could not deduct balance");
            
            // Insert into withdrawals
            const { data: withdrawData, error: withdrawError } = await supabase
                .from('withdrawals')
                .insert({
                    telegram_id: currentUser.telegram_id,
                    solana_address: addressInput,
                    amount: amount,
                    status: 'pending'
                })
                .select()
                .single();
                
            if (withdrawError) throw withdrawError;
            
            // Notify Admin
            try {
                await fetch(`${CONFIG.ADMIN_API_URL}/notify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'withdraw',
                        id: withdrawData.id,
                        telegram_id: currentUser.telegram_id,
                        username: currentUser.username,
                        amount: amount,
                        address: addressInput
                    })
                });
            } catch(e) {
                console.error("Webhook trigger failed", e);
            }
            
            statusEl.innerText = "✅ Request submitted! Pending review.";
            statusEl.style.color = "var(--success-color)";
            document.getElementById('withdraw-amount').value = '';
            document.getElementById('withdraw-address').value = '';
            
        } catch (err) {
            console.error(err);
            statusEl.innerText = "❌ Failed to process withdrawal.";
            statusEl.style.color = "var(--danger-color)";
        }
    });
});
