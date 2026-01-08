/**
 * ============================================
 * UNIFIED STAFF PORTAL CODE.GS (API VERSION)
 * ============================================
 * Handles:
 * 1. API routing for local login.html
 * 2. User authentication (signup/signin)
 * 3. File uploads to Google Drive
 * 4. File listing from Google Drive
 * 5. Password recovery with OTP
 * ============================================
 */

const FOLDER_ID = '1ycN3omGZu0Pn1eQk8EANnJiWZnLmVqAE';
const SPREADSHEET_ID = '1ghHCPuhcbnAAk9eK3wF8KTXui3qt6yL_kKzEV7oczZU';

/**
 * Main entry point: Handles API Calls
 */
function doGet(e) {
  // If this is an API call from your website (has action parameter)
  if (e && e.parameter && e.parameter.action) {
    return handleApiRequest(e);
  }

  // Fallback: If visited directly in browser, show status instead of error
  return ContentService.createTextOutput("🚀 Academia API is Live!\n\nStatus: Running\nSpreadsheet: Connected\n\nInstructions:\n1. Copy the Web App URL from 'Deploy' > 'New Deployment'\n2. Paste it into API_URL in your login.html")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Handle POST requests (used for large file uploads)
 */
function doPost(e) {
  return handleApiRequest(e);
}

/**
 * Route API requests to the correct function
 */
function handleApiRequest(e) {
  try {
    // Handle parameters from both GET and POST requests
    let action, data;
    
    if (e.parameter && e.parameter.action) {
      // GET or POST with parameters
      action = e.parameter.action;
      data = e.parameter.data ? JSON.parse(e.parameter.data) : null;
    } else if (e.postData) {
      // POST with body
      const params = parsePostData(e.postData.contents);
      action = params.action;
      data = params.data ? JSON.parse(params.data) : null;
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'No action specified'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    let result;
    switch (action) {
      case 'signup':
        result = processSignup(data);
        break;
      case 'login':
        result = processLogin(data);
        break;
      case 'upload':
        result = uploadFileToFolder(data.base64Data, data.fileName);
        break;
      case 'getFiles':
        result = getFilesFromDrive();
        break;
      case 'forgotPassword':
        result = processForgotPassword(data.email);
        break;
      case 'verifyOTP':
        result = verifyOTP(data.email, data.otp);
        break;
      default:
        result = { success: false, message: 'Invalid action: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'API Error: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Parse POST data from URL-encoded format
 */
function parsePostData(postData) {
  const params = {};
  const pairs = postData.split('&');
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i].split('=');
    params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return params;
}

// =============================================
// USER AUTHENTICATION FUNCTIONS
// =============================================

function processSignup(formData) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Users');
    
    if (!sheet) {
      sheet = ss.insertSheet('Users');
      sheet.appendRow(['Name', 'Email', 'Password', 'Access', 'Link', 'OTP', 'OTP_Expiry', 'Admin_consent']);
    }
    
    if (!isValidEmail(formData.email)) {
      return { success: false, message: 'Please enter a valid email address!' };
    }
    
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).toLowerCase() === String(formData.email).toLowerCase()) {
        return { success: false, message: 'Email already registered!' };
      }
    }
    
    sheet.appendRow([
      formData.name,
      formData.email,
      formData.password,
      'Allowed', 
      '', 
      '', 
      '', 
      '0' // Admin_consent = Pending
    ]);
    
    return { success: true, message: 'Registration successful! Pending Admin approval.' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

function processLogin(formData) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Users');
    
    if (!sheet) {
      return { success: false, message: 'No users registered yet.' };
    }
    
    var data = sheet.getDataRange().getDisplayValues();
    
    for (var i = 1; i < data.length; i++) {
      var dbEmail = String(data[i][1]).trim();
      var dbPassword = String(data[i][2]).trim();
      var adminConsent = String(data[i][7]).trim();

      if (dbEmail === formData.email && dbPassword === formData.password) {
        if (adminConsent !== "1") {
          return { success: false, message: 'Account Pending Admin approval.' };
        }
        
        return {
          success: true,
          message: 'Login Successful!',
          userName: data[i][0]
        };
      }
    }
    
    return { success: false, message: 'Invalid email or password.' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

// =============================================
// FILE MANAGEMENT FUNCTIONS
// =============================================

function uploadFileToFolder(base64Data, fileName) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const contentType = base64Data.substring(5, base64Data.indexOf(';'));
    const bytes = Utilities.base64Decode(base64Data.split(',')[1]);
    const blob = Utilities.newBlob(bytes, contentType, fileName);
    
    const file = folder.createFile(blob);
    return { success: true, url: file.getUrl() };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function getFilesFromDrive() {
  try {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var files = folder.getFiles();
    var fileList = [];

    while (files.hasNext()) {
      var file = files.next();
      fileList.push({
        name: file.getName(),
        url: file.getUrl(),
        downloadUrl: "https://drive.google.com/uc?export=download&id=" + file.getId(),
        type: file.getMimeType(),
        id: file.getId()
      });
    }
    
    return { success: true, files: fileList };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// =============================================
// PASSWORD RECOVERY FUNCTIONS
// =============================================

function processForgotPassword(email) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Users');
    
    if (!sheet) {
      return { success: false, message: 'No users found.' };
    }
    
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).toLowerCase() === String(email).toLowerCase()) {
        var otp = Math.floor(100000 + Math.random() * 900000);
        var otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 
        
        sheet.getRange(i + 1, 6).setValue(otp);
        sheet.getRange(i + 1, 7).setValue(otpExpiry);
        
        sendOTPEmail(email, otp, data[i][0]);
        
        return { success: true, message: 'OTP sent to email.', showOTPInput: true };
      }
    }
    
    return { success: false, message: 'No user found with that email.' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function verifyOTP(email, otp) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Users');
    var data = sheet.getDataRange().getValues();
    var now = new Date();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).toLowerCase() === String(email).toLowerCase()) {
        if (String(data[i][5]) === String(otp) && now <= new Date(data[i][6])) {
          sheet.getRange(i + 1, 6).setValue('');
          
          return { 
            success: true, 
            message: 'Verified!', 
            password: data[i][2] 
          };
        }
      }
    }
    
    return { success: false, message: 'Invalid or expired OTP.' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function sendOTPEmail(email, otp, userName) {
  var subject = 'UPSC Academia - Password Reset OTP';
  var htmlBody = `
    <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 30px; border-radius: 15px; background: linear-gradient(135deg, #b890e6 0%, #8e44ad 100%);">
      <div style="background: white; padding: 30px; border-radius: 10px;">
        <h2 style="color: #2b1369; text-align: center;">Password Reset Request</h2>
        <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size: 14px; color: #555;">Use the OTP below to recover your account:</p>
        <div style="background: #fcfaff; border: 2px dashed #b890e6; padding: 20px; margin: 20px 0; text-align: center; border-radius: 10px;">
          <h1 style="color: #2b1369; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p style="font-size: 13px; color: #999;">⚠️ Valid for 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">UPSC Academia Portal</p>
      </div>
    </div>
  `;
  
  MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
