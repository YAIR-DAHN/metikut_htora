// משתנים גלובליים למבחן
let currentQuestions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let currentUserDetails = null;

async function startQuiz(userDetails) {
    // בדיקה אם המבחן זמין
    if (!CONFIG.quiz.isAvailable) {
        window.location.href = 'quiz-unavailable.html';
        return;
    }

    if (!userDetails || !userDetails.userName || !userDetails.branch || !userDetails.phone) {
        showModal({
            title: 'שגיאת טופס',
            message: 'אנא מלא את כל פרטי המשתמש',
            icon: 'warning'
        });
        return;
    }

    // בדיקת תקינות הסניף
    if (!validateBranch(document.getElementById('branch'))) {
        showModal({
            title: 'שגיאת טופס',
            message: 'אנא בחר סניף מהרשימה',
            icon: 'warning'
        });
        return;
    }

    showLoading();
    try {
        // אם השאלות עדיין לא נטענו, נטען אותן
        if (!cache.questions) {
            const response = await fetchFromAPI('getQuestions');
            cache.questions = response.data;
        }

        if (!cache.questions || cache.questions.length === 0) {
            throw new Error('לא נמצאו שאלות למבחן');
        }

        // שמירת פרטי המשתמש
        currentUserDetails = userDetails;

        // איתחול מערך התשובות
        currentQuestions = cache.questions;
        userAnswers = new Array(currentQuestions.length).fill(null);
        currentQuestionIndex = 0;

        // עדכון מספר השאלות הכולל
        document.getElementById('totalQuestions').textContent = currentQuestions.length;

        // הסתרת טופס ההרשמה והצגת המבחן
        document.getElementById('registration-form').classList.add('hidden');
        document.getElementById('quiz-section').classList.remove('hidden');

        // הצגת השאלה הראשונה
        showQuestion(0);

        // יצירת אינדיקטורים לשאלות
        createQuestionIndicators();

    } catch (error) {
        console.error('שגיאה בהתחלת המבחן:', error);
        showModal({
            title: 'שגיאה',
            message: error.message || 'אירעה שגיאה בטעינת המבחן, נסה שוב בעוד כמה דקות או צור קשר עם האחראי',
            icon: 'error'
        });
    } finally {
        hideLoading();
    }
}

async function submitQuiz() {
    // שמירת התשובה האחרונה לפני הגשה
    saveCurrentAnswer();

    // בדיקה אם יש שאלות שלא נענו
    const unansweredCount = userAnswers.filter(answer => answer === null || answer === '').length;
    if (unansweredCount > 0) {
        // יצירת דיאלוג מותאם אישית
        const confirmDialogHTML = `
            <div id="confirm-dialog" class="custom-dialog">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <span class="material-icons warning-icon">warning</span>
                        <h2>שאלות ללא מענה</h2>
                    </div>
                    <p>נותרו ${unansweredCount} שאלות ללא מענה. האם ברצונך להגיש את המבחן?</p>
                    <div class="dialog-buttons">
                        <button id="cancel-submit" class="secondary-button">חזור למבחן</button>
                        <button id="confirm-submit" class="primary-button">הגש מבחן</button>
                    </div>
                </div>
            </div>
        `;
        
        // הוספת הדיאלוג לדף
        document.body.insertAdjacentHTML('beforeend', confirmDialogHTML);
        
        // הוספת מאזיני אירועים לכפתורים
        document.getElementById('confirm-submit').addEventListener('click', () => {
            document.getElementById('confirm-dialog').remove();
            submitQuizToServer();
        });
        
        document.getElementById('cancel-submit').addEventListener('click', () => {
            document.getElementById('confirm-dialog').remove();
        });
        return;
    }

    submitQuizToServer();
}

