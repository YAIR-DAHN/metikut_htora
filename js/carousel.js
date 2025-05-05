class Carousel {
    constructor(container) {
        this.container = container;
        this.slides = container.querySelector('.carousel-slides');
        this.slideElements = container.querySelectorAll('.carousel-slide');
        this.prevButton = container.querySelector('.carousel-button.prev');
        this.nextButton = container.querySelector('.carousel-button.next');
        this.dotsContainer = container.querySelector('.carousel-dots');
        
        this.currentSlide = 0;
        this.slideCount = this.slideElements.length;
        this.autoPlayInterval = null;
        
        this.init();
    }
    
    init() {
        // יצירת נקודות ניווט
        this.createDots();
        
        // הוספת מאזיני אירועים
        this.prevButton.addEventListener('click', () => this.prevSlide());
        this.nextButton.addEventListener('click', () => this.nextSlide());
        
        // התחלת גלילה אוטומטית
        this.startAutoPlay();
        
        // עצירת גלילה אוטומטית בעת מעבר עכבר
        this.container.addEventListener('mouseenter', () => this.stopAutoPlay());
        this.container.addEventListener('mouseleave', () => this.startAutoPlay());
        
        // הצגת השקופית הראשונה
        this.updateSlide();
    }
    
    createDots() {
        for (let i = 0; i < this.slideCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'carousel-dot';
            dot.addEventListener('click', () => {
                this.currentSlide = i;
                this.updateSlide();
            });
            this.dotsContainer.appendChild(dot);
        }
    }
    
    updateSlide() {
        // עדכון מיקום השקופיות
        const offset = -this.currentSlide * 100;
        this.slides.style.transform = `translateX(${offset}%)`;
        
        // עדכון מצב השקופיות
        this.slideElements.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentSlide);
        });
        
        // עדכון נקודות הניווט
        const dots = this.dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slideCount;
        this.updateSlide();
    }
    
    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.slideCount) % this.slideCount;
        this.updateSlide();
    }
    
    startAutoPlay() {
        if (this.autoPlayInterval) return;
        this.autoPlayInterval = setInterval(() => this.nextSlide(), 5000);
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
}

// אתחול הקרוסלה כאשר הדף נטען
document.addEventListener('DOMContentLoaded', () => {
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        new Carousel(carouselContainer);
    }
});

// הוספת טיפול בסרטונים בקרוסלה
document.addEventListener('DOMContentLoaded', function() {
    // טיפול בלחיצה על סרטונים בקרוסלה
    const videoCards = document.querySelectorAll('.video-card');
    
    videoCards.forEach(card => {
        const videoContainer = card.querySelector('.video-container');
        const video = card.querySelector('video');
        const overlay = card.querySelector('.ad-overlay');
        
        if (!video || !overlay) return;
        
        // הסרת האפשרות autoplay/muted לאחר טעינה (כדי שהמשתמש יוכל לשלוט בווידאו)
        video.addEventListener('loadeddata', function() {
            console.log('וידאו נטען בהצלחה');
            video.muted = false;
            video.autoplay = false;
            video.pause();
        });
        
        video.addEventListener('error', function(e) {
            console.error('שגיאה בטעינת הוידאו:', e);
        });
        
        // בדיקה אם הוידאו כבר התחיל לנגן
        video.addEventListener('playing', function() {
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            console.log('הוידאו מנגן');
        });
        
        // טיפול בלחיצה על האוברליי
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                // הפעלה מחדש בכל מקרה כדי לוודא שהוידאו מתחיל
                video.currentTime = 0;
                video.muted = false;
                const playPromise = video.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        overlay.style.opacity = '0';
                        overlay.style.visibility = 'hidden';
                    }).catch(err => {
                        console.error('שגיאה בהפעלת הוידאו:', err);
                        // ננסה שוב עם השתקה (דפדפנים רבים דורשים זאת)
                        video.muted = true;
                        video.play().catch(e => console.error('שגיאה גם עם muted:', e));
                    });
                }
            } catch (err) {
                console.error('שגיאה בניגון הוידאו:', err);
            }
        });
        
        // טיפול בסיום הוידאו
        video.addEventListener('ended', function() {
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';
            video.currentTime = 0;
        });
        
        // טיפול בלחיצה ישירה על הוידאו כדי לעצור אותו
        video.addEventListener('click', function(e) {
            e.stopPropagation();
            if (!video.paused) {
                video.pause();
                overlay.style.opacity = '1';
                overlay.style.visibility = 'visible';
            }
        });
    });
}); 