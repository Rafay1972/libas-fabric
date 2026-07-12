// State
let products = [];
let categories = [];
let slides = [];
let currentSlide = 0;
let sliderInterval;
let activeCategory = 'all';

// Cart and Wishlist (Guest mode uses localStorage)
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

const DEFAULT_SLIDES = [
  {
    image: createFabricHeroImage('Premium Pakistani Fabrics', 'Refined lawn, khaddar, silk, and more for every season.', '#c9a961', '#1a1712'),
    title: 'Premium Pakistani Fabrics',
    subtitle: 'Refined lawn, khaddar, silk, and more for every season.'
  },
  {
    image: createFabricHeroImage('Elegant Collections', 'Thoughtfully curated fabric styles with a modern shopping experience.', '#d4af37', '#191919'),
    title: 'Elegant Collections',
    subtitle: 'Thoughtfully curated fabric styles with a modern shopping experience.'
  },
  {
    image: createFabricHeroImage('Order Seamlessly', 'Add to cart, save favorites, and check out via WhatsApp in seconds.', '#b8942e', '#151515'),
    title: 'Order Seamlessly',
    subtitle: 'Add to cart, save favorites, and check out via WhatsApp in seconds.'
  }
];

const CATEGORY_IMAGES = {
  Lawn: createCategoryImage('Lawn', '#c9a961', '#15120f'),
  Khaddar: createCategoryImage('Khaddar', '#d4af37', '#111111'),
  Cotton: createCategoryImage('Cotton', '#cab27a', '#161616'),
  Silk: createCategoryImage('Silk', '#c9a961', '#181614'),
  Chiffon: createCategoryImage('Chiffon', '#d9bf72', '#161311'),
  Linen: createCategoryImage('Linen', '#b8942e', '#131313'),
  Jamawar: createCategoryImage('Jamawar', '#d4af37', '#120f0d'),
  Karandi: createCategoryImage('Karandi', '#cab27a', '#161616'),
  'Wash & Wear': createCategoryImage('Wash & Wear', '#c9a961', '#151515'),
  Boski: createCategoryImage('Boski', '#d4af37', '#111111')
};

function getAuthToken() {
  return localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('userToken') || '';
}

function ensureToastHost() {
  let host = document.getElementById('toastHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toastHost';
    host.className = 'toast-host';
    document.body.appendChild(host);
  }
  return host;
}

function showToast(message, type = 'success') {
  const host = ensureToastHost();
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = '<span class="toast-dot"></span><div class="toast-text">' + message + '</div>';
  host.appendChild(toast);
  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    window.setTimeout(() => toast.remove(), 200);
  }, 2400);
}

async function refreshAccountBadges() {
  const token = getAuthToken();
  if (!token) return;

  try {
    const [cartRes, wishRes] = await Promise.all([
      fetch('/api/cart', { headers: { Authorization: 'Bearer ' + token } }).then(function (res) { return res.json(); }),
      fetch('/api/wishlist', { headers: { Authorization: 'Bearer ' + token } }).then(function (res) { return res.json(); })
    ]);

    const totalCart = cartRes.success && Array.isArray(cartRes.cart)
      ? cartRes.cart.reduce(function (acc, item) { return acc + (item.quantity || 0); }, 0)
      : 0;
    const totalWish = wishRes.success && Array.isArray(wishRes.wishlist) ? wishRes.wishlist.length : 0;

    const cartBadge = document.getElementById('cartCount');
    const wishBadge = document.getElementById('wishlistCount');
    if (cartBadge) {
      cartBadge.textContent = totalCart;
      cartBadge.style.display = totalCart > 0 ? 'flex' : 'none';
    }
    if (wishBadge) {
      wishBadge.textContent = totalWish;
      wishBadge.style.display = totalWish > 0 ? 'flex' : 'none';
    }
  } catch (err) {
    console.error('Failed to refresh account badges', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  loadData();
  updateBadges();

  const sliderContainer = document.getElementById('heroSlider');
  if (sliderContainer) {
    sliderContainer.addEventListener('mouseenter', () => clearInterval(sliderInterval));
    sliderContainer.addEventListener('mouseleave', startAutoSlide);
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    if (prevBtn) prevBtn.addEventListener('click', () => changeSlide(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeSlide(1));
  }

  refreshAccountBadges();
});

function initMenu() {
  const hamburger = document.getElementById('hamburgerMenu');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.hamburger') && !e.target.closest('#navLinks')) {
        navLinks.classList.remove('show');
      }
    });
  }
}

