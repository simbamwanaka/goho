// Basic product dataset
const PRODUCTS = [
  { id: 'p1', name: 'Tomatoes', category: 'vegetable', price: 1.20, unit: 'kg', img: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=800&auto=format&fit=crop' },
  { id: 'p2', name: 'Watermelon', category: 'fruit', price: 5.00, unit: 'each', img: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=800&auto=format&fit=crop' },
  { id: 'p3', name: 'Cucumber', category: 'vegetable', price: 0.90, unit: 'each', img: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?q=80&w=800&auto=format&fit=crop' },
  { id: 'p4', name: 'Butternut', category: 'vegetable', price: 2.50, unit: 'each', img: 'https://images.unsplash.com/photo-1608460151804-7a4f4a1e4fb9?q=80&w=800&auto=format&fit=crop' },
  { id: 'p5', name: 'Peppers', category: 'vegetable', price: 1.80, unit: 'kg', img: 'https://images.unsplash.com/photo-1569741333666-54a1f5d37f3b?q=80&w=800&auto=format&fit=crop' }
];

let cart = {}; // { productId: quantity }

// Utilities
const $ = id => document.getElementById(id);

// Render year
$('year') && ($('year').textContent = new Date().getFullYear());

// Render product grid
function renderProducts(list = PRODUCTS) {
  const grid = $('productGrid');
  grid.innerHTML = '';
  list.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-md-4';
    col.innerHTML = `
      <div class="card h-100">
        <img src="${p.img}" class="card-img-top product-img" alt="${p.name}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${p.name}</h5>
          <div class="mb-2 text-muted">${p.category}</div>
          <div class="mb-3"><span class="price">$${p.price.toFixed(2)}</span> <small class="text-muted"> / ${p.unit}</small></div>
          <div class="mt-auto d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary add-btn" data-id="${p.id}">Add</button>
            <button class="btn btn-sm btn-outline-secondary details-btn" data-id="${p.id}">Details</button>
          </div>
        </div>
      </div>`;
    grid.appendChild(col);
  });

  // attach listeners
  document.querySelectorAll('.add-btn').forEach(b => b.addEventListener('click', e => {
    addToCart(e.currentTarget.dataset.id);
  }));
  document.querySelectorAll('.details-btn').forEach(b => b.addEventListener('click', e => {
    const id = e.currentTarget.dataset.id;
    const p = PRODUCTS.find(x => x.id === id);
    alert(`${p.name}\nPrice: $${p.price.toFixed(2)} / ${p.unit}\nCategory: ${p.category}`);
  }));
}

function addToCart(productId) {
  cart[productId] = (cart[productId] || 0) + 1;
  updateCartCount();
}

function updateCartCount(){
  const count = Object.values(cart).reduce((s,q)=>s+q,0);
  $('cartCount').textContent = count;
  renderCartItems();
}

function renderCartItems(){
  const container = $('cartItems');
  if(!container) return;
  container.innerHTML = '';
  if(Object.keys(cart).length === 0){
    container.innerHTML = '<p class="text-muted">Cart is empty.</p>';
    $('cartTotal').textContent = '0.00';
    return;
  }
  let total = 0;
  const list = document.createElement('div');
  list.className = 'list-group';
  Object.entries(cart).forEach(([id, qty]) => {
    const p = PRODUCTS.find(x => x.id === id);
    const lineTotal = p.price * qty;
    total += lineTotal;
    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    item.innerHTML = `
      <div>
        <div class="fw-bold">${p.name}</div>
        <div class="text-muted small">${qty} x $${p.price.toFixed(2)}</div>
      </div>
      <div class="d-flex gap-2 align-items-center">
        <button class="btn btn-sm btn-outline-secondary dec" data-id="${id}">-</button>
        <button class="btn btn-sm btn-outline-secondary inc" data-id="${id}">+</button>
      </div>
    `;
    list.appendChild(item);
  });
  container.appendChild(list);
  $('cartTotal').textContent = total.toFixed(2);

  // attach qty controls
  container.querySelectorAll('.inc').forEach(b => b.addEventListener('click', e => {
    const id = e.currentTarget.dataset.id; cart[id] = (cart[id]||0)+1; updateCartCount();
  }));
  container.querySelectorAll('.dec').forEach(b => b.addEventListener('click', e => {
    const id = e.currentTarget.dataset.id; cart[id] = (cart[id]||0)-1; if(cart[id] <= 0) delete cart[id]; updateCartCount();
  }));
}

// Filtering and search
$('categoryFilter') && $('categoryFilter').addEventListener('change', e => {
  applyFilters();
});
$('searchInput') && $('searchInput').addEventListener('input', e => {
  applyFilters();
});

function applyFilters(){
  const cat = $('categoryFilter').value;
  const q = $('searchInput').value.trim().toLowerCase();
  const filtered = PRODUCTS.filter(p => {
    const okCat = (cat === 'all') || (p.category === cat);
    const okQ = p.name.toLowerCase().includes(q);
    return okCat && okQ;
  });
  renderProducts(filtered);
}

// Contact form simple handling
$('contactForm') && $('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  // lightweight client-side validation
  const name = $('name').value.trim(), email = $('email').value.trim(), message = $('message').value.trim();
  if(!name || !email || !message){ alert('Please complete all fields.'); return; }
  alert('Thank you. Your message has been sent.');
  e.currentTarget.reset();
});

// Checkout simulation
$('checkoutBtn') && $('checkoutBtn').addEventListener('click', () => {
  if(Object.keys(cart).length === 0){ alert('Cart is empty.'); return; }
  const summary = Object.entries(cart).map(([id,qty])=>{
    const p = PRODUCTS.find(x=>x.id===id);
    return `${p.name} x ${qty}`;
  }).join('\n');
  alert('Order placed:\n' + summary + '\nA member will contact you to confirm.');
  cart = {};
  updateCartCount();
});

// Initial render
renderProducts();
updateCartCount();

// --- Gallery Lightbox and Interactivity ---
// Fetch and render gallery images from API
async function loadGalleryImages() {
  try {
    const response = await fetch('/api/gallery');
    if (!response.ok) throw new Error('Failed to load gallery');
    const items = await response.json();
    
    const grid = document.getElementById('galleryGrid');
    grid.className = 'gallery-grid';
    grid.innerHTML = '';
    
    items.forEach((item, idx) => {
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      galleryItem.setAttribute('tabindex', '0');
      galleryItem.setAttribute('role', 'button');
      galleryItem.setAttribute('aria-label', item.caption ? 'View ' + item.caption : 'View image');
      
      galleryItem.innerHTML = `
        <img loading="lazy" 
             data-index="${idx}" 
             src="${item.src}" 
             alt="${item.caption || 'Gallery image'}"
        >
        <div class="overlay">
          <div class="overlay-content">
            ${item.caption ? `<h3 class="overlay-title">${item.caption}</h3>` : ''}
            <div class="overlay-actions">
              <button class="btn-zoom" aria-label="View larger">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M19 19h-3v-3h1v2h2M19 5h-2V3h-1v3h3M5 5v2H3v1h3V5M3 16v1h2v2h1v-3"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;

      // Add click handler to the whole gallery item
      galleryItem.addEventListener('click', () => openLightbox(idx));
      
      // Add keyboard handler for accessibility
      galleryItem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(idx);
        }
      });

      grid.appendChild(galleryItem);
    });

    // Initialize Intersection Observer for lazy loading
    const observerOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target.querySelector('img');
          if (img && img.hasAttribute('data-src')) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all gallery items
    document.querySelectorAll('.gallery-item').forEach(item => {
      observer.observe(item);
    });

  } catch (err) {
    console.error('Gallery load error:', err);
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '<div class="alert alert-warning">Failed to load gallery images. Please try again later.</div>';
  }
}

// Initial gallery load
loadGalleryImages();

// Lightbox element refs will be obtained after DOM is ready
let lightbox = null;
let lbImg = null;
let lbCaption = null;
let btnClose = null;
let btnPrev = null;
let btnNext = null;
let btnPlay = null;
let btnDownload = null;
let btnFullscreen = null;

let currentIndex = 0;
let slideInterval = null;

function openLightbox(index) {
  if (!lightbox) {
    return;
  }
  
  currentIndex = index;
  const img = document.querySelector(`#galleryGrid img[data-index="${index}"]`);
  if (!img) {
    return;
  }

  // Prepare lightbox content
  lbImg.src = img.src;
  lbImg.alt = img.alt || '';
  lbCaption.textContent = img.alt || '';

  // Show lightbox with animation
  lightbox.classList.remove('d-none');
  document.body.style.overflow = 'hidden';
  
  requestAnimationFrame(() => {
    lightbox.classList.add('active');
    lbImg.style.opacity = '1';
    lbImg.style.transform = 'scale(1)';
  });

  // Update navigation state
  const totalImages = document.querySelectorAll('#galleryGrid img').length;
  btnPrev.disabled = currentIndex === 0;
  btnNext.disabled = currentIndex === totalImages - 1;

  // Update accessibility
  lightbox.setAttribute('aria-hidden', 'false');
  lightbox.setAttribute('aria-label', `Image ${currentIndex + 1} of ${totalImages}`);

  // Setup download button
  if (btnDownload) {
    btnDownload.onclick = () => {
      const link = document.createElement('a');
      link.href = img.src;
      link.download = `gallery-image-${index + 1}.jpg`;
      link.click();
    };
  }

  // Setup play button
  if (btnPlay) {
    btnPlay.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16">
      <polygon points="5,3 19,12 5,21"/>
    </svg>`;
    btnPlay.setAttribute('aria-label', 'Start slideshow');
  }

  // Add loading indicator
  lbImg.style.opacity = '0';
  lbImg.style.transform = 'scale(0.9)';

  // Remove loading indicator once image is loaded
  lbImg.onload = () => {
    requestAnimationFrame(() => {
      lbImg.style.opacity = '1';
      lbImg.style.transform = 'scale(1)';
    });
  };
}

function closeLightbox() {
  if (!lightbox) {
    return;
  }

  // Start closing animation
  lightbox.classList.remove('active');
  lbImg.style.opacity = '0';
  lbImg.style.transform = 'scale(0.9)';

  // Stop any running slideshow
  stopSlideshow();

  // Wait for animation to finish before hiding
  setTimeout(() => {
    lightbox.classList.add('d-none');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }, 300);
}

function showIndex(i) {
  if (!lightbox) {
    return;
  }

  const allImages = document.querySelectorAll('#galleryGrid img');
  const totalImages = allImages.length;
  
  // Calculate new index with wrapping
  currentIndex = ((i % totalImages) + totalImages) % totalImages;
  
  const img = allImages[currentIndex];
  if (!img) {
    return;
  }

  // Add slide animation
  const direction = i > currentIndex ? 'left' : 'right';
  lbImg.style.transition = 'none';
  lbImg.style.transform = `translateX(${direction === 'left' ? '100px' : '-100px'})`;
  lbImg.style.opacity = '0';
  
  // Update content
  lbImg.src = img.src;
  lbImg.alt = img.alt || '';
  lbCaption.textContent = img.dataset.caption || img.alt || '';

  // Animate in
  requestAnimationFrame(() => {
    lbImg.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    lbImg.style.transform = 'translateX(0)';
    lbImg.style.opacity = '1';
  });

  // Update navigation state
  btnPrev.disabled = currentIndex === 0;
  btnNext.disabled = currentIndex === totalImages - 1;

  // Update aria labels
  lbImg.setAttribute('aria-label', `Image ${currentIndex + 1} of ${totalImages}${img.alt ? ': ' + img.alt : ''}`);
}

function next() {
  showIndex(currentIndex + 1);
}

function prev() {
  showIndex(currentIndex - 1);
}

function startSlideshow() {
  if (slideInterval) {
    return;
  }
  
  // Update play button to show pause icon
  btnPlay.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>`;
  btnPlay.setAttribute('aria-label', 'Pause slideshow');
  
  // Start auto-advance with fade transition
  slideInterval = setInterval(() => {
    const totalImages = document.querySelectorAll('#galleryGrid img').length;
    if (currentIndex < totalImages - 1) {
      next();
    } else {
      showIndex(0); // Loop back to start
    }
  }, 3000);
}

function stopSlideshow() {
  if (!slideInterval) {
    return;
  }
  
  // Update play button to show play icon
  btnPlay.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16">
    <polygon points="5,3 19,12 5,21"/>
  </svg>`;
  btnPlay.setAttribute('aria-label', 'Start slideshow');
  
  clearInterval(slideInterval);
  slideInterval = null;
}

function toggleSlideshow() {
  if (slideInterval) {
    stopSlideshow();
  } else {
    startSlideshow();
  }
}

function downloadCurrent(){
  const url = lbImg.src;
  const a = document.createElement('a');
  a.href = url; a.download = `image-${currentIndex+1}.jpg`; document.body.appendChild(a); a.click(); a.remove();
}

function toggleFullscreen(){
  const el = lightbox.querySelector('.lightbox-content');
  if(!document.fullscreenElement){ el.requestFullscreen?.(); }
  else { document.exitFullscreen?.(); }
}

// Setup lightbox controls and accessibility
function setupLightboxControls() {
  if (!lightbox) {
    console.warn('Lightbox element not found');
    return;
  }

  // Close button
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      closeLightbox();
    });
    btnClose.setAttribute('aria-label', 'Close gallery view');
  }

  // Navigation buttons
  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      prev();
    });
    btnPrev.setAttribute('aria-label', 'Previous image');
  }

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      next();
    });
    btnNext.setAttribute('aria-label', 'Next image');
  }

  // Slideshow control
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      toggleSlideshow();
    });
    btnPlay.setAttribute('aria-label', 'Start slideshow');
  }

  // Download button
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      downloadCurrent();
    });
    btnDownload.setAttribute('aria-label', 'Download current image');
  }

  // Fullscreen button
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      toggleFullscreen();
    });
    btnFullscreen.setAttribute('aria-label', 'Toggle fullscreen');
  }

  // Backdrop click to close
  lightbox.addEventListener('click', (e) => {
    if (e.target.classList.contains('lightbox-backdrop')) {
      closeLightbox();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox || lightbox.classList.contains('d-none')) {
      return;
    }

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowRight':
        next();
        break;
      case 'ArrowLeft':
        prev();
        break;
      case ' ':
        e.preventDefault();
        toggleSlideshow();
        break;
    }
  });

  // Focus trap for accessibility
  const focusableElements = lightbox.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  document.addEventListener('focusin', (e) => {
    if (!lightbox || lightbox.classList.contains('d-none')) {
      return;
    }
    
    if (!lightbox.contains(e.target)) {
      e.preventDefault();
      firstFocusable.focus();
    }
  });

  // Handle focus wrapping
  lastFocusable.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      firstFocusable.focus();
    }
  });

  firstFocusable.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      lastFocusable.focus();
    }
  });
}

// Initialize controls once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // obtain lightbox element references now that DOM is ready
  lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lbImg = lightbox.querySelector('.lightbox-img');
    lbCaption = lightbox.querySelector('.lightbox-caption');
    btnClose = lightbox.querySelector('.lightbox-close');
    btnPrev = lightbox.querySelector('.lightbox-prev');
    btnNext = lightbox.querySelector('.lightbox-next');
    btnPlay = lightbox.querySelector('.lightbox-play');
    btnDownload = lightbox.querySelector('.lightbox-download');
    btnFullscreen = lightbox.querySelector('.lightbox-fullscreen');
    // new bottom close button inside controls
    const btnCloseBottom = lightbox.querySelector('.lightbox-close-bottom');
    if (btnCloseBottom) {
      btnCloseBottom.addEventListener('click', () => closeLightbox());
      btnCloseBottom.setAttribute('aria-label', 'Close');
    }
  }

  setupLightboxControls();
});

