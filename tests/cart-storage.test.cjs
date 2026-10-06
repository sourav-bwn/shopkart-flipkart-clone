// Run with: node --test tests/*.test.cjs
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function storefront(fail){
    const nodes={};let saved;
    const context=vm.createContext({
        localStorage:{getItem:()=>null,setItem(key,value){if(fail)throw new Error('Quota exceeded');saved=value;}},
        document:{getElementById:id=>nodes[id] ||= {},addEventListener(){},createElement:()=>({}),head:{appendChild(){}}}
    });
    vm.runInContext(fs.readFileSync(path.join(root,'js/products.js'),'utf8'),context);
    vm.runInContext(fs.readFileSync(path.join(root,'js/app.js'),'utf8'),context);
    context.showNotification=()=>{};
    return {context,nodes,saved:()=>JSON.parse(saved)};
}
test('blocked storage does not stop add, quantity updates or removal',()=>{
    const {context,nodes}=storefront(true);
    assert.doesNotThrow(()=>context.addToCart(1));
    assert.equal(nodes['cart-count'].textContent,1);
    assert.doesNotThrow(()=>context.updateQuantity(1,1));
    assert.equal(nodes['cart-count'].textContent,2);
    assert.doesNotThrow(()=>context.updateQuantity(1,-1));
    assert.equal(nodes['cart-count'].textContent,1);
    assert.doesNotThrow(()=>context.removeFromCart(1));
    assert.equal(nodes['cart-count'].textContent,0);
    assert.match(nodes['cart-items'].innerHTML,/Your cart is empty/);
    assert.equal(context.saveCart(),false);
});
test('available storage still receives every cart change',()=>{
    const app=storefront(false);
    app.context.addToCart(1);assert.equal(app.saved()[0].quantity,1);
    app.context.updateQuantity(1,1);assert.equal(app.saved()[0].quantity,2);
    app.context.removeFromCart(1);assert.deepEqual(app.saved(),[]);
    assert.equal(app.context.saveCart(),true);
});
