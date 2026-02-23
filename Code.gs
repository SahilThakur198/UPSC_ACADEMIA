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
 * 6. Enrollment Emails with Auto-Scheduling
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
      case 'enroll':
        result = processEnrollment(data);
        break;
      case 'getLeads':
        result = getLeadsFromSheet();
        break;
      case 'upload':
        result = uploadFileToFolder(data.base64Data, data.fileName);
        break;
      case 'deleteFile':
        result = deleteFileFromDrive(data.fileId);
        break;
      case 'getFiles':
        result = getFilesFromDrive();
        break;
      case 'download':
        result = downloadFileAsBase64(e.parameter.id);
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
 * Handle Enrollment Form Submission
 */
function processEnrollment(data) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName('Leads');
    
    if (!sheet) {
      sheet = ss.insertSheet('Leads');
      sheet.appendRow(['Timestamp', 'Name', 'Email', 'Phone', 'Course', 'Status']);
    }
    
    sheet.appendRow([
      new Date(),
      data.name || data.enrollName,
      data.email || data.enrollEmail,
      String(data.phone || data.enrollPhone),
      data.course,
      'New'
    ]);

    // --- Send Confirmation Email with Nearest Saturday ---
    sendEnrollmentConfirmation(data);
    // ---------------------------------------------------
    
    return { success: true, message: 'Enrollment successful!' };
  } catch (err) {
    return { success: false, message: 'Enrollment error: ' + err.toString() };
  }
}

/**
 * Fetch Leads for Admin Dashboard
 */
function getLeadsFromSheet() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Leads');
    
    if (!sheet) return { success: true, leads: [] };
    
    const data = sheet.getDataRange().getDisplayValues();
    const leads = [];
    
    for (let i = 1; i < data.length; i++) {
      leads.push({
        timestamp: data[i][0],
        name: data[i][1],
        email: data[i][2],
        phone: data[i][3],
        course: data[i][4],
        status: data[i][5]
      });
    }
    
    return { success: true, leads: leads.reverse() }; // Newest first
  } catch (err) {
    return { success: false, message: 'Leads fetch error: ' + err.toString() };
  }
}

/**
 * Delete file from Google Drive
 */
function deleteFileFromDrive(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    return { success: true, message: 'File moved to trash.' };
  } catch (err) {
    return { success: false, message: 'Delete error: ' + err.toString() };
  }
}

/**
 * Helper to fetch file as Base64 for proxy download
 */
function downloadFileAsBase64(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const base64 = Utilities.base64Encode(blob.getBytes());
    return {
      success: true,
      data: base64,
      fileName: file.getName(),
      mimeType: file.getMimeType()
    };
  } catch (err) {
    return { success: false, error: err.toString() };
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
// UTILITY FUNCTIONS & EMAILS
// =============================================

/**
 * Calculates the date of the next Saturday
 * Returns an array or object to be formatted in Marathi
 */
function getNextSaturdayDate() {
  const date = new Date();
  const dayOfWeek = date.getDay(); // Sunday - Saturday : 0 - 6
  const daysUntilSat = 6 - dayOfWeek;
  
  if (daysUntilSat === 0) {
    date.setDate(date.getDate() + 7);
  } else {
    date.setDate(date.getDate() + daysUntilSat);
  }
  return date;
}

/**
 * Sends Confirmation Email to Student & BCC Admin
 */
function sendEnrollmentConfirmation(data) {
  var email = data.email || data.enrollEmail;
  var name = data.name || data.enrollName || 'Student';
  var course = data.course || 'the course';
  
  if (!isValidEmail(email)) return;
  
  var subject = "Demo Class Invitation - UPSC Academia";
  var mapLink = "https://google.com/maps?q=18.51725828295656,73.85547900935163&utm_source=email&utm_medium=student&utm_campaign=maps_click";
  
  // Specific phone number requested
  var phoneNumber = "7666818376";
  var phoneLink = "tel:+91" + phoneNumber;
  
  // Dynamic Date Calculation with Marathi Formatting
  var nextSat = getNextSaturdayDate();
  var marathiMonths = [
    "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून", 
    "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"
  ];
  
  // Format: "10 जानेवारी 2026"
  var displayDate = nextSat.getDate() + " " + marathiMonths[nextSat.getMonth()] + " " + nextSat.getFullYear();
  
  // Brand Colors
  var primaryBlue = "#081f3d"; 
  var accentRed = "#c62828";   
  
  var htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Gotu&display=swap');
        
        /* Base Reset */
        body { margin: 0; padding: 0; background-color: #f4f4f4; }
        
        .email-container { 
          font-family: 'Gotu', 'Segoe UI', sans-serif; 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff; 
          border: 1px solid #e0e0e0; 
        }
        
        .header { background-color: ${primaryBlue}; padding: 25px; text-align: center; display: block; }
        
        .logo-text { font-size: 28px; font-weight: 700; text-decoration: none; }
        .upsc { color: ${accentRed}; font-family: "Times New Roman", serif; font-weight: 900; }
        .academia { color: #ffffff; font-family: "Kalam", cursive, sans-serif; font-style: italic; margin-left: 5px; }
        .tagline { color: #cfd8dc; font-size: 14px; margin-top: 10px; font-weight: normal; line-height: 1.4; }

        .content { padding: 30px; color: #333333; line-height: 1.6; }
        .highlight-box { background-color: #f8f9fa; border-left: 5px solid ${accentRed}; padding: 20px; margin: 25px 0; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .info-row { margin-bottom: 8px; font-size: 15px; }
        .info-label { font-weight: bold; color: ${primaryBlue}; width: 60px; display: inline-block; }
        
        .btn { display: inline-block; padding: 12px 25px; margin: 10px 5px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px; text-align: center; }
        .btn-blue { background-color: ${primaryBlue}; color: #ffffff; }
        .btn-green { background-color: #28a745; color: #ffffff; }
        
        .footer { background-color: #082245; padding: 20px; text-align: center; font-size: 12px; color: rgba(255, 255, 255, 0.8); border-top: 4px solid ${accentRed}; }
        .phone-display { font-size: 20px; font-weight: bold; color: ${accentRed}; display: inline-block; }
        
        /* RESPONSIVE DESIGN FOR MOBILE DEVICES */
        @media only screen and (max-width: 600px) {
          .email-container { width: 100% !important; border: none !important; }
          .content { padding: 20px !important; }
          .header { padding: 20px !important; }
          .logo-text { font-size: 24px !important; }
          .tagline { font-size: 12px !important; }
          .highlight-box { padding: 15px !important; margin: 20px 0 !important; }
          .info-label { display: block; width: 100%; margin-bottom: 2px; color: ${accentRed}; }
          .btn { display: block !important; width: auto !important; margin: 10px 0 !important; }
          .info-row { margin-bottom: 12px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        
        <!-- HEADER -->
        <div class="header">
          <div class="logo-text">
            <span class="upsc">UPSC</span><span class="academia">Academia</span>
          </div>
          <div class="tagline">Pioneering civil services coaching in Pune,<br>nurturing the nation's future leaders.</div>
        </div>
        
        <!-- CONTENT BODY -->
        <div class="content">
          <p>नमस्कार <strong>${name}</strong> 🙏🏻 ,</p>
          <p><strong>UPSC Academia</strong> मध्ये <strong>${course}</strong> साठी स्वारस्य दाखवल्याबद्दल धन्यवाद.</p>
          <p>आम्ही तुम्हाला आमच्या <strong>मोफत डेमो लेक्चर (Free Demo Lecture)</strong> साठी आमंत्रित करीत आहोत .</p>

          <!-- DETAILS BOX -->
          <div class="highlight-box">
            <div class="info-row"><span class="info-label">📅 दिनांक:</span> ${displayDate}</div>
            <div class="info-row"><span class="info-label">⏰ वेळ:</span> सकाळी 11:00 ते दुपारी 1:00</div>
            <div class="info-row" style="margin-top: 15px;">
                <span class="info-label">📍 स्थळ:</span>
                ३ रा मजला, शान ब्रह्मा कॉम्प्लेक्स, श्रीमंत दगडूशेठ गणपतीच्या मागे, फरासखाना पोलीस स्टेशन समोर, पुणे.
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; border-top: 1px dashed #ddd; padding-top: 20px;">
            <p style="margin-bottom: 5px; font-size: 15px;">मदत हवी आहे? आम्हाला कॉल करा किंवा या ईमेलला उत्तर द्या.</p>
            
            <a href="${phoneLink}" style="text-decoration: none;">
              <span class="phone-display">📞 ${phoneNumber}</span>
            </a>
            
            <div style="margin-top: 15px;">
               <a href="${mapLink}" class="btn btn-blue">📍 Google Maps वर पहा</a>
            </div>
          </div>
        </div>
        
        <!-- FOOTER -->
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} UPSC Academia. All rights reserved.</p>
          <p>Pune, Maharashtra</p>
        </div>
        
      </div>
    </body>
    </html>
  `;
  
  MailApp.sendEmail({
    to: email,
    bcc: 'sahiluselessfellow@gmail.com',
    subject: subject,
    htmlBody: htmlBody
  });
}

function sendOTPEmail(email, otp, userName) {
  var primaryBlue = "#081f3d"; 
  var accentRed = "#c62828";   
  
  var subject = 'UPSC Academia - Password Reset OTP';
  var htmlBody = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
      <div style="background-color: ${primaryBlue}; padding: 20px; text-align: center;">
         <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Password Reset</h2>
      </div>
      <div style="padding: 30px; text-align: center;">
        <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size: 14px; color: #666;">Use the OTP below to recover your account:</p>
        
        <div style="background: #fcfaff; border: 2px dashed ${accentRed}; padding: 15px; margin: 20px auto; width: 80%; border-radius: 8px;">
          <h1 style="color: ${primaryBlue}; font-size: 32px; margin: 0; letter-spacing: 4px;">${otp}</h1>
        </div>
        
        <p style="font-size: 12px; color: #999;">⚠️ Valid for 10 minutes.</p>
      </div>
    </div>
  `;
  
  MailApp.sendEmail({ to: email, subject: subject, htmlBody: htmlBody });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}