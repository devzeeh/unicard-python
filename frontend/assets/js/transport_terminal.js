// UniCard Transit Validator Controller
class TransitTerminalController {
    constructor() {
        this.distanceKm = 4.0;
        this.fareConfig = {
            base_fare: 15.00,
            base_km: 4.0,
            per_km_rate: 2.00,
            promo_discount_percent: 0.0,
            promo_name: '',
            is_promo_active: false
        };
        this.merchants = window.transitMerchants || [];
        this.resetTimer = null;
        this.isProcessing = false;
        this.lastTapTime = 0;
        this.lastTappedCard = '';
        this.init();
    }

    init() {
        this.initSelectors();
        this.initLiveClock();
        this.initMQTT();
        this.fetchFareConfig();
    }

    // -------------------------------------------------------------
    // Merchant & Validator Terminal Selection
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
        this.fetchFareConfig();
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
            label.textContent = `Node: ${termSelect.options[termSelect.selectedIndex].text}`;
            label.className = 'font-medium text-slate-300';
        } else {
            label.textContent = 'No terminal assigned';
            label.className = 'font-medium text-rose-400';
        }
    }

    // -------------------------------------------------------------
    // Distance & Fare Preview
    // -------------------------------------------------------------
    setDistance(km) {
        this.distanceKm = Math.max(1, parseFloat(km));
        document.getElementById('distanceRange').value = this.distanceKm;
        document.getElementById('distanceInput').value = this.distanceKm;
        this.updateDistanceButtons();
        this.updateFarePreviews();
    }

    onRangeInput(val) {
        this.distanceKm = parseFloat(val);
        document.getElementById('distanceInput').value = this.distanceKm;
        this.updateDistanceButtons();
        this.updateFarePreviews();
    }

    updateDistanceButtons() {
        const btns = document.querySelectorAll('.km-btn');
        btns.forEach(b => {
            const km = parseFloat(b.dataset.km);
            if (km === this.distanceKm) {
                b.className = 'km-btn py-2.5 px-2 bg-indigo-600 border border-indigo-500 rounded-xl text-xs font-bold text-white transition shadow-sm text-center';
            } else {
                b.className = 'km-btn py-2.5 px-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-700 transition active:scale-95 text-center';
            }
        });

        document.getElementById('activeTripDistanceBadge').textContent = `${this.distanceKm.toFixed(1)} km Trip`;
    }

    calculateGrossFare(distance) {
        const baseFare = parseFloat(this.fareConfig.base_fare) || 15.00;
        const baseKm = parseFloat(this.fareConfig.base_km) || 4.0;
        const perKmRate = parseFloat(this.fareConfig.per_km_rate) || 2.00;

        let gross = baseFare;
        if (distance > baseKm) {
            const extraKm = distance - baseKm;
            gross += extraKm * perKmRate;
        }

        // Apply merchant promo if active
        if (this.fareConfig.is_promo_active && parseFloat(this.fareConfig.promo_discount_percent) > 0) {
            const promo = gross * (parseFloat(this.fareConfig.promo_discount_percent) / 100);
            gross -= promo;
        }

        return Math.max(0, gross);
    }

    updateFarePreviews() {
        const gross = this.calculateGrossFare(this.distanceKm);
        const discounted = gross * 0.80; // 20% off for Student/Senior/PWD

        document.getElementById('previewRegularFare').textContent = `₱${gross.toFixed(2)}`;
        document.getElementById('previewDiscountedFare').textContent = `₱${discounted.toFixed(2)}`;
        document.getElementById('standbyFareText').textContent = `₱${gross.toFixed(2)}`;
    }

    // -------------------------------------------------------------
    // Dynamic Fare Config API
    // -------------------------------------------------------------
    async fetchFareConfig() {
        const merchSelect = document.getElementById('selectMerchant');
        if (!merchSelect || !merchSelect.value) return;

        try {
            const res = await fetch(`/v1/payment/merchant/${merchSelect.value}/fare-config`);
            const data = await res.json();
            if (data.success && data.data) {
                this.fareConfig = data.data;
                this.renderFormulaCard();
                this.updateFarePreviews();
            }
        } catch (e) {
            console.warn('Could not fetch fare config:', e);
        }
    }

    renderFormulaCard() {
        document.getElementById('formulaBaseKm').textContent = parseFloat(this.fareConfig.base_km).toFixed(1);
        document.getElementById('formulaBaseFare').textContent = `₱${parseFloat(this.fareConfig.base_fare).toFixed(2)}`;
        document.getElementById('formulaPerKmRate').textContent = `₱${parseFloat(this.fareConfig.per_km_rate).toFixed(2)} / km`;

        const promoRow = document.getElementById('formulaPromoRow');
        const promoVal = document.getElementById('formulaPromoVal');
        if (this.fareConfig.is_promo_active && parseFloat(this.fareConfig.promo_discount_percent) > 0) {
            promoRow.classList.remove('hidden');
            promoVal.textContent = `-${parseFloat(this.fareConfig.promo_discount_percent).toFixed(0)}% (${this.fareConfig.promo_name || 'Active'})`;
        } else {
            promoRow.classList.add('hidden');
        }
    }

    toggleFareConfigModal() {
        const modal = document.getElementById('fareConfigModal');
        modal.classList.toggle('hidden');

        if (!modal.classList.contains('hidden')) {
            document.getElementById('inputBaseFare').value = this.fareConfig.base_fare;
            document.getElementById('inputBaseKm').value = this.fareConfig.base_km;
            document.getElementById('inputPerKmRate').value = this.fareConfig.per_km_rate;
            document.getElementById('inputPromoPercent').value = this.fareConfig.promo_discount_percent || 0;
            document.getElementById('inputPromoName').value = this.fareConfig.promo_name || '';
            document.getElementById('inputIsPromoActive').checked = !!this.fareConfig.is_promo_active;
        }
    }

    async saveFareConfig(e) {
        e.preventDefault();
        const merchId = document.getElementById('selectMerchant').value;
        const payload = {
            base_fare: parseFloat(document.getElementById('inputBaseFare').value),
            base_km: parseFloat(document.getElementById('inputBaseKm').value),
            per_km_rate: parseFloat(document.getElementById('inputPerKmRate').value),
            promo_discount_percent: parseFloat(document.getElementById('inputPromoPercent').value) || 0,
            promo_name: document.getElementById('inputPromoName').value.trim(),
            is_promo_active: document.getElementById('inputIsPromoActive').checked
        };

        try {
            const res = await fetch(`/v1/payment/merchant/${merchId}/fare-config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                this.fareConfig = { ...this.fareConfig, ...payload };
                this.renderFormulaCard();
                this.updateFarePreviews();
                this.toggleFareConfigModal();
            } else {
                alert(data.message || 'Failed to update fare settings');
            }
        } catch (err) {
            alert('Error updating rates');
        }
    }

    // -------------------------------------------------------------
    // Tap Processing & Transit Display States
    // -------------------------------------------------------------
    async processTap() {
        if (this.isProcessing) {
            console.warn('Tap transaction already in-flight. Ignoring duplicate trigger.');
            return;
        }

        const cardInput = document.getElementById('transitCardInput');
        const cardIdentifier = (cardInput.value || '').trim();
        const merchId = document.getElementById('selectMerchant').value;
        const termId = document.getElementById('selectTerminal').value;

        if (!cardIdentifier) {
            cardInput.focus();
            return;
        }

        // Anti-Passback & Double-Tap Guard: Prevent immediate repeat tap of same card
        const now = Date.now();
        if (this.lastTappedCard && this.lastTappedCard.toLowerCase() === cardIdentifier.toLowerCase() && (now - this.lastTapTime) < 5000) {
            this.playTone(300, 0.25);
            this.showDeclined('Card Recently Tapped', 'Double-tap safety prevented duplicate fare deduction.');
            return;
        }

        if (!merchId || !termId) {
            this.showDeclined('Terminal Configuration Error', 'No active transit merchant or validator assigned.');
            return;
        }

        this.isProcessing = true;
        const tapBtn = document.getElementById('btnSimulateTap');
        if (tapBtn) tapBtn.disabled = true;

        try {
            const res = await fetch('/v1/payment/transport/tap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    card_identifier: cardIdentifier,
                    merchant_id: merchId,
                    terminal_id: termId,
                    distance_km: this.distanceKm,
                    route_note: `${this.distanceKm.toFixed(1)} km Stage`
                })
            });

            const data = await res.json();
            if (data.success && data.data) {
                this.lastTappedCard = cardIdentifier;
                this.lastTapTime = Date.now();
                this.playTone(880, 0.15); // Positive chime
                this.showApproved(data.data);
                cardInput.value = '';
            } else {
                this.playTone(220, 0.3); // Low buzzer
                const title = res.status === 429 ? 'Double-Tap Prevented' : 'Tap Declined';
                this.showDeclined(title, data.message || 'Transaction rejected.');
            }
        } catch (e) {
            this.playTone(220, 0.3);
            this.showDeclined('Connection Error', 'Validator could not reach central payment server.');
        } finally {
            this.isProcessing = false;
            if (tapBtn) tapBtn.disabled = false;
        }
    }

    showApproved(receipt) {
        clearTimeout(this.resetTimer);

        document.getElementById('stateStandby').classList.add('hidden');
        document.getElementById('stateDeclined').classList.add('hidden');
        document.getElementById('stateApproved').classList.remove('hidden');

        // Dynamic Data
        document.getElementById('displayAmountPaid').textContent = `₱${parseFloat(receipt.final_amount_paid).toFixed(2)}`;
        document.getElementById('displayRemainingBalance').textContent = `₱${parseFloat(receipt.remaining_balance).toFixed(2)}`;
        document.getElementById('displayPointsEarned').textContent = `+₱${parseFloat(receipt.points_earned).toFixed(2)} Cashback Points`;
        document.getElementById('displayCardholder').textContent = receipt.card_holder_name;
        document.getElementById('displayCardNum').textContent = receipt.card_number;

        const discountBanner = document.getElementById('displayDiscountBanner');
        const discountText = document.getElementById('displayDiscountText');
        if (receipt.discount_applied && parseFloat(receipt.discount_applied) > 0) {
            discountBanner.classList.remove('hidden');
            discountText.textContent = `20% Concession Discount Saved (-₱${parseFloat(receipt.discount_applied).toFixed(2)})`;
        } else {
            discountBanner.classList.add('hidden');
        }

        // Green glow
        const glow = document.getElementById('validatorGlow');
        glow.className = 'absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none transition-all duration-500';

        // Auto return to standby after 4.5 seconds
        this.resetTimer = setTimeout(() => this.resetToStandby(), 4500);
    }

    showDeclined(title, reason) {
        clearTimeout(this.resetTimer);

        document.getElementById('stateStandby').classList.add('hidden');
        document.getElementById('stateApproved').classList.add('hidden');
        document.getElementById('stateDeclined').classList.remove('hidden');

        document.getElementById('declinedTitle').textContent = title;
        document.getElementById('declinedReason').textContent = reason;

        // Red glow
        const glow = document.getElementById('validatorGlow');
        glow.className = 'absolute -top-24 -right-24 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl pointer-events-none transition-all duration-500';

        // Auto return to standby after 4.5 seconds
        this.resetTimer = setTimeout(() => this.resetToStandby(), 4500);
    }

    resetToStandby() {
        document.getElementById('stateApproved').classList.add('hidden');
        document.getElementById('stateDeclined').classList.add('hidden');
        document.getElementById('stateStandby').classList.remove('hidden');

        const glow = document.getElementById('validatorGlow');
        glow.className = 'absolute -top-24 -right-24 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none transition-all duration-500';
    }

    // -------------------------------------------------------------
    // Audio Chimes using Web Audio API
    // -------------------------------------------------------------
    playTone(freq, duration) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = freq > 400 ? 'sine' : 'sawtooth';
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            // Audio context not allowed without interaction
        }
    }

    // -------------------------------------------------------------
    // Hardware MQTT WebSocket Listener
    // -------------------------------------------------------------
    initMQTT() {
        const dot = document.getElementById('mqttStatusDot');
        const text = document.getElementById('mqttStatusText');

        if (typeof mqtt === 'undefined') {
            if (text) text.textContent = 'USB/NFC Mode';
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
                            const now = Date.now();
                            if (this.lastTappedCard && this.lastTappedCard.toLowerCase() === payload.card_number.toLowerCase() && (now - this.lastTapTime) < 4000) {
                                console.warn('Duplicate RFID sensor trigger suppressed for card:', payload.card_number);
                                return;
                            }
                            const input = document.getElementById('transitCardInput');
                            input.value = payload.card_number;
                            // Automatic contactless tap execution
                            this.processTap();
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
window.transitTerminal = new TransitTerminalController();
