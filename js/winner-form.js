// הגדרת API URL
const API_BASE_URL = CONFIG.api.url;

// טעינת רשימת הסניפים
document.addEventListener('DOMContentLoaded', function() {
    loadBranches();
    initializeForm();
});

async function loadBranches() {
    try {
        const response = await fetchFromAPI('getBranches');
        
        if (response.data) {
            const branchSelect = document.getElementById('branch');
            branchSelect.innerHTML = '<option value="">בחר סניף</option>';
            
            response.data.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch;
                option.textContent = branch;
                branchSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('שגיאה בטעינת סניפים:', error);
        showError('שגיאה בטעינת רשימת הסניפים');
    }
}

function initializeForm() {
    const form = document.getElementById('winnerForm');
    const idInput = document.getElementById('idNumber');
    const phoneInput = document.getElementById('phone');
    const parentPhoneInput = document.getElementById('parentPhone');

    // תיקוף תעודת זהות
    idInput.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9);
    });

    // תיקוף טלפון
    phoneInput.addEventListener('input', function() {
        let value = this.value.replace(/[^0-9]/g, '');
        if (value.length > 3 && value.length <= 6) {
            value = value.replace(/(\d{3})(\d+)/, '$1-$2');
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
        }
        this.value = value;
    });

    // תיקוף טלפון הורה
    parentPhoneInput.addEventListener('input', function() {
        let value = this.value.replace(/[^0-9]/g, '');
        if (value.length > 3 && value.length <= 6) {
            value = value.replace(/(\d{3})(\d+)/, '$1-$2');
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
        }
        this.value = value;
    });

    // טיפול בשליחת הטופס
    form.addEventListener('submit', handleSubmit);
}

async function handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    // תיקוף נתונים
    if (!validateForm(data)) {
        return;
    }

    showLoading(true);
    
    try {
        const response = await fetchFromAPI('submitWinnerForm', 'GET', {
            winnerDetails: data
        });
        
        if (response.success) {
            showSuccess();
            event.target.reset();
        } else {
            showError(response.error || 'שגיאה בשליחת הטופס');
        }
    } catch (error) {
        console.error('שגיאה בשליחת טופס זכייה:', error);
        showError('שגיאה בהתחברות לשרת. אנא נסה שוב.');
    } finally {
        showLoading(false);
    }
}

function validateForm(data) {
    // בדיקות תיקוף בסיסיות
    if (data.idNumber && !/^\d{9}$/.test(data.idNumber)) {
        showError('מספר תעודת הזהות חייב להכיל 9 ספרות');
        return false;
    }
    
    if (data.phone && !/^0\d{1,2}-?\d{3}-?\d{4}$/.test(data.phone.replace(/-/g, ''))) {
        showError('מספר הטלפון אינו תקין');
        return false;
    }
    
    return true;
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.classList.toggle('hidden', !show);
}

function showSuccess() {
    const success = document.getElementById('successMessage');
    const error = document.getElementById('errorMessage');
    const form = document.getElementById('winnerForm');
    
    success.classList.remove('hidden');
    error.classList.add('hidden');
    form.classList.add('hidden');
    
    // גלילה לתוצאה
    success.scrollIntoView({ behavior: 'smooth' });
}

function showError(message) {
    const error = document.getElementById('errorMessage');
    const success = document.getElementById('successMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    error.classList.remove('hidden');
    success.classList.add('hidden');
    
    // גלילה לשגיאה
    error.scrollIntoView({ behavior: 'smooth' });
    
    // הסתרת השגיאה אחרי 5 שניות
    setTimeout(() => {
        error.classList.add('hidden');
    }, 5000);
}

async function fetchFromAPI(action, method = 'GET', data = null) {
    const url = new URL(API_BASE_URL);
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

// פונקציה להצגת פרטי יצירת האתר
function showContactInfo() {
    alert('נבנה על ידי Y.D. Systems\nלפרטים נוספים: ydcodesystems@gmail.com');
} 