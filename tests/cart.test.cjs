// Run with: node --test tests/cart.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const catalog = fs.readFileSync(path.join(root, 'js/products.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');

function restore(saved, storageError = false) {
    const nodes = {};
    const context = vm.createContext({
        localStorage: { getItem() { if (storageError) throw new Error('Storage unavailable'); return saved; } },
        document: {
            getElementById(id) { return nodes[id] ||= {}; },
            addEventListener() {},
            createElement() { return {}; },
            head: { appendChild() {} }
        }
    });
    vm.runInContext(catalog, context);
    vm.runInContext(app, context);
    vm.runInContext('updateCart()', context);
    return { cart: JSON.parse(vm.runInContext('JSON.stringify(cart)', context)), nodes };
}

test('missing, corrupt, and non-array data recover with an empty usable cart', () => {
    for (const saved of [null, '', '{broken', 'null', '{}', 'true', '42', '"cart"']) {
        const { cart, nodes } = restore(saved);
        assert.deepEqual(cart, []);
        assert.equal(nodes['cart-count'].textContent, 0);
        assert.match(nodes['cart-items'].innerHTML, /Your cart is empty/);
    }
});

test('unavailable localStorage does not stop initialization', () => {
    assert.deepEqual(restore(null, true).cart, []);
});

test('valid quantities survive and current catalog fields replace stale snapshots', () => {
    const { cart, nodes } = restore(JSON.stringify([{ id: 1, quantity: 2, price: -1, name: 'Old name' }]));
    assert.equal(cart.length, 1);
    assert.equal(cart[0].id, 1);
    assert.equal(cart[0].quantity, 2);
    assert.notEqual(cart[0].name, 'Old name');
    assert.ok(cart[0].price > 0);
    assert.equal(nodes['cart-count'].textContent, 2);
    assert.equal(nodes['cart-total'].textContent, `₹${(cart[0].price * 2).toLocaleString()}`);
});

test('invalid entries are skipped without losing valid items', () => {
    const items = [null, {}, {id: 999999, quantity: 1}, ...[0, -1, 1.5, '2', null, 1e30].map(quantity => ({id: 1, quantity})), {id: 1, quantity: 3}];
    const { cart } = restore(JSON.stringify(items));
    assert.equal(cart.length, 1);
    assert.equal(cart[0].quantity, 3);
});
