async function postJson(url, data){
  const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
  return res;
}

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const u = document.getElementById('adminUser').value;
  const p = document.getElementById('adminPass').value;
  const r = await postJson('/admin/login', { username: u, password: p });
  if(r.ok){ document.getElementById('loginBox').classList.add('d-none'); document.getElementById('appUI').classList.remove('d-none'); loadAll(); }
  else { alert('Login failed'); }
});

document.getElementById('logoutBtn').addEventListener('click', async () => { await postJson('/admin/logout', {}); location.reload(); });

document.getElementById('addProductBtn').addEventListener('click', async e => {
  e.preventDefault();
  const name = document.getElementById('pName').value;
  const category = document.getElementById('pCategory').value;
  const price = document.getElementById('pPrice').value;
  const unit = document.getElementById('pUnit').value;
  const fileInput = document.getElementById('pImgFile');
  
  // Validate form
  if (!name || !category || !price || !unit) {
    alert('Please fill in all required fields');
    return;
  }
  
  if (!fileInput.files || !fileInput.files[0]) {
    alert('Please select an image file');
    return;
  }

  // Upload image
  const fd = new FormData();
  fd.append('image', fileInput.files[0]);
  const up = await fetch('/api/products/upload', { method: 'POST', body: fd });
  
  if (!up.ok) {
    let txt = 'Image upload failed';
    try {
      const j = await up.json();
      txt += ': ' + (j.error || JSON.stringify(j));
    } catch(e) {
      txt += ': ' + await up.text();
    }
    alert(txt);
    return;
  }

  const u = await up.json();
  const data = { name, category, price, unit, img: u.src };
  const r = await postJson('/api/products', data);
  
  if (r.ok) {
    alert('Product added successfully');
    document.getElementById('productForm').reset();
    loadProducts();
  } else {
    alert('Failed to add product');
  }
});

document.getElementById('addGalleryBtn').addEventListener('click', async e => {
  e.preventDefault();
  const caption = document.getElementById('gCaption').value;
  const fileInput = document.getElementById('gFile');
  
  if (!fileInput.files || !fileInput.files[0]) {
    alert('Please select an image file');
    return;
  }

  const fd = new FormData();
  fd.append('image', fileInput.files[0]);
  fd.append('caption', caption || '');
  
  const up = await fetch('/api/gallery/upload', { method: 'POST', body: fd });
  
  if (up.ok) {
    alert('Image added to gallery');
    document.getElementById('galleryForm').reset();
    loadGallery();
  } else {
    let txt = 'Upload failed';
    try {
      const j = await up.json();
      txt += ': ' + (j.error || JSON.stringify(j));
    } catch(e) {
      txt += ': ' + await up.text();
    }
    alert(txt);
  }
});

async function loadProducts(){
  const res = await fetch('/admin/api/products');
  if(!res.ok) return;
  const list = await res.json();
  const container = document.getElementById('productsList'); container.innerHTML = '';
  list.forEach(p => { 
    const row = document.createElement('div'); 
    row.className='d-flex justify-content-between align-items-center border p-2 mb-2'; 
    row.innerHTML = `<div><strong>${p.name}</strong><div class="text-muted small">${p.category} • $${p.price}</div></div><button class="btn btn-sm btn-danger" data-id="${p.id}">Delete</button>`; 
    container.appendChild(row); 
    row.querySelector('button').addEventListener('click', async () => { 
      try {
        const response = await fetch('/api/products/'+p.id, {method:'DELETE'}); 
        if (!response.ok) {
          if (response.status === 401) {
            alert('Your session has expired. Please log in again.');
            location.reload();
            return;
          }
          throw new Error('Failed to delete product');
        }
        loadProducts();
      } catch (err) {
        alert(err.message);
      }
    }); 
  });
}

async function loadGallery(){
  const res = await fetch('/admin/api/gallery');
  if(!res.ok) return;
  const list = await res.json();
  const container = document.getElementById('galleryList'); container.innerHTML = '';
  list.forEach(g => { 
    const row = document.createElement('div'); 
    row.className='d-flex justify-content-between align-items-center border p-2 mb-2'; 
    row.innerHTML = `<div><img src="${g.src}" style="height:48px;object-fit:cover;margin-right:8px;border-radius:4px"> <strong>${g.caption}</strong></div><button class="btn btn-sm btn-danger" data-id="${g.id}">Delete</button>`; 
    container.appendChild(row); 
    row.querySelector('button').addEventListener('click', async () => { 
      if (!confirm('Are you sure you want to delete this gallery item?')) {
        return;
      }
      try {
        const response = await fetch('/api/gallery/'+g.id, {method:'DELETE'}); 
        if (!response.ok) {
          if (response.status === 401) {
            alert('Your session has expired. Please log in again.');
            location.reload();
            return;
          } else if (response.status === 404) {
            alert('Gallery item not found. The page will refresh.');
            loadGallery();
            return;
          }
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete gallery item');
        }
        loadGallery();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Error deleting gallery item: ' + err.message);
      }
    }); 
  });
}

async function loadAll() { 
  await loadProducts(); 
  await loadGallery(); 
  // Re-attach gallery image event listeners
  document.querySelectorAll('#galleryGrid .gallery-img').forEach((img, idx) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openLightbox(idx));
    img.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openLightbox(idx);
    });
    img.setAttribute('tabindex', '0');
  });
}
