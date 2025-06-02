// פונקציות משותפות כמו showModal, initDarkMode וכו' 

const API_URL = 'https://script.google.com/macros/s/AKfycbwpOz3V8V7k14t-VxjnDtKIrQpz2uZVCCZz727KP1RjK7Zh9h9XgfJa2xkpe8P4Zt9J4g/exec';

// קאש לנתונים
const cache = {
    questions: null,
    branches: null
};

// הגדרת זמינות המבחן
const QUIZ_CONFIG = {
    // isAvailable: false, // האם המבחן זמין כרגע
    isAvailable: true, // האם המבחן זמין כרגע
    nextQuizDate: '2024-05-26'  // תאריך המבחן הבא
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
    
    // תמיד נשתמש ב-GET ונעביר נתונים כפרמטרים בURL
    if (data) {
        url.searchParams.append('data', encodeURIComponent(JSON.stringify(data)));
    }
    
    try {
        const response = await fetch(url.toString(), {
            method: 'GET'
        });
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
    
    // הסרת מודלים קודמים אם קיימים
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
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
    
    // בדיקה אם יש סגנונות למודל
    if (!document.querySelector('style#modal-styles')) {
        const modalStyles = `
            <style id="modal-styles">
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.3s, visibility 0.3s;
                }
                
                .modal-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }
                
                .modal {
                    background-color: white;
                    border-radius: 8px;
                    max-width: 90%;
                    width: 500px;
                    padding: 20px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    position: relative;
                }
                
                .modal-close {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 24px;
                    color: #999;
                }
                
                .modal-header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 15px;
                }
                
                .modal-icon {
                    margin-left: 10px;
                    color: #1abc9c;
                    font-size: 24px;
                }
                
                .modal-title {
                    margin: 0;
                    font-size: 20px;
                }
                
                .modal-content {
                    margin-bottom: 20px;
                    line-height: 1.5;
                }
                
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                }
                
                .modal-button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-right: 10px;
                }
                
                .modal-button:last-child {
                    margin-right: 0;
                }
                
                .modal-button.primary {
                    background-color: #1abc9c;
                    color: white;
                }
                
                .modal-button.secondary {
                    background-color: #f1f1f1;
                    color: #333;
                }
                
                .modal-button.primary:hover {
                    background-color: #16a085;
                }
                
                .modal-button.secondary:hover {
                    background-color: #e0e0e0;
                }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', modalStyles);
    }
    
    // הוספת הקלאס active מיד
    modalOverlay.classList.add('active');
    
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

// פונקציות להצגת מודאל תמונה
function openImageModal(src) {
    // יצירת המודאל אם לא קיים
    let modal = document.querySelector('.image-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <button class="close-modal" onclick="closeImageModal()">
                <span class="material-icons">close</span>
            </button>
            <img class="modal-image" src="" alt="תמונה מוגדלת">
        `;
        document.body.appendChild(modal);

        // סגירת המודאל בלחיצה על הרקע
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeImageModal();
            }
        });

        // סגירת המודאל בלחיצה על ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeImageModal();
            }
        });
    }

    // עדכון התמונה והצגת המודאל
    const modalImage = modal.querySelector('.modal-image');
    modalImage.src = src;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    const modal = document.querySelector('.image-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// הוספת מאזיני לחיצה לכרטיסי המודעות
document.addEventListener('DOMContentLoaded', () => {
    const adCards = document.querySelectorAll('.ad-card');
    adCards.forEach(card => {
        card.addEventListener('click', () => {
            const image = card.querySelector('.ad-image');
            if (image) {
                openImageModal(image.src);
            }
        });
    });
}); 