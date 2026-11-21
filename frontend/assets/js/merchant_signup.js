document.addEventListener("DOMContentLoaded", function () {
    const step1 = document.getElementById("step-1");
    const step2 = document.getElementById("step-2");
    const step3 = document.getElementById("step-3");
    const stepSubtitle = document.getElementById("step-subtitle");
    const stepProgress = document.getElementById("step-progress");
    const signupForm = document.getElementById("merchantSignupForm");
    const errorMessage = document.getElementById("error-message");
    const sendOtpBtn = document.getElementById("sendOtpBtn");
    const verifyOtpBtn = document.getElementById("verifyOtpBtn");
    const otpStatus = document.getElementById("otpStatus");
    const btnStep1 = document.getElementById("btn-step-1");
    const btnBack2 = document.getElementById("btn-back-2");
    const btnStep2 = document.getElementById("btn-step-2");
    const btnBack3 = document.getElementById("btn-back-3");
    const createAccountBtn = document.getElementById("create-account-btn");
    const businessTypeSelect = document.getElementById("businessType");
    const businessTypeOtherWrap = document.getElementById("businessTypeOtherWrap");
    const businessTypeOther = document.getElementById("businessTypeOther");

    if (!signupForm) return;

    let emailVerified = false;

    function showStep(stepNumber) {
        [step1, step2, step3].forEach((step) => step && step.classList.add("hidden"));
        errorMessage.classList.add("hidden");

        if (stepNumber === 1) {
            step1.classList.remove("hidden");
            stepSubtitle.textContent = "Step 1 of 3: Your Details";
            stepProgress.style.width = "33%";
        } else if (stepNumber === 2) {
            step2.classList.remove("hidden");
            stepSubtitle.textContent = "Step 2 of 3: Owner Details";
            stepProgress.style.width = "66%";
        } else if (stepNumber === 3) {
            step3.classList.remove("hidden");
            stepSubtitle.textContent = "Step 3 of 3: Security";
            stepProgress.style.width = "100%";
        }
    }

    function toggleBusinessTypeOther() {
        const isOther = businessTypeSelect.value === "Other";
        businessTypeOtherWrap.classList.toggle("hidden", !isOther);
        if (!isOther) {
            businessTypeOther.value = "";
        }
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function setOtpStatus(message, type) {
        if (!otpStatus) return;
        otpStatus.textContent = message;
        otpStatus.classList.remove("hidden", "text-red-600", "text-green-600");
        otpStatus.classList.add(type === "error" ? "text-red-600" : "text-green-600");
    }

    function setButtonLoading(button, label, isLoading) {
        if (!button) return;
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = label;
            button.classList.add("opacity-75", "cursor-not-allowed");
            return;
        }
        button.disabled = false;
        button.textContent = button.dataset.originalText || label;
        button.classList.remove("opacity-75", "cursor-not-allowed");
    }

    function validateRequiredField(input) {
        if (!input) return true;
        if (input.value.trim() === "") {
            input.classList.add("border-red-500");
            return false;
        }
        input.classList.remove("border-red-500");
        return true;
    }

    function updatePasswordChecklist() {
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const lengthCheck = document.getElementById("length-check");
        const matchCheck = document.getElementById("match-check");

        const isLengthValid = password.length >= 8;
        const isMatchValid = password !== "" && password === confirmPassword;

        const successSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-green-500"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>';
        const errorSvg = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-red-500"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>';

        lengthCheck.innerHTML = `${isLengthValid ? successSvg : errorSvg}<span>At least 8 characters</span>`;
        matchCheck.innerHTML = `${isMatchValid ? successSvg : errorSvg}<span>Passwords match</span>`;
        lengthCheck.className = `flex items-center space-x-2 text-sm ${isLengthValid ? "text-green-600" : "text-gray-600"}`;
        matchCheck.className = `flex items-center space-x-2 text-sm ${isMatchValid ? "text-green-600" : "text-gray-600"}`;

        return isLengthValid && isMatchValid;
    }

    async function sendMerchantOTP() {
        const businessEmail = document.getElementById("businessEmail").value.trim();
        if (!businessEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
            showError("Please enter a valid business email before sending the OTP.");
            return;
        }

        setButtonLoading(sendOtpBtn, "Sending...", true);
        try {
            const response = await fetch("/v1/merchant/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: businessEmail }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to send OTP");
            }
            emailVerified = false;
            document.getElementById("otpCode").value = "";
            setOtpStatus("A verification code has been sent to your business email.", "success");
        } catch (error) {
            setOtpStatus(error.message || "Unable to send OTP. Please try again.", "error");
            showError(error.message || "Unable to send OTP. Please try again.");
        } finally {
            setButtonLoading(sendOtpBtn, "Send OTP", false);
        }
    }

    async function verifyMerchantOTP() {
        const businessEmail = document.getElementById("businessEmail").value.trim();
        const otpCode = document.getElementById("otpCode").value.trim();

        if (!businessEmail || !otpCode) {
            showError("Please enter the business email and OTP code before verifying.");
            return;
        }

        setButtonLoading(verifyOtpBtn, "Verifying...", true);
        try {
            const response = await fetch("/v1/merchant/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: businessEmail, otp: otpCode }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || "OTP verification failed");
            }
            emailVerified = true;
            setOtpStatus("Business email verified successfully.", "success");
        } catch (error) {
            emailVerified = false;
            setOtpStatus(error.message || "OTP verification failed.", "error");
            showError(error.message || "OTP verification failed.");
        } finally {
            setButtonLoading(verifyOtpBtn, "Verify", false);
        }
    }

    businessTypeSelect.addEventListener("change", toggleBusinessTypeOther);

    btnStep1.addEventListener("click", function () {
        const businessName = document.getElementById("businessName");
        const businessType = document.getElementById("businessType");
        const businessAddress = document.getElementById("businessAddress");
        const businessTypeOtherValue = document.getElementById("businessTypeOther");

        const valid = [businessName, businessType, businessAddress].every(validateRequiredField);
        const customTypeIsValid = businessType.value !== "Other" || validateRequiredField(businessTypeOtherValue);

        if (!valid || !customTypeIsValid) {
            showError("Please complete all business information before continuing.");
            return;
        }

        showStep(2);
    });

    btnBack2.addEventListener("click", () => showStep(1));
    btnStep2.addEventListener("click", function () {
        const ownerName = document.getElementById("ownerName");
        const businessPhone = document.getElementById("businessPhone");
        const businessEmail = document.getElementById("businessEmail");

        const valid = [ownerName, businessPhone, businessEmail].every(validateRequiredField);
        if (!valid || !emailVerified) {
            showError("Please verify your business email before continuing.");
            return;
        }
        showStep(3);
    });

    btnBack3.addEventListener("click", () => showStep(2));
    document.getElementById("password").addEventListener("input", updatePasswordChecklist);
    document.getElementById("confirmPassword").addEventListener("input", updatePasswordChecklist);
    sendOtpBtn.addEventListener("click", sendMerchantOTP);
    verifyOtpBtn.addEventListener("click", verifyMerchantOTP);

    signupForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const businessName = document.getElementById("businessName").value.trim();
        const businessType = document.getElementById("businessType").value;
        const businessTypeOther = document.getElementById("businessTypeOther").value.trim();
        const businessAddress = document.getElementById("businessAddress").value.trim();
        const ownerName = document.getElementById("ownerName").value.trim();
        const businessPhone = document.getElementById("businessPhone").value.trim();
        const businessEmail = document.getElementById("businessEmail").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (!businessName || !businessType || !businessAddress || !ownerName || !businessPhone || !businessEmail) {
            showError("Please complete all required merchant details before submitting.");
            return;
        }

        if (businessType === "Other" && !businessTypeOther) {
            showError("Please specify your business type before continuing.");
            return;
        }

        if (!emailVerified) {
            showError("Please verify your business email with the OTP before creating the merchant account.");
            return;
        }

        if (password !== confirmPassword || password.length < 8) {
            showError("Password must be at least 8 characters and match the confirmation field.");
            return;
        }

        setButtonLoading(createAccountBtn, "Creating account...", true);

        try {
            const payload = {
                businessName,
                businessType: businessType === "Other" ? businessTypeOther : businessType,
                businessAddress,
                ownerName,
                businessPhone,
                businessEmail,
                password,
                businessTypeOther: businessType === "Other" ? businessTypeOther : "",
            };

            const response = await fetch("/v1/merchant/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.message || "Merchant account creation failed.");
            }

            errorMessage.classList.remove("text-red-600", "bg-red-100");
            errorMessage.classList.add("text-green-700", "bg-green-100");
            errorMessage.textContent = "Merchant account created successfully. Please log in to continue with payout setup.";
            errorMessage.classList.remove("hidden");
            signupForm.reset();
            toggleBusinessTypeOther();
            setTimeout(() => {
                window.location.href = "/login";
            }, 2200);
        } catch (error) {
            showError(error.message || "A network error occurred. Please try again later.");
        } finally {
            setButtonLoading(createAccountBtn, "Create Account", false);
        }
    });

    toggleBusinessTypeOther();
    showStep(1);
});
