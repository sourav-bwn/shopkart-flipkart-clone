// Run with: node --test tests/*.test.cjs
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function storefront(){
    const nodes={}; let ready;
    const context=vm.createContext({
        localStorage:{getItem:()=>null},
        document:{
            getElementById:id=>nodes[id] ||= {value:'',querySelectorAll:()=>[]},
            addEventListener:(event,fn)=>ready=fn,
            querySelectorAll:()=>[],createElement:()=>({}),head:{appendChild(){}}
        }
    });
    vm.runInContext(fs.readFileSync(path.join(root,'js/products.js'),'utf8'),context);
    vm.runInContext(fs.readFileSync(path.join(root,'js/app.js'),'utf8'),context);
    context.renderDeals=()=>{};context.updateCart=()=>{};
    context.setupEventListeners=()=>{};context.startDealTimer=()=>{};
    ready();
    return {nodes,context};
}
test('initial price range includes every catalog product',()=>{
    const {nodes,context}=storefront();
    const max=vm.runInContext('Math.max(...products.map(p=>p.price))',context);
    assert.ok(Number(nodes['price-range'].max)>=max);
    const count=(nodes['products-grid'].innerHTML.match(/class="product-card"/g)||[]).length;
    assert.equal(count,vm.runInContext('products.length',context));
    assert.equal(Number(nodes['price-range'].value),Number(nodes['price-range'].max));
});
test('clear filters restores the full catalog after a low-price filter',()=>{
    const {nodes,context}=storefront();
    vm.runInContext('currentFilters.maxPrice=1000;renderProducts()',context);
    const filtered=(nodes['products-grid'].innerHTML.match(/class="product-card"/g)||[]).length;
    assert.ok(filtered<vm.runInContext('products.length',context));
    context.clearFilters();
    const count=(nodes['products-grid'].innerHTML.match(/class="product-card"/g)||[]).length;
    assert.equal(count,vm.runInContext('products.length',context));
    assert.equal(nodes['max-price'].textContent,`₹${Number(nodes['price-range'].max).toLocaleString()}`);
});
