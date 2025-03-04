document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayWinners();
    
    // הוספת מאזין לחיצה על הרקע של המודל
    const modal = document.getElementById('imageModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeImageModal();
        }
    });
    
    // הוספת מאזין לחיצה על כפתור הסגירה
    const closeButton = document.querySelector('.close-modal');
    closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        closeImageModal();
    });
    
    // סגירת המודל בלחיצה על Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });
});

let currentWinners = [];
let currentFilter = null;

function getUniqueCategories(winners) {
    return [...new Set(winners.map(winner => winner.category))];
}

function createFilterButtons(categories) {
    const filterContainer = document.getElementById('filter-buttons');
    filterContainer.innerHTML = '';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.textContent = category;
        button.onclick = () => filterWinners(category);
        filterContainer.appendChild(button);
    });
}

function filterWinners(category) {
    const container = document.getElementById('winners-container');
    const buttons = document.querySelectorAll('.filter-button');
    
    // עדכון כפתורים פעילים
    buttons.forEach(button => {
        button.classList.toggle('active', button.textContent === category);
    });
    
    // אנימציית fade
    container.classList.add('fade');
    
    setTimeout(() => {
        // סינון והצגת הזוכים
        const filteredWinners = currentWinners.filter(winner => winner.quiz === category);
        displayWinners(filteredWinners);
        container.classList.remove('fade');
    }, 300);
}

async function fetchAndDisplayWinners() {
    try {
        const response = await fetch(`${CONFIG.api.url}?action=getWinners`);
        const responseData = await response.json();
        
        if (responseData && responseData.data && Array.isArray(responseData.data)) {
            currentWinners = responseData.data;
            const categories = [...new Set(currentWinners.map(winner => winner.quiz))];
            
            // יצירת כפתורי הסינון רק אם יש יותר מקטגוריה אחת
            if (categories.length > 1) {
                createFilterButtons(categories);
                
                // הצגת הקטגוריה הראשונה כברירת מחדל
                filterWinners(categories[0]);
            } else {
                // אם יש רק קטגוריה אחת, פשוט נציג את כל הזוכים
                displayWinners(currentWinners);
            }
        } else {
            throw new Error('שגיאה בטעינת רשימת הזוכים');
        }
    } catch (error) {
        console.error('שגיאה:', error);
        document.getElementById('winners-container').innerHTML = 
            '<p class="error-message">אירעה שגיאה בטעינת רשימת הזוכים. אנא נסה שוב מאוחר יותר.</p>';
    }
}

function displayWinners(winners) {
    const container = document.getElementById('winners-container');
    
    if (!winners || winners.length === 0) {
        container.innerHTML = `
            <div class="no-winners">
                <span class="material-icons">emoji_events</span>
                <h2>עדיין לא הוכרזו זוכים במבחן השבועי</h2>
                <p>המשיכו להתמיד ואולי בקרוב תופיעו כאן 😊</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = winners.map(winner => `
        <div class="winner-card">
            <span class="material-icons winner-medal">emoji_events</span>
            <div class="winner-info">
                <h3>${winner.name}</h3>
                <div class="winner-details">
                    <div>סניף: ${winner.branch}</div>
                    <div>זכייה: ${winner.prize}</div>
                    <div>עבור: ${winner.quiz}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// פונקציות חדשות לטיפול בתצוגת מסך מלא
function openFullscreen(imageSrc) {
    const modal = document.getElementById('fullscreenModal');
    const modalImg = document.getElementById('fullscreenImage');
    modal.style.display = "block";
    modalImg.src = imageSrc;
    
    // סגירה בלחיצה על ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeFullscreen();
    });
    
    // סגירה בלחיצה על הרקע
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeFullscreen();
    });
}

function closeFullscreen() {
    const modal = document.getElementById('fullscreenModal');
    modal.style.display = "none";
} 