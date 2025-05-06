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

// טיפול בלחיצה על תמונות וידאו בקרוסלה
document.addEventListener('DOMContentLoaded', function() {
    // טיפול בלחיצה על תמונות וידאו בקרוסלה
    const videoImages = document.querySelectorAll('.ad-image[data-video-src]');
    
    videoImages.forEach(image => {
        const card = image.closest('.ad-card');
        
        if (card) {
            card.addEventListener('click', function() {
                const videoSrc = image.getAttribute('data-video-src');
                
                // ניקוי מודאל קודם אם קיים
                const existingModal = document.getElementById('videoModal');
                if (existingModal) {
                    document.body.removeChild(existingModal);
                }
                
                // יצירת מודאל חדש
                const modal = document.createElement('div');
                modal.id = 'videoModal';
                modal.className = 'video-modal';
                
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close-video-modal">&times;</span>
                        <video controls autoplay>
                            <source src="${videoSrc}" type="video/mp4">
                            הדפדפן שלך לא תומך בתגית וידאו.
                        </video>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // הגדרת סגירת המודאל
                const closeButton = modal.querySelector('.close-video-modal');
                closeButton.addEventListener('click', function() {
                    document.body.removeChild(modal);
                });
                
                // סגירה בלחיצה מחוץ לתוכן
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        document.body.removeChild(modal);
                    }
                });
            });
        }
    });
}); 