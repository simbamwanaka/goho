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

// Preview images before upload
document.getElementById('gFile').addEventListener('change', function(e) {
  const preview = document.getElementById('imagePreview');
  const previewGrid = preview.querySelector('.gallery-grid');
  previewGrid.innerHTML = '';
  
  if (this.files.length > 0) {
    preview.classList.remove('d-none');
    Array.from(this.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.innerHTML = `
          <img src="${e.target.result}" alt="Preview">
          <div class="overlay">
            <span>${file.name}</span>
          </div>
        `;
        previewGrid.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  } else {
    preview.classList.add('d-none');
  }
});

document.getElementById('addGalleryBtn').addEventListener('click', async e => {
  e.preventDefault();
  const caption = document.getElementById('gCaption').value;
  const fileInput = document.getElementById('gFile');
  
  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Please select at least one image file');
    return;
  }

  const uploadPromises = Array.from(fileInput.files).map(async file => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('caption', caption || '');
    
    try {
      const up = await fetch('/api/gallery/upload', { method: 'POST', body: fd });
      if (!up.ok) {
        const error = await up.text();
        throw new Error(error);
      }
      return up.json();
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      throw error;
    }
  });

  try {
    await Promise.all(uploadPromises);
    document.getElementById('galleryForm').reset();
    document.getElementById('imagePreview').classList.add('d-none');
    loadGallery();
  } catch (error) {
    alert('One or more uploads failed. Please try again.');
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

async function loadGallery() {
  const res = await fetch('/admin/api/gallery');
  if (!res.ok) {
    return;
  }
  const list = await res.json();
  const container = document.getElementById('galleryList');
  container.innerHTML = '';
  
  list.forEach(g => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
      <img src="${g.src}" alt="${g.caption || 'Gallery image'}" loading="lazy">
      <div class="overlay">
        <span>${g.caption || 'No caption'}</span>
      </div>
      <div class="gallery-actions">
        <button class="delete-btn" title="Delete image">Delete</button>
      </div>
    `;
    
    // Add click to zoom functionality
    item.querySelector('img').addEventListener('click', () => {
      const modal = document.getElementById('imageModal');
      const modalImg = modal.querySelector('img');
      modal.style.display = 'block';
      modalImg.src = g.src;
      modalImg.alt = g.caption || 'Gallery image';
    });
    
    // Delete functionality
    item.querySelector('.delete-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!confirm('Are you sure you want to delete this image?')) {
        return;
      }
      
      try {
        const response = await fetch('/api/gallery/' + g.id, { method: 'DELETE' });
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
        item.remove();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Error deleting gallery item: ' + err.message);
      }
    });
    
    container.appendChild(item);
  });
  
  // Modal close button
  const modal = document.getElementById('imageModal');
  const closeBtn = modal.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  // Close modal on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
    }
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