async function loadData() {
  try {
    const [prodRes, catRes, slideRes] = await Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/slides').then(res => res.json())
    ]);

    if (prodRes.success) products = prodRes.products;
    if (catRes.success) categories = catRes.categories;
    if (slideRes.success && slideRes.slides.length > 0) {
      slides = slideRes.slides;
    } else {
      slides = DEFAULT_SLIDES;
    }

    renderSlider();
    renderCategories();
    renderProducts();
  } catch (err) {
    console.error('Failed to load data', err);
    document.getElementById('productsGrid').innerHTML = '<p style="color:#e74c3c;">Error loading products. Please try again later.</p>';
  }
}

// Slider
function renderSlider() {
  const track = document.getElementById('sliderTrack');
  const dots = document.getElementById('sliderDots');
  if (!track || !dots) return;

  clearInterval(sliderInterval);
  track.innerHTML = '';
  dots.innerHTML = '';
  currentSlide = 0;

  if (slides.length === 0) {
    slides = DEFAULT_SLIDES;
  }

  slides.forEach((slide, index) => {
    track.innerHTML += `
      <div class="slide" style="background-image:url('${slide.image}')">
        <div class="slide-content">
          <span class="tag">لباسِ ہدایہ</span>
          <h1>${slide.title}</h1>
          <p>${slide.subtitle}</p>
        </div>
      </div>
    `;
    dots.innerHTML += `<span class="dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></span>`;
  });

  updateSliderPosition();
  if (slides.length > 1) {
    startAutoSlide();
  }
}

function updateSliderPosition() {
  const track = document.getElementById('sliderTrack');
  if (track) track.style.transform = `translateX(-${currentSlide * 100}%)`;
  document.querySelectorAll('#sliderDots .dot').forEach((d, i) => {
    d.classList.toggle('active', i === currentSlide);
  });
}

function changeSlide(dir) {
  const total = slides.length || 1;
  currentSlide = (currentSlide + dir + total) % total;
  updateSliderPosition();
  resetAutoSlide();
}

function goToSlide(idx) {
  currentSlide = idx;
  updateSliderPosition();
  resetAutoSlide();
}

function startAutoSlide() {
  clearInterval(sliderInterval);
  if (slides.length <= 1) return;
  sliderInterval = setInterval(() => {
    const total = slides.length || 1;
    currentSlide = (currentSlide + 1) % total;
    updateSliderPosition();
  }, 5000);
}

function resetAutoSlide() {
  clearInterval(sliderInterval);
  startAutoSlide();
}

// Categories
function renderCategories() {
  const tabs = document.getElementById('filterTabs');
  const grid = document.getElementById('categoriesGrid');

  if (tabs && categories.length > 0) {
    tabs.innerHTML = `<button class="filter-tab ${activeCategory === 'all' ? 'active' : ''}" data-cat="all" onclick="filterProducts('all')">All Fabrics</button>`;
    categories.forEach(cat => {
      tabs.innerHTML += `<button class="filter-tab ${activeCategory === cat.name ? 'active' : ''}" data-cat="${cat.name}" onclick="filterProducts('${cat.name}')">${cat.name}</button>`;
    });
  }

  if (grid && categories.length > 0) {
    grid.innerHTML = categories.map(cat => {
      const count = products.filter(p => p.category === cat.name).length;
      const imageUrl = cat.image || CATEGORY_IMAGES[cat.name] || createCategoryImage(cat.name, '#c9a961', '#151515');
      return `
        <div class="category-card" onclick="filterProducts('${cat.name}')">
          <div class="cat-media" style="background-image:url('${imageUrl}')"></div>
          <div class="cat-overlay"></div>
          <div class="cat-body">
            <h4>${cat.name}</h4>
            <span class="cat-count">${count} items</span>
          </div>
        </div>
      `;
    }).join('');
  } else if (grid) {
    grid.innerHTML = '<p style="color:#888;">No categories found.</p>';
  }
}

