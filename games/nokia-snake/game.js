(()=>{
'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay'),scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),statusEl=document.getElementById('status');
const CELL=20,GRID=30,BOARD=600;
const COLORS={bg:'#aabb69',grid:'#8c9e55',dark:'#354a25',light:'#dce8a6'};
let snake=[],food=null,dir={x:1,y:0},queuedDir={x:1,y:0},score=0,state='ready',best=0,accumulator=0,lastTime=0,raf=0,turnLocked=false,swipeStart=null;
try{best=Number(localStorage.getItem('sbNokiaSnakeBest'))||0}catch{}
function updateHud(){scoreEl.textContent=score;bestEl.textContent=best;statusEl.textContent=state.toUpperCase();document.getElementById('pause').textContent=state==='paused'?'▶ RESUME':'Ⅱ PAUSE';document.getElementById('pause').disabled=!(state==='playing'||state==='paused')}
function saveBest(){best=Math.max(best,score);try{localStorage.setItem('sbNokiaSnakeBest',String(best))}catch{}}
function spawnFood(){const empty=[];for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++)if(!snake.some(s=>s.x===x&&s.y===y))empty.push({x,y});if(!empty.length){food=empty[Math.floor(Math.random()*empty.length)];return true}food=null;return false}
function reset(){cancelAnimationFrame(raf);snake=[{x:15,y:15},{x:14,y:15},{x:13,y:15},{x:12,y:15}];dir={x:1,y:0};queuedDir={...dir};score=0;accumulator=0;turnLocked=false;state='ready';spawnFood();overlay.innerHTML='<h2>NOKIA SNAKE</h2><p>Eat the food, grow longer and avoid walls and yourself.</p><button class="btn" id="start">START GAME</button>';overlay.classList.remove('hidden');document.getElementById('start').onclick=start;updateHud();draw()}
function start(){reset();state='playing';overlay.classList.add('hidden');lastTime=performance.now();updateHud();raf=requestAnimationFrame(loop)}
function pause(){if(state==='playing'){state='paused';overlay.innerHTML='<h2>PAUSED</h2><p>Your game is safely paused.</p><button class="btn" id="resume">RESUME</button>';overlay.classList.remove('hidden');document.getElementById('resume').onclick=pause;updateHud()}else if(state==='paused'){state='playing';overlay.classList.add('hidden');lastTime=performance.now();updateHud();raf=requestAnimationFrame(loop)}}
function finish(won=false){state=won?'won':'over';saveBest();overlay.innerHTML='<h2>'+ (won?'BOARD CLEARED!':'GAME OVER') +'</h2><p>Score: '+score+' · Best: '+best+'</p><button class="btn" id="again">PLAY AGAIN</button>';overlay.classList.remove('hidden');document.getElementById('again').onclick=start;updateHud()}
function step(){dir={...queuedDir};const head={x:snake[0].x+dir.x,y:snake[0].y+dir.y},eating=food&&head.x===food.x&&head.y===food.y;
if(head.x<0||head.x>=GRID||head.y<0||head.y>=GRID||snake.slice(0,eating?snake.length:snake.length-1).some(s=>s.x===head.x&&s.y===head.y)){finish();return}
snake.unshift(head);if(eating){score+=10;saveBest();if(!spawnFood()){finish(true);return}}else snake.pop();
turnLocked=false;updateHud()}
function loop(t){if(state!=='playing')return;const dt=Math.min(100,t-lastTime);lastTime=t;accumulator+=dt;const stepMs=Math.max(72,145-score*0.35);while(accumulator>=stepMs&&state==='playing'){step();accumulator-=stepMs}draw();if(state==='playing')raf=requestAnimationFrame(loop)}
function draw(){ctx.fillStyle=COLORS.bg;ctx.fillRect(0,0,BOARD,BOARD);ctx.strokeStyle=COLORS.grid;ctx.lineWidth=1;for(let i=0;i<=BOARD;i+=CELL){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,BOARD);ctx.moveTo(0,i);ctx.lineTo(BOARD,i);ctx.stroke()}
if(food){ctx.fillStyle=COLORS.dark;ctx.fillRect(food.x*CELL+4,food.y*CELL+4,12,12)}
snake.forEach((s,i)=>{ctx.fillStyle=COLORS.dark;ctx.fillRect(s.x*CELL+1,s.y*CELL+1,18,18);if(i===0){ctx.fillStyle=COLORS.light;if(dir.x===1){ctx.fillRect(s.x*CELL+13,s.y*CELL+5,3,3);ctx.fillRect(s.x*CELL+13,s.y*CELL+12,3,3)}else if(dir.x===-1){ctx.fillRect(s.x*CELL+4,s.y*CELL+5,3,3);ctx.fillRect(s.x*CELL+4,s.y*CELL+12,3,3)}else if(dir.y===-1){ctx.fillRect(s.x*CELL+5,s.y*CELL+4,3,3);ctx.fillRect(s.x*CELL+12,s.y*CELL+4,3,3)}else{ctx.fillRect(s.x*CELL+5,s.y*CELL+13,3,3);ctx.fillRect(s.x*CELL+12,s.y*CELL+13,3,3)}}})}
function setDirection(name){const map={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}},d=map[name];if(!d)return;if(state==='ready'){state='playing';overlay.classList.add('hidden');lastTime=performance.now();updateHud();raf=requestAnimationFrame(loop)}if(state!=='playing'||turnLocked)return;if(d.x===-dir.x&&d.y===-dir.y)return;queuedDir=d;turnLocked=true}
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase(),map={arrowup:'up',w:'up',arrowdown:'down',s:'down',arrowleft:'left',a:'left',arrowright:'right',d:'right'};if(map[k]||k===' '||k==='enter')e.preventDefault();if(map[k])setDirection(map[k]);if(k===' '&&(state==='playing'||state==='paused'))pause();if(k==='enter'&&(state==='ready'||state==='over'||state==='won'))start()});
document.getElementById('start').onclick=start;document.getElementById('pause').onclick=pause;document.getElementById('restart').onclick=start;
document.querySelectorAll('[data-dir]').forEach(btn=>btn.addEventListener('pointerdown',e=>{e.preventDefault();setDirection(btn.dataset.dir)}));
canvas.addEventListener('pointerdown',e=>{swipeStart={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointerup',e=>{if(!swipeStart)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;if(Math.max(Math.abs(dx),Math.abs(dy))>24)setDirection(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));swipeStart=null});
window.addEventListener('blur',()=>{if(state==='playing')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause()});
reset();
})();