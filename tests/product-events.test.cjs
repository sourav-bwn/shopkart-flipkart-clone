// Run with: node --test tests/*.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function element(productId = 1) {
    return { dataset: {productId: String(productId)}, listeners: [],
        addEventListener(type, handler) { this.listeners.push(handler); } };
}

test('filtering and sorting do not duplicate deal card or cart-button listeners', () => {
    const dealCard = element(), dealButton = element();
    let gridCard, gridButton;
    const grid = {
        set innerHTML(value) { gridCard = element(); gridButton = element(); },
        querySelectorAll(selector) { return selector === '.product-card' ? [gridCard] : [gridButton]; }
    };
    const nodes = {'products-grid': grid, 'deals-container': {},
        'search-input': {value: ''}, 'sort-filter': {value: 'default'}};
    const context = vm.createContext({
        localStorage: {getItem: () => null},
        document: {
            getElementById: id => nodes[id] ||= {},
            addEventListener() {}, createElement: () => ({}), head: {appendChild() {}},
            querySelectorAll(selector) {
                if (selector === '.product-card') return [gridCard, dealCard];
                if (selector === '.add-to-cart-btn') return [gridButton, dealButton];
                return selector.endsWith('.product-card') ? [dealCard] : [dealButton];
            }
        }
    });
    vm.runInContext(fs.readFileSync(path.join(root, 'js/products.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(root, 'js/app.js'), 'utf8'), context);
    vm.runInContext('renderProducts(); renderDeals();', context);
    for (let i = 0; i < 5; i++) vm.runInContext('renderProducts()', context);
    assert.equal(dealButton.listeners.length, 1, 'deal button must have exactly one click listener');
    assert.equal(dealCard.listeners.length, 1, 'deal card must have exactly one click listener');
    assert.equal(gridButton.listeners.length, 1);
    assert.equal(gridCard.listeners.length, 1);
    let additions = 0, details = 0;
    context.addToCart = () => additions++;
    context.showProductDetail = () => details++;
    dealButton.listeners.forEach(handler => handler({stopPropagation() {}}));
    dealCard.listeners.forEach(handler => handler({target: {classList: {contains: () => false}}}));
    assert.equal(additions, 1, 'one click must add only one item');
    assert.equal(details, 1, 'one click must open details only once');
});