async function submitQuizToServer() {
    showLoading();
    try {
        if (!currentUserDetails) {
            hideLoading();
            alert('לא נמצאו פרטי משתמש');
            return;
        }

        const result = await fetchFromAPI('submitQuiz', 'POST', {
            userDetails: currentUserDetails,
            answers: userAnswers
        });
        
        if (result.success) {
            // קודם נסתיר את מסך הטעינה
            hideLoading();
            
            // נשנה את תצוגת הדף להודעת הצלחה
            document.body.innerHTML = `
                <div class="success-page">
                    <div class="success-container">
                        <span class="material-icons success-icon">check_circle</span>
                        <h1>אשריך!</h1>
                        <p>סיימת את המבחן השבועי, הזוכים יפורסמו באתר, ועכשיו לא לשכוח ההספק השבועי דף לה: ממשיכים בכל הכח כי אין דבר מתוק יותר מדף גמרא, תנועת הנוער "אור ישראלי" מיזם מתיקות התורה</p>
                        <button onclick="window.location.href='index.html'">חזרה לדף הבית</button>
                    </div>
                </div>
                <style>
                    .success-page {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        background-color: #f5f5f5;
                        font-family: 'Rubik', sans-serif;
                    }
                    
                    .success-container {
                        background-color: white;
                        border-radius: 8px;
                        padding: 40px;
                        max-width: 90%;
                        width: 600px;
                        text-align: center;
                        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    }
                    
                    .success-icon {
                        font-size: 80px;
                        color: #4CAF50;
                        margin-bottom: 20px;
                    }
                    
                    .success-container h1 {
                        color: #333;
                        margin: 0 0 20px 0;
                        font-size: 32px;
                    }
                    
                    .success-container p {
                        color: #666;
                        margin-bottom: 30px;
                        line-height: 1.6;
                        font-size: 18px;
                    }
                    
                    .success-container button {
                        background-color: #1abc9c;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 4px;
                        font-size: 18px;
                        cursor: pointer;
                        transition: background-color 0.3s;
                    }
                    
                    .success-container button:hover {
                        background-color: #16a085;
                    }
                </style>
            `;
        } else {
            throw new Error('שגיאה בהגשת המבחן');
        }
    } catch (error) {
        console.error('שגיאה בהגשת המבחן:', error);
        hideLoading();
        alert('שגיאה בהגשת המבחן: ' + (error.message || 'אירעה שגיאה בהגשת המבחן. אנא נסה שוב.'));
    }
}

function createQuestionIndicators() {
    const container = document.createElement('div');
    container.className = 'questions-status';
    
    for (let i = 0; i < currentQuestions.length; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'question-indicator';
        indicator.addEventListener('click', () => {
            saveCurrentAnswer();
            currentQuestionIndex = i;
            showQuestion(i);
        });
        container.appendChild(indicator);
    }
    
    document.querySelector('.progress-container').after(container);
    updateQuestionIndicators();
}

function updateQuestionIndicators() {
    const indicators = document.querySelectorAll('.question-indicator');
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('answered', userAnswers[index] !== null);
        indicator.classList.toggle('current', index === currentQuestionIndex);
    });
}

async function testAppScriptConnection() {
    showLoading();
    try {
        const result = await fetchFromAPI('testConnection');
        if (result && result.status === 'success') {
            return true;
        }
        return false;
    } catch (error) {
        console.error('שגיאה בבדיקת החיבור:', error);
        if (error.message.includes('Failed to fetch')) {
            showModal({
                title: 'שגיאת חיבור',
                message: 'לא ניתן להתחבר לשרת. אנא בדוק את החיבור לאינטרנט.',
                icon: 'wifi_off'
            });
        } else {
            showModal({
                title: 'שגיאת מערכת',
                message: 'אירעה שגיאה בהתחברות למערכת. אנא נסה שוב מאוחר יותר, אם הבעיה ממשיכה אנא צרו קשר.',
                icon: 'error'
            });
        }
        return false;
    } finally {
        hideLoading();
    }
}

