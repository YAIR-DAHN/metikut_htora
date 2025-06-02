const API_URL = 'https://script.google.com/macros/s/AKfycbwpOz3V8V7k14t-VxjnDtKIrQpz2uZVCCZz727KP1RjK7Zh9h9XgfJa2xkpe8P4Zt9J4g/exec';

// קאש לנתונים
const cache = {
    questions: null,
    branches: null
};

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

// מצב טעינה מינימלי לאלמנטים ספציפיים
function showElementLoading(element) {
    const loader = document.createElement('div');
    loader.className = 'element-loader';
    element.appendChild(loader);
}

function hideElementLoading(element) {
    const loader = element.querySelector('.element-loader');
    if (loader) {
        loader.remove();
    }
}

async function fetchFromAPI(action, method = 'GET', data = null) {
    const url = new URL(API_URL);
    url.searchParams.append('action', action);
    
    // עבור GET עם data, נוסיף את הנתונים כפרמטרים בURL
    if (data) {
        url.searchParams.append('data', encodeURIComponent(JSON.stringify(data)));
    }
    
    try {
        const response = await fetch(url.toString(), {
            method: 'GET'  // תמיד נשתמש ב-GET
        });
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        const text = await response.text();
        console.log('Response text:', text);
        
        try {
            const jsonResponse = JSON.parse(text);
            if (jsonResponse.error) {
                throw new Error(jsonResponse.error);
            }
            return jsonResponse;
        } catch (e) {
            console.error('Failed to parse response:', text);
            throw new Error('Invalid JSON response');
        }
    } catch (error) {
        console.error('Error fetching from API:', error);
        throw error;
    }
}

async function testAppScriptConnection() {
    showLoading();
    try {
        const result = await fetchFromAPI('testConnection');
        console.log('תוצאת בדיקת החיבור:', result);
        if (result && result.status === 'success') {
            console.log('גיליונות קיימים:', result.sheets);
            return true;
        }
        console.error('שגיאה:', result.message);
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
                message: 'אירעה שגיאה בהתחברות למערכת. אנא נסה שוב מאוחר יותר.',
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

// טיפול במצב לילה
function initDarkMode() {
    const themeToggle = document.querySelector('.theme-toggle');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.querySelector('.material-icons').textContent = 'light_mode';
    }

    themeToggle.addEventListener('click', () => {
        const isDark = document.body.hasAttribute('data-theme');
        const icon = themeToggle.querySelector('.material-icons');

        if (!isDark) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            icon.textContent = 'light_mode';
        } else {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            icon.textContent = 'dark_mode';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
});

// משתנים גלובליים למבחן
let currentQuestions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let currentUserDetails = null; // נוסיף משתנה גלובלי לשמירת פרטי המשתמש

function createQuestionIndicators() {
    const container = document.createElement('div');
    container.className = 'questions-status';
    
    for (let i = 0; i < currentQuestions.length; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'question-indicator';
        indicator.addEventListener('click', () => {
            saveCurrentAnswer();
            const direction = i > currentQuestionIndex ? 'next' : 'prev';
            currentQuestionIndex = i;
            showQuestion(i, direction);
        });
        container.appendChild(indicator);
    }
    
    document.querySelector('.progress-container').after(container);
}

function updateQuestionIndicators() {
    const indicators = document.querySelectorAll('.question-indicator');
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('answered', userAnswers[index] !== null);
        indicator.classList.toggle('current', index === currentQuestionIndex);
    });
}

async function startQuiz(userDetails) {
    if (!userDetails || !userDetails.userName || !userDetails.branch || !userDetails.phone) {
        showModal({
            title: 'שגיאת טופס',
            message: 'אנא מלא את כל פרטי המשתמש',
            icon: 'warning'
        });
        return;
    }

    currentUserDetails = userDetails;

    try {
        // שימוש בנתונים מהקאש אם קיימים
        if (!cache.questions) {
            const response = await fetchFromAPI('getQuestions');
            cache.questions = response.data;
        }
        currentQuestions = cache.questions;
        userAnswers = new Array(currentQuestions.length).fill(null);
        
        document.getElementById('registration-form').classList.add('hidden');
        document.getElementById('quiz-section').classList.remove('hidden');
        
        document.getElementById('totalQuestions').textContent = currentQuestions.length;
        createProgressDots();
        showQuestion(0);
        
        updateProgressBar();
    } catch (error) {
        console.error('שגיאה בטעינת המבחן:', error);
        showModal({
            title: 'שגיאה בטעינת המבחן',
            message: 'אירעה שגיאה בטעינת המבחן. אנא נסה שוב.',
            icon: 'error'
        });
    }
}

