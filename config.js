const CONFIG = {
    // PUBLIC CONFIGURATION (Exposed to frontend)
    // The Web App URL from Google Apps Script deployment
    SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxwKmCd-dAv5fpqTQ10VUEmsybGeWb33r9m3d6g5UJd3PGdwRvl1aanRJM1uCRaE4hkYA/exec",

    // Hostinger MySQL Database API URL (dual-write endpoint)
    DB_API_URL: "https://academiaclass.in/api/index.php",
};

// Also expose as window global if needed
window.CONFIG = CONFIG;
