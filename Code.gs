// עדכון הקבועים
const SPREADSHEET_ID = '1cpwhIaORiZwBObEsezWgYhztf75zcaqS6jlWatiC0UM'; // צריך להחליף את זה ב-ID האמיתי
const QUESTIONS_SHEET_NAME = 'שאלות';
const ANSWERS_SHEET_NAME = 'תשובות';
const BRANCHES_SHEET_NAME = 'סניפים';
const WINNERS_SHEET_NAME = 'זוכים';
const UPDATES_SHEET_NAME = 'עדכונים';
const REGISTRATION_SHEET_NAME = 'רישום'; // גיליון חדש לרישום
const PODCAST_LOTTERY_SHEET_NAME = 'פודקאסט הגרלה';
const PODCAST_LISTENS_SHEET_NAME = 'האזנות פודקאסט';

function doGet(e) {
  const response = ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify(handleRequest(e)));
  
  return response;
}

function handleRequest(e) {
  const action = e.parameter.action;
  let data = null;
  
  try {
    if (e.parameter.data) {
      data = JSON.parse(decodeURIComponent(e.parameter.data));
    }
  } catch (error) {
    return {
      error: 'Invalid data format'
    };
  }
  
  switch(action) {
    case 'getBranches':
      return {
        data: getBranches()
      };
      
    case 'getQuestions':
      return {
        data: getCurrentQuestions()
      };
      
    case 'testConnection':
      return {
        status: 'success',
        message: 'מחובר בהצלחה!'
      };
      
    case 'submitQuiz':
      if (!data) {
        return { error: 'No data provided' };
      }
      const result = submitQuiz(data.userDetails, data.answers);
      if (!result.success) {
        return { error: result.error || 'Failed to submit quiz' };
      }
      return result;
      
    case 'submitRegistration':
      if (!data) {
        return { error: 'No data provided' };
      }
      const regResult = submitRegistration(data.userDetails);
      if (!regResult.success) {
        return { error: regResult.error || 'Failed to submit registration' };
      }
      return regResult;
      
    case 'submitPodcastLottery':
      if (!data) {
        return { error: 'No data provided' };
      }
      const lotteryResult = submitPodcastLottery(data.userDetails);
      if (!lotteryResult.success) {
        return { error: lotteryResult.error || 'Failed to submit lottery entry' };
      }
      return lotteryResult;
      
    case 'savePodcastListen':
      if (!data) {
        return { error: 'No data provided' };
      }
      const listenResult = savePodcastListen(data);
      if (!listenResult.success) {
        return { error: listenResult.error || 'Failed to save listen data' };
      }
      return listenResult;
      
    case 'getWinners':
      return getWinners();
      
    case 'getUpdates':
      return getUpdates();
      
    default:
      return {
        error: 'Invalid action'
      };
  }
}

function doPost(e) {
  // טיפול בבקשות POST עם אותן כותרות CORS
  const response = ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setContent(JSON.stringify(handleRequest(e)));
  
  return addCorsHeaders(response);
}

// פונקציה להחזרת רשימת הסניפים
function getBranches() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(BRANCHES_SHEET_NAME);
  const branches = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  return branches.flat().filter(branch => branch !== '');
}

// פונקציה להחזרת השאלות למבחן הנוכחי
function getCurrentQuestions() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(QUESTIONS_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // מחזיר רק שאלות פעילות למבחן הנוכחי
  const questions = data.slice(1)
    .filter(row => row[headers.indexOf('פעיל')] === true)
    .map(row => ({
      id: row[headers.indexOf('מזהה')],
      question: row[headers.indexOf('שאלה')],
      type: row[headers.indexOf('סוג')],
      options: row.slice(headers.indexOf('אופציה 1'), headers.indexOf('אופציה 1') + 4)
        .filter(option => option !== ''),
      correctAnswer: row[headers.indexOf('תשובה נכונה')]
    }));
    
  return questions;
}

// פונקציה לשמירת תשובות המשתמש
function submitQuiz(userDetails, answers) {
  if (!userDetails || !userDetails.userName || !userDetails.branch || !userDetails.phone) {
    return {
      success: false,
      error: 'חסרים פרטי משתמש'
    };
  }

  if (!answers || !Array.isArray(answers)) {
    return {
      success: false,
      error: 'חסרות תשובות'
    };
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ANSWERS_SHEET_NAME);
  const timestamp = new Date();
  
  // חישוב ציון
  const questions = getCurrentQuestions();
  let score = 0;
  questions.forEach((q, index) => {
    if (answers[index] && q.correctAnswer === answers[index]) {
      score++;
    }
  });
  
  const finalScore = (score / questions.length) * 100;
  
  try {
    // שמירת התשובות
    sheet.appendRow([
      timestamp,
      userDetails.userName,
      userDetails.branch,
      userDetails.phone,
      ...answers,
      finalScore
    ]);
    
    return {
      success: true,
      score: finalScore
    };
  } catch (error) {
    console.error('Error saving quiz:', error);
    return {
      success: false,
      error: 'שגיאה בשמירת המבחן'
    };
  }
}

