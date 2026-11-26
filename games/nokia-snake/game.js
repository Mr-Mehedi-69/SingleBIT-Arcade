(()=>{
'use strict';
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const overlay=$('overlay'),scoreEl=$('score'),bestEl=$('best'),statusEl=$('status');
const levelEl=$('level'),foodEl=$('food-count'),modeSelect=$('mode');
const CELL=20,GRID=36,BOARD=CELL*GRID,FOODS_PER_LEVEL=5;
const THEMES=[
 {name:'NOKIA GREEN',bg:'#aabb69',grid:'#8c9e55',snake:'#354a25',light:'#e5f0b0',food:'#d82e28',obstacle:'#52633b',accent:'#43562d'},
 {name:'JUNGLE',bg:'#78965a',grid:'#66844b',snake:'#1d3825',light:'#d8efb1',food:'#ffcf38',obstacle:'#354b2b',accent:'#31552c'},
 {name:'DESERT',bg:'#d9bd83',grid:'#c6a76d',snake:'#63452b',light:'#fff0c7',food:'#c73535',obstacle:'#8b6238',accent:'#79532d'},
 {name:'ICE FIELD',bg:'#a8d5df',grid:'#8abac9',snake:'#19495c',light:'#e4fbff',food:'#ed5b68',obstacle:'#4b8292',accent:'#236276'},
 {name:'NIGHT CITY',bg:'#30334f',grid:'#424765',snake:'#d4f26a',light:'#ffffff',food:'#ff557d',obstacle:'#171c35',accent:'#747de5'},
 {name:'VOLCANIC',bg:'#563b3b',grid:'#704848',snake:'#f4c56b',light:'#fff4d6',food:'#ff6b35',obstacle:'#2b2026',accent:'#d65c39'}
];
let snake=[],food=null,obstacles=[],dir={x:1,y:0},queuedDir={x:1,y:0};
let score=0,foodEaten=0,level=1,state='ready',best=0,accumulator=0,lastTime=0,raf=0,turnLocked=false,swipeStart=null,mode='classic';
try{best=Number(localStorage.getItem('sbNokiaSnakeBest'))||0}catch{}
function theme(){return THEMES[(level-1)%THEMES.length]}
function updateHud(){
 scoreEl.textContent=score;bestEl.textContent=best;statusEl.textContent=state.toUpperCase();
 levelEl.textContent=level;foodEl.textContent=foodEaten;
 $('pause').textContent=state==='paused'?'▶ RESUME':'Ⅱ PAUSE';
 $('pause').disabled=!(state==='playing'||state==='paused');
 modeSelect.disabled=state==='playing'||state==='paused';
 $('level-name').textContent=theme().name;
 document.documentElement.style.setProperty('--snake-accent',theme().accent);
}
function saveBest(){best=Math.max(best,score);try{localStorage.setItem('sbNokiaSnakeBest',String(best))}catch{}}
function occupied(x,y){return snake.some(s=>s.x===x&&s.y===y)||obstacles.some(o=>o.x===x&&o.y===y)}
function spawnFood(){
 const free=[];
 for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++)if(!occupied(x,y))free.push({x,y});
 if(!free.length){food=null;return false}
 food=free[Math.floor(Math.random()*free.length)];
 return true;
}
function buildObstacles(){
 obstacles=[];
 if(mode==='zen')return;
 let count=mode==='adventure'?Math.min(3+level*3,34):(level<3?0:Math.min((level-2)*3,24));
 let attempts=0;
 while(obstacles.length<count&&attempts<count*40){
  attempts++;
  const p={x:2+Math.floor(Math.random()*(GRID-4)),y:2+Math.floor(Math.random()*(GRID-4))};
  const nearSnake=snake.some(s=>Math.abs(s.x-p.x)+Math.abs(s.y-p.y)<5);
  if(!nearSnake&&!occupied(p.x,p.y))obstacles.push(p);
 }
}
function setOverlay(title,description,buttonText,callback){
 overlay.innerHTML='<div class="overlay-card"><p class="overlay-kicker">SINGLEBIT ARCADE · NOKIA SNAKE</p><h2>'+title+'</h2><p>'+description+'</p><button class="btn" id="overlay-action" type="button">'+buttonText+'</button></div>';
 overlay.classList.remove('hidden');$('overlay-action').onclick=callback;
}
function reset(showStart=true){
 cancelAnimationFrame(raf);
 snake=[{x:18,y:18},{x:17,y:18},{x:16,y:18},{x:15,y:18}];
 dir={x:1,y:0};queuedDir={...dir};score=0;foodEaten=0;level=1;accumulator=0;turnLocked=false;state='ready';mode=modeSelect.value||'classic';
 buildObstacles();spawnFood();updateHud();draw();
 if(showStart)setOverlay('NOKIA SNAKE','Choose your route, collect 5 food items to level up, and watch the world transform.','START GAME',start);
}
function start(){reset(false);state='playing';overlay.classList.add('hidden');lastTime=performance.now();updateHud();raf=requestAnimationFrame(loop)}
function pause(){
 if(state==='playing'){state='paused';setOverlay('PAUSED','Your run is saved in this session. Take your time.','RESUME',pause);updateHud()}
 else if(state==='paused'){state='playing';overlay.classList.add('hidden');lastTime=performance.now();updateHud();raf=requestAnimationFrame(loop)}
}
function finish(won=false){
 state=won?'won':'over';saveBest();updateHud();
 setOverlay(won?'BOARD CLEARED!':'GAME OVER','Score: '+score+' · Level: '+level+' · Best: '+best,'PLAY AGAIN',start);
}
function levelUp(){
 level=Math.floor(foodEaten/FOODS_PER_LEVEL)+1;
 buildObstacles();
 if(!spawnFood()){finish(true);return}
 updateHud();
}
function step(){
 dir={...queuedDir};
 const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
 const eating=!!food&&head.x===food.x&&head.y===food.y;
 const hitsWall=head.x<0||head.x>=GRID||head.y<0||head.y>=GRID;
 const hitsObstacle=obstacles.some(o=>o.x===head.x&&o.y===head.y);
 const bodyToCheck=eating?snake:snake.slice(0,-1);
 const hitsSelf=bodyToCheck.some(s=>s.x===head.x&&s.y===head.y);
 if(hitsWall||hitsObstacle||hitsSelf){finish();return}
 snake.unshift(head);
 if(eating){
  score+=10;foodEaten++;saveBest();
  const nextLevel=Math.floor(foodEaten/FOODS_PER_LEVEL)+1;
  if(nextLevel!==level){levelUp();if(state!=='playing')return}
  else if(!spawnFood()){finish(true);return}
 }else snake.pop();
 turnLocked=false;updateHud();
}
function loop(t){
 if(state!=='playing')return;
 const dt=Math.min(100,t-lastTime);lastTime=t;accumulator+=dt;
 const stepMs=Math.max(62,148-(level-1)*8);
 while(accumulator>=stepMs&&state==='playing'){step();accumulator-=stepMs}
 draw();if(state==='playing')raf=requestAnimationFrame(loop);
}
function draw(){
 const pal=theme();
 ctx.fillStyle=pal.bg;ctx.fillRect(0,0,BOARD,BOARD);
 ctx.strokeStyle=pal.grid;ctx.lineWidth=1;
 for(let i=0;i<=BOARD;i+=CELL){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,BOARD);ctx.moveTo(0,i);ctx.lineTo(BOARD,i);ctx.stroke()}
 // Subtle ground pattern changes with each level.
 ctx.globalAlpha=.12;ctx.fillStyle=pal.light;
 for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++)if((x+y+level)%7===0)ctx.fillRect(x*CELL+8,y*CELL+8,3,3);
 ctx.globalAlpha=1;
 obstacles.forEach(o=>{
  ctx.fillStyle=pal.obstacle;ctx.fillRect(o.x*CELL+1,o.y*CELL+1,CELL-2,CELL-2);
  ctx.fillStyle=pal.grid;ctx.fillRect(o.x*CELL+4,o.y*CELL+4,CELL-8,3);
 });
 if(food){
  const cx=food.x*CELL+CELL/2,cy=food.y*CELL+CELL/2;
  ctx.fillStyle=pal.food;ctx.beginPath();ctx.arc(cx,cy,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=pal.light;ctx.beginPath();ctx.arc(cx-2,cy-2,2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#315c24';ctx.fillRect(cx+1,cy-10,3,5);
 }
 snake.forEach((s,i)=>{
  ctx.fillStyle=i===0?pal.light:pal.snake;
  ctx.fillRect(s.x*CELL+1,s.y*CELL+1,CELL-2,CELL-2);
  if(i===0){
   ctx.fillStyle=pal.snake;
   if(dir.x===1){ctx.fillRect(s.x*CELL+14,s.y*CELL+5,3,3);ctx.fillRect(s.x*CELL+14,s.y*CELL+12,3,3)}
   else if(dir.x===-1){ctx.fillRect(s.x*CELL+3,s.y*CELL+5,3,3);ctx.fillRect(s.x*CELL+3,s.y*CELL+12,3,3)}
   else if(dir.y===-1){ctx.fillRect(s.x*CELL+5,s.y*CELL+3,3,3);ctx.fillRect(s.x*CELL+12,s.y*CELL+3,3,3)}
   else{ctx.fillRect(s.x*CELL+5,s.y*CELL+14,3,3);ctx.fillRect(s.x*CELL+12,s.y*CELL+14,3,3)}
  }
 });
}
function setDirection(name){
 const map={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}},d=map[name];if(!d)return;
 if(state==='ready')start();
 if(state!=='playing'||turnLocked)return;
 if(d.x===-dir.x&&d.y===-dir.y)return;
 queuedDir=d;turnLocked=true;
}
document.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase(),map={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};
 if(map[k]||k===' '||k==='enter')e.preventDefault();
 if(map[k])setDirection(map[k]);
 if(k===' '&&(state==='playing'||state==='paused'))pause();
 if(k==='enter'&&(state==='ready'||state==='over'||state==='won'))start();
});
$('start').onclick=start;$('pause').onclick=pause;$('restart').onclick=start;
modeSelect.addEventListener('change',()=>reset(true));
document.querySelectorAll('[data-dir]').forEach(btn=>btn.addEventListener('pointerdown',e=>{e.preventDefault();setDirection(btn.dataset.dir)}));
canvas.addEventListener('pointerdown',e=>{swipeStart={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointerup',e=>{if(!swipeStart)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>24)setDirection(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));swipeStart=null});
window.addEventListener('blur',()=>{if(state==='playing')pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause()});
document.addEventListener('fullscreenchange',()=>setTimeout(draw,60));
reset();
})();