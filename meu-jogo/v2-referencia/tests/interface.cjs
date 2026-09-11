/* Headless rendering smoke check; no browser, screenshot or visual validation. */
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../dist/index.html'),'utf8');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
const noop=()=>{};const gradient={addColorStop:noop};const context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get(t,k){return k in t?t[k]:noop}});
const elements=new Map(ids.map(id=>[id,{id,textContent:'',innerHTML:'',hidden:false,disabled:false,style:{},dataset:{},classList:{toggle:noop,add:noop,remove:noop},setAttribute:noop,addEventListener:noop,getBoundingClientRect:()=>({width:720,height:540,left:0,top:0}),getContext:()=>context}]));elements.get('game').parentElement={classList:{toggle:noop}};
const sandbox={console,Math,Number,Array,Error,Promise,AbortController,document:{getElementById:id=>{assert(elements.has(id),'Missing element '+id);return elements.get(id)},querySelectorAll:()=>[],addEventListener:noop},window:{devicePixelRatio:1,matchMedia:()=>({matches:false}),addEventListener:noop},Image:class {complete=false},localStorage:{getItem:()=>0,setItem:noop},requestAnimationFrame:noop};
vm.createContext(sandbox);for(const name of ['engine.js','game.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/'+name),'utf8'),sandbox);
vm.runInContext(`$('start').onclick();choose(0);game.build(4,0);game.build(7,1);game.nextWave();for(let i=0;i<800;i++){game.step(.05);animateFx(.05);if(i%4===0){draw();ui()}}if(g.metrics.towerDamage<=0)throw Error('Combat did not reach the line');$('pause').onclick();draw();ui();$('pause').onclick();`,sandbox);
console.log('Game UI initialization, active combat render calls, pause, and DOM references: OK');