function showQuestion(index) {
    const question = currentQuestions[index];
    const container = document.getElementById('question-container');
    
    container.innerHTML = `
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
        prevButton.style.display = 'none';
    } else {
        prevButton.style.display = 'block';
    }
    
    if (index === currentQuestions.length - 1) {
        nextButton.style.display = 'none';
    } else {
        nextButton.style.display = 'block';
    }
    
    submitButton.classList.toggle('hidden', index !== currentQuestions.length - 1);
    
    document.getElementById('currentQuestion').textContent = index + 1;
    updateProgressBar();
}

function updateProgressBar() {
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    document.querySelector('.progress-bar').style.width = `${progress}%`;
    updateProgressDots();
}

function createProgressDots() {
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'progress-dots';
    
    for (let i = 0; i < currentQuestions.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'progress-dot';
        dotsContainer.appendChild(dot);
    }
    
    document.querySelector('.progress-container').appendChild(dotsContainer);
}

function updateProgressDots() {
    const dots = document.querySelectorAll('.progress-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('answered', userAnswers[index] !== null);
    });
}

function saveCurrentAnswer() {
    const question = currentQuestions[currentQuestionIndex];
    if (question.type === 'אמריקאי') {
        const selected = document.querySelector(`input[name="q${currentQuestionIndex}"]:checked`);
        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        if (selected) {
            selected.closest('.option').classList.add('selected');
        }
        userAnswers[currentQuestionIndex] = selected ? selected.value : null;
    } else {
        const answer = document.querySelector('.open-answer').value.trim();
        userAnswers[currentQuestionIndex] = answer || null;
    }

    updateProgressBar();
}

async function submitQuiz() {
    saveCurrentAnswer();
    
    if (userAnswers.includes(null)) {
        showModal({
            title: 'אזהרה',
            message: 'יש שאלות שלא ענית עליהן. האם אתה בטוח שברצונך להגיש את המבחן?',
            icon: 'warning',
            confirmText: 'כן, הגש מבחן',
            cancelText: 'לא, חזור למבחן',
            onConfirm: async () => {
                await submitQuizToServer();
            }
        });
        return;
    }
    
    await submitQuizToServer();
}

async function submitQuizToServer() {
    showLoading();
    try {
        if (!currentUserDetails) {
            showModal({
                title: 'שגיאה',
                message: 'לא נמצאו פרטי משתמש',
                icon: 'error'
            });
            return;
        }

        const result = await fetchFromAPI('submitQuiz', 'GET', {
            userDetails: currentUserDetails,
            answers: userAnswers
        });
        
        if (result.success) {
            showModal({
                title: 'המבחן הוגש בהצלחה!',
                message: 'התשובות נקלטו בהצלחה! הודעות ישלחו לזוכים',
                icon: 'check_circle',
                onConfirm: () => {
                    window.location.reload();
                }
            });
        } else {
            throw new Error('שגיאה בהגשת המבחן');
        }
    } catch (error) {
        console.error('שגיאה בהגשת המבחן:', error);
        showModal({
            title: 'שגיאה בהגשת המבחן',
            message: error.message || 'אירעה שגיאה בהגשת המבחן. אנא נסה שוב.',
            icon: 'error'
        });
    } finally {
        hideLoading();
    }
}

// טעינת רשימת הסניפים
async function loadBranches() {
    const branchInput = document.getElementById('branch');
    const datalist = document.getElementById('branchList');
    showElementLoading(branchInput.parentElement);

    try {
        const response = await fetchFromAPI('getBranches');
        cache.branches = response.data;
        updateBranchList(cache.branches);
    } catch (error) {
        console.error('שגיאה בטעינת רשימת הסניפים:', error);
    } finally {
        hideElementLoading(branchInput.parentElement);
    }
}

function updateBranchList(branches) {
    const datalist = document.getElementById('branchList');
    datalist.innerHTML = ''; // ניקוי הרשימה הקיימת
    branches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch;
        datalist.appendChild(option);
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
        if (!errorElement) {
            const error = document.createElement('div');
            error.className = 'error-message';
            error.textContent = 'אנא בחר סניף מהרשימה';
            input.parentElement.appendChild(error);
        }
        return false;
    }
    
    if (errorElement) {
        errorElement.remove();
    }
    return true;
}

function showModal(options) {
    const { title, message, icon = 'info', confirmText = 'אישור', cancelText = 'ביטול', onConfirm, onCancel } = options;
    
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal">
                <button class="modal-close">
                    <span class="material-icons">close</span>
                </button>
                <div class="modal-header">
                    <span class="material-icons modal-icon">${icon}</span>
                    <h3 class="modal-title">${title}</h3>
                </div>
                <div class="modal-content">${message}</div>
                <div class="modal-actions">
                    ${onCancel ? `<button class="modal-button secondary">${cancelText}</button>` : ''}
                    <button class="modal-button primary">${confirmText}</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modalOverlay = document.querySelector('.modal-overlay');
    const modal = modalOverlay.querySelector('.modal');
    
    setTimeout(() => modalOverlay.classList.add('active'), 10);
    
    const confirmButton = modalOverlay.querySelector('.modal-button.primary');
    const cancelButton = modalOverlay.querySelector('.modal-button.secondary');
    const closeButton = modalOverlay.querySelector('.modal-close');
    
    // פונקציה לסגירת המודל
    const closeModal = (callback) => {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            modalOverlay.remove();
            if (callback) callback();
        }, 300);
    };
    
    confirmButton.addEventListener('click', () => {
        closeModal(onConfirm);
    });
    
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            closeModal(onCancel);
        });
    }
    
    // סגירה בלחיצה על הX
    closeButton.addEventListener('click', () => {
        closeModal(onCancel);
    });
    
    // סגירה בלחיצה מחוץ למודל
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal(onCancel);
        }
    });
    
    // סגירה בלחיצה על ESC
    document.addEventListener('keydown', function closeOnEsc(e) {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', closeOnEsc);
            closeModal(onCancel);
        }
    });
}

// מעקב אחר גלילת העמוד
window.addEventListener('scroll', () => {
    document.body.classList.toggle('scrolled', window.scrollY > 50);
});

function expandViewer() {
    const iframe = document.getElementById('bookFrame');
    if (iframe) {
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
            iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) {
            iframe.msRequestFullscreen();
        }
    }
}

function closeViewer() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
} 