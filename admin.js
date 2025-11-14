document.addEventListener('DOMContentLoaded', () => {
    // Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore();

    // DOM Elements
    const loginModalElement = document.getElementById('loginModal');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const adminPanel = document.getElementById('admin-panel');
    const logoutBtn = document.getElementById('logout-btn');
    
    const globalSettingsForm = document.getElementById('global-settings-form');
    const whatsappLinkInput = document.getElementById('whatsapp-link');
    
    const merchantList = document.getElementById('merchant-list');
    const merchantLoader = document.getElementById('merchant-loader');
    const addMerchantBtn = document.getElementById('add-merchant-btn');
    const merchantModalElement = document.getElementById('merchantModal');
    const merchantForm = document.getElementById('merchant-form');
    const merchantModalLabel = document.getElementById('merchantModalLabel');
    const merchantIdInput = document.getElementById('merchant-id');
    const merchantNameInput = document.getElementById('merchant-name');
    const merchantLinkInput = document.getElementById('merchant-link');
    
    const appToastElement = document.getElementById('appToast');
    const toastTitle = document.getElementById('toast-title');
    const toastBody = document.getElementById('toast-body');

    // Bootstrap Modals & Toasts
    const loginModal = new bootstrap.Modal(loginModalElement);
    const merchantModal = new bootstrap.Modal(merchantModalElement);
    const appToast = new bootstrap.Toast(appToastElement);

    // App State
    let currentUser = null;

    // --- UTILS ---
    const showToast = (title, message, isError = false) => {
        toastTitle.textContent = title;
        toastBody.textContent = message;
        appToastElement.classList.toggle('bg-danger', isError);
        appToastElement.classList.toggle('text-white', isError);
        appToast.show();
    };

    const setButtonLoading = (button, isLoading) => {
        const spinner = button.querySelector('.spinner-border');
        if (isLoading) {
            button.disabled = true;
            if (spinner) spinner.classList.remove('d-none');
        } else {
            button.disabled = false;
            if (spinner) spinner.classList.add('d-none');
        }
    };

    // --- AUTHENTICATION ---
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            adminPanel.style.display = 'block';
            loginModal.hide();
            loadGlobalSettings();
            loadMerchants();
        } else {
            currentUser = null;
            adminPanel.style.display = 'none';
            loginModal.show();
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setButtonLoading(loginForm.querySelector('button'), true);
        loginError.classList.add('d-none');
        
        const email = loginForm.email.value;
        const password = loginForm.password.value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            loginError.textContent = error.message;
            loginError.classList.remove('d-none');
        } finally {
            setButtonLoading(loginForm.querySelector('button'), false);
        }
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });

    // --- GLOBAL SETTINGS ---
    const loadGlobalSettings = async () => {
        try {
            const doc = await db.collection('settings').doc('global').get();
            if (doc.exists) {
                whatsappLinkInput.value = doc.data().whatsappLink || '';
            }
        } catch (error) {
            console.error("Error loading global settings:", error);
            showToast('Error', 'Could not load global settings.', true);
        }
    };

    globalSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = globalSettingsForm.querySelector('button');
        setButtonLoading(button, true);

        try {
            await db.collection('settings').doc('global').set({
                whatsappLink: whatsappLinkInput.value
            }, { merge: true });
            showToast('Success', 'Global WhatsApp link updated successfully!');
        } catch (error) {
            console.error("Error saving global settings:", error);
            showToast('Error', 'Failed to save settings.', true);
        } finally {
            setButtonLoading(button, false);
        }
    });

    // --- MERCHANT MANAGEMENT ---
    const renderMerchants = (merchants) => {
        merchantLoader.style.display = 'none';
        merchantList.innerHTML = '';
        if (merchants.length === 0) {
            merchantList.innerHTML = '<p class="text-center text-white-50 mt-4">No merchants found. Add one to get started.</p>';
            return;
        }
        merchants.forEach(merchant => {
            const item = document.createElement('div');
            item.className = 'list-group-item d-flex justify-content-between align-items-center flex-wrap gap-2';
            item.innerHTML = `
                <div class="me-auto">
                    <strong class="d-block">${merchant.name}</strong>
                    <small class="text-white-50 text-truncate d-block" style="max-width: 250px;">${merchant.link}</small>
                </div>
                <div class="d-flex align-items-center ms-auto">
                    <div class="form-check form-switch me-2">
                        <input class="form-check-input merchant-status-toggle" type="checkbox" role="switch" data-id="${merchant.id}" ${merchant.isEnabled ? 'checked' : ''} data-bs-toggle="tooltip" title="${merchant.isEnabled ? 'Disable' : 'Enable'} Merchant">
                    </div>
                    <button class="btn-icon edit-merchant-btn" data-id="${merchant.id}" data-name="${merchant.name}" data-link="${merchant.link}" data-bs-toggle="tooltip" title="Edit Merchant"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete delete-merchant-btn" data-id="${merchant.id}" data-bs-toggle="tooltip" title="Delete Merchant"><i class="fas fa-trash"></i></button>
                </div>
            `;
            merchantList.appendChild(item);
        });
        
        // Initialize tooltips for the newly added elements
        const tooltipTriggerList = [].slice.call(merchantList.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    };
    
    const loadMerchants = () => {
        merchantLoader.style.display = 'block';
        db.collection('merchants').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const merchants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderMerchants(merchants);
        }, error => {
            console.error("Error loading merchants:", error);
            merchantLoader.style.display = 'none';
            showToast('Error', 'Could not load merchants.', true);
        });
    };
    
    // Open modal for adding
    addMerchantBtn.addEventListener('click', () => {
        merchantModalLabel.textContent = 'Add New Merchant';
        merchantForm.reset();
        merchantIdInput.value = '';
    });
    
    // Merchant form submission (Add/Edit)
    merchantForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = merchantForm.querySelector('button[type="submit"]');
        setButtonLoading(button, true);

        const id = merchantIdInput.value;
        const merchantData = {
            name: merchantNameInput.value,
            link: merchantLinkInput.value,
            isEnabled: true, // Default to enabled
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (id) { // Editing existing merchant
                delete merchantData.createdAt; // Don't update creation time
                await db.collection('merchants').doc(id).update({
                    name: merchantData.name,
                    link: merchantData.link
                });
                showToast('Success', 'Merchant updated successfully!');
            } else { // Adding new merchant
                await db.collection('merchants').add(merchantData);
                showToast('Success', 'New merchant added successfully!');
            }
            merchantModal.hide();
        } catch (error) {
            console.error("Error saving merchant:", error);
            showToast('Error', 'Failed to save merchant.', true);
        } finally {
            setButtonLoading(button, false);
        }
    });

    // Event delegation for merchant actions
    merchantList.addEventListener('click', async (e) => {
        // Toggle status
        if (e.target.classList.contains('merchant-status-toggle')) {
            const id = e.target.dataset.id;
            const isEnabled = e.target.checked;
            try {
                await db.collection('merchants').doc(id).update({ isEnabled });
                showToast('Success', `Merchant ${isEnabled ? 'enabled' : 'disabled'}.`);
            } catch (error) {
                showToast('Error', 'Failed to update merchant status.', true);
                e.target.checked = !isEnabled; // Revert checkbox on error
            }
        }
        
        // Edit button
        const editBtn = e.target.closest('.edit-merchant-btn');
        if (editBtn) {
            merchantModalLabel.textContent = 'Edit Merchant';
            merchantIdInput.value = editBtn.dataset.id;
            merchantNameInput.value = editBtn.dataset.name;
            merchantLinkInput.value = editBtn.dataset.link;
            merchantModal.show();
        }

        // Delete button
        const deleteBtn = e.target.closest('.delete-merchant-btn');
        if (deleteBtn) {
            if (confirm('Are you sure you want to delete this merchant?')) {
                try {
                    await db.collection('merchants').doc(deleteBtn.dataset.id).delete();
                    showToast('Success', 'Merchant deleted successfully.');
                } catch (error) {
                    showToast('Error', 'Failed to delete merchant.', true);
                }
            }
        }
    });
});