// פונקציה לטעינת נתונים ברקע
async function preloadData() {
    try {
        // טעינה מקבילית של שאלות וסניפים
        const [questionsResponse, branchesResponse] = await Promise.all([
            fetchFromAPI('getQuestions'),
            fetchFromAPI('getBranches')
        ]);

        cache.questions = questionsResponse.data;
        cache.branches = branchesResponse.data;
        
        return true;
    } catch (error) {
        console.error('שגיאה בטעינת נתונים מקדימה:', error);
        return false;
    }
}

function updateBranchList(branches) {
    const input = document.getElementById('branch');
    const resultsContainer = input.parentElement.querySelector('.branch-results');

    // פונקציה לסינון והצגת תוצאות
    function filterBranches(searchText) {
        const filtered = branches.filter(branch => 
            branch.toLowerCase().includes(searchText.toLowerCase())
        );

        resultsContainer.innerHTML = filtered.map(branch => `
            <div class="branch-option">
                <span class="material-icons">location_on</span>
                <span class="branch-name">${branch}</span>
            </div>
        `).join('');
    }

    // מאזיני אירועים
    input.addEventListener('input', (e) => {
        const searchText = e.target.value.trim();
        if (searchText) {
            filterBranches(searchText);
        } else {
            resultsContainer.innerHTML = '';
        }
    });

    // בחירת סניף מהרשימה
    resultsContainer.addEventListener('click', (e) => {
        const option = e.target.closest('.branch-option');
        if (option) {
            const branchName = option.querySelector('.branch-name').textContent;
            input.value = branchName;
            resultsContainer.innerHTML = '';
            validateBranch(input);
        }
    });

    // סגירת הרשימה בלחיצה מחוץ לאזור החיפוש
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.branch-search-container')) {
            resultsContainer.innerHTML = '';
        }
    });
}

// וולידציה של הסניף
function validateBranch(input) {
    const branch = input.value;
    const errorElement = input.parentElement.querySelector('.error-message');
    
    if (!cache.branches) {
        return true; // נאפשר אם הנתונים עדיין לא נטענו
    }
    
    if (!cache.branches.includes(branch)) {
        input.classList.add('invalid');
        if (!errorElement) {
            const error = document.createElement('div');
            error.className = 'error-message';
            error.textContent = 'אנא בחר סניף מהרשימה';
            input.parentElement.appendChild(error);
        }
        return false;
    }
    
    input.classList.remove('invalid');
    if (errorElement) {
        errorElement.remove();
    }
    return true;
}

function initializeEventListeners() {
    // הגשת טופס ההרשמה
    document.getElementById('userDetailsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // בדיקת תקינות הסניף לפני שליחה
        const branchInput = document.getElementById('branch');
        if (!validateBranch(branchInput)) {
            return;
        }

        const formData = {
            userName: document.getElementById('userName').value,
            branch: document.getElementById('branch').value,
            phone: document.getElementById('phone').value
        };

        // שמירת הפרטים בזיכרון המקומי אם המשתמש ביקש
        if (document.getElementById('rememberMe').checked) {
            localStorage.setItem('userDetails', JSON.stringify(formData));
        } else {
            localStorage.removeItem('userDetails');
        }

        // מעבר למבחן
        startQuiz(formData);
    });

    // וולידציה למספר טלפון
    document.getElementById('phone').addEventListener('input', (e) => {
        const phone = e.target.value.replace(/\D/g, '');
        if (phone.length > 10) {
            e.target.value = phone.slice(0, 10);
        } else {
            e.target.value = phone;
        }
    });

    // וולידציה לשדה הסניף
    const branchInput = document.getElementById('branch');
    branchInput.addEventListener('input', () => {
        validateBranch(branchInput);
    });

    branchInput.addEventListener('blur', () => {
        validateBranch(branchInput);
    });

    // עדכון פונקציית prevQuestion לטיפול בביטול המבחן
    document.getElementById('prevQuestion').addEventListener('click', () => {
        if (currentQuestionIndex === 0) {
            // אם זו השאלה הראשונה, נראה חלון אישור לביטול המבחן
            // יצירת דיאלוג מותאם אישית לביטול המבחן
            const cancelDialogHTML = `
                <div id="cancel-dialog" class="custom-dialog">
                    <div class="dialog-content">
                        <div class="dialog-header">
                            <span class="material-icons warning-icon">warning</span>
                            <h2>ביטול מבחן</h2>
                        </div>
                        <p>האם אתה בטוח שברצונך לבטל את המבחן?</p>
                        <div class="dialog-buttons">
                            <button id="continue-quiz" class="secondary-button">לא, המשך מבחן</button>
                            <button id="cancel-quiz" class="primary-button">כן, בטל מבחן</button>
                        </div>
                    </div>
                </div>
            `;
            
            // הוספת הדיאלוג לדף
            document.body.insertAdjacentHTML('beforeend', cancelDialogHTML);
            
            // הוספת מאזיני אירועים לכפתורים
            document.getElementById('cancel-quiz').addEventListener('click', () => {
                document.getElementById('cancel-dialog').remove();
                // חזרה לטופס ההרשמה
                document.getElementById('quiz-section').classList.add('hidden');
                document.getElementById('registration-form').classList.remove('hidden');
                // איפוס נתוני המבחן
                currentQuestions = [];
                userAnswers = [];
                currentQuestionIndex = 0;
            });
            
            document.getElementById('continue-quiz').addEventListener('click', () => {
                document.getElementById('cancel-dialog').remove();
            });
            return;
        }

        saveCurrentAnswer();
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
    });
    
    document.getElementById('nextQuestion').addEventListener('click', () => {
        saveCurrentAnswer();
        if (currentQuestionIndex < currentQuestions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        }
    });
    
    document.getElementById('submitQuiz').addEventListener('click', submitQuiz);
}

