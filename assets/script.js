/* assets/shop.js — resilient shop + UI helpers (includes scroll animations, smooth-scroll fallback, gallery quick-view)
   - IIFE with single-init guard
   - defensive checks (no errors if elements missing)
   - integrates with existing cart/modal/shop logic
*/
// call-picker.js
// Simple, defensive script to open call picker modal and handle Phone / WhatsApp actions.

// assets/call-picker.js
(function () {
  'use strict';
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(() => {
    const phoneBtn = document.getElementById('phoneBtn'); // changed from callBtn
    const modalEl = document.getElementById('callPicker');
    const numDisplay = document.getElementById('numDisplay');
    const phoneLabel = document.getElementById('phoneLabel');
    const callPhoneBtn = document.getElementById('callPhone');
    const callWhatsAppBtn = document.getElementById('callWhatsApp');

    if (!phoneBtn) return; // nothing to do if there's no phone button on the page

    const sanitizeTel = (s = '') => (s + '').trim().replace(/[^0-9+]/g, '');
    const sanitizeForWa = (s = '') => (s + '').trim().replace(/[^0-9]/g, '').replace(/^0+/, '');

    const readNumber = () => {
      const fromAttr = phoneBtn.getAttribute('data-number');
      if (fromAttr && fromAttr.trim()) return fromAttr.trim();
      if (phoneLabel && phoneLabel.textContent) return phoneLabel.textContent.trim();
      return '';
    };

    phoneBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const raw = readNumber();
      if (numDisplay) numDisplay.textContent = raw || '—';
      if (window.bootstrap && modalEl) {
        try { new bootstrap.Modal(modalEl).show(); } catch (e) {
          const tel = sanitizeTel(raw);
          if (tel) window.location.href = `tel:${tel}`;
        }
      } else {
        const tel = sanitizeTel(raw);
        if (tel) window.location.href = `tel:${tel}`;
      }
    });

    if (callPhoneBtn) {
      callPhoneBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const raw = readNumber();
        const tel = sanitizeTel(raw);
        if (!tel) { alert('Phone number not available or invalid.'); return; }
        try { const m = window.bootstrap && modalEl ? bootstrap.Modal.getInstance(modalEl) : null; if (m) m.hide(); } catch (e) {}
        window.location.href = `tel:${tel}`;
      });
    }

    if (callWhatsAppBtn) {
      callWhatsAppBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        const raw = readNumber();
        const waNumber = sanitizeForWa(raw);
        if (!waNumber) { alert('Phone number not available or not suitable for WhatsApp (needs country code).'); return; }
        try { const m = window.bootstrap && modalEl ? bootstrap.Modal.getInstance(modalEl) : null; if (m) m.hide(); } catch (e) {}
        window.open(`https://wa.me/${waNumber}`, '_blank');
      });
    }

    phoneBtn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); phoneBtn.click(); }
    });
  });
})();



