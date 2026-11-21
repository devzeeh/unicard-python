// UniCard Manager Refund Portal Controller
class RefundPortalController {
    constructor() {
        this.currentTxn = null;
        this.init();
    }

    init() {
        this.initLiveClock();
        // Check if txn_id is in query string
        const urlParams = new URLSearchParams(window.location.search);
        const queryTxnId = urlParams.get('txn_id') || urlParams.get('id');
        if (queryTxnId) {
            document.getElementById('lookupTxnInput').value = queryTxnId;
            this.executeLookup(queryTxnId);
        }
    }

    async lookupTransaction(e) {
        if (e) e.preventDefault();
        const input = document.getElementById('lookupTxnInput');
        const txnId = (input.value || '').trim();
        if (!txnId) return;
        await this.executeLookup(txnId);
    }

    async executeLookup(txnId) {
        const btn = document.getElementById('btnLookup');
        const errEl = document.getElementById('lookupError');
        const card = document.getElementById('txnInspectionCard');
        const successCard = document.getElementById('refundSuccessCard');

        errEl.classList.add('hidden');
        successCard.classList.add('hidden');
        btn.disabled = true;
        btn.innerHTML = 'Looking up...';

        try {
            const res = await fetch(`/v1/payment/transactions/${encodeURIComponent(txnId)}`);
            const data = await res.json();

            if (data.success && data.data) {
                this.currentTxn = data.data;
                this.renderTransaction(data.data);
                card.classList.remove('hidden');
            } else {
                this.currentTxn = null;
                card.classList.add('hidden');
                errEl.textContent = data.message || 'Transaction not found. Please verify Reference ID.';
                errEl.classList.remove('hidden');
            }
        } catch (err) {
            this.currentTxn = null;
            card.classList.add('hidden');
            errEl.textContent = 'Network error looking up transaction.';
            errEl.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>Inspect Transaction</span>';
        }
    }

    renderTransaction(tx) {
        document.getElementById('cardTxnId').textContent = tx.transaction_id;
        document.getElementById('cardHolder').textContent = tx.card_holder_name || 'Cardholder';
        document.getElementById('cardNum').textContent = tx.card_number || 'N/A';
        document.getElementById('cardMerchant').textContent = tx.merchant_name || 'Merchant';
        document.getElementById('cardTerminal').textContent = tx.terminal_name || 'Terminal';
        document.getElementById('cardAmount').textContent = `₱${parseFloat(tx.amount || 0).toFixed(2)}`;

        const dateObj = new Date(tx.created_at);
        document.getElementById('cardDate').textContent = dateObj.toLocaleString();

        const statusBadge = document.getElementById('cardTxnStatusBadge');
        const btnSubmit = document.getElementById('btnSubmitRefund');
        const btnText = document.getElementById('btnSubmitRefundText');

        if (tx.status === 'completed' && tx.is_refundable) {
            statusBadge.className = 'text-xs px-3 py-1 rounded-full font-bold uppercase bg-emerald-100 text-emerald-800';
            statusBadge.textContent = 'Completed (Refundable)';
            btnSubmit.disabled = false;
            btnText.textContent = 'Authorize & Issue Manager Refund';
        } else if (tx.status === 'refunded' || (tx.status === 'completed' && !tx.is_refundable)) {
            statusBadge.className = 'text-xs px-3 py-1 rounded-full font-bold uppercase bg-amber-100 text-amber-800';
            statusBadge.textContent = 'Already Refunded';
            btnSubmit.disabled = true;
            btnText.textContent = 'Transaction Already Refunded';
        } else {
            statusBadge.className = 'text-xs px-3 py-1 rounded-full font-bold uppercase bg-slate-200 text-slate-700';
            statusBadge.textContent = tx.status;
            btnSubmit.disabled = true;
            btnText.textContent = `Cannot Refund (${tx.status})`;
        }

        const cardStatusEl = document.getElementById('cardStatus');
        cardStatusEl.textContent = tx.card_status;
        if (tx.card_status === 'active') {
            cardStatusEl.className = 'font-bold uppercase text-emerald-600';
        } else {
            cardStatusEl.className = 'font-bold uppercase text-rose-600';
        }
    }

    async submitRefund(e) {
        e.preventDefault();
        if (!this.currentTxn) return;

        const reason = document.getElementById('reasonSelect').value;
        const notes = document.getElementById('notesInput').value.trim();
        const freezeCard = document.getElementById('freezeCardCheckbox').checked;

        const btn = document.getElementById('btnSubmitRefund');
        const btnText = document.getElementById('btnSubmitRefundText');
        const errEl = document.getElementById('refundActionError');

        btn.disabled = true;
        btnText.textContent = 'Processing Refund...';
        errEl.classList.add('hidden');

        try {
            const res = await fetch(`/v1/payment/transactions/${encodeURIComponent(this.currentTxn.transaction_id)}/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_id: this.currentTxn.transaction_id,
                    reason: reason,
                    notes: notes,
                    freeze_card: freezeCard
                })
            });

            const data = await res.json();
            if (data.success && data.data) {
                this.showSuccess(data.data);
            } else {
                errEl.textContent = data.message || 'Refund rejected by server.';
                errEl.classList.remove('hidden');
                btn.disabled = false;
                btnText.textContent = 'Authorize & Issue Manager Refund';
            }
        } catch (err) {
            errEl.textContent = 'Network communication error.';
            errEl.classList.remove('hidden');
            btn.disabled = false;
            btnText.textContent = 'Authorize & Issue Manager Refund';
        }
    }

    showSuccess(r) {
        document.getElementById('txnInspectionCard').classList.add('hidden');
        const successCard = document.getElementById('refundSuccessCard');

        document.getElementById('successMsg').textContent = `₱${parseFloat(r.refunded_amount).toFixed(2)} has been refunded to card ${r.card_number}.`;
        document.getElementById('succRefundId').textContent = r.refund_transaction_id;
        document.getElementById('succBalance').textContent = `₱${parseFloat(r.new_balance).toFixed(2)}`;
        document.getElementById('succPoints').textContent = `-₱${parseFloat(r.clawed_back_points).toFixed(2)} pts`;

        const cardStatusEl = document.getElementById('succCardStatus');
        cardStatusEl.textContent = r.card_status;
        cardStatusEl.className = r.card_status === 'blocked' ? 'font-bold uppercase text-rose-600' : 'font-bold uppercase text-emerald-600';

        const storeEl = document.getElementById('succStore');
        if (storeEl) storeEl.textContent = r.store_name || (this.currentTxn ? this.currentTxn.merchant_name : 'UniCard Store');

        const approverEl = document.getElementById('succApprovedBy');
        if (approverEl) approverEl.textContent = r.approved_by || 'Store Manager';

        successCard.classList.remove('hidden');
    }

    reset() {
        document.getElementById('lookupTxnInput').value = '';
        document.getElementById('txnInspectionCard').classList.add('hidden');
        document.getElementById('refundSuccessCard').classList.add('hidden');
        document.getElementById('lookupTxnInput').focus();
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
window.refundController = new RefundPortalController();
