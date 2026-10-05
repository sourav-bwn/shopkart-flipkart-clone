// ShopKart - Main Application JavaScript

// Recover saved quantities using current catalog data, not stale stored product fields.
function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem('cart'));
        if (!Array.isArray(saved)) return [];
        return saved.flatMap(item => {
            if (!item || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) return [];
            const product = products.find(p => p.id === item.id);
            return product ? [{ ...product, quantity: item.quantity }] : [];
        });
    } catch {
        // Corrupt JSON or unavailable storage must not prevent the storefront loading.
        return [];
    }
}
let cart = loadCart();
let currentCategory = 'all';
const catalogMaxPrice = Math.ceil(Math.max(0, ...products.map(p => p.price)) / 1000) * 1000;
let currentFilters = {
    maxPrice: catalogMaxPrice,
    brands: [],
    minRating: 0,
    minDiscount: 0
};

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const dealsContainer = document.getElementById('deals-container');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const loginModal = document.getElementById('login-modal');
const productModal = document.getElementById('product-modal');
const searchInput = document.getElementById('search-input');
const sortFilter = document.getElementById('sort-filter');
const priceRange = document.getElementById('price-range');
const maxPriceLabel = document.getElementById('max-price');
const productsTitle = document.getElementById('products-title');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    priceRange.max = catalogMaxPrice;
    priceRange.value = catalogMaxPrice;
    maxPriceLabel.textContent = `₹${catalogMaxPrice.toLocaleString()}`;
    renderProducts();
    renderDeals();
    updateCart();
    setupEventListeners();
    startDealTimer();
});

// Setup Event Listeners
function setupEventListeners() {
    // Cart toggle
    document.querySelector('.cart-icon').addEventListener('click', openCart);
    document.getElementById('close-cart').addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    // Login modal
    document.getElementById('login-btn').addEventListener('click', () => loginModal.classList.add('active'));
    document.getElementById('close-modal').addEventListener('click', () => loginModal.classList.remove('active'));

    // Product modal
    document.getElementById('close-product-modal').addEventListener('click', () => productModal.classList.remove('active'));

    // Category clicks
    document.querySelectorAll('.category-card, .nav-item a').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const category = item.dataset.category;
            filterByCategory(category);
        });
    });

    // Search functionality
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Sort filter
    sortFilter.addEventListener('change', () => {
        renderProducts();
    });

    // Price range filter
    priceRange.addEventListener('input', (e) => {
        currentFilters.maxPrice = parseInt(e.target.value);
        maxPriceLabel.textContent = `₹${currentFilters.maxPrice.toLocaleString()}`;
        renderProducts();
    });

    // Brand filters
    document.querySelectorAll('.brand-filters input').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            currentFilters.brands = Array.from(document.querySelectorAll('.brand-filters input:checked'))
                .map(cb => cb.value.toLowerCase());
            renderProducts();
        });
    });

    // Rating filters
    document.querySelectorAll('.rating-filters input').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checked = document.querySelectorAll('.rating-filters input:checked');
            currentFilters.minRating = checked.length > 0 ? Math.min(...Array.from(checked).map(cb => parseInt(cb.value))) : 0;
            renderProducts();
        });
    });

    // Discount filters
    document.querySelectorAll('.discount-filters input').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checked = document.querySelectorAll('.discount-filters input:checked');
            currentFilters.minDiscount = checked.length > 0 ? Math.min(...Array.from(checked).map(cb => parseInt(cb.value))) : 0;
            renderProducts();
        });
    });

    // Clear filters
    document.querySelector('.clear-filters').addEventListener('click', clearFilters);

    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Login functionality would connect to backend in real application');
        loginModal.classList.remove('active');
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.classList.remove('active');
        if (e.target === productModal) productModal.classList.remove('active');
    });
}

// Render Products
function renderProducts() {
    let filteredProducts = [...products];

    // Filter by category
    if (currentCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === currentCategory);
    }

    // Filter by search
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.brand.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
        );
    }

    // Apply filters
    filteredProducts = filteredProducts.filter(p => {
        if (p.price > currentFilters.maxPrice) return false;
        if (currentFilters.brands.length > 0 && !currentFilters.brands.includes(p.brand.toLowerCase())) return false;
        if (p.rating < currentFilters.minRating) return false;
        if (p.discount < currentFilters.minDiscount) return false;
        return true;
    });

    // Sort products
    const sortValue = sortFilter.value;
    switch (sortValue) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'discount':
            filteredProducts.sort((a, b) => b.discount - a.discount);
            break;
    }

    // Render to grid
    productsGrid.innerHTML = filteredProducts.length > 0 
        ? filteredProducts.map(product => createProductCard(product)).join('')
        : '<div class="empty-cart"><i class="fas fa-search"></i><p>No products found</p></div>';

    // Add click listeners to product cards
    productsGrid.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('add-to-cart-btn')) {
                const productId = parseInt(card.dataset.productId);
                showProductDetail(productId);
            }
        });
    });

    // Add to cart buttons
    productsGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(btn.dataset.productId);
            addToCart(productId);
        });
    });
}

// Create Product Card HTML
function createProductCard(product) {
    return `
        <div class="product-card" data-product-id="${product.id}">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-rating">
                    <span class="rating-badge">${product.rating} ★</span>
                    <span class="rating-count">(${product.ratingCount.toLocaleString()})</span>
                </div>
                <div class="product-price">
                    <span class="current-price">₹${product.price.toLocaleString()}</span>
                    <span class="original-price">₹${product.originalPrice.toLocaleString()}</span>
                    <span class="discount">${product.discount}% off</span>
                </div>
                <div class="product-delivery">${product.delivery}</div>
                <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
            </div>
        </div>
    `;
}

// Render Deals of the Day
function renderDeals() {
    const deals = [...products]
        .sort((a, b) => b.discount - a.discount)
        .slice(0, 5);

    dealsContainer.innerHTML = deals.map(product => createProductCard(product)).join('');

    // Add event listeners
    document.querySelectorAll('.deals-container .product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('add-to-cart-btn')) {
                const productId = parseInt(card.dataset.productId);
                showProductDetail(productId);
            }
        });
    });

    document.querySelectorAll('.deals-container .add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = parseInt(btn.dataset.productId);
            addToCart(productId);
        });
    });
}

// Show Product Detail
function showProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const detailContent = document.getElementById('product-detail-content');
    detailContent.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-detail-image">
        <div class="product-detail-info">
            <h2>${product.name}</h2>
            <div class="product-detail-rating">
                <span class="rating-badge">${product.rating} ★</span>
                <span class="rating-count">${product.ratingCount.toLocaleString()} ratings</span>
            </div>
            <div class="product-detail-price">
                <span class="current-price">₹${product.price.toLocaleString()}</span>
                <span class="original-price">₹${product.originalPrice.toLocaleString()}</span>
                <span class="discount">${product.discount}% off</span>
            </div>
            <p class="product-detail-description">${product.description}</p>
            <p class="product-delivery"><i class="fas fa-truck"></i> ${product.delivery}</p>
            <div class="product-detail-actions">
                <button class="add-to-cart-detail" onclick="addToCart(${product.id}); productModal.classList.remove('active');">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
                <button class="buy-now-detail" onclick="addToCart(${product.id}); productModal.classList.remove('active'); openCart();">
                    <i class="fas fa-bolt"></i> Buy Now
                </button>
            </div>
        </div>
    `;

    productModal.classList.add('active');
}

// Filter by Category
function filterByCategory(category) {
    currentCategory = category;
    productsTitle.textContent = category === 'all' ? 'All Products' : `${category.charAt(0).toUpperCase() + category.slice(1)} Products`;
    renderProducts();
    
    // Scroll to products section
    document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
}

// Handle Search
function handleSearch() {
    renderProducts();
}

// Clear All Filters
function clearFilters() {
    currentFilters = {
        maxPrice: catalogMaxPrice,
        brands: [],
        minRating: 0,
        minDiscount: 0
    };

    priceRange.value = catalogMaxPrice;
    maxPriceLabel.textContent = `₹${catalogMaxPrice.toLocaleString()}`;
    
    document.querySelectorAll('.filters-sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.filters-sidebar input[type="radio"]').forEach(rb => rb.checked = false);
    
    currentCategory = 'all';
    productsTitle.textContent = 'All Products';
    searchInput.value = '';
    sortFilter.value = 'default';

    renderProducts();
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart();
    updateCart();
    showNotification(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCart();
    }
}

function updateCart() {
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `₹${total.toLocaleString()}`;

    // Render cart items
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">₹${item.price.toLocaleString()}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
        `).join('');
    }
}

function openCart() {
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Deal Timer
function startDealTimer() {
    const timerElement = document.getElementById('deal-timer');
    let hours = 23, minutes = 59, seconds = 59;

    setInterval(() => {
        seconds--;
        if (seconds < 0) {
            seconds = 59;
            minutes--;
        }
        if (minutes < 0) {
            minutes = 59;
            hours--;
        }
        if (hours < 0) {
            hours = 23;
            minutes = 59;
            seconds = 59;
        }

        timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #388e3c;
        color: white;
        padding: 15px 25px;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