(function () {
  'use strict';

  if (window.__ARTVAULT_SHOP_INITIALIZED) return;
  window.__ARTVAULT_SHOP_INITIALIZED = true;

  const debug = false;
  function log(...a){ if(debug) console.log('[shop]', ...a); }
  function warn(...a){ if(debug) console.warn('[shop]', ...a); }

  // ---------- small helpers ----------
  function safeGet(id){ return document.getElementById(id) || null; }
  function safeQuery(sel){ return Array.from(document.querySelectorAll(sel || '') || []); }

  // ---------- Data (products etc.) ----------
  const products = [
    { id: 1, title: "Swing Lady", category: "historical", price: 1200, oldPrice: 2000, img: "assets/images/Historical img jpg.jpg" },
    { id: 2, title: "Red Flowers", category: "digital", price: 1000, oldPrice: 2000, img: "assets/images/digital art piecejpg.jpg" },
    { id: 3, title: "Mystic Window", category: "digital", price: 480, img: "assets/images/window girl.jpg" },
    { id: 4, title: "Moon Light", category: "anime", price: 1600, img: "assets/images/moon.jpg" },
    { id: 5, title: "Sailor Cat", category: "anime", price: 1000, oldPrice: 1600, img: "assets/images/blue eye kittenjpg.jpg" },
    { id: 6, title: "Girl with Earring", category: "historical", price: 3000, oldPrice: 4500, img: "assets/images/Girl with pearl earring.jpg" }
  ];

  let cart = [];

  // ---------- utility functions ----------
  function formatPrice(n){ return `$${n.toLocaleString()}`; }
  function findCartIndexByProductId(productId){ return cart.findIndex(c=>c.id===productId); }
  function isInCart(productId){ return findCartIndexByProductId(productId) !== -1; }

  function setAddButtonState(productId, added){
    const selector = `.add-to-cart[data-id="${productId}"]`;
    document.querySelectorAll(selector).forEach(btn=>{
      if(added){
        btn.textContent = "Added to Cart";
        btn.classList.remove("btn-outline-secondary","btn-dark","btn-primary");
        btn.classList.add("btn-success");
        btn.disabled = true;
      } else {
        btn.textContent = "Add to Cart";
        btn.classList.remove("btn-success");
        btn.classList.add("btn-outline-secondary");
        btn.disabled = false;
      }
    });
  }

  // ---------- product rendering / modal / cart (kept concise) ----------
  function renderProducts(list){
    const productList = safeGet('productList');
    if(!productList) return;
    productList.innerHTML = '';
    list.forEach(p=>{
      const inCart = isInCart(p.id);
      const addBtnClass = inCart ? 'btn-success' : 'btn-outline-secondary';
      const addBtnText = inCart ? 'Added to Cart' : 'Add to Cart';

      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4';
      col.innerHTML = `
        <div class="card product-card h-100">
          <img src="${p.img}" class="card-img-top product-img" alt="${p.title}" onerror="this.style.opacity=.6;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${p.title}</h5>
            <p class="price mb-3">${formatPrice(p.price)}${p.oldPrice ? `<span class="old-price">${formatPrice(p.oldPrice)}</span>` : ''}</p>
            <div class="mt-auto d-grid gap-2">
              <button class="btn btn-dark" data-action="view" data-id="${p.id}">View Details</button>
              <button class="btn ${addBtnClass} add-to-cart" data-action="add" data-id="${p.id}">${addBtnText}</button>
            </div>
          </div>
        </div>
      `;
      productList.appendChild(col);
    });
  }

  function ensureProductModal(){
    if (document.getElementById('productDetailModal')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" id="productDetailModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="productDetailTitle"></h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body d-flex gap-3">
              <img id="productDetailImg" src="" alt="" style="width:45%;object-fit:cover;border-radius:6px">
              <div>
                <p id="productDetailPrice" class="h5"></p>
                <p id="productDetailDesc" class="text-muted"></p>
                <div class="mt-3">
                  <button id="productDetailAdd" class="btn btn-outline-secondary add-to-cart" data-action="add">Add to Cart</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrapper);
  }

  function openProductModal(product){
    ensureProductModal();
    const title = safeGet('productDetailTitle');
    const img = safeGet('productDetailImg');
    const price = safeGet('productDetailPrice');
    const desc = safeGet('productDetailDesc');
    const addBtn = safeGet('productDetailAdd');

    if(title) title.textContent = product.title;
    if(img) img.src = product.img;
    if(price) price.innerHTML = `${formatPrice(product.price)}${product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : ''}`;
    if(desc) desc.textContent = `Category: ${product.category} — ID: ${product.id}`;
    if(addBtn){ addBtn.dataset.id = product.id; setAddButtonState(product.id, isInCart(product.id)); }

    try {
      if(window.bootstrap && document.getElementById('productDetailModal')) {
        new bootstrap.Modal(document.getElementById('productDetailModal')).show();
      }
    } catch(e){ warn('Could not show product modal — bootstrap may be missing', e); }
  }

  function ensureCartModal(){
    if(document.getElementById('cartModal')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" id="cartModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-md modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Your Cart</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body"><div id="cartItems"></div><hr>
              <div class="d-flex justify-content-between align-items-center">
                <strong>Total:</strong>
                <strong id="cartTotal">$0</strong>
              </div></div>
            <div class="modal-footer">
              <button id="checkoutBtn" class="btn btn-dark">Checkout</button>
              <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrapper);
    const checkout = safeGet('checkoutBtn');
    if(checkout) checkout.addEventListener('click', ()=>{
      cart.forEach(e=>setAddButtonState(e.id,false));
      cart = [];
      updateCartUI();
      try { const modal = bootstrap.Modal.getInstance(document.getElementById('cartModal')); if(modal) modal.hide(); } catch(e){}
      alert('Checkout simulated — thank you!');
    });
  }

  function updateCartUI(){
    const countEl = safeGet('cartCount');
    if(countEl) countEl.textContent = cart.length;
    const countFloat = safeGet('cartCountFloat');
    if(countFloat) countFloat.textContent = cart.length;

    const itemsEl = safeGet('cartItems');
    if(!itemsEl) return;
    itemsEl.innerHTML = '';
    let total = 0;
    if(cart.length === 0){
      itemsEl.innerHTML = '<p class="text-muted">Your cart is empty.</p>';
    } else {
      cart.forEach((entry, idx)=>{
        const product = products.find(p=>p.id===entry.id);
        if(!product) return;
        total += product.price * entry.qty;
        const item = document.createElement('div');
        item.className = 'd-flex align-items-center gap-2 mb-2';
        item.innerHTML = `
          <img src="${product.img}" style="width:64px;height:64px;object-fit:cover;border-radius:6px">
          <div class="flex-grow-1">
            <div>${product.title} <small class="text-muted">x${entry.qty}</small></div>
            <div class="text-muted small">${formatPrice(product.price)} each</div>
          </div>
          <div class="text-end">
            <div class="mb-1">
              <button class="btn btn-sm btn-outline-secondary" data-idx="${idx}" data-action="decrease">−</button>
              <button class="btn btn-sm btn-outline-secondary" data-idx="${idx}" data-action="increase">+</button>
            </div>
            <button class="btn btn-sm btn-danger" data-idx="${idx}" data-action="remove">Remove</button>
          </div>`;
        itemsEl.appendChild(item);
      });
    }
    const totalEl = safeGet('cartTotal');
    if(totalEl) totalEl.textContent = formatPrice(total);
  }

  function addToCart(productId){
    const idx = findCartIndexByProductId(productId);
    if(idx>=0) cart[idx].qty += 1;
    else { cart.push({id:productId, qty:1}); setAddButtonState(productId,true); }
    updateCartCountFlash(); updateCartUI();
        // Show notification
    const toastElement = document.getElementById('cartToast');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
  }

  function removeFromCartByIndex(idx){
    if(idx<0||idx>=cart.length) return;
    const removedId = cart[idx].id;
    cart.splice(idx,1);
    if(!isInCart(removedId)) setAddButtonState(removedId,false);
    updateCartUI(); updateCartCountFlash();
  }

  function updateCartCountFlash(){
    const el = safeGet('cartCount');
    if(!el) return;
    el.textContent = cart.length;
    try{ el.animate([{transform:'scale(1)'},{transform:'scale(1.15)'},{transform:'scale(1)'}], {duration:250}); }catch(e){}
  }

  // ---------- Filters ----------
  function applyFilters(){
    const catEl = safeGet('categoryFilter'), sortEl = safeGet('sortFilter'), searchEl = safeGet('searchInput');
    const cat = (catEl && catEl.value) || 'all';
    const sort = (sortEl && sortEl.value) || 'default';
    const q = (searchEl && searchEl.value.trim().toLowerCase()) || '';
    let result = products.filter(p=>{
      if(cat!=='all' && p.category!==cat) return false;
      if(q && !p.title.toLowerCase().includes(q) && !p.category.toLowerCase().includes(q)) return false;
      return true;
    });
    if(sort==='low') result.sort((a,b)=>a.price-b.price);
    if(sort==='high') result.sort((a,b)=>b.price-a.price);
    renderProducts(result);
  }

  // ---------- Global click delegation ----------
  document.addEventListener('click',(e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const action = btn.dataset.action;
    if(action==='view'){
      const id = parseInt(btn.dataset.id,10);
      const p = products.find(x=>x.id===id);
      if(p) openProductModal(p);
      return;
    }
    if(action==='add'){
      const id = parseInt(btn.dataset.id,10);
      if(!Number.isNaN(id)){ addToCart(id); setAddButtonState(id,true); renderProducts(products); }
      return;
    }
    if(btn.dataset.action && ['increase','decrease','remove'].includes(btn.dataset.action) && btn.dataset.idx!==undefined){
      const idx = parseInt(btn.dataset.idx,10), a = btn.dataset.action;
      if(a==='remove') removeFromCartByIndex(idx);
      else if(a==='increase'){ if(cart[idx]){ cart[idx].qty +=1; updateCartUI(); updateCartCountFlash(); } }
      else if(a==='decrease'){ if(cart[idx]){ cart[idx].qty -=1; if(cart[idx].qty<=0) removeFromCartByIndex(idx); else { updateCartUI(); updateCartCountFlash(); } } }
    }
  });

  // ---------- Hover toggles ----------
  document.addEventListener('mouseover', e=>{ const c = e.target.closest('.product-card'); if(c) c.classList.add('hovered'); });
  document.addEventListener('mouseout', e=>{ const c = e.target.closest('.product-card'); if(c) c.classList.remove('hovered'); });

  // ---------- Newsletter ----------
  function attachNewsletter(){
    const form = safeGet('newsletterForm'), msg = safeGet('newsletterMsg');
    if(!form) return;
    form.addEventListener('submit',(e)=>{ e.preventDefault(); if(msg){ msg.classList.remove('d-none'); setTimeout(()=>msg.classList.add('d-none'),4000); } form.reset(); });
  }

  // ---------- Carousel/Nav cart hookup ----------
  function attachCarouselCartButton(){
    const ids = ['carouselCartBtn','callBtn','navCartBtn','cartBtn'];
    let btn=null;
    for(const id of ids){ btn = safeGet(id); if(btn) break; }
    if(!btn){ log('No carousel/nav cart button found'); return; }
    btn.addEventListener('click', ev=>{ ev.preventDefault(); ensureCartModal(); try{ const modal = new bootstrap.Modal(document.getElementById('cartModal')); modal.show(); }catch(e){ warn('Could not open cart modal', e); } });
  }

  // ---------- Scroll animation + smooth scroll fallback (defensive) ----------
  function setupScrollAnimations(){
    const fadeEls = safeQuery('.fade-in-on-scroll');
    if(fadeEls.length === 0) { log('No fade-in-on-scroll elements found — skipping observer.'); return; }

    if('IntersectionObserver' in window){
      try {
        const observer = new IntersectionObserver(entries=>{
          entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('visible'); });
        }, {threshold: 0.15});
        fadeEls.forEach(el => observer.observe(el));
      } catch(e){ warn('IntersectionObserver setup failed', e); }
    } else {
      // fallback: just add visible class
      fadeEls.forEach(el => el.classList.add('visible'));
    }

    // Smooth scroll fallback for internal anchors
    const anchors = safeQuery('a[href^="#"]');
    anchors.forEach(a=>{
      try {
        const href = a.getAttribute('href');
        if(!href || href === '#') return;
        const target = document.querySelector(href);
        if(!target) return;
        a.addEventListener('click', (ev)=>{ ev.preventDefault(); target.scrollIntoView({behavior:'smooth', block:'start'}); });
      } catch(e){ /* ignore invalid selectors */ }
    });
  }

  // ---------- Gallery filtering + quick view (defensive) ----------
  function setupGallery(){
    const filterButtons = safeQuery('[data-filter]');
    const galleryItems = safeQuery('.gallery-item');

    if(filterButtons.length === 0 || galleryItems.length === 0){
      log('Gallery controls or items missing — skipping gallery setup.');
    } else {
      filterButtons.forEach(btn=>{
        btn.addEventListener('click', ()=>{
          filterButtons.forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          const category = btn.getAttribute('data-filter');
          galleryItems.forEach(item=>{
            item.style.display = (category==='all' || item.dataset.category === category) ? 'block' : 'none';
          });
        });
      });
    }

    // Quick view modal (guarded)
    const artModalEl = safeGet('artModal');
    const modalImg = safeGet('modal-img');
    const modalTitle = document.querySelector('.modal-title') || null;
    const modalDesc = safeGet('modal-desc');

    if(!artModalEl || !modalImg){
      log('Art modal or modal image missing — skipping quick view modal setup.');
    } else {
      // ensure bootstrap exists
      let galleryModalInstance = null;
      if(window.bootstrap){
        try { galleryModalInstance = new bootstrap.Modal(artModalEl); } catch(e){ warn('Could not create gallery modal instance', e); galleryModalInstance = null; }
      }

      safeQuery('.gallery-item img').forEach(img => {
        img.addEventListener('click', ()=>{
          if(modalImg) modalImg.src = img.src;
          if(modalTitle) modalTitle.textContent = img.alt || '';
          if(modalDesc) modalDesc.textContent = img.dataset.desc || "This is a beautiful piece of art that captures timeless beauty.";
          if(galleryModalInstance) galleryModalInstance.show();
        });
      });
    }
  }

  // ---------- Init ----------
  function init(){
    if(!safeGet('productList')){
      // If shop not on page, we still set up global helpers that won't break:
      setupScrollAnimations();
      setupGallery();
      log('Shop elements not found; only global UI helpers initialized.');
      return;
    }

    try{
      renderProducts(products);
      ensureProductModal();
      ensureCartModal();
      attachNewsletter();
      attachCarouselCartButton();

      // Filters & search
      const catEl = safeGet('categoryFilter'); if(catEl) catEl.addEventListener('change', applyFilters);
      const sortEl = safeGet('sortFilter'); if(sortEl) sortEl.addEventListener('change', applyFilters);
      const searchEl = safeGet('searchInput'); if(searchEl) searchEl.addEventListener('input', applyFilters);

      // global UI helpers
      setupScrollAnimations();
      setupGallery();

      updateCartUI();
      log('Shop initialized.');
    } catch(e){
      warn('Shop init caught error', e);
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})(); // end IIFE
//================Contact us modal script==================
     document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const notification = document.getElementById('notification');
    
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Reset notification
      notification.classList.add('hidden');
      
      // Validate form
      if (!contactForm.checkValidity()) {
        showNotification('Please fill in all required fields correctly.', 'error');
        return;
      }
      
      // Show loading state
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Sending...';
      submitButton.disabled = true;
      
      // Simulate sending (1.5 second delay)
      setTimeout(() => {
        showNotification('Your message has been delivered successfully!', 'success');
        contactForm.reset();
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
      }, 1500);
    });
    
    function showNotification(message, type) {
      notification.textContent = message;
      notification.className = 'notification ' + type;
      notification.classList.remove('hidden');
      
      // Scroll to notification
      notification.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
