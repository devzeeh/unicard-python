document.addEventListener("DOMContentLoaded", function () {
    const transactionsBody = document.getElementById("transactions-table-body");

    let allTransactions = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    const validTransactionTypes = new Set(['payment','refund','reversal','topup','withdrawal']);
    const shouldShowAmount = (type) => typeof type === 'string' && validTransactionTypes.has(type.toLowerCase());

    function escapeHtml(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // DOM Elements
    const searchTxn = document.getElementById("searchTxn");
    const filterType = document.getElementById("filterType");
    const filterStatus = document.getElementById("filterStatus");
    const pageStart = document.getElementById("pageStart");
    const pageEnd = document.getElementById("pageEnd");
    const totalItems = document.getElementById("totalItems");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");

    // Event Listeners for Filters
    if (searchTxn) searchTxn.addEventListener("input", () => { currentPage = 1; renderTransactions(); });
    if (filterType) filterType.addEventListener("change", () => { currentPage = 1; renderTransactions(); });
    if (filterStatus) filterStatus.addEventListener("change", () => { currentPage = 1; renderTransactions(); });
    if (prevPageBtn) prevPageBtn.addEventListener("click", () => { if (currentPage > 1) { currentPage--; renderTransactions(); } });
    if (nextPageBtn) nextPageBtn.addEventListener("click", () => { currentPage++; renderTransactions(); });

    function loadTransactions() {
        const pathSegments = window.location.pathname.split('/');
        let userId = null;
        if (pathSegments.length >= 3 && pathSegments[1] === 'u') {
            userId = pathSegments[2];
        } else if (pathSegments.length >= 2 && pathSegments[1] !== '') {
            userId = pathSegments[1];
        }

        let endpoint = "/v1/user/transactions";
        if (userId) {
            endpoint = "/v1/user/" + encodeURIComponent(userId) + "/transactions";
        }

        fetch(endpoint)
            .then(response => {
                if (response.status === 401) {
                    window.location.href = "/login";
                    return null;
                }
                return response.json();
            })
            .then(data => {
                if (!data || !data.success) {
                    showError();
                    return;
                }
                allTransactions = data.transactions || [];
                renderTransactions();
            })
            .catch(error => {
                console.error("Error loading transactions:", error);
                showError();
            });
    }

    function renderTransactions() {
        if (!transactionsBody) return;

        let filtered = [...allTransactions];

        // Apply Search
        const searchVal = searchTxn ? searchTxn.value.toLowerCase() : "";
        if (searchVal) {
            filtered = filtered.filter(tx =>
                (tx.description && tx.description.toLowerCase().includes(searchVal)) ||
                (tx.merchant_name && tx.merchant_name.toLowerCase().includes(searchVal)) ||
                (tx.type && tx.type.toLowerCase().includes(searchVal)) ||
                (tx.transaction_id && tx.transaction_id.toLowerCase().includes(searchVal)) ||
                (tx.terminal_id && tx.terminal_id.toLowerCase().includes(searchVal))
            );
        }

        // Apply Type Filter
        const typeVal = filterType ? filterType.value.toLowerCase() : "";
        if (typeVal) {
            filtered = filtered.filter(tx => tx.type && tx.type.toLowerCase() === typeVal);
        }

        // Apply Status Filter
        const statusVal = filterStatus ? filterStatus.value.toLowerCase() : "";
        if (statusVal) {
            filtered = filtered.filter(tx => tx.status && tx.status.toLowerCase() === statusVal);
        }


        // Pagination setup
        const total = filtered.length;
        const totalPages = Math.ceil(total / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = Math.min(startIdx + itemsPerPage, total);
        const paginated = filtered.slice(startIdx, endIdx);

        // Update Pagination UI
        if (pageStart) pageStart.textContent = total === 0 ? 0 : startIdx + 1;
        if (pageEnd) pageEnd.textContent = endIdx;
        if (totalItems) totalItems.textContent = total;
        if (prevPageBtn) prevPageBtn.disabled = currentPage <= 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage >= totalPages;

        transactionsBody.innerHTML = "";

        if (paginated.length > 0) {
            paginated.forEach(tx => {
                const tr = document.createElement("tr");
                const showAmount = shouldShowAmount(tx.type);
                const lowerType = (tx.type || '').toLowerCase();
                const isDebit = lowerType === "payment" || lowerType === "withdrawal" || lowerType === "charge" || lowerType === "deduction";
                const colorClass = showAmount ? (isDebit ? "text-red-600" : "text-green-600") : "";
                const sign = isDebit ? "-" : "+";
                const amount = showAmount ? Number(tx.amount || 0).toFixed(2) : '';
                const displayType = tx.type ? tx.type.charAt(0).toUpperCase() + tx.type.slice(1) : "";

                let txDate = "N/A";
                let txTime = "";
                if (tx.date) {
                    const d = new Date(tx.date + " " + (tx.time || ""));
                    if (!isNaN(d.getTime())) {
                        txDate = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                        txTime = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                    } else {
                        txDate = tx.date;
                        txTime = tx.time || "";
                    }
                }
                let statusHtml = "";
                if (tx.status) {
                    const statusVal = tx.status.toLowerCase();
                    const statusColor = statusVal === "completed" ? "bg-green-100 text-green-800" :
                        statusVal === "refunded" ? "bg-amber-100 text-amber-800" :
                        statusVal === "pending" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800";
                    statusHtml = `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${escapeHtml(tx.status)}</span>`;
                }

                tr.className = "hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100";
                tr.onclick = function () {
                    openTxnModal(tx, txDate, txTime);
                };

                let merchantTitle = "Transaction";
                if (tx.merchant_name && tx.merchant_name !== "Transaction") {
                    merchantTitle = tx.merchant_name;
                } else if (tx.description) {
                    merchantTitle = tx.description;
                }

                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="font-medium text-gray-900">${escapeHtml(txDate)}</div>
                        <div class="text-xs text-gray-500 mt-0.5">${escapeHtml(txTime)}</div>
                    </td>
                    <td class="px-6 py-4 max-w-0 overflow-hidden">
                        <div class="font-medium text-gray-900 truncate" title="${escapeHtml(merchantTitle)}">${escapeHtml(merchantTitle)}</div>
                        <div class="text-xs text-gray-500 mt-0.5 truncate capitalize">${escapeHtml(displayType || 'N/A')}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        ${showAmount ? `<span class="${colorClass}">${sign}₱${amount}</span>` : '<span class="text-gray-400">—</span>'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                        ${statusHtml}
                    </td>
                `;
                transactionsBody.appendChild(tr);
            });
        } else {
            transactionsBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-10 text-center text-sm text-gray-500">
                        No transactions found.
                    </td>
                </tr>
            `;
        }
    }

    function showError() {
        if (transactionsBody) {
            transactionsBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-10 text-center text-sm text-red-500">
                        Failed to load transactions.
                    </td>
                </tr>
            `;
        }
    }

    loadTransactions();

    // --- Modal Logic ---
    const txnModal = document.getElementById("txnModal");
    const txnModalContent = document.getElementById("txnModalContent");
    const closeTxnModalBtn = document.getElementById("closeTxnModalBtn");
    const closeTxnModalBottomBtn = document.getElementById("closeTxnModalBottomBtn");
    const copyTxnIdBtn = document.getElementById("copyTxnIdBtn");
    const modalCopyFullBtn = document.getElementById("modalCopyFullBtn");

    let activeModalTxnId = "";

    function copyTxnIdToClipboard() {
        if (!activeModalTxnId || activeModalTxnId === 'N/A') return;
        navigator.clipboard.writeText(activeModalTxnId).then(() => {
            const copyIcon = document.getElementById("copyIconSvg");
            const checkIcon = document.getElementById("checkIconSvg");
            const fullBtnText = document.getElementById("modalCopyFullBtnText");
            if (copyIcon && checkIcon) {
                copyIcon.classList.add("hidden");
                checkIcon.classList.remove("hidden");
            }
            if (fullBtnText) fullBtnText.textContent = "Copied!";
            setTimeout(() => {
                if (copyIcon && checkIcon) {
                    copyIcon.classList.remove("hidden");
                    checkIcon.classList.add("hidden");
                }
                if (fullBtnText) fullBtnText.textContent = "Copy Ref ID";
            }, 2000);
        }).catch(err => {
            console.warn("Failed to copy transaction ID:", err);
        });
    }

    if (copyTxnIdBtn) copyTxnIdBtn.addEventListener("click", copyTxnIdToClipboard);
    if (modalCopyFullBtn) modalCopyFullBtn.addEventListener("click", copyTxnIdToClipboard);

    if (txnModal && closeTxnModalBtn) {
        closeTxnModalBtn.onclick = closeTxnModal;
        if (closeTxnModalBottomBtn) closeTxnModalBottomBtn.onclick = closeTxnModal;
        txnModal.onclick = function (e) {
            if (e.target === txnModal) closeTxnModal();
        };
    }

    function getActionLabel(type) {
        const t = (type || '').toLowerCase();
        if (t === 'transit' || t === 'fare') {
            return 'Fare at';
        }
        if (t === 'topup' || t === 'top-up' || t === 'cashin' || t === 'cash-in') {
            return 'Cash in from';
        }
        if (t === 'refund' || t === 'reversal') {
            return 'Refund from';
        }
        if (t === 'withdrawal') {
            return 'Withdrawal to';
        }
        return 'Purchase at';
    }

    function openTxnModal(tx, txDate, txTime) {
        if (!txnModal) return;

        activeModalTxnId = tx.transaction_id || "";
        const txnIdEl = document.getElementById("modalTxnId");
        if (txnIdEl) txnIdEl.textContent = tx.transaction_id || 'N/A';

        const dateEl = document.getElementById("modalTxnDate");
        if (dateEl) dateEl.textContent = `${txDate} at ${txTime}`;

        const typeEl = document.getElementById("modalTxnType");
        const formattedType = tx.type ? tx.type.charAt(0).toUpperCase() + tx.type.slice(1) : "N/A";
        if (typeEl) typeEl.textContent = formattedType;

        const actionLabelEl = document.getElementById("modalTxnActionLabel");
        if (actionLabelEl) {
            actionLabelEl.textContent = tx.action_label || getActionLabel(tx.type);
        }

        const statusEl = document.getElementById("modalTxnStatus");
        const statusBadge = document.getElementById("modalTxnStatusBadge");
        const statusDot = document.getElementById("modalTxnStatusDot");
        const s = (tx.status || 'completed').toLowerCase();
        if (statusEl) statusEl.textContent = s.charAt(0).toUpperCase() + s.slice(1);
        if (statusBadge && statusDot) {
            if (s === 'completed') {
                statusBadge.className = 'mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
                statusDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse';
            } else if (s === 'refunded') {
                statusBadge.className = 'mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20';
                statusDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-500';
            } else if (s === 'pending') {
                statusBadge.className = 'mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20';
                statusDot.className = 'w-1.5 h-1.5 rounded-full bg-yellow-500';
            } else {
                statusBadge.className = 'mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20';
                statusDot.className = 'w-1.5 h-1.5 rounded-full bg-rose-500';
            }
        }

        let merchantTitle = "Transaction";
        if (tx.merchant_name && tx.merchant_name !== "Transaction") {
            merchantTitle = tx.merchant_name;
        } else if (tx.description) {
            merchantTitle = tx.description;
        }
        const merchantEl = document.getElementById("modalTxnMerchant");
        if (merchantEl) merchantEl.textContent = merchantTitle;

        const feeEl = document.getElementById("modalTxnFee");
        const feeRow = document.getElementById("modalTxnFeeRow");
        const feeNum = Number(tx.service_fee || 0);
        if (feeEl) feeEl.textContent = `₱${feeNum.toFixed(2)}`;
        if (feeRow) {
            if (feeNum > 0) feeRow.classList.remove("hidden");
            else feeRow.classList.add("hidden");
        }

        const pointsEl = document.getElementById("modalTxnPoints");
        const pointsRow = document.getElementById("modalTxnPointsRow");
        const pointsVal = Number(tx.points_earned || 0);
        if (pointsEl) pointsEl.textContent = pointsVal > 0 ? `+${pointsVal} pts` : `0 pts`;
        if (pointsRow) {
            if (pointsVal > 0) pointsRow.classList.remove("hidden");
            else pointsRow.classList.add("hidden");
        }

        const showAmount = shouldShowAmount(tx.type);
        const lowerType = (tx.type || '').toLowerCase();
        const isDebit = lowerType === "payment" || lowerType === "withdrawal" || lowerType === "charge" || lowerType === "deduction";
        const sign = isDebit ? "-" : "+";
        const colorClass = isDebit ? "text-slate-900" : "text-emerald-600";

        const reasonCard = document.getElementById("modalTxnReasonCard");
        const reasonTitle = document.getElementById("modalTxnReasonTitle");
        const reasonText = document.getElementById("modalTxnReasonText");
        if (reasonCard && reasonTitle && reasonText) {
            const isRefund = lowerType === "refund" || lowerType === "reversal";
            const isFailed = s === "failed";
            if (isRefund) {
                reasonCard.className = "rounded-2xl p-4 border border-amber-200 bg-amber-50/70 text-sm space-y-1";
                reasonTitle.className = "text-[11px] font-bold tracking-wider uppercase text-amber-700";
                reasonTitle.textContent = "Refund Reason & Notes";
                reasonText.className = "text-sm font-medium leading-relaxed text-amber-900";
                reasonText.textContent = tx.description || "Refund processed to cardholder account.";
                reasonCard.classList.remove("hidden");
            } else if (isFailed) {
                reasonCard.className = "rounded-2xl p-4 border border-rose-200 bg-rose-50/70 text-sm space-y-1";
                reasonTitle.className = "text-[11px] font-bold tracking-wider uppercase text-rose-700";
                reasonTitle.textContent = "Failure Reason";
                reasonText.className = "text-sm font-medium leading-relaxed text-rose-900";
                reasonText.textContent = tx.description || "Transaction failed or could not be processed.";
                reasonCard.classList.remove("hidden");
            } else {
                reasonCard.classList.add("hidden");
                reasonText.textContent = "";
            }
        }

        const amtEl = document.getElementById("modalTxnTotal");
        if (amtEl) {
            if (showAmount) {
                amtEl.textContent = `${sign}₱${Number(tx.amount || 0).toFixed(2)}`;
                amtEl.className = `text-3xl font-extrabold tracking-tight ${colorClass} mb-1`;
            } else {
                amtEl.textContent = '—';
                amtEl.className = 'text-3xl font-extrabold tracking-tight text-gray-400 mb-1';
            }
        }

        txnModal.classList.remove('hidden');
        setTimeout(() => {
            txnModal.classList.add('opacity-100');
            txnModalContent.classList.add('scale-100', 'opacity-100');
            txnModalContent.classList.remove('scale-95', 'opacity-0');
        }, 10);
    }

    function closeTxnModal() {
        txnModalContent.classList.add('scale-95', 'opacity-0');
        txnModalContent.classList.remove('scale-100', 'opacity-100');
        txnModal.classList.remove('opacity-100');
        setTimeout(() => {
            txnModal.classList.add('hidden');
        }, 300);
    }
});
