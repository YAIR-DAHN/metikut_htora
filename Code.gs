// עדכון הקבועים
const SPREADSHEET_ID = '1cpwhIaORiZwBObEsezWgYhztf75zcaqS6jlWatiC0UM'; // צריך להחליף את זה ב-ID האמיתי
const QUESTIONS_SHEET_NAME = 'שאלות';
const ANSWERS_SHEET_NAME = 'תשובות';
const BRANCHES_SHEET_NAME = 'סניפים';
const WINNERS_SHEET_NAME = 'זוכים';
const UPDATES_SHEET_NAME = 'עדכונים';

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
  return doGet(e);
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