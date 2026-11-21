document.addEventListener("DOMContentLoaded", function () {
    const quickBtns = document.querySelectorAll('.quick-amount-btn');
    const amountInput = document.getElementById('amount');
    const form = document.getElementById('topup-form');
    const submitBtn = document.getElementById('topup-submit-btn');
    const amountError = document.getElementById('amount-error');
    const paymentError = document.getElementById('payment-error');
    const paymentLabels = document.querySelectorAll('label[for^="payment-"]');
    const paymentInputs = document.querySelectorAll('input[name="payment_method"]');

    // Breakdown elements
    const breakdownContainer = document.getElementById('breakdown-container');
    const breakdownAmount = document.getElementById('breakdown-amount');
    const breakdownTotal = document.getElementById('breakdown-total');

    // Field highlight and scroll helpers
    function highlightAmountError(message) {
        if (amountError) {
            amountError.textContent = message;
            amountError.classList.remove('hidden');
        }
        if (paymentError) {
            paymentError.classList.add('hidden');
        }
        amountInput.classList.remove('border-gray-200', 'border-gray-300', 'focus:border-blue-500', 'focus:ring-blue-500');
        amountInput.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        amountInput.style.borderColor = '#ef4444';
        amountInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        amountInput.focus();
    }

    function clearAmountError() {
        amountInput.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
        amountInput.classList.add('border-gray-200', 'focus:border-blue-500', 'focus:ring-blue-500');
        amountInput.style.borderColor = '';
        if (amountError) {
            amountError.classList.add('hidden');
        }
    }

    function clearPaymentErrorClasses() {
        paymentLabels.forEach(label => {
            label.classList.remove('border-red-500', 'ring-2', 'ring-red-500', 'bg-red-50');
            label.style.borderColor = '';
        });
    }

    function clearPaymentError() {
        clearPaymentErrorClasses();
        if (paymentError) {
            paymentError.classList.add('hidden');
        }
    }

    function highlightPaymentError(message, selectedMethodInput) {
        if (paymentError) {
            paymentError.textContent = message;
            paymentError.classList.remove('hidden');
        }
        if (amountError) {
            amountError.classList.add('hidden');
        }
        clearPaymentErrorClasses();

        let targetElement = null;
        if (selectedMethodInput) {
            const label = document.querySelector(`label[for="${selectedMethodInput.id}"]`);
            if (label) {
                label.classList.add('border-red-500', 'ring-2', 'ring-red-500', 'bg-red-50');
                label.style.borderColor = '#ef4444';
                targetElement = label;
            }
        } else {
            paymentLabels.forEach(label => {
                label.classList.add('border-red-500', 'ring-2', 'ring-red-500');
                label.style.borderColor = '#ef4444';
            });
            targetElement = paymentLabels[0];
        }

        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetElement.focus();
        }
    }

    // Function to run validation
    const validateForm = () => {
        const amountText = amountInput.value.trim();
        const amount = parseFloat(amountText);
        const method = document.querySelector('input[name="payment_method"]:checked');

        let isValid = true;

        if (amountText === '') {
            isValid = false;
            clearAmountError();
        } else if (amountText.startsWith('-')) {
            isValid = false;
            if (amountError) {
                amountError.textContent = 'Negative values are not allowed.';
                amountError.classList.remove('hidden');
            }
            amountInput.classList.add('border-red-500', 'focus:ring-red-500');
            amountInput.style.borderColor = '#ef4444';
        } else if (isNaN(amount) || amount < 50) {
            isValid = false;
            if (amountError) {
                amountError.textContent = 'Minimum top-up amount is ₱50.00.';
                amountError.classList.remove('hidden');
            }
            amountInput.classList.add('border-red-500', 'focus:ring-red-500');
            amountInput.style.borderColor = '#ef4444';
        } else if (amount > 2000) {
            isValid = false;
            if (amountError) {
                amountError.textContent = 'Maximum top-up amount is ₱2,000.00.';
                amountError.classList.remove('hidden');
            }
            amountInput.classList.add('border-red-500', 'focus:ring-red-500');
            amountInput.style.borderColor = '#ef4444';
        } else {
            clearAmountError();
        }

        // Update breakdown
        if (isValid) {
            breakdownAmount.textContent = amount.toFixed(2);
            breakdownTotal.textContent = (amount + 15).toFixed(2);
            breakdownContainer.classList.remove('hidden');
        } else {
            breakdownContainer.classList.add('hidden');
        }

        // Update quick amount buttons highlight
        if (quickBtns) {
            quickBtns.forEach(btn => {
                if (!isNaN(amount) && parseFloat(btn.innerText) === amount) {
                    btn.classList.remove('bg-gray-50', 'text-gray-700', 'border-gray-200', 'hover:bg-gray-100');
                    btn.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-600', 'hover:bg-blue-100');
                } else {
                    btn.classList.add('bg-gray-50', 'text-gray-700', 'border-gray-200', 'hover:bg-gray-100');
                    btn.classList.remove('bg-blue-50', 'text-blue-700', 'border-blue-600', 'hover:bg-blue-100');
                }
            });
        }

        submitBtn.disabled = !(isValid && method);
    };

    if (amountInput) {
        amountInput.addEventListener('input', () => {
            clearAmountError();
            validateForm();
        });
    }

    if (quickBtns && amountInput) {
        quickBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                amountInput.value = btn.innerText;
                clearAmountError();
                validateForm();
            });
        });
    }

    // Payment method selection handling
    paymentLabels.forEach(label => {
        label.addEventListener('click', (e) => {
            const amountText = amountInput.value.trim();
            const amount = parseFloat(amountText);

            if (amountText === '' || isNaN(amount) || amount < 50 || amount > 2000) {
                e.preventDefault();
                highlightAmountError('Please enter a valid amount (₱50.00 - ₱2,000.00) before selecting a payment method.');
                return;
            }

            clearPaymentError();
            setTimeout(validateForm, 50);
        });
    });

    paymentInputs.forEach(input => {
        input.addEventListener('change', () => {
            clearPaymentError();
            validateForm();
        });
    });

    if (form && submitBtn) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const amountText = amountInput.value.trim();
            const amount = parseFloat(amountText);
            const method = document.querySelector('input[name="payment_method"]:checked');

            if (amountText === '' || isNaN(amount) || amount < 50 || amount > 2000) {
                const msg = (isNaN(amount) || amount < 50) ? 'Minimum top-up amount is ₱50.00.' : 'Maximum top-up amount is ₱2,000.00.';
                highlightAmountError(msg);
                return;
            }

            if (!method) {
                highlightPaymentError('Please select a payment method before proceeding.');
                return;
            }

            // Get username from URL path: /u/{username}/topup
            const pathParts = window.location.pathname.split('/');
            let username = '';
            if (pathParts.length >= 3 && pathParts[1] === 'u') {
                username = pathParts[2];
            }

            if (!username) {
                highlightAmountError('Could not determine user profile from URL.');
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.innerText = 'Processing...';

                const response = await fetch(`/v1/user/${username}/topup/checkout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ amount, payment_method: method.value })
                });

                if (!response.ok) {
                    let errMsg = 'Failed to initialize checkout';
                    try {
                        const errorData = await response.json();
                        if (errorData && errorData.message) {
                            errMsg = errorData.message;
                        }
                    } catch (_) {
                        try {
                            const errorText = await response.text();
                            const parsed = JSON.parse(errorText);
                            if (parsed && parsed.message) {
                                errMsg = parsed.message;
                            } else if (errorText) {
                                errMsg = errorText;
                            }
                        } catch (_) {}
                    }
                    throw new Error(errMsg);
                }

                const data = await response.json();
                if (data.data && data.data.url) {
                    window.location.href = data.data.url;
                } else {
                    throw new Error('No checkout URL returned');
                }
            } catch (err) {
                console.error('Checkout error:', err);
                let displayMsg = err.message || 'Failed to initialize checkout';
                if (typeof displayMsg === 'string' && displayMsg.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(displayMsg);
                        if (parsed && parsed.message) {
                            displayMsg = parsed.message;
                        }
                    } catch (_) {}
                }

                const lowerMsg = displayMsg.toLowerCase();
                if (lowerMsg.includes('amount') || lowerMsg.includes('too low') || lowerMsg.includes('too high')) {
                    highlightAmountError(displayMsg);
                } else if (lowerMsg.includes('qr') || lowerMsg.includes('method') || lowerMsg.includes('unavailable') || lowerMsg.includes('channel') || lowerMsg.includes('gcash') || lowerMsg.includes('maya') || lowerMsg.includes('grabpay')) {
                    highlightPaymentError(displayMsg, method);
                } else {
                    highlightPaymentError(displayMsg, method);
                }

                submitBtn.disabled = false;
                submitBtn.innerText = 'Top Up Now';
            }
        });
    }
});
