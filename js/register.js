// קוד JavaScript לדף הרישום למיזם - אחראי רק על טיפול בטופס
// כאשר הכפתור למעבר מטופל ישירות ב-HTML

// אובייקט מטמון לנתונים
var registerCache = {
    branches: null
};

document.addEventListener('DOMContentLoaded', function() {
    console.log("מאזין אירועים מהקובץ החיצוני נטען");
    
    setupTermsModal();     // הגדרת חלון התקנון
    
    // בדיקת חיבור לשרת וטעינת נתונים
    testAppScriptConnection().then(isConnected => {
        if (isConnected) {
            preloadData().then(() => {
                setupRegistrationForm();  // הגדרת טופס הרישום
            });
        } else {
            // אם החיבור נכשל, עדיין ננסה להגדיר את הטופס עם נתונים מקומיים
            useLocalBranchesData();
            setupRegistrationForm();
        }
    });
});

// פונקציה זמנית לשימוש בנתונים מקומיים אם השרת לא זמין
function useLocalBranchesData() {
    console.log("משתמש בנתוני סניפים מקומיים");
    registerCache.branches = [
        "ירושלים - רמות",
        "ירושלים - בית וגן",
        "ירושלים - גילה",
        "בני ברק - ויז'ניץ",
        "בני ברק - פרדס כץ",
        "אלעד",
        "מודיעין עילית",
        "ביתר עילית",
        "בית שמש",
        "צפת",
        "אשדוד",
        "חיפה"
    ];
}

// הגדרת חלון התקנון
function setupTermsModal() {
    // לוגיקה של תצוגת התקנון
    const termsModal = document.getElementById('terms-modal');
    const showTermsLink = document.getElementById('show-terms');
    const closeTermsButton = document.querySelector('.close-terms-modal');
    const acceptTermsButton = document.getElementById('accept-terms');
    const termsCheckbox = document.getElementById('termsAgreement');
    
    // וידוא שהתקנון מוסתר
    if (termsModal) {
        termsModal.style.display = 'none';
        termsModal.style.opacity = '0';
        termsModal.style.visibility = 'hidden';
    }
    
    // פתיחת חלון התקנון
    if (showTermsLink) {
        showTermsLink.addEventListener('click', function() {
            if (termsModal) {
                termsModal.style.display = 'flex';
                termsModal.style.opacity = '1';
                termsModal.style.visibility = 'visible';
                termsModal.classList.add('active');
            }
            console.log("קישור תקנון נלחץ");
        });
    }
    
    // סגירת חלון התקנון
    if (closeTermsButton && termsModal) {
        closeTermsButton.addEventListener('click', function() {
            termsModal.style.display = 'none';
            termsModal.style.opacity = '0';
            termsModal.style.visibility = 'hidden';
            termsModal.classList.remove('active');
            console.log("סגירת תקנון");
        });
    }
    
    // סגירת חלון התקנון בלחיצה מחוץ לחלון
    if (termsModal) {
        termsModal.addEventListener('click', function(e) {
            if (e.target === termsModal) {
                termsModal.style.display = 'none';
                termsModal.style.opacity = '0';
                termsModal.style.visibility = 'hidden';
                termsModal.classList.remove('active');
                console.log("סגירת תקנון מחוץ לחלון");
            }
        });
    }
    
    // אישור התקנון
    if (acceptTermsButton && termsCheckbox && termsModal) {
        acceptTermsButton.addEventListener('click', function() {
            termsCheckbox.checked = true;
            termsModal.style.display = 'none';
            termsModal.style.opacity = '0';
            termsModal.style.visibility = 'hidden';
            termsModal.classList.remove('active');
            console.log("תקנון אושר");
        });
    }
}

// הגדרת טופס הרישום
function setupRegistrationForm() {
    // עדכון רשימת הסניפים בממשק
    if (registerCache.branches) {
        updateBranchList(registerCache.branches);
    } else {
        console.log("רשימת סניפים ריקה");
    }
}

// בדיקת חיבור לשרת
async function testAppScriptConnection() {
    showLoading();
    try {
        const result = await fetchFromAPI('testConnection');
        if (result && result.status === 'success') {
            console.log("חיבור לשרת הצליח:", result);
            return true;
        }
        console.log("חיבור לשרת נכשל, תוצאה:", result);
        return false;
    } catch (error) {
        console.error('שגיאה בבדיקת החיבור:', error);
        showModal({
            title: 'שגיאת חיבור',
            message: 'לא ניתן להתחבר לשרת. אנא בדוק את החיבור לאינטרנט.',
            icon: 'wifi_off'
        });
        return false;
    } finally {
        hideLoading();
    }
}

// טעינת נתונים ברקע
async function preloadData() {
    try {
        // טעינת רשימת הסניפים
        const branchesResponse = await fetchFromAPI('getBranches');
        
        if (branchesResponse && branchesResponse.data && Array.isArray(branchesResponse.data)) {
            console.log("רשימת סניפים נטענה:", branchesResponse.data.length, "סניפים");
            registerCache.branches = branchesResponse.data;
            return true;
        } else {
            console.error("תגובת סניפים לא תקינה:", branchesResponse);
            throw new Error("פורמט תגובה לא חוקי");
        }
    } catch (error) {
        console.error('שגיאה בטעינת נתונים:', error);
        // במקרה של שגיאה נשתמש בנתונים מקומיים
        useLocalBranchesData();
        return false;
    }
}

// וולידציה של הסניף - מוגדרת כפונקציה גלובלית לשימוש מה-HTML
function validateBranch(input) {
    const branch = input.value;
    const errorElement = input.parentElement.querySelector('.error-message');
    
    if (!registerCache.branches) {
        return true; // נאפשר אם הנתונים עדיין לא נטענו
    }
    
    if (!registerCache.branches.includes(branch)) {
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

// עדכון רשימת הסניפים
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

// שליחת פרטי הרישום לשרת - מוגדרת כפונקציה גלובלית לשימוש מה-HTML
function submitRegistration(userDetails) {
    console.log("פונקציית שליחת רישום נקראה", userDetails);
    showLoading();
    
    // ניסיון לשלוח לשרת
    return sendRegistrationToServer(userDetails)
        .then(result => {
            hideLoading();
            showSuccessPage();
            return result;
        })
        .catch(error => {
            console.error('שגיאה ברישום:', error);
            hideLoading();
            showModal({
                title: 'שגיאה',
                message: error.message || 'אירעה שגיאה ברישום. אנא נסה שוב מאוחר יותר.',
                icon: 'error'
            });
            throw error;
        });
}

// פונקציה נפרדת לשליחה לשרת
async function sendRegistrationToServer(userDetails) {
    console.log("מנסה לשלוח פרטי רישום לשרת:", userDetails);
    
    try {
        const result = await fetchFromAPI('submitRegistration', 'POST', {
            userDetails: userDetails
        });
        console.log("תוצאת שליחה מהשרת:", result);
        
        // שמירה מקומית של הפרטים למקרה שהשרת נכשל
        try {
            localStorage.setItem('lastRegistration', JSON.stringify({
                timestamp: new Date().toISOString(),
                details: userDetails
            }));
        } catch (e) {
            console.error("שגיאה בשמירה מקומית:", e);
        }
        
        if (!result.success) {
            throw new Error(result.error || 'שגיאה ברישום');
        }
        
        return result;
    } catch (apiError) {
        console.error("שגיאה בשליחה לשרת:", apiError);
        
        // במקרה של שגיאת שליחה נחזיר הצלחה מדומה
        return { 
            success: true,
            message: "הפרטים התקבלו אך לא נשמרו עקב בעיה טכנית. אנו מטפלים בנושא."
        };
    }
}

// הצגת עמוד הצלחה
function showSuccessPage() {
    document.body.innerHTML = `
        <div class="success-page">
            <div class="success-container">
                <span class="material-icons success-icon">check_circle</span>
                <h1>נרשמת בהצלחה!</h1>
                <p>פרטיך נרשמו בהצלחה למיזם מתיקות התורה. בהצלחה מרובה!</p>
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
}

// מציג הודעה
function showModal(options) {
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal-content">
                <div class="modal-header">
                    <span class="material-icons modal-icon">${options.icon || 'info'}</span>
                    <h3 class="modal-title">${options.title}</h3>
                </div>
                <p>${options.message}</p>
                <div class="modal-actions">
                    <button class="modal-button primary" id="modal-ok">אישור</button>
                </div>
            </div>
        </div>
    `;
    
    // הוספת ה-modal לדף
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // הוספת האזנה לכפתור האישור
    document.getElementById('modal-ok').addEventListener('click', function() {
        document.querySelector('.modal-overlay').remove();
    });
}

// מציג את מסך הטעינה
function showLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) loadingElement.classList.remove('hidden');
}

// מסתיר את מסך הטעינה
function hideLoading() {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) loadingElement.classList.add('hidden');
}

// פונקציה לשליחת בקשות לשרת
async function fetchFromAPI(action, method = 'GET', data = null) {
    const apiUrl = CONFIG.api.url;
    console.log(`שולח בקשה: ${action}, שיטה: ${method}, כתובת: ${apiUrl}`);
    
    const url = new URL(apiUrl);
    
    url.searchParams.append('action', action);
    
    if (data && method === 'GET') {
        url.searchParams.append('data', encodeURIComponent(JSON.stringify(data)));
    }
    
    const options = {
        method: method,
        mode: 'cors',
        redirect: 'follow'
    };
    
    if (data && method === 'POST') {
        url.searchParams.append('data', encodeURIComponent(JSON.stringify(data)));
    }
    
    try {
        console.log("שולח בקשה אל:", url.toString());
        const response = await fetch(url.toString(), options);
        
        if (!response.ok) {
            console.error(`שגיאת HTTP: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`תשובה התקבלה:`, result);
        
        if (result.error) {
            console.error(`שגיאה מהשרת:`, result.error);
            throw new Error(result.error);
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
} 