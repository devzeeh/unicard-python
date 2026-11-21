// UniCard Retail POS Controller
class POSCartController {
    constructor() {
        this.items = [];
        this.currentCard = null;
        this.merchants = window.posMerchants || [];
        this.init();
    }

    init() {
        this.initSelectors();
        this.initLiveClock();
        this.initMQTT();
        this.initCardInputListener();
        this.renderCart();
    }

    // -------------------------------------------------------------
    // Merchant & Terminal Dropdowns
    // -------------------------------------------------------------
    initSelectors() {
        const merchSelect = document.getElementById('selectMerchant');
        const termSelect = document.getElementById('selectTerminal');
        if (!merchSelect || !termSelect) return;

        if (this.merchants.length > 0) {
            this.populateTerminals(this.merchants[0].id);
        }
    }

    onMerchantChange() {
        const merchId = document.getElementById('selectMerchant').value;
        this.populateTerminals(merchId);
    }

    onTerminalChange() {
        this.updateActiveTerminalLabel();
    }

    populateTerminals(merchantId) {
        const termSelect = document.getElementById('selectTerminal');
        termSelect.innerHTML = '';

        const merchant = this.merchants.find(m => m.id === merchantId);
        if (!merchant || !merchant.terminals || merchant.terminals.length === 0) {
            termSelect.innerHTML = '<option value="" disabled selected>No active terminals</option>';
            this.updateActiveTerminalLabel();
            return;
        }

        merchant.terminals.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.terminal_id;
            opt.textContent = `${t.device_name} (${t.terminal_id})`;
            termSelect.appendChild(opt);
        });

        termSelect.selectedIndex = 0;
        this.updateActiveTerminalLabel();
    }

    updateActiveTerminalLabel() {
        const label = document.getElementById('activeTerminalLabel');
        const termSelect = document.getElementById('selectTerminal');
        if (!label || !termSelect) return;

        if (termSelect.selectedIndex >= 0 && termSelect.options[termSelect.selectedIndex].value) {
            label.textContent = `Terminal: ${termSelect.options[termSelect.selectedIndex].text}`;
            label.className = 'font-medium text-slate-700';
        } else {
            label.textContent = 'No terminal selected';
            label.className = 'font-medium text-rose-500';
        }
    }

    // -------------------------------------------------------------
    // Cart Manipulation
    // -------------------------------------------------------------
    addItem(name, price) {
        const existing = this.items.find(i => i.item_name === name);
        if (existing) {
            existing.quantity++;
            existing.subtotal = existing.quantity * existing.unit_price;
        } else {
            this.items.push({
                item_name: name,
                unit_price: parseFloat(price),
                quantity: 1,
                subtotal: parseFloat(price)
            });
        }
        this.renderCart();
    }

    addCustomItem() {
        const nameInput = document.getElementById('customItemName');
        const priceInput = document.getElementById('customItemPrice');
        const name = (nameInput.value || '').trim() || 'Custom Item';
        const price = parseFloat(priceInput.value);

        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid price greater than ₱0.00');
            return;
        }

        this.addItem(name, price);
        nameInput.value = '';
        priceInput.value = '';
    }

    updateQty(index, delta) {
        if (!this.items[index]) return;
        this.items[index].quantity += delta;
        if (this.items[index].quantity <= 0) {
            this.items.splice(index, 1);
        } else {
            this.items[index].subtotal = this.items[index].quantity * this.items[index].unit_price;
        }
        this.renderCart();
    }

    removeItem(index) {
        this.items.splice(index, 1);
        this.renderCart();
    }

    clearCart() {
        this.items = [];
        this.renderCart();
    }

    calculateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);

        let discount = 0;
        const discountAllowed = document.getElementById('applyDiscountCheckbox').checked;
        if (discountAllowed && this.currentCard) {
            const cType = (this.currentCard.card_type || '').toLowerCase();
            if ((cType === 'student' || cType === 'pwd' || cType === 'senior') && this.currentCard.discount_verified) {
                discount = subtotal * 0.20; // 20% discount
            }
        }

        const totalDue = Math.max(0, subtotal - discount);
        const cashbackPoints = totalDue * 0.002; // 0.2% reward

        return { subtotal, discount, totalDue, cashbackPoints };
    }

    renderCart() {
        const list = document.getElementById('cartItemsList');
        const countBadge = document.getElementById('cartCountBadge');
        const subtotalEl = document.getElementById('cartSubtotal');
        const discountRow = document.getElementById('cartDiscountRow');
        const discountVal = document.getElementById('cartDiscountVal');
        const discountTag = document.getElementById('discountEligibleTag');
        const pointsEl = document.getElementById('cartPoints');
        const totalDueEl = document.getElementById('cartTotalDue');

        if (this.items.length === 0) {
            list.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                    <svg class="w-10 h-10 mb-2 stroke-current opacity-40" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    <p class="text-xs font-medium">Cart is currently empty</p>
                </div>
            `;
            countBadge.textContent = '0 items';
            subtotalEl.textContent = '₱0.00';
            discountRow.classList.add('hidden');
            pointsEl.textContent = '+₱0.00 pts';
            totalDueEl.textContent = '₱0.00';
            return;
        }

        const totalItemCount = this.items.reduce((c, i) => c + i.quantity, 0);
        countBadge.textContent = `${totalItemCount} item${totalItemCount > 1 ? 's' : ''}`;

        list.innerHTML = this.items.map((it, idx) => `
            <div class="py-2.5 flex items-center justify-between group">
                <div class="flex-1 min-w-0 pr-2">
                    <div class="font-bold text-xs text-slate-800 truncate">${it.item_name}</div>
                    <div class="text-[11px] text-slate-400">₱${it.unit_price.toFixed(2)} each</div>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button type="button" onclick="posCart.updateQty(${idx}, -1)" class="px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-200 rounded-l-lg transition">-</button>
                        <span class="px-2 text-xs font-bold text-slate-800">${it.quantity}</span>
                        <button type="button" onclick="posCart.updateQty(${idx}, 1)" class="px-2 py-0.5 text-xs text-slate-600 hover:text-slate-900 font-bold hover:bg-slate-200 rounded-r-lg transition">+</button>
                    </div>
                    <span class="font-bold text-xs text-slate-900 w-16 text-right">₱${it.subtotal.toFixed(2)}</span>
                    <button type="button" onclick="posCart.removeItem(${idx})" class="text-slate-300 hover:text-rose-500 transition px-1">✕</button>
                </div>
            </div>
        `).join('');

        const { subtotal, discount, totalDue, cashbackPoints } = this.calculateTotals();

        subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
        if (discount > 0) {
            discountRow.classList.remove('hidden');
            discountVal.textContent = `-₱${discount.toFixed(2)}`;
            if (this.currentCard) {
                discountTag.textContent = `${this.currentCard.card_type} verified`;
            }
        } else {
            discountRow.classList.add('hidden');
        }

        pointsEl.textContent = `+₱${cashbackPoints.toFixed(2)} pts`;
        totalDueEl.textContent = `₱${totalDue.toFixed(2)}`;
    }

    // -------------------------------------------------------------
    // Card Lookup & Tap Event
    // -------------------------------------------------------------
    initCardInputListener() {
        const input = document.getElementById('posCardInput');
        if (!input) return;

        let debounceTimeout = null;
        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimeout);
            const val = e.target.value.trim();
            if (val.length >= 4) {
                debounceTimeout = setTimeout(() => this.lookupCard(val), 400);
            } else {
                this.currentCard = null;
                document.getElementById('cardInfoBadge').classList.add('hidden');
                this.renderCart();
            }
        });
    }

    async lookupCard(identifier) {
        try {
            const res = await fetch(`/v1/payment/card/${encodeURIComponent(identifier)}`);
            const data = await res.json();
            if (data.success && data.data) {
                this.currentCard = data.data;
                this.showCardBadge(data.data);
                this.renderCart();
            } else {
                this.currentCard = null;
                document.getElementById('cardInfoBadge').classList.add('hidden');
                this.renderCart();
            }
        } catch (e) {
            console.warn('Card lookup error:', e);
        }
    }

    showCardBadge(card) {
        const badge = document.getElementById('cardInfoBadge');
        const nameEl = document.getElementById('cardHolderName');
        const typeEl = document.getElementById('cardTypePill');
        const balEl = document.getElementById('cardAvailBalance');

        nameEl.textContent = card.user_name || 'Cardholder';
        typeEl.textContent = card.card_type;
        balEl.textContent = `₱${parseFloat(card.balance).toFixed(2)}`;

        if (card.discount_verified) {
            typeEl.className = 'ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-emerald-100 text-emerald-700';
            typeEl.textContent += ' • 20% DISCOUNT';
        } else {
            typeEl.className = 'ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-200 text-slate-700';
        }

        badge.classList.remove('hidden');
    }

    // -------------------------------------------------------------
    // MQTT WebSocket Reader
    // -------------------------------------------------------------
    initMQTT() {
        const dot = document.getElementById('mqttStatusDot');
        const text = document.getElementById('mqttStatusText');

        if (typeof mqtt === 'undefined') {
            if (text) text.textContent = 'Keyboard Reader Mode';
            return;
        }

        const brokerUrl = 'ws://localhost:9001';
        try {
            const client = mqtt.connect(brokerUrl);
            client.on('connect', () => {
                if (dot) dot.className = 'w-2 h-2 rounded-full bg-emerald-400';
                if (text) text.textContent = 'Hardware RFID Active';
                client.subscribe('unicard/frontend/scan');
            });

            client.on('message', (topic, message) => {
                if (topic === 'unicard/frontend/scan') {
                    try {
                        const payload = JSON.parse(message.toString());
                        if (payload.card_number) {
                            const input = document.getElementById('posCardInput');
                            input.value = payload.card_number;
                            input.classList.add('ring-2', 'ring-emerald-500');
                            setTimeout(() => input.classList.remove('ring-2', 'ring-emerald-500'), 1500);
                            this.lookupCard(payload.card_number);
                        }
                    } catch (err) {
                        console.error('MQTT scan parse error:', err);
                    }
                }
            });

            client.on('error', () => {
                if (dot) dot.className = 'w-2 h-2 rounded-full bg-amber-400';
                if (text) text.textContent = 'Direct Input Mode';
            });
        } catch (e) {
            if (text) text.textContent = 'Direct Input Mode';
        }
    }

    // -------------------------------------------------------------
    // Checkout Execution
    // -------------------------------------------------------------
    async processCheckout() {
        const errEl = document.getElementById('posErrorMessage');
        errEl.classList.add('hidden');
        errEl.textContent = '';

        const cardInput = document.getElementById('posCardInput');
        const cardIdentifier = cardInput.value.trim();
        const merchantId = document.getElementById('selectMerchant').value;
        const terminalId = document.getElementById('selectTerminal').value;
        const applyDiscount = document.getElementById('applyDiscountCheckbox').checked;

        if (!cardIdentifier) {
            this.showError('Please tap a UniCard or enter card number / RFID UID.');
            cardInput.focus();
            return;
        }

        if (!merchantId || !terminalId) {
            this.showError('Please ensure an active merchant and terminal are selected.');
            return;
        }

        if (this.items.length === 0) {
            this.showError('Cart is empty. Please add items to checkout.');
            return;
        }

        const btn = document.getElementById('btnPosCheckout');
        const btnText = document.getElementById('btnCheckoutText');
        btn.disabled = true;
        btnText.textContent = 'Processing Payment...';

        try {
            const res = await fetch('/v1/payment/retail/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    card_identifier: cardIdentifier,
                    merchant_id: merchantId,
                    terminal_id: terminalId,
                    items: this.items,
                    apply_discount: applyDiscount
                })
            });

            const data = await res.json();
            if (data.success && data.data) {
                this.showReceipt(data.data);
                this.clearCart();
                cardInput.value = '';
                this.currentCard = null;
                document.getElementById('cardInfoBadge').classList.add('hidden');
            } else {
                this.showError(data.message || 'Payment transaction was declined.');
            }
        } catch (e) {
            this.showError('Network error connecting to payment gateway.');
        } finally {
            btn.disabled = false;
            btnText.textContent = 'Charge UniCard';
        }
    }

    showError(msg) {
        const errEl = document.getElementById('posErrorMessage');
        errEl.textContent = msg;
        errEl.classList.remove('hidden');
    }

    // -------------------------------------------------------------
    // Receipt Modal Handling
    // -------------------------------------------------------------
    showReceipt(receipt) {
        document.getElementById('rcptTotalPaid').textContent = `₱${parseFloat(receipt.final_amount_paid).toFixed(2)}`;
        document.getElementById('rcptPointsEarned').textContent = `+₱${parseFloat(receipt.points_earned).toFixed(2)} Cashback Reward (0.2%)`;
        document.getElementById('rcptTxnId').textContent = receipt.transaction_id;
        document.getElementById('rcptHolder').textContent = receipt.card_holder_name;
        document.getElementById('rcptCardNum').textContent = receipt.card_number;
        document.getElementById('rcptRemainingBalance').textContent = `₱${parseFloat(receipt.remaining_balance).toFixed(2)}`;

        const discountRow = document.getElementById('rcptDiscountRow');
        const discountVal = document.getElementById('rcptDiscountVal');
        if (receipt.discount_applied && parseFloat(receipt.discount_applied) > 0) {
            discountRow.classList.remove('hidden');
            discountVal.textContent = `-₱${parseFloat(receipt.discount_applied).toFixed(2)}`;
        } else {
            discountRow.classList.add('hidden');
        }

        const itemsContainer = document.getElementById('rcptItemsContainer');
        const itemsList = document.getElementById('rcptItemsList');
        if (receipt.items && receipt.items.length > 0) {
            itemsContainer.classList.remove('hidden');
            itemsList.innerHTML = receipt.items.map(it => `
                <tr class="py-1">
                    <td class="py-1">${it.item_name}</td>
                    <td class="py-1 text-center font-mono">${it.quantity}</td>
                    <td class="py-1 text-right font-bold">₱${parseFloat(it.subtotal).toFixed(2)}</td>
                </tr>
            `).join('');
        } else {
            itemsContainer.classList.add('hidden');
        }

        document.getElementById('receiptModal').classList.remove('hidden');
    }

    closeReceiptModal() {
        document.getElementById('receiptModal').classList.add('hidden');
    }

    initLiveClock() {
        const clockEl = document.getElementById('liveClock');
        if (!clockEl) return;
        const update = () => {
            clockEl.textContent = new Date().toLocaleTimeString();
        };
        update();
        setInterval(update, 1000);
    }
}

// Global initialization
window.posCart = new POSCartController();
