const CONFIG = {
    // PUBLIC CONFIGURATION (Exposed to frontend)
    // The Web App URL from Google Apps Script deployment
    SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxVd6G9yCWCBowAK2PZxWQLJRgJvff8y4wKh56fDUEnv3b_Sxoz3uva9kyZz-X-kEeG/exec",

    // Hostinger MySQL Database API URL (dual-write endpoint)
    DB_API_URL: "https://academiaclass.in/api/index.php",
};

// Also expose as window global if needed
window.CONFIG = CONFIG;
