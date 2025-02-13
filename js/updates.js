const UPDATE_TYPES = {
    'עדכון רגיל': { icon: 'info', label: 'עדכון רגיל' },
    'עדכון חשוב': { icon: 'new_releases', label: 'עדכון חשוב' },
    'מבחן חדש': { icon: 'quiz', label: 'מבחן חדש' },
    'זוכים': { icon: 'emoji_events', label: 'זוכים' }
};

const UPDATES_STORAGE_KEY = 'metikut_updates';
const LAST_SEEN_UPDATE_KEY = 'metikut_last_seen_update';
const VIEWED_UPDATES_KEY = 'metikut_viewed_updates';

const MAX_CONTENT_LENGTH = 150; // אורך מקסימלי לתוכן לפני קיצור

function truncateContent(content) {
    if (content.length <= MAX_CONTENT_LENGTH) return content;
    return {
        short: content.slice(0, MAX_CONTENT_LENGTH) + '...',
        full: content
    };
}

async function loadUpdates() {
    const container = document.getElementById('updates-container');
    
    // טעינת עדכונים מהזיכרון המקומי
    const cachedUpdates = JSON.parse(localStorage.getItem(UPDATES_STORAGE_KEY) || '[]');
    const viewedUpdates = JSON.parse(localStorage.getItem(VIEWED_UPDATES_KEY) || '[]');
    
    // הצגת העדכונים מהזיכרון המקומי אם קיימים
    if (cachedUpdates.length > 0) {
        renderUpdates(cachedUpdates, viewedUpdates);
    }
    
    try {
        // טעינת עדכונים חדשים מהשרת
        const response = await fetchFromAPI('getUpdates');
        const updates = response.data;
        
        // שמירת העדכונים בזיכרון המקומי
        localStorage.setItem(UPDATES_STORAGE_KEY, JSON.stringify(updates));
        
        // הצגת העדכונים החדשים
        renderUpdates(updates, viewedUpdates);
        
        // עדכון רשימת העדכונים שנצפו לאחר 3 שניות
        setTimeout(() => {
            if (updates.length > 0) {
                const currentViewedUpdates = new Set([...viewedUpdates]);
                updates.forEach(update => currentViewedUpdates.add(update.date));
                localStorage.setItem(VIEWED_UPDATES_KEY, JSON.stringify([...currentViewedUpdates]));
            }
        }, 3000);
        
    } catch (error) {
        console.error('שגיאה בטעינת העדכונים:', error);
        if (!cachedUpdates.length) {
            container.innerHTML = `
                <div class="error-message">
                    <span class="material-icons">error_outline</span>
                    <p>אירעה שגיאה בטעינת העדכונים</p>
                </div>
            `;
        }
    }
}

function renderUpdates(updates, viewedUpdates) {
    const container = document.getElementById('updates-container');
    
    if (!updates || updates.length === 0) {
        container.innerHTML = `
            <div class="no-updates">
                <span class="material-icons">notifications_off</span>
                <p>אין עדכונים חדשים</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = updates.map(update => {
        const updateType = UPDATE_TYPES[update.type] || UPDATE_TYPES['עדכון רגיל'];
        const isNew = !viewedUpdates.includes(update.date);
        const content = truncateContent(update.content);
        const hasFullContent = typeof content === 'object';
        
        return `
            <article class="update-card ${isNew ? 'new' : ''}">
                <div class="update-header">
                    <span class="material-icons">${updateType.icon}</span>
                    <h3>${update.title}</h3>
                    <time>${update.date}</time>
                </div>
                <div class="update-content">
                    <p>${hasFullContent ? content.short : content}</p>
                    ${hasFullContent ? `
                        <div class="update-full-content hidden">${content.full}</div>
                        <button class="read-more-btn">קרא עוד</button>
                    ` : ''}
                </div>
            </article>
        `;
    }).join('');

    // הוספת מאזיני אירועים לכפתורי 'קרא עוד'
    container.querySelectorAll('.read-more-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const content = this.closest('.update-content');
            const fullContent = content.querySelector('.update-full-content');
            const shortContent = content.querySelector('p');
            
            if (fullContent.classList.contains('hidden')) {
                shortContent.style.display = 'none';
                fullContent.classList.remove('hidden');
                this.textContent = 'הצג פחות';
            } else {
                shortContent.style.display = 'block';
                fullContent.classList.add('hidden');
                this.textContent = 'קרא עוד';
            }
        });
    });
}

// טעינת העדכונים בטעינת הדף
document.addEventListener('DOMContentLoaded', loadUpdates); 