function filterProducts(catName) {
  activeCategory = catName;
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.cat === catName);
  });
  renderProducts();
  const prodSec = document.getElementById('products');
  if (prodSec) prodSec.scrollIntoView({ behavior: 'smooth' });
}

// Products
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let filtered = products;
  if (activeCategory !== 'all') {
    filtered = products.filter(p => p.category === activeCategory);
  }

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="color:#888; text-align:center; grid-column:1/-1;">No products found in this category.</p>';
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const isWishlisted = wishlist.includes(p._id);
    const imgUrl = (p.images && p.images.length > 0) ? p.images[0] : createProductPlaceholder(p.category || 'Fabric', '#c9a961', '#151515');
    const saleBadge = (p.oldPrice && p.oldPrice > p.price) ? '<span class="product-badge">SALE</span>' : '';
    const oldPriceHtml = (p.oldPrice && p.oldPrice > p.price) ? `<span class="old-price">Rs. ${p.oldPrice.toLocaleString()}</span>` : '';

    return `
      <a href="/product.html?id=${p._id}" class="product-card">
        <div class="product-img" style="background-image:url('${imgUrl}')">
          ${saleBadge}
          <div class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="event.preventDefault(); toggleWishlist('${p._id}', event)">
            ${isWishlisted ? SVG_ICONS.heart_filled : SVG_ICONS.heart_outline}
          </div>
        </div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <h4>${p.name}</h4>
          <div class="price">Rs. ${p.price.toLocaleString()} ${oldPriceHtml}</div>
          <div class="actions-row">
            <button class="btn-cart" onclick="event.preventDefault(); addToCart('${p._id}')">
              ${SVG_ICONS.cart} Add to Cart
            </button>
            <button class="btn-order" onclick="event.preventDefault(); orderWa('${p.name}', ${p.price})">
              ${SVG_ICONS.whatsapp} Order
            </button>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

// Cart & Wishlist Logic
function toggleWishlist(id, event) {
  const token = getAuthToken();
  const index = wishlist.indexOf(id);
  if (index > -1) {
    wishlist.splice(index, 1);
  } else {
    wishlist.push(id);
  }
  localStorage.setItem('wishlist', JSON.stringify(wishlist));

  if (token) {
    fetch('/api/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ productId: id })
    }).catch(function (err) { console.error('Wishlist sync failed', err); });
  }

  if (event) {
    const btn = event.currentTarget;
    btn.classList.toggle('active');
    btn.innerHTML = wishlist.includes(id) ? SVG_ICONS.heart_filled : SVG_ICONS.heart_outline;
  }

  updateBadges();
  refreshAccountBadges();
  showToast(wishlist.includes(id) ? 'Added to wishlist' : 'Removed from wishlist');
}

async function addToCart(id, qty = 1) {
  const token = getAuthToken();
  const existing = cart.find(i => i.product === id);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ product: id, quantity: qty });
  }
  localStorage.setItem('cart', JSON.stringify(cart));

  if (token) {
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ productId: id, quantity: qty })
      });
      await refreshAccountBadges();
    } catch (err) {
      console.error('Cart sync failed', err);
    }
  }

  updateBadges();
  showToast('Added to cart');
}

function updateBadges() {
  const cartBadge = document.getElementById('cartCount');
  const wishBadge = document.getElementById('wishlistCount');

  if (cartBadge) {
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
  }

  if (wishBadge) {
    wishBadge.textContent = wishlist.length;
    wishBadge.style.display = wishlist.length > 0 ? 'flex' : 'none';
  }
}

function orderWa(name, price) {
  const msg = `Assalam-o-Alaikum! I want to order: ${name} - Rs. ${price.toLocaleString()}`;
  window.open(`https://wa.me/923194327821?text=${encodeURIComponent(msg)}`, '_blank');
}
