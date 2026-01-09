// Centralized Configuration for UPSC Academia
const CONFIG = {
    // Google Apps Script Web App URL
    // All frontend components should use this as the single source of truth for backend calls.
    API_URL: "https://script.google.com/macros/s/AKfycbzNSSpvoi82o0xO7dGP2dKwuVz77FieXcbJUPnBy18gGltp84A0_bVYH7iJZ6ZV7Him/exec",

    // Security: Helper to escape HTML and prevent XSS
    escapeHTML: (str) => {
        if (!str) return "";
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
    }
};

// Export to window for global access in browsers
window.UPSC_CONFIG = CONFIG;
