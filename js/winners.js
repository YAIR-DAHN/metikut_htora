document.addEventListener('DOMContentLoaded', async () => {
    initDarkMode();
    showLoading();

    try {
        const response = await fetchFromAPI('getWinners');
        const winners = response.data;
        
        const container = document.getElementById('winners-container');
        
        if (!winners || winners.length === 0) {
            container.innerHTML = `
                <div class="no-winners">
                    <span class="material-icons">emoji_events</span>
                    <h2>עדיין לא הוכרזו זוכים במבחן השבועי</h2>
                    <p>המשיכו להתמיד ואולי בקרוב תופיעו כאן 😊</p>
                </div>
            `;
        } else {
            container.innerHTML = winners.map((winner, index) => `
                <div class="winner-card">
                    <span class="material-icons winner-medal">
                        ${index === 0 ? 'workspace_premium' : 'emoji_events'}
                    </span>
                    <div class="winner-info">
                        <h3>${winner.name}</h3>
                        <div class="winner-details">
                            <div>סניף: ${winner.branch}</div>
                            <div>זכה ב${winner.prize}</div>
                            <div>עבור ${winner.quiz}</div>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('שגיאה בטעינת רשימת הזוכים:', error);
        showModal({
            title: 'שגיאה',
            message: 'אירעה שגיאה בטעינת רשימת הזוכים. אנא נסה שוב מאוחר יותר.',
            icon: 'error'
        });
    } finally {
        hideLoading();
    }
}); 