// פונקציות משותפות כמו showModal, initDarkMode וכו' 

const API_URL = 'https://script.google.com/macros/s/AKfycbzukUmXo8t_pL4QzFnafDBf1rzOEQaTZMS_FU0OF1sTFac4d_5HVsf3ZjJOlKlWACBh7g/exec';

// קאש לנתונים
const cache = {
    questions: null,
    branches: null
};

// הגדרת זמינות המבחן
const QUIZ_CONFIG = {
    // isAvailable: false, // האם המבחן זמין כרגע
    isAvailable: true, // האם המבחן זמין כרגע
    nextQuizDate: '2024-02-25'  // תאריך המבחן הבא
};

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

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
    
    if (method === 'POST' && data) {
        url.searchParams.append('data', JSON.stringify(data));
    }
    
    try {
        const response = await fetch(url.toString());
        const text = await response.text();
        
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
    
    closeButton.addEventListener('click', () => {
        closeModal(onCancel);
    });
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal(onCancel);
        }
    });
    
    document.addEventListener('keydown', function closeOnEsc(e) {
        if (e.key === 'Escape') {
            document.removeEventListener('keydown', closeOnEsc);
            closeModal(onCancel);
        }
    });
}

// טיפול במצב לילה
function initDarkMode() {
    return; // מונע את הפעלת מצב לילה
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

// מעקב אחר גלילת העמוד
window.addEventListener('scroll', () => {
    document.body.classList.toggle('scrolled', window.scrollY > 50);
});

// פונקציה לניתוב לדף המתאים
function handleQuizNavigation(event) {
    if (event) {
        event.preventDefault();
    }
    
    if (QUIZ_CONFIG.isAvailable) {
        window.location.href = 'quiz.html';
    } else {
        window.location.href = 'quiz-unavailable.html';
    }
}

function showContactInfo() {
    showModal({
        title: 'y.d. systems',
        message: `
            <div class="contact-item">
                <span class="material-icons">phone</span>
                <a href="tel:0583730000" dir="ltr">058-373-0000</a>
            </div>
            <div class="contact-item">
                <span class="material-icons">forum</span>
                <a href="https://wa.me/972583730000" target="_blank" dir="ltr">058-373-0000</a>
            </div>
            <div class="contact-item">
                <span class="material-icons">email</span>
                <a href="mailto:yairdahn@gmail.com">yairdahn@gmail.com</a>
            </div>
        `,
        confirmText: 'סגור',
        icon: 'contact_support'
    });
} 