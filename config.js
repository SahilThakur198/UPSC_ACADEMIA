const CONFIG = {
    // PUBLIC CONFIGURATION (Exposed to frontend)
    // The Web App URL from Google Apps Script deployment
    SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwDmnGxubYk2TMst8buujlJvIPCth2w_VjFd-Mdo0wJZIEHLOGLWmAT5RLw1KUv2qfB/exec",

    // Model configuration for the chatbot
    CHATBOT_MODEL: "openai/gpt-oss-120b:free",

    // OpenRouter API Key (Requested by user to be here)
    OPENROUTER_API_KEY: "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"
};

// Also expose as window global if needed
window.CONFIG = CONFIG;
