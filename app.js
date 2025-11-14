document.addEventListener('DOMContentLoaded', () => {
    // Check if firebase is initialized
    if (typeof firebase === 'undefined') {
        console.error('Firebase is not initialized. Make sure firebase-init.js is loaded correctly and configured.');
        return;
    }

    const db = firebase.firestore();

    /**
     * Fetches the global WhatsApp link from Firestore and applies it to all relevant elements.
     */
    const applyGlobalWhatsAppLink = async () => {
        try {
            const doc = await db.collection('settings').doc('global').get();
            if (doc.exists) {
                const whatsappLink = doc.data().whatsappLink;
                if (whatsappLink) {
                    // Use a more specific selector if needed, but a class is robust.
                    const linkElements = document.querySelectorAll('.dynamic-whatsapp-link');
                    linkElements.forEach(el => {
                        // If it's an anchor, set href. Otherwise, you could use it for other things.
                        if (el.tagName === 'A') {
                            el.href = whatsappLink;
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching global WhatsApp link:", error);
        }
    };

    /**
     * Fetches enabled merchants from Firestore and renders them on the merchants page.
     */
    const loadMerchants = async () => {
        const merchantGrid = document.getElementById('merchant-grid');
        const merchantLoader = document.getElementById('merchant-loader');

        if (!merchantGrid) return; // Only run on merchants page

        try {
            // Removed .orderBy() to prevent Firestore index error. Sorting is now done client-side.
            const snapshot = await db.collection('merchants')
                                     .where('isEnabled', '==', true)
                                     .get();
            
            if (merchantLoader) merchantLoader.style.display = 'none';

            merchantGrid.innerHTML = ''; // Clear existing static content
            
            if (snapshot.empty) {
                merchantGrid.innerHTML = '<p class="text-center text-white-50">No verified merchants are available at this time. Please check back later.</p>';
                return;
            }

            // Convert snapshot to array and sort by createdAt descending
            const merchants = snapshot.docs.map(doc => doc.data());
            merchants.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
                const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
                return timeB - timeA;
            });

            merchants.forEach(merchant => {
                const merchantCard = `
                    <a href="${merchant.link}" target="_blank" class="merchant-card">
                        <div class="merchant-info">
                            <h3>${merchant.name}</h3>
                            <div class="verified-badge">
                                <i class="fas fa-check-circle"></i> Verified Merchant
                            </div>
                        </div>
                        <span class="btn btn-gradient">Get Key</span>
                    </a>
                `;
                merchantGrid.innerHTML += merchantCard;
            });

        } catch (error) {
            console.error("Error fetching merchants:", error);
            if (merchantLoader) merchantLoader.style.display = 'none';
            merchantGrid.innerHTML = '<p class="text-center text-danger">Could not load merchant information. Please try again later.</p>';
        }
    };

    // Run the functions to populate the page
    applyGlobalWhatsAppLink();
    loadMerchants();
});