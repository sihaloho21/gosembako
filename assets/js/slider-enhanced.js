/**
 * Slider Enhanced for Paket Sembako
 * Handles image slider in product detail modal with fade transitions.
 */

const sliderState = {
    currentIndex: 0,
    totalSlides: 0,
    images: [],
    touchStartX: 0,
    touchEndX: 0
};

function initializeSlider(images) {
    const slider = document.getElementById('modal-slider');
    const dotsContainer = document.getElementById('slider-dots');
    const skeleton = document.getElementById('slider-skeleton');
    
    if (!slider) return;
    
    // Reset state
    sliderState.images = images && images.length > 0 ? images : ['https://placehold.co/600x400?text=Produk'];
    sliderState.currentIndex = 0;
    sliderState.totalSlides = sliderState.images.length;
    
    // Clear previous content
    slider.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';
    
    // Show skeleton
    if (skeleton) skeleton.classList.remove('hidden');
    
    // Populate slider
    sliderState.images.forEach((src, index) => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = `Product Image ${index + 1}`;
        img.className = 'absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out';
        img.style.opacity = index === 0 ? '1' : '0';
        img.style.zIndex = index === 0 ? '1' : '0';
        
        img.onerror = function() {
            this.src = 'https://placehold.co/600x400?text=Gambar+Tidak+Tersedia';
        };
        
        img.onload = function() {
            if (index === 0 && skeleton) skeleton.classList.add('hidden');
        };
        
        // Add click for lightbox
        img.onclick = () => openLightbox(index);
        
        slider.appendChild(img);
        
        // Create dots
        if (dotsContainer && sliderState.totalSlides > 1) {
            const dot = document.createElement('div');
            dot.className = `slider-dot w-2 h-2 rounded-full transition-all duration-300 ${index === 0 ? 'bg-white w-4' : 'bg-white/50'}`;
            dot.onclick = (e) => {
                e.stopPropagation();
                goToSlide(index);
            };
            dotsContainer.appendChild(dot);
        }
    } );
    
    updateSliderCounter();
    setupSwipe(slider);
}

function updateSliderPosition() {
    const images = document.querySelectorAll('#modal-slider img');
    const dots = document.querySelectorAll('#slider-dots .slider-dot');
    
    images.forEach((img, index) => {
        if (index === sliderState.currentIndex) {
            img.style.opacity = '1';
            img.style.zIndex = '1';
        } else {
            img.style.opacity = '0';
            img.style.zIndex = '0';
        }
    });
    
    dots.forEach((dot, index) => {
        if (index === sliderState.currentIndex) {
            dot.classList.add('bg-white', 'w-4');
            dot.classList.remove('bg-white/50');
        } else {
            dot.classList.remove('bg-white', 'w-4');
            dot.classList.add('bg-white/50');
        }
    });
    
    updateSliderCounter();
}

function updateSliderCounter() {
    const counter = document.getElementById('slider-counter');
    if (counter) {
        counter.innerText = `${sliderState.currentIndex + 1} / ${sliderState.totalSlides}`;
    }
}

function nextSlide() {
    sliderState.currentIndex = (sliderState.currentIndex + 1) % sliderState.totalSlides;
    updateSliderPosition();
}

function prevSlide() {
    sliderState.currentIndex = (sliderState.currentIndex - 1 + sliderState.totalSlides) % sliderState.totalSlides;
    updateSliderPosition();
}

function goToSlide(index) {
    sliderState.currentIndex = index;
    updateSliderPosition();
}

// Swipe Support
function setupSwipe(el) {
    el.addEventListener('touchstart', e => {
        sliderState.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    el.addEventListener('touchend', e => {
        sliderState.touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    const threshold = 50;
    if (sliderState.touchEndX < sliderState.touchStartX - threshold) nextSlide();
    if (sliderState.touchEndX > sliderState.touchStartX + threshold) prevSlide();
}

// Lightbox Logic
function openLightbox(index) {
    const modal = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-image');
    if (!modal || !img) return;
    
    img.src = sliderState.images[index];
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Setup zoom for the new image
    setupZoom(img);
}

function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}

function lightboxNext() {
    sliderState.currentIndex = (sliderState.currentIndex + 1) % sliderState.totalSlides;
    const img = document.getElementById('lightbox-image');
    if (img) {
        img.src = sliderState.images[sliderState.currentIndex];
        img.dispatchEvent(new CustomEvent('zoomreset'));
    }
    updateSliderPosition();
}

function lightboxPrev() {
    sliderState.currentIndex = (sliderState.currentIndex - 1 + sliderState.totalSlides) % sliderState.totalSlides;
    const img = document.getElementById('lightbox-image');
    if (img) {
        img.src = sliderState.images[sliderState.currentIndex];
        img.dispatchEvent(new CustomEvent('zoomreset'));
    }
    updateSliderPosition();
}

// Zoom Logic
function setupZoom(img) {
    let scale = 1;
    let pointX = 0;
    let pointY = 0;
    let start = { x: 0, y: 0 };
    let isPanning = false;

    function setTransform() {
        img.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
    }

    img.onmousedown = function(e) {
        if (scale === 1) return;
        e.preventDefault();
        start = { x: e.clientX - pointX, y: e.clientY - pointY };
        isPanning = true;
    };

    window.onmousemove = function(e) {
        if (!isPanning) return;
        pointX = e.clientX - start.x;
        pointY = e.clientY - start.y;
        setTransform();
    };

    window.onmouseup = function() {
        isPanning = false;
    };

    img.ondblclick = function(e) {
        if (scale !== 1) {
            scale = 1;
            pointX = 0;
            pointY = 0;
        } else {
            scale = 2.5;
            // Zoom towards click point
            pointX = (img.offsetWidth / 2 - e.offsetX) * 1.5;
            pointY = (img.offsetHeight / 2 - e.offsetY) * 1.5;
        }
        setTransform();
    };

    // Reset zoom on custom event
    img.addEventListener('zoomreset', () => {
        scale = 1;
        pointX = 0;
        pointY = 0;
        setTransform();
    });
}

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox-modal');
    if (lightbox && !lightbox.classList.contains('hidden')) {
        if (e.key === 'ArrowRight') lightboxNext();
        if (e.key === 'ArrowLeft') lightboxPrev();
        if (e.key === 'Escape') closeLightbox();
    }
});
