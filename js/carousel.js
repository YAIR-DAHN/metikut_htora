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