function showQuestion(index) {
    const question = currentQuestions[index];
    const container = document.getElementById('question-container');
    
    // עדכון סרגל התקדמות
    const progressBar = document.querySelector('.progress-bar');
    const progress = ((index + 1) / currentQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    // עדכון מספרי השאלות
    document.getElementById('currentQuestion').textContent = index + 1;
    document.getElementById('totalQuestions').textContent = currentQuestions.length;

    // יצירת או עדכון עיגולי התקדמות
    const progressContainer = document.querySelector('.progress-container');
    
    // יצירת עיגולים רק אם הם לא קיימים
    if (!progressContainer.querySelector('.progress-dot')) {
        currentQuestions.forEach((_, i) => {
            const dot = document.createElement('div');
            dot.className = 'progress-dot';
            progressContainer.appendChild(dot);
        });
    }
    
    // עדכון מצב העיגולים
    const dots = progressContainer.querySelectorAll('.progress-dot');
    dots.forEach((dot, i) => {
        dot.className = 'progress-dot';
        if (i === index) {
            dot.classList.add('active');
        }
        if (i < index) {
            dot.classList.add('completed');
        }
    });
    
    // הוספת ההקדמה לפני השאלות הראשונות
    let introductionHTML = '';
    if (index === 0 && CONFIG.quiz.introductionText) {
        introductionHTML = `
            <div class="quiz-introduction">
                <h3>הקדמה חשובה לשאלות הבאות</h3>
                <p>${CONFIG.quiz.introductionText}</p>
            </div>
        `;
    }
    
    container.innerHTML = `
        ${introductionHTML}
        <div class="question">
            <h3>${question.question}</h3>
            ${question.type === 'אמריקאי' ? 
                `<div class="options">
                    ${question.options.map((option, i) => `
                        <label class="option">
                            <input type="radio" name="q${index}" value="${option}" 
                                ${userAnswers[index] === option ? 'checked' : ''}>
                            <span>${option}</span>
                        </label>
                    `).join('')}
                </div>` :
                `<textarea class="open-answer" rows="4">${userAnswers[index] || ''}</textarea>`
            }
        </div>
    `;
    
    // עדכון כפתורי הניווט
    const prevButton = document.getElementById('prevQuestion');
    const nextButton = document.getElementById('nextQuestion');
    const submitButton = document.getElementById('submitQuiz');
    
    prevButton.innerHTML = `<span class="material-icons">arrow_forward</span>שאלה קודמת`;
    nextButton.innerHTML = `שאלה הבאה<span class="material-icons">arrow_back</span>`;
    
    // הסתרת הכפתורים
    if (index === 0) {
        prevButton.style.display = 'block';
        prevButton.innerHTML = `<span class="material-icons">close</span>ביטול מבחן`;
        prevButton.classList.add('cancel-button');
    } else {
        prevButton.style.display = 'block';
        prevButton.classList.remove('cancel-button');
        prevButton.innerHTML = `<span class="material-icons">arrow_forward</span>שאלה קודמת`;
    }
    
    if (index === currentQuestions.length - 1) {
        nextButton.style.display = 'none';
    } else {
        nextButton.style.display = 'block';
    }
    
    submitButton.classList.toggle('hidden', index !== currentQuestions.length - 1);
}

function saveCurrentAnswer() {
    const question = currentQuestions[currentQuestionIndex];
    if (!question) return;

    if (question.type === 'אמריקאי') {
        const selected = document.querySelector(`input[name="q${currentQuestionIndex}"]:checked`);
        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        if (selected) {
            selected.closest('.option').classList.add('selected');
            userAnswers[currentQuestionIndex] = selected.value;
        }
    } else {
        const answer = document.querySelector('.open-answer').value.trim();
        userAnswers[currentQuestionIndex] = answer;
    }

    updateQuestionIndicators();
}

document.addEventListener('DOMContentLoaded', async () => {
    initDarkMode();

    // טיפול בהודעה לפני המבחן
    if (CONFIG.quiz.showAnnouncement) {
        const announcement = document.getElementById('quiz-announcement');
        const closeBtn = document.querySelector('.close-announcement');
        const startQuizBtn = document.querySelector('.start-quiz-btn');
        const announcementText = document.getElementById('announcement-text');
        
        // עדכון תוכן ההודעה מהקונפיגורציה
        if (CONFIG.quiz.announcementText) {
            announcementText.textContent = CONFIG.quiz.announcementText;
        }
        
        // סגירת ההודעה והתחלת המבחן
        function closeAnnouncement() {
            announcement.style.opacity = '0';
            setTimeout(() => {
                announcement.style.display = 'none';
            }, 300);
        }
        
        closeBtn.addEventListener('click', closeAnnouncement);
        startQuizBtn.addEventListener('click', closeAnnouncement);
    } else {
        // אם לא צריך להציג הודעה, הסתר אותה
        document.getElementById('quiz-announcement').style.display = 'none';
    }

    // נעילת כפתור התחלת המבחן
    const submitButton = document.querySelector('#userDetailsForm button[type="submit"]');
    submitButton.disabled = true;
    submitButton.classList.add('loading-button');
    submitButton.innerHTML = '<div class="spinner"></div>אנא המתן...';

    // בדיקת חיבור ראשונית
    const isConnected = await testAppScriptConnection();
    if (!isConnected) return;

    try {
        // התחלת טעינת נתונים ברקע
        const preloadPromise = preloadData();

        // טיפול בזכירת פרטי המשתמש
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        if (userDetails.userName) {
            document.getElementById('userName').value = userDetails.userName;
            document.getElementById('branch').value = userDetails.branch;
            document.getElementById('phone').value = userDetails.phone;
            document.getElementById('rememberMe').checked = true;
        }

        // המתנה לסיום טעינת הנתונים
        await preloadPromise;
        
        // שחרור כפתור התחלת המבחן
        submitButton.disabled = false;
        submitButton.classList.remove('loading-button');
        submitButton.innerHTML = 'התחל מבחן';

        // עדכון רשימת הסניפים בממשק
        if (cache.branches) {
            updateBranchList(cache.branches);
        }

    } catch (error) {
        console.error('שגיאה באתחול:', error);
        submitButton.disabled = true;
        submitButton.innerHTML = 'אירעה שגיאה';
        showModal({
            title: 'שגיאה',
            message: 'אירעה שגיאה בטעינת הנתונים. אנא רענן את הדף.',
            icon: 'error'
        });
    }

    // הוספת מאזיני אירועים
    initializeEventListeners();
});

// טעינת שאלות המבחן
async function loadQuestions() {
    try {
        showLoading();
        const submitButton = document.querySelector('#userDetailsForm button[type="submit"]');
        submitButton.disabled = true;
        submitButton.classList.add('loading-button');
        submitButton.innerHTML = '<div class="spinner"></div>אנא המתן...';

        const response = await fetchFromAPI('getQuestions');
        cache.questions = response.questions;
        
        hideLoading();
        submitButton.disabled = false;
        submitButton.classList.remove('loading-button');
        submitButton.innerHTML = 'התחל מבחן';
        
        return response.questions;
    } catch (error) {
        console.error('Error loading questions:', error);
        showModal({
            title: 'שגיאה',
            message: 'אירעה שגיאה בטעינת השאלות. אנא נסה שוב מאוחר יותר.',
            icon: 'error'
        });
        const submitButton = document.querySelector('#userDetailsForm button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = 'אירעה שגיאה';
    }
}

// עדכון סרגל התקדמות
function updateProgress() {
    // מחיקת עיגולי התקדמות קיימים
    const existingDots = document.querySelectorAll('.progress-dot');
    existingDots.forEach(dot => dot.remove());

    const progressBar = document.querySelector('.progress-bar');
    const currentQuestionSpan = document.getElementById('currentQuestion');
    const totalQuestionsSpan = document.getElementById('totalQuestions');
    
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    currentQuestionSpan.textContent = currentQuestionIndex + 1;
    totalQuestionsSpan.textContent = currentQuestions.length;
    
    // יצירת עיגולי התקדמות חדשים
    const progressContainer = document.querySelector('.progress-container');
    currentQuestions.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `progress-dot ${index === currentQuestionIndex ? 'active' : ''}`;
        if (index < currentQuestionIndex) {
            dot.classList.add('completed');
        }
        progressContainer.appendChild(dot);
    });
}

