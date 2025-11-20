
// Prevent the browser from showing the install prompt immediately
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    console.log('Install prompt prevented');
});

/**
 * Fetches HTML content from a given URL and injects it into a specified element.
 * @param {string} url - The URL of the HTML component to load.
 * @param {string} elementId - The ID of the element to inject the HTML into.
 */
const loadComponent = async (url, elementId) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }
        const text = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = text;
        } else {
            console.error(`Element with id '${elementId}' not found.`);
        }
    } catch (error) {
        console.error('Error loading component:', error);
    }
};

/**
 * Initializes all page scripts that depend on the DOM, such as animations
 * and event listeners. This should be called after components are loaded.
 */
const initializePageScripts = () => {
    // Initialize AOS (Animate On Scroll) library
    if (window.AOS) {
        window.AOS.init({
            duration: 800,
            once: true,
        });
    }

    // Add scroll effect to the navbar
    const nav = document.querySelector('.navbar');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                nav.classList.add('navbar-scrolled');
            } else {
                nav.classList.remove('navbar-scrolled');
            }
        });
    }

    // Set active navigation link based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    let isHomeSection = window.location.pathname.includes('index.html') || window.location.pathname === '/';
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop().split('#')[0];
        link.classList.remove('active');
        if (linkPage === currentPage) {
            // Add active class if the page matches, and it's not a home section link
             if (!link.getAttribute('href').includes('#') || !isHomeSection) {
                link.classList.add('active');
            }
        }
    });

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"], a[href^="index.html#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            const targetId = href.substring(href.indexOf('#'));
            
            // If we are not on the index page, navigate there first
            if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
                 window.location.href = 'index.html' + targetId;
                 return;
            }

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Security: Prevent content copying ---
    // Disable right-click context menu
    document.addEventListener('contextmenu', event => event.preventDefault());

    // Disable common keyboard shortcuts for copying/viewing source
    document.addEventListener('keydown', event => {
        // Block F12 (Developer Tools)
        if (event.key === 'F12') {
            event.preventDefault();
        }

        // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Developer Tools)
        if (event.ctrlKey && event.shiftKey && ['I', 'J', 'C'].includes(event.key.toUpperCase())) {
             event.preventDefault();
        }
        
        // Block Ctrl+U (View Source) and Ctrl+S (Save Page)
        if (event.ctrlKey && ['U', 'S'].includes(event.key.toUpperCase())) {
            event.preventDefault();
        }
    });
};

/**
 * Main execution block that runs after the initial DOM is loaded.
 * It loads the header and footer components and then initializes page scripts.
 */
document.addEventListener('DOMContentLoaded', () => {
    Promise.all([
        loadComponent('header.html', 'header-placeholder'),
        loadComponent('footer.html', 'footer-placeholder')
    ]).then(() => {
        // This ensures that all components are loaded before we initialize scripts
        // that might depend on elements within those components (like the navbar).
        initializePageScripts();
    });
});