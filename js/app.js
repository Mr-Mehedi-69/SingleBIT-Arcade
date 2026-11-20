(()=> {
const games=window.SINGLEBIT_GAMES||[],grid=document.querySelector('#grid'),search=document.querySelector('#search'),sort=document.querySelector('#sort'),filters=[...document.querySelectorAll('[data-filter]')],favBtn=document.querySelector('#favorites-only');
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
let category='all',favorites=read('sbArcadeFavorites',[]),played=read('sbArcadePlayed',[]),history=read('sbArcadeHistory',[]),onlyFavorites=false;
const save=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const symbol=g=>({snake:'🐍',race:'🏎️',zombie:'🧟',space:'🚀',forest:'🌲💎'}[g.art]||'🎮');
function render(){
let q=search.value.trim().toLowerCase();
let list=games.filter(g=>(category==='all'||g.category===category)&&(!onlyFavorites||favorites.includes(g.id))&&(g.title+' '+g.description+' '+g.tag).toLowerCase().includes(q));
if(sort.value==='az')list.sort((a,b)=>a.title.localeCompare(b.title));
if(sort.value==='za')list.sort((a,b)=>b.title.localeCompare(a.title));
grid.innerHTML=list.map(g=>{let fav=favorites.includes(g.id);return `<article class="game-card"><a class="game-art ${esc(g.art)}" href="${esc(g.url)}" data-play="${esc(g.id)}" aria-label="Play ${esc(g.title)}"><span class="art-symbol">${symbol(g)}</span><span class="art-tag">${esc(g.tag)}</span><span class="art-play">▶ PLAY</span></a><div class="card-content"><div class="card-title-row"><h3>${esc(g.title)}</h3><button class="heart ${fav?'saved':''}" data-fav="${esc(g.id)}" aria-label="${fav?'Remove from':'Add to'} favourites" aria-pressed="${fav}">${fav?'♥':'♡'}</button></div><p>${esc(g.description)}</p><div class="card-meta"><span>${esc(g.difficulty)}</span><a href="${esc(g.url)}" class="play-link" data-play="${esc(g.id)}">PLAY NOW ↗</a></div></div></article>`}).join('');
document.querySelector('#empty').hidden=list.length!==0;
document.querySelector('#game-count').textContent=String(games.length).padStart(2,'0');const total=document.querySelector('#total-games');if(total)total.textContent=String(games.length).padStart(2,'0');
grid.querySelectorAll('[data-fav]').forEach(btn=>btn.addEventListener('click',()=>{let id=btn.dataset.fav;favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[...favorites,id];save('sbArcadeFavorites',favorites);render()}));
grid.querySelectorAll('[data-play]').forEach(link=>link.addEventListener('click',()=>{let id=link.dataset.play;played=[id,...played.filter(x=>x!==id)].slice(0,10);save('sbArcadePlayed',played);history=[{id,at:new Date().toISOString()},...history.filter(x=>x.id!==id)].slice(0,20);save('sbArcadeHistory',history)}));
}
search.addEventListener('input',render);sort.addEventListener('change',render);
filters.forEach(btn=>btn.addEventListener('click',()=>{filters.forEach(b=>b.classList.remove('active'));btn.classList.add('active');category=btn.dataset.filter;render()}));
favBtn.addEventListener('click',()=>{onlyFavorites=!onlyFavorites;favBtn.classList.toggle('active',onlyFavorites);favBtn.setAttribute('aria-pressed',String(onlyFavorites));render()});
document.querySelector('#year').textContent=new Date().getFullYear();render();
})();