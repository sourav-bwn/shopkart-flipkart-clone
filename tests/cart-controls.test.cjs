// Run with: node --test tests/*.test.cjs
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function app(saved){
    const nodes={}, listeners={}; let writes=0;
    function element(){return {value:'',classList:{active:true,add(){this.active=true},remove(){this.active=false}},addEventListener(){}};}
    const document={getElementById:id=>nodes[id]??=element(),addEventListener:(type,fn)=>listeners[type]=fn,
        querySelector:()=>element(),querySelectorAll:()=>[],createElement:()=>({}),head:{appendChild(){}},body:{style:{overflow:'hidden'}}};
    const context=vm.createContext({document,window:{addEventListener(){}},localStorage:{getItem:()=>saved,setItem(){writes++;}}});
    vm.runInContext(fs.readFileSync(path.join(root,'js/products.js'),'utf8'),context);
    vm.runInContext(fs.readFileSync(path.join(root,'js/app.js'),'utf8'),context);
    context.showNotification=()=>{};
    return {context,nodes,listeners,document,writes:()=>writes,run:code=>vm.runInContext(code,context),cart:()=>JSON.parse(vm.runInContext('JSON.stringify(cart)',context))};
}
test('duplicate saved product rows combine quantities into one current-catalog entry',()=>{
    const x=app(JSON.stringify([{id:1,quantity:2,name:'Stale'},{id:1,quantity:3},{id:2,quantity:1}]));
    assert.equal(x.cart().length,2);assert.equal(x.cart()[0].quantity,5);assert.notEqual(x.cart()[0].name,'Stale');
    x.context.updateQuantity(1,1);assert.equal(x.cart()[0].quantity,6);
});
test('combining duplicate rows never overflows safe integer quantity',()=>{
    const x=app(JSON.stringify([{id:1,quantity:Number.MAX_SAFE_INTEGER},{id:1,quantity:1}]));
    assert.equal(x.cart().length,1);assert.equal(x.cart()[0].quantity,Number.MAX_SAFE_INTEGER);
});
test('add and plus button preserve a maximum safe quantity without persisting overflow',()=>{
    const x=app(JSON.stringify([{id:1,quantity:Number.MAX_SAFE_INTEGER}]));
    x.context.addToCart(1);x.context.updateQuantity(1,1);
    assert.equal(x.cart()[0].quantity,Number.MAX_SAFE_INTEGER);assert.equal(x.writes(),0);
});
test('quantity changes reject fractions and nonnumeric values but minus still removes at zero',()=>{
    const x=app(JSON.stringify([{id:1,quantity:1}]));
    for(const change of [NaN,Infinity,0.5,'1',null])x.context.updateQuantity(1,change);
    assert.equal(x.cart()[0].quantity,1);assert.equal(x.writes(),0);
    x.context.updateQuantity(1,-1);assert.deepEqual(x.cart(),[]);assert.equal(x.writes(),1);
});