// מעבר לשאלה הבאה
function showNextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        showCurrentQuestion();
        updateProgress();
    }
}

// מעבר לשאלה הקודמת
function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showCurrentQuestion();
        updateProgress();
    }
}

// איפוס המבחן
function resetQuiz() {
    currentQuestionIndex = 0;
    userAnswers = {};
    const progressContainer = document.querySelector('.progress-container');
    progressContainer.innerHTML = '<div class="progress-bar"></div>' +
        '<span class="progress-text">שאלה <span id="currentQuestion">1</span> מתוך <span id="totalQuestions">10</span></span>';
    showCurrentQuestion();
    updateProgress();
}

// הוספת סגנונות לדיאלוגים המותאמים אישית
const customDialogStyles = `
<style id="custom-dialog-styles">
    .custom-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .dialog-content {
        background-color: white;
        border-radius: 8px;
        padding: 30px;
        max-width: 90%;
        width: 500px;
        text-align: center;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .dialog-header {
        margin-bottom: 20px;
    }
    
    .warning-icon {
        font-size: 50px;
        color: #FFC107;
        margin-bottom: 10px;
    }
    
    .dialog-content h2 {
        color: #333;
        margin: 0 0 10px 0;
        font-size: 22px;
    }
    
    .dialog-content p {
        color: #666;
        margin-bottom: 25px;
        line-height: 1.6;
        font-size: 16px;
    }
    
    .dialog-buttons {
        display: flex;
        justify-content: center;
        gap: 15px;
    }
    
    .primary-button {
        background-color: #1abc9c;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    
    .secondary-button {
        background-color: #f1f1f1;
        color: #333;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    
    .primary-button:hover {
        background-color: #16a085;
    }
    
    .secondary-button:hover {
        background-color: #e0e0e0;
    }
</style>
`;

// הוספת הסגנונות לדף
document.head.insertAdjacentHTML('beforeend', customDialogStyles); 