// פונקציית בדיקה פשוטה
function testConnection() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheets = ss.getSheets().map(sheet => sheet.getName());
    return {
      status: 'success',
      message: 'מחובר בהצלחה!',
      sheets: sheets
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.toString()
    };
  }
}

// פונקציה לשמירת פרטי רישום
function submitRegistration(userDetails) {
  console.log("קבלת בקשת רישום:", JSON.stringify(userDetails));
  
  if (!userDetails || !userDetails.userName || !userDetails.branch || !userDetails.phone) {
    console.error("חסרים פרטי משתמש:", JSON.stringify(userDetails));
    return {
      success: false,
      error: 'חסרים פרטי משתמש'
    };
  }

  try {
    // בדיקה אם קיים גיליון רישום, ואם לא - יוצרים אותו
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let registrationSheet = ss.getSheetByName(REGISTRATION_SHEET_NAME);
    
    if (!registrationSheet) {
      console.log("יוצר גיליון רישום חדש");
      registrationSheet = ss.insertSheet(REGISTRATION_SHEET_NAME);
      registrationSheet.getRange('A1:D1').setValues([['תאריך', 'שם', 'סניף', 'טלפון']]);
      registrationSheet.setFrozenRows(1);
    }
    
    const timestamp = new Date();
    console.log("הוספת שורה חדשה לגיליון רישום");
    
    // שמירת פרטי הרישום
    registrationSheet.appendRow([
      timestamp,
      userDetails.userName,
      userDetails.branch,
      userDetails.phone
    ]);
    
    console.log("רישום הושלם בהצלחה עבור:", userDetails.userName);
    return {
      success: true,
      message: 'הרישום הושלם בהצלחה'
    };
  } catch (error) {
    console.error('שגיאת רישום:', error.toString());
    return {
      success: false,
      error: 'שגיאה בשמירת פרטי הרישום: ' + error.toString()
    };
  }
}

// פונקציה לשמירת פרטי הגרלת פודקאסט
function submitPodcastLottery(userDetails) {
  console.log("קבלת בקשת הגרלת פודקאסט:", JSON.stringify(userDetails));
  
  if (!userDetails || !userDetails.userName || !userDetails.branch || !userDetails.phone || !userDetails.episode) {
    console.error("חסרים פרטי משתמש:", JSON.stringify(userDetails));
    return {
      success: false,
      error: 'חסרים פרטי משתמש'
    };
  }

  try {
    // בדיקה אם קיים גיליון הגרלת פודקאסט, ואם לא - יוצרים אותו
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let lotterySheet = ss.getSheetByName(PODCAST_LOTTERY_SHEET_NAME);
    
    if (!lotterySheet) {
      console.log("יוצר גיליון הגרלת פודקאסט חדש");
      lotterySheet = ss.insertSheet(PODCAST_LOTTERY_SHEET_NAME);
      lotterySheet.getRange('A1:E1').setValues([['תאריך', 'שם', 'טלפון', 'סניף', 'פרק']]);
      lotterySheet.setFrozenRows(1);
    }
    
    const timestamp = new Date();
    console.log("הוספת רישום להגרלה עבור:", userDetails.userName);
    
    // שמירת פרטי ההגרלה
    lotterySheet.appendRow([
      timestamp,
      userDetails.userName,
      userDetails.phone,
      userDetails.branch,
      userDetails.episode
    ]);
    
    console.log("רישום להגרלה הושלם בהצלחה");
    return {
      success: true,
      message: 'נרשמת להגרלה בהצלחה'
    };
  } catch (error) {
    console.error('שגיאת רישום להגרלה:', error.toString());
    return {
      success: false,
      error: 'שגיאה בשמירת פרטי ההגרלה: ' + error.toString()
    };
  }
}

// פונקציה לשמירת נתוני האזנה
function savePodcastListen(data) {
  console.log("קבלת בקשת שמירת האזנה:", JSON.stringify(data));
  
  try {
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let listensSheet = ss.getSheetByName(PODCAST_LISTENS_SHEET_NAME);
    
    if (!listensSheet) {
      console.log("יוצר גיליון האזנות פודקאסט חדש");
      listensSheet = ss.insertSheet(PODCAST_LISTENS_SHEET_NAME);
      listensSheet.getRange('A1:H1').setValues([['מזהה', 'מכשיר', 'פרק', 'שם פרק', 'תאריך', 'משך האזנה (שניות)', 'הושלם', 'עדכון אחרון']]);
      listensSheet.setFrozenRows(1);
    }

    const sessionId = data.sessionId;
    const deviceId = data.deviceId;
    const episodeId = data.episodeId;
    const episodeTitle = data.episodeTitle;
    const updateType = data.updateType;
    const totalListened = data.totalListened;
    const completed = data.completed;
    const timestamp = new Date(data.timestamp);
    
    // חיפוש שורה קיימת לפי sessionId
    const dataRange = listensSheet.getDataRange();
    const values = dataRange.getValues();
    let existingRow = -1;
    
    // חיפוש השורה הקיימת (החל מהשורה השנייה כי הראשונה היא כותרות)
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === sessionId) { // sessionId נמצא בעמודה הראשונה
        existingRow = i + 1; // +1 כי getValues() מתחיל מ-0
        break;
      }
    }

    const rowData = [
      sessionId,
      deviceId,
      episodeId,
      episodeTitle,
      timestamp,
      totalListened,
      completed ? 'כן' : 'לא',
      timestamp // עדכון אחרון
    ];

    if (existingRow > 0 && updateType !== 'start') {
      // עדכון שורה קיימת (רק אם זה לא התחלת האזנה)
      listensSheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      console.log(`עודכן שורה ${existingRow} עבור האזנה ${sessionId}`);
    } else if (updateType === 'start') {
      // הוספת שורה חדשה רק עבור התחלת האזנה
      listensSheet.appendRow(rowData);
      console.log(`נוספה שורה חדשה עבור האזנה ${sessionId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('שגיאה בשמירת נתוני האזנה:', error);
    return { success: false, error: error.toString() };
  }
}

// נוסיף פונקציה שתיצור את המבנה הבסיסי של הגיליון אם הוא לא קיים
function setupSpreadsheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // הגדרת גיליון סניפים
  let branchesSheet = ss.getSheetByName(BRANCHES_SHEET_NAME);
  if (!branchesSheet) {
    branchesSheet = ss.insertSheet(BRANCHES_SHEET_NAME);
    branchesSheet.getRange('A1').setValue('שם הסניף');
  }
  
  // הגדרת גיליון שאלות
  let questionsSheet = ss.getSheetByName(QUESTIONS_SHEET_NAME);
  if (!questionsSheet) {
    questionsSheet = ss.insertSheet(QUESTIONS_SHEET_NAME);
    questionsSheet.getRange('A1:I1').setValues([['מזהה', 'שאלה', 'סוג', 'אופציה 1', 'אופציה 2', 'אופציה 3', 'אופציה 4', 'תשובה נכונה', 'פעיל']]);
  }
  
  // הגדרת גיליון תשובות
  let answersSheet = ss.getSheetByName(ANSWERS_SHEET_NAME);
  if (!answersSheet) {
    answersSheet = ss.insertSheet(ANSWERS_SHEET_NAME);
    answersSheet.getRange('A1:E1').setValues([['תאריך', 'שם', 'סניף', 'טלפון', 'ציון']]);
  }
  
  // הגדרת גיליון רישום
  let registrationSheet = ss.getSheetByName(REGISTRATION_SHEET_NAME);
  if (!registrationSheet) {
    registrationSheet = ss.insertSheet(REGISTRATION_SHEET_NAME);
    registrationSheet.getRange('A1:D1').setValues([['תאריך', 'שם', 'סניף', 'טלפון']]);
    registrationSheet.setFrozenRows(1);
  }
  
  // הגדרת גיליון הגרלת פודקאסט
  let podcastLotterySheet = ss.getSheetByName(PODCAST_LOTTERY_SHEET_NAME);
  if (!podcastLotterySheet) {
    podcastLotterySheet = ss.insertSheet(PODCAST_LOTTERY_SHEET_NAME);
    podcastLotterySheet.getRange('A1:E1').setValues([['תאריך', 'שם', 'טלפון', 'סניף', 'פרק']]);
    podcastLotterySheet.setFrozenRows(1);
  }
  
  // הגדרת גיליון האזנות פודקאסט
  let podcastListensSheet = ss.getSheetByName(PODCAST_LISTENS_SHEET_NAME);
  if (!podcastListensSheet) {
    podcastListensSheet = ss.insertSheet(PODCAST_LISTENS_SHEET_NAME);
    podcastListensSheet.getRange('A1:H1').setValues([['מזהה', 'מכשיר', 'פרק', 'שם פרק', 'תאריך', 'משך האזנה (שניות)', 'הושלם', 'עדכון אחרון']]);
    podcastListensSheet.setFrozenRows(1);
  }
  
  return "Spreadsheet setup completed";
}

function getWinners() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const winnersSheet = ss.getSheetByName(WINNERS_SHEET_NAME);
  
  if (!winnersSheet) {
    return { data: [] };
  }
  
  const data = winnersSheet.getDataRange().getValues();
  const headers = data[0];
  const winners = data.slice(1).map(row => ({
    name: row[0],
    branch: row[1],
    prize: row[2],
    quiz: row[3]
  }));
  
  return { data: winners };
}

function getUpdates() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const updatesSheet = ss.getSheetByName(UPDATES_SHEET_NAME);
  
  if (!updatesSheet) {
    return { data: [] };
  }
  
  const data = updatesSheet.getDataRange().getValues();
  const headers = data[0];
  const updates = data.slice(1).reverse()
    .map(row => ({
      date: row[0],
      title: row[1],
      content: row[2],
      type: row[3].toLowerCase().trim()
    }));
  
  return { data: updates };
} 