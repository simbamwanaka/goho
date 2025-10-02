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
const galleryImgs = Array.from(document.querySelectorAll('#galleryGrid .gallery-img'));
const lightbox = document.getElementById('lightbox');
const lbImg = lightbox && lightbox.querySelector('.lightbox-img');
const lbCaption = lightbox && lightbox.querySelector('.lightbox-caption');
const btnClose = lightbox && lightbox.querySelector('.lightbox-close');
const btnPrev = lightbox && lightbox.querySelector('.lightbox-prev');
const btnNext = lightbox && lightbox.querySelector('.lightbox-next');
const btnPlay = lightbox && lightbox.querySelector('.lightbox-play');
const btnDownload = lightbox && lightbox.querySelector('.lightbox-download');
const btnFullscreen = lightbox && lightbox.querySelector('.lightbox-fullscreen');

let currentIndex = 0;
let slideInterval = null;

function openLightbox(index){
  if(!lightbox) return;
  currentIndex = index;
  const img = galleryImgs[currentIndex];
  lbImg.src = img.src;
  lbImg.alt = img.alt || '';
  lbCaption.textContent = img.dataset.caption || img.alt || '';
  lightbox.classList.remove('d-none');
  lightbox.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  btnPlay.textContent = '▶';
}

function closeLightbox(){
  if(!lightbox) return;
  lightbox.classList.add('d-none');
  lightbox.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  stopSlideshow();
}

function showIndex(i){
  currentIndex = (i + galleryImgs.length) % galleryImgs.length;
  const img = galleryImgs[currentIndex];
  lbImg.src = img.src;
  lbImg.alt = img.alt || '';
  lbCaption.textContent = img.dataset.caption || img.alt || '';
}

function next(){ showIndex(currentIndex + 1); }
function prev(){ showIndex(currentIndex - 1); }

function startSlideshow(){
  if(slideInterval) return;
  btnPlay.textContent = '⏸';
  slideInterval = setInterval(next, 3000);
}
function stopSlideshow(){
  btnPlay.textContent = '▶';
  clearInterval(slideInterval); slideInterval = null;
}

function toggleSlideshow(){ if(slideInterval) stopSlideshow(); else startSlideshow(); }

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

// Attach listeners to thumbnails
galleryImgs.forEach((img, idx) => {
  img.style.cursor = 'zoom-in';
  img.addEventListener('click', () => openLightbox(idx));
  img.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') openLightbox(idx); });
  // make focusable for keyboard users
  img.setAttribute('tabindex','0');
});

// Lightbox controls
btnClose && btnClose.addEventListener('click', closeLightbox);
btnPrev && btnPrev.addEventListener('click', prev);
btnNext && btnNext.addEventListener('click', next);
btnPlay && btnPlay.addEventListener('click', toggleSlideshow);
btnDownload && btnDownload.addEventListener('click', downloadCurrent);
btnFullscreen && btnFullscreen.addEventListener('click', toggleFullscreen);

// close when clicking backdrop
lightbox && lightbox.addEventListener('click', e => {
  if(e.target.classList.contains('lightbox-backdrop')) closeLightbox();
});

// keyboard navigation
document.addEventListener('keydown', e => {
  if(!lightbox || lightbox.classList.contains('d-none')) return;
  if(e.key === 'Escape') closeLightbox();
  if(e.key === 'ArrowRight') next();
  if(e.key === 'ArrowLeft') prev();
  if(e.key === ' ') { e.preventDefault(); toggleSlideshow(); }
});

// Improve accessibility: trap focus inside lightbox when open
document.addEventListener('focusin', e => {
  if(!lightbox || lightbox.classList.contains('d-none')) return;
  if(!lightbox.contains(e.target)) {
    e.stopPropagation();
    btnClose && btnClose.focus();
  }
});

