const CONFIG = {
    // PUBLIC CONFIGURATION (Exposed to frontend)
    // The Web App URL from Google Apps Script deployment
    SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwDmnGxubYk2TMst8buujlJvIPCth2w_VjFd-Mdo0wJZIEHLOGLWmAT5RLw1KUv2qfB/exec",



    // Admin API Key for securing sensitive backend actions (e.g., delete, view leads)
    // Set this to a secure random string and match it in your Code.gs settings (or pass it from admin portal)
    ADMIN_API_KEY: "CHANGE_ME_TO_A_SECURE_TOKEN"
};

// Also expose as window global if needed
window.CONFIG = CONFIG;
