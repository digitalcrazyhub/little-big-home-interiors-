document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("contactForm");
    const messageBox = document.getElementById("formMsg");
    const submitButton = document.getElementById("contactSubmit");
    /*
     * ==========================================
     * CHECK FORM
     * ==========================================
     */
    if (!form) {
        console.error("Contact form #contactForm not found.");
        return;
    }
    /*
     * ==========================================
     * SUBMIT
     * ==========================================
     */
    form.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();
            console.log("=================================");
            console.log("CONTACT FORM SUBMIT STARTED");
            console.log("=================================");
            /*
             * ======================================
             * GET ELEMENTS
             * ======================================
             */
            const nameInput = form.querySelector('input[name="name"]');
            const emailInput = form.querySelector('input[name="email"]');
            const phoneInput = form.querySelector('input[name="phone"]');
            const typeInput = form.querySelector('select[name="type"]');
            const messageInput = form.querySelector('textarea[name="message"]');
            /*
             * ======================================
             * READ VALUES
             * ======================================
             */
            const name = nameInput ? nameInput.value.trim() : "";
            const email = emailInput ? emailInput.value.trim() : "";
            const phone = phoneInput ? phoneInput.value.trim() : "";
            const type = typeInput ? typeInput.value.trim() : "";
            const message = messageInput ? messageInput.value.trim() : "";
            /*
             * ======================================
             * DEBUG
             * ======================================
             */
            console.log(
                "FORM VALUES:",
                {
                    name: name,
                    email: email,
                    phone: phone,
                    type: type,
                    message: message
                }
            );
            /*
             * ======================================
             * FRONTEND VALIDATION
             * ======================================
             */
            if (!name) {
                showMessage("Please enter your name.", "error");
                if (nameInput) {
                    nameInput.focus();
                }
                return;
            }
            if (!email) {
                showMessage("Please enter your email address.", "error");
                if (emailInput) {
                    emailInput.focus();
                }
                return;
            }
            const emailPattern = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/;
            if (!emailPattern.test(email)) {
                showMessage("Please enter a valid email address.", "error");
                if (emailInput) {
                    emailInput.focus();
                }
                return;
            }
            /*
             * ======================================
             * DISABLE BUTTON
             * ======================================
             */
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "SENDING...";}
            /*
             * ======================================
             * CLEAR MESSAGE
             * ======================================
             */
            showMessage("", "");
            /*
             * ======================================
             * REQUEST DATA
             * ======================================
             */
            const requestData = {
                name: name,
                email: email,
                phone: phone,
                type: type,
                message: message
            };
            console.log("SENDING TO /api/contact:", requestData);
            /*
             * ======================================
             * SEND TO SPRING BOOT
             * ======================================
             */
            try {
                const response = await fetch("/api/contact",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json",
                                "Accept":
                                    "application/json"
                            },
                            credentials: "same-origin",
                            body: JSON.stringify(requestData)
                        }
                    );
                /*
                 * ==================================
                 * READ RESPONSE
                 * ==================================
                 */
                const contentType =
                    response.headers.get(
                        "content-type"
                    ) || "";
                let data;
                if (
                    contentType.includes(
                        "application/json"
                    )
                ) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    try {
                        data = JSON.parse(text);
                    } catch {
                        data = {message: text};
                    }
                }
                console.log("BACKEND STATUS:", response.status);
                console.log("BACKEND RESPONSE:", data);
                /*
                 * ==================================
                 * ERROR
                 * ==================================
                 */
                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        data?.error ||
                        "Unable to submit your enquiry."
                    );
                }
                if (
                    data &&
                    data.success === false
                ) {
                    throw new Error(
                        data.message ||
                        "Unable to submit your enquiry."
                    );
                }
                /*
                 * ==================================
                 * SUCCESS
                 * ==================================
                 */

                console.log("CONTACT FORM SUCCESS");
                showMessage(
                    data?.message ||
                    "Thank you! Your enquiry has been submitted successfully.",
                    "success"
                );
                /*
                 * CLEAR FORM
                 */
                form.reset();
            } catch (error) {
                console.error("CONTACT FORM ERROR:", error);
                showMessage(
                    error.message ||
                    "Something went wrong. Please try again.",
                    "error"
                );
            } finally {
                /*
                 * ==================================
                 * ENABLE BUTTON
                 * ==================================
                 */
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = "START A CONVERSATION";
                }
            }
        }
    );
    /*
     * ==========================================
     * MESSAGE FUNCTION
     * ==========================================
     */
    function showMessage(
        message,
        type
    ) {
        if (!messageBox) {
            return;
        }
        messageBox.textContent = message;
        messageBox.className = "form-msg";
        if (type) {messageBox.classList.add(type);
        }
    }
});
const phoneInput = document.getElementById("contactPhone");

if (phoneInput) {
    phoneInput.addEventListener("input", function () {

        // Remove everything except numbers
        this.value = this.value.replace(/\D/g, "");

        // Maximum 10 digits
        if (this.value.length > 10) {
            this.value = this.value.substring(0, 10);
        }
    });
}