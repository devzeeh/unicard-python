document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const toggleButton = document.getElementById('menu-toggle-button');
    const openIcon = document.getElementById('icon-open');
    const closeIcon = document.getElementById('icon-close');
    const mainContent = document.getElementById('main-content');

    const validTransactionTypes = new Set(['payment', 'top-up', 'refund', 'charge', 'deduction']);
    const shouldShowAmount = (type) => typeof type === 'string' && validTransactionTypes.has(type.toLowerCase());

    // --- Profile Dropdown Elements ---
    const profileButton = document.getElementById('profile-avatar-button');
    const profileMenu = document.getElementById('profile-dropdown-menu');
    const profileLogoutButton = document.getElementById('profile-logout-button'); // ADDED

    // --- Logout Modal Elements ---
    const logoutButton = document.getElementById('logout-button');
    const logoutModal = document.getElementById('logout-modal');
    const logoutModalContent = document.getElementById('logout-modal-content');
    const closeModalButton = document.getElementById('modal-close-button');
    const cancelModalButton = document.getElementById('modal-cancel-button');
    const confirmLogoutButton = document.getElementById('modal-confirm-logout-button');


    // --- Sidebar Logic ---
    if (sidebar && sidebarOverlay && toggleButton && openIcon && closeIcon && mainContent) {

        function toggleSidebar() {
            sidebar.classList.toggle('-translate-x-full');
            mainContent.classList.toggle('md:pl-72');
            openIcon.classList.toggle('hidden');
            closeIcon.classList.toggle('hidden');
            if (window.innerWidth < 768) {
                sidebarOverlay.classList.toggle('hidden');
            }
        }

        toggleButton.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleSidebar();
        });

        sidebarOverlay.addEventListener('click', function () {
            toggleSidebar();
        });

        // --- Auto-close sidebar on nav link click (for mobile) ---
        const navLinks = sidebar.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768 && !closeIcon.classList.contains('hidden')) {
                    toggleSidebar();
                }
            });
        });

    } else {
        console.error("Sidebar elements not found. Make sure all IDs are correct.");
    }

    // --- Profile Dropdown Logic ---
    if (profileButton && profileMenu) {

        profileButton.addEventListener('click', function (event) {
            event.stopPropagation();
            profileMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', function (event) {
            if (!profileMenu.classList.contains('hidden') &&
                !profileButton.contains(event.target) &&
                !profileMenu.contains(event.target)) {
                profileMenu.classList.add('hidden');
            }
        });

    } else {
        console.error("Profile dropdown elements not found. Make sure all IDs are correct.");
    }

    // --- Logout Modal Logic ---
    // Check for all required modal elements
    const modalElementsExist = logoutModal && logoutModalContent && closeModalButton && cancelModalButton && confirmLogoutButton;

    if (modalElementsExist) {

        function openLogoutModal() {
            logoutModal.classList.remove('hidden');
            setTimeout(() => {
                logoutModal.classList.remove('opacity-0');
                logoutModal.classList.add('opacity-100');
                logoutModalContent.classList.add('scale-100', 'opacity-100');
                logoutModalContent.classList.remove('scale-95', 'opacity-0');
            }, 10);
        }

        // Function to close the modal
        function closeLogoutModal() {
            logoutModalContent.classList.add('scale-95', 'opacity-0');
            logoutModalContent.classList.remove('scale-100', 'opacity-100');
            logoutModal.classList.add('opacity-0');
            logoutModal.classList.remove('opacity-100');

            setTimeout(() => {
                logoutModal.classList.add('hidden');
            }, 300);
        }

        // --- UPDATED: Attach to all logout buttons ---

        // 1. Sidebar Logout Button
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                openLogoutModal();
            });
        }

        // 2. Profile Dropdown Logout Button
        if (profileLogoutButton) {
            profileLogoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                profileMenu.classList.add('hidden'); // Close dropdown
                openLogoutModal();
            });
        }
        // --- END OF UPDATE ---

        // Close modal buttons
        closeModalButton.addEventListener('click', closeLogoutModal);
        cancelModalButton.addEventListener('click', closeLogoutModal);

        // Also close if clicking on the background overlay
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                closeLogoutModal();
            }
        });

        // Confirm logout and redirect
        confirmLogoutButton.addEventListener('click', () => {
            console.log('Logging out...');
            window.location.href = "/logout";
        });

    } else {
        console.error("Logout modal elements not found. Make sure all IDs are correct.");
    }

    // --- Fetch Dashboard Data (Removed for SSR) ---

    // --- Modal Logic ---
    const txnModal = document.getElementById("txnModal");
    const txnModalContent = document.getElementById("txnModalContent");
    const closeTxnModalBtn = document.getElementById("closeTxnModalBtn");
    const closeTxnModalBottomBtn = document.getElementById("closeTxnModalBottomBtn");

    if (txnModal && closeTxnModalBtn) {
        closeTxnModalBtn.onclick = closeTxnModal;
        closeTxnModalBottomBtn.onclick = closeTxnModal;
        txnModal.onclick = function (e) {
            if (e.target === txnModal) closeTxnModal();
        };
    }

    // --- Recent Transactions Modal Click Handlers ---
    const recentTxnRows = document.querySelectorAll("#recent-transactions-table-body tr[data-tx-id]");
    recentTxnRows.forEach(row => {
        row.addEventListener("click", () => {
            const tx = {
                transaction_id: row.getAttribute("data-tx-id"),
                date: row.getAttribute("data-tx-date"),
                time: row.getAttribute("data-tx-time"),
                description: row.getAttribute("data-tx-desc"),
                merchant_name: row.getAttribute("data-tx-merchant") || row.getAttribute("data-tx-desc"),
                type: row.getAttribute("data-tx-type"),
                amount: row.getAttribute("data-tx-amount"),
                status: row.getAttribute("data-tx-status"),
                terminal_id: row.getAttribute("data-tx-terminal"),
                service_fee: row.getAttribute("data-tx-fee"),
                points_earned: Number(row.getAttribute("data-tx-points") || 0)
            };
            openTxnModal(tx);
        });
    });

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

    const copyTxnIdBtn = document.getElementById("copyTxnIdBtn");
    const modalCopyFullBtn = document.getElementById("modalCopyFullBtn");
    if (copyTxnIdBtn) copyTxnIdBtn.addEventListener("click", copyTxnIdToClipboard);
    if (modalCopyFullBtn) modalCopyFullBtn.addEventListener("click", copyTxnIdToClipboard);

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

    function openTxnModal(tx) {
        if (!txnModal) return;

        activeModalTxnId = tx.transaction_id || "";
        const txnIdEl = document.getElementById("modalTxnId");
        if (txnIdEl) txnIdEl.textContent = tx.transaction_id || 'N/A';

        const dateEl = document.getElementById("modalTxnDate");
        if (dateEl) dateEl.textContent = `${tx.date} at ${tx.time}`;

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
            amtEl.textContent = `${sign}₱${Number(tx.amount || 0).toFixed(2)}`;
            amtEl.className = `text-3xl font-extrabold tracking-tight ${colorClass} mb-1`;
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