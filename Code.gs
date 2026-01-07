/**
 * ============================================
 * UNIFIED STAFF PORTAL API - CODE.GS
 * ============================================
 * This script works as a BACKEND API for login.html
 * login.html is hosted on your website
 * This script handles API requests and returns JSON
 * ============================================
 */

// **IMPORTANT**: Replace this with your Google Drive Folder ID
const FOLDER_ID = '1ycN3omGZu0Pn1eQk8EANnJiWZnLmVqAE';

/**
 * Main entry point: Handles GET requests (API calls)
 * This does NOT serve HTML - only returns JSON data
 */
function doGet(e) {
  return handleRequest(e);
}

/**
 * Handles POST requests (for file uploads and complex data)
 */
function doPost(e) {
  return handleRequest(e);
}

/**
 * Central request handler with CORS support
 */
function handleRequest(e) {
  // Handle CORS preflight
  if (e && e.parameter && e.parameter.action === 'preflight') {
    return createCORSResponse({success: true});
  }
  
  try {
    if (!e || !e.parameter) {
      return createCORSResponse({success: false, message: 'No parameters provided'});
    }
    
    const action = e.parameter.action;
    const data = e.parameter.data ? JSON.parse(e.parameter.data) : {};
    
    let response;
    
    switch(action) {
      case 'signup':
        response = processSignup(data);
        break;
      case 'login':
        response = processLogin(data);
        break;
      case 'upload':
        response = uploadFileToFolder(data.base64Data, data.fileName);
        break;
      case 'getFiles':
        response = getFilesFromDrive();
        break;
      case 'forgotPassword':
        response = processForgotPassword(data.email);
        break;
      case 'verifyOTP':
        response = verifyOTP(data.email, data.otp);
        break;
      default:
        response = {success: false, message: 'Invalid action: ' + action};
    }
    
    return createCORSResponse(response);
    
  } catch (err) {
    return createCORSResponse({
      success: false, 
      message: 'Server error: ' + err.toString()
    });
  }
}

/**
 * Create JSON response with CORS headers
 */
function createCORSResponse(responseData) {
  const output = JSON.stringify(responseData);
  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// =============================================
// USER AUTHENTICATION FUNCTIONS
// =============================================

/**
 * Handle User Signup
 */
function processSignup(formData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Users');
    
    // Create Users sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('Users');
      sheet.appendRow(['Name', 'Email', 'Password', 'Access', 'Link', 'OTP', 'OTP_Expiry', 'Admin_consent']);
    }
    
    // Validate email format
    if (!isValidEmail(formData.email)) {
      return { success: false, message: 'Please enter a valid email address!' };
    }
    
    // Check if email already exists
    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).toLowerCase() === String(formData.email).toLowerCase()) {
        return { success: false, message: 'Email already registered!' };
      }
    }
    
    // Add new user (Admin_consent default is '0' = Pending)
    sheet.appendRow([
      formData.name,
      formData.email,
      formData.password,
      'Allowed', 
      '', // Link placeholder
      '', // OTP
      '', // OTP_Expiry
      '0' // Admin_consent = Pending approval
    ]);
    
    return { success: true, message: 'Registration successful! Pending Admin approval.' };
  } catch (err) {
    return { success: false, message: 'Error: ' + err.toString() };
  }
}

/**
 * Handle User Login
 */
function processLogin(formData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Users');
    
    if (!sheet) {
      return { success: false, message: 'No users registered yet.' };
    }
    
    var data = sheet.getDataRange().getDisplayValues();
    
    // Search for matching email and password
    for (var i = 1; i < data.length; i++) {
      var dbEmail = String(data[i][1]).trim();
      var dbPassword = String(data[i][2]).trim();
      var adminConsent = String(data[i][7]).trim();

      if (dbEmail === formData.email && dbPassword === formData.password) {
        // Check if admin has approved this user
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

/**
 * Upload file to Google Drive folder
 */
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

/**
 * Fetch all files from the Drive folder
 */
function getFilesFromDrive() {
  try {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var files = folder.getFiles();
    var fileList = [];

    while (files.hasNext()) {
      var file = files.next();
      fileList.push({
        name: file.getName(),
        url: file.getUrl(), // View Link
        downloadUrl: "https://drive.google.com/uc?export=download&id=" + file.getId(), // Direct Download
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

/**
 * Process Forgot Password Request
 */
function processForgotPassword(email) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Users');
    
    if (!sheet) {
      return { success: false, message: 'No users found.' };
    }
    
    var data = sheet.getDataRange().getValues();
    
    // Find user by email
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).toLowerCase() === String(email).toLowerCase()) {
        // Generate 6-digit OTP
        var otp = Math.floor(100000 + Math.random() * 900000);
        var otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        // Store OTP and expiry in sheet
        sheet.getRange(i + 1, 6).setValue(otp);
        sheet.getRange(i + 1, 7).setValue(otpExpiry);
        
        // Send OTP via email
        sendOTPEmail(email, otp, data[i][0]);
        
        return { success: true, message: 'OTP sent to email.', showOTPInput: true };
      }
    }
    
    return { success: false, message: 'No user found with that email.' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * Verify OTP and return password
 */
function verifyOTP(email, otp) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Users');
    var data = sheet.getDataRange().getValues();
    var now = new Date();
    
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).toLowerCase() === String(email).toLowerCase()) {
        // Check if OTP matches and hasn't expired
        if (String(data[i][5]) === String(otp) && now <= new Date(data[i][6])) {
          // Clear OTP from sheet
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

/**
 * Send OTP via email
 */
function sendOTPEmail(email, otp, userName) {
  var subject = 'UPSC Academia - Password Reset OTP';
  var htmlBody = `
    <div style="font-family: 'Montserrat', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 30px; border-radius: 15px; background: linear-gradient(135deg, #b890e6 0%, #8e44ad 100%);">
      <div style="background: white; padding: 30px; border-radius: 10px;">
        <h2 style="color: #2b1369; text-align: center;">Password Reset Request</h2>
        <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size: 14px; color: #555;">You requested to reset your password. Use the OTP below to recover your account:</p>
        <div style="background: #fcfaff; border: 2px dashed #b890e6; padding: 20px; margin: 20px 0; text-align: center; border-radius: 10px;">
          <h1 style="color: #2b1369; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p style="font-size: 13px; color: #999;">⚠️ This OTP will expire in <strong>10 minutes</strong>.</p>
        <p style="font-size: 13px; color: #999;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">UPSC Academia Staff Portal</p>
      </div>
    </div>
  `;
  
  MailApp.sendEmail({ 
    to: email, 
    subject: subject, 
    htmlBody: htmlBody 
  });
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

