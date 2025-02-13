// Intersection Observer לטעינה הדרגתית
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// הוספת אנימציות לאלמנטים
function initAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));
    
    // הוספת אפקט Ripple לכפתורים
    const buttons = document.querySelectorAll('button, .nav-button, .download-card');
    buttons.forEach(button => {
        button.classList.add('ripple');
    });
}

// פונקציית שיתוף
function shareWebsite() {
    const shareData = {
        title: 'מתיקות התורה',
        text: 'הצטרפו למיזם מתיקות התורה! 📚\n\nלימוד משותף של פרק המפקיד עם אלפי נערים ברחבי הארץ 🌟\n\nפרטים נוספים:',
        url: window.location.origin
    };

    // בדיקה אם יש תמיכה ב-Web Share API
    if (navigator.share) {
        navigator.share(shareData)
            .catch(err => {
                shareOnWhatsApp();
            });
    } else {
        shareOnWhatsApp();
    }
}

function shareOnWhatsApp() {
    const text = encodeURIComponent('הצטרפו למיזם מתיקות התורה! 📚\n\nלימוד משותף של פרק המפקיד עם אלפי נערים ברחבי הארץ 🌟\n\nלפרטים נוספים:\n') + 
                encodeURIComponent(window.location.origin);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

// אתחול בטעינת הדף
document.addEventListener('DOMContentLoaded', () => {
    initAnimations();
}); 