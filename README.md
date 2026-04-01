# ShopKart - Flipkart-like E-commerce Website

A modern e-commerce website inspired by Flipkart, built with HTML, CSS, and JavaScript.

## Features

### 1. **Product Browsing**
- Browse products across 6 categories: Electronics, Fashion, Home & Furniture, Appliances, Toys & Baby, and Grocery
- View product details including price, discount, ratings, and delivery information
- Deals of the Day section with countdown timer

### 2. **Search & Filters**
- Real-time search functionality
- Filter by price range, brand, rating, and discount
- Sort products by price, rating, or discount
- Clear all filters option

### 3. **Shopping Cart**
- Add products to cart
- Update quantity
- Remove items
- Persistent cart (saves to localStorage)
- Cart sidebar with total calculation

### 4. **Product Details**
- Click on any product to view detailed information
- Product description, pricing, and delivery info
- Add to Cart and Buy Now options

### 5. **User Interface**
- Flipkart-inspired blue and orange color scheme
- Responsive design for desktop, tablet, and mobile
- Smooth animations and transitions
- Login modal (UI only)
- Notification system for cart actions

### 6. **Navigation**
- Category navigation in header
- Category cards on homepage
- Breadcrumb-style navigation

## How to Use

1. **Open the website**: Simply open `index.html` in your web browser
2. **Browse products**: Scroll down to see all products or use category filters
3. **Search**: Type in the search bar to find specific products
4. **Filter**: Use the sidebar filters to narrow down products
5. **Add to cart**: Click "Add to Cart" button on any product
6. **View cart**: Click the cart icon in the header to see your cart
7. **Checkout**: Click "Proceed to Checkout" in the cart (demo only)

## File Structure

```
flipkart-clone/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # All styles
├── js/
│   ├── products.js    # Product data (30 products)
│   └── app.js         # Main application logic
└── images/            # Image directory (using external URLs)
```

## Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Flexbox, Grid, animations, responsive design
- **JavaScript**: ES6+, localStorage, DOM manipulation
- **Font Awesome**: Icons
- **Google Fonts**: Roboto font

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Notes

- Product images are loaded from Unsplash (requires internet connection)
- Cart data persists in browser localStorage
- Login functionality is UI-only (no backend)
- Checkout is demo-only (no payment processing)