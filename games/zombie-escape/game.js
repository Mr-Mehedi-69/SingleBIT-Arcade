(()=>{'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,$=id=>document.getElementById(id);
const COLORS={bg:'#0b1723',grid:'#183047',cyan:'#31e6d0',blue:'#4b9eff',red:'#d84c63',white:'#eef7ff'};
let state='ready',player,enemies=[],orbs=[],particles=[],keys={},touch={},score=0,best=+(localStorage.getItem('sbZombieBest')||0),collected=0,time=0,hp=100,spawnTimer=0,orbTimer=0,last=0,soundOn=false,audio=null,pointer=null;
const rand=(a,b)=>Math.random()*(b-a)+a,clamp=(v,a,b)=>Math.max(a,Math.min(v,b)),dist=(a,b,c,d)=>Math.hypot(c-a,d-b);
function fmt(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(Math.floor(t%60)).padStart(2,'0')}
function ui(){$('score').textContent=String(score).padStart(4,'0');$('best').textContent=String(best).padStart(4,'0');$('time').textContent=fmt(time);$('health').style.width=hp+'%';$('healthText').textContent=Math.ceil(hp)+'%';$('level').textContent='THREAT '+(1+Math.floor(time/25))}
function beep(f=550,d=.07){if(!soundOn)return;try{audio||=new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=f;o.type='sine';g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch(e){}}
function reset(){player={x:W/2,y:H/2,r:16,speed:250,inv:0};enemies=[];orbs=[];particles=[];score=collected=time=spawnTimer=orbTimer=0;hp=100;for(let i=0;i<4;i++)spawnOrb();ui()}
function spawnOrb(){let x,y,n=0;do{x=rand(35,W-35);y=rand(35,H-35);n++}while(dist(x,y,player.x,player.y)<125&&n<30);orbs.push({x,y,r:10,p:rand(0,7)})}
function spawnEnemy(){if(enemies.length>=24)return;let side=Math.floor(rand(0,4)),x=side===1?W+24:side===3?-24:rand(0,W),y=side===0?-24:side===2?H+24:rand(0,H);enemies.push({x,y,r:rand(14,19),speed:rand(60,82)+Math.min(75,Math.floor(time/25)*7),p:rand(0,7)})}
function burst(x,y,color){for(let i=0;i<12;i++){let a=rand(0,Math.PI*2),v=rand(35,155);particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.5,max:.5,color})}}
function show(title,message,button){$('overlayTitle').textContent=title;$('overlayText').textContent=message;$('start').textContent=button;$('overlay').classList.remove('hidden')}
function start(){reset();state='playing';$('overlay').classList.add('hidden');last=performance.now();requestAnimationFrame(loop)}
function pause(){if(state==='playing'){state='paused';show('GAME PAUSED','Your run is waiting. Take a breather.','RESUME GAME')}else if(state==='paused'){state='playing';$('overlay').classList.add('hidden');last=performance.now();requestAnimationFrame(loop)}}
function finish(){state='over';best=Math.max(best,score);localStorage.setItem('sbZombieBest',String(best));ui();show('RUN OVER','You survived '+fmt(time)+' and scored '+score+'. Best score: '+best+'.','PLAY AGAIN');beep(170,.2)}
function update(dt){
 time+=dt;spawnTimer+=dt;orbTimer+=dt;
 let dx=(keys.ArrowRight||keys.d||touch.right?1:0)-(keys.ArrowLeft||keys.a||touch.left?1:0),dy=(keys.ArrowDown||keys.s||touch.down?1:0)-(keys.ArrowUp||keys.w||touch.up?1:0),m=Math.hypot(dx,dy)||1;
 player.x=clamp(player.x+dx/m*player.speed*dt,player.r,W-player.r);player.y=clamp(player.y+dy/m*player.speed*dt,player.r,H-player.r);player.inv=Math.max(0,player.inv-dt);
 if(spawnTimer>Math.max(.55,2.2-time*.018)){spawnEnemy();spawnTimer=0}
 if(orbTimer>7&&orbs.length<5){spawnOrb();orbTimer=0}
 for(const e of enemies){let x=player.x-e.x,y=player.y-e.y,d=Math.hypot(x,y)||1;e.x+=x/d*e.speed*dt;e.y+=y/d*e.speed*dt;e.p+=dt*4;if(d<e.r+player.r&&player.inv<=0){hp=Math.max(0,hp-18);player.inv=.85;burst(player.x,player.y,'#ff536b');beep(140,.1);if(hp<=0){finish();return}}}
 for(let i=orbs.length-1;i>=0;i--){let o=orbs[i];o.p+=dt*3;if(dist(player.x,player.y,o.x,o.y)<player.r+o.r+3){orbs.splice(i,1);collected++;score+=100;hp=Math.min(100,hp+7);burst(o.x,o.y,COLORS.cyan);beep(760,.07)}}
 score=Math.max(score,Math.floor(time*3)+collected*100);
 for(let i=particles.length-1;i>=0;i--){let p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.life-=dt;if(p.life<=0)particles.splice(i,1)}
 ui()
}
function draw(){
 ctx.clearRect(0,0,W,H);ctx.fillStyle=COLORS.bg;ctx.fillRect(0,0,W,H);ctx.strokeStyle=COLORS.grid;ctx.globalAlpha=.7;
 for(let x=0;x<=W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<=H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}ctx.globalAlpha=1;ctx.strokeStyle='#2a5960';ctx.lineWidth=3;ctx.strokeRect(2,2,W-4,H-4);
 for(const o of orbs){let s=1+Math.sin(o.p)*.15;ctx.save();ctx.translate(o.x,o.y);ctx.scale(s,s);ctx.shadowBlur=22;ctx.shadowColor=COLORS.cyan;ctx.fillStyle=COLORS.cyan;ctx.beginPath();ctx.arc(0,0,o.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#eafffb';ctx.beginPath();ctx.arc(-3,-3,3,0,Math.PI*2);ctx.fill();ctx.restore()}
 for(const e of enemies){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.sin(e.p)*.08);ctx.shadowBlur=13;ctx.shadowColor=COLORS.red;ctx.fillStyle=COLORS.red;ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#421e35';ctx.beginPath();ctx.arc(-5,-3,3,0,Math.PI*2);ctx.arc(5,-3,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe5b8';ctx.fillRect(-4,5,8,2);ctx.restore()}
 ctx.save();if(player.inv>0&&Math.floor(performance.now()/90)%2===0)ctx.globalAlpha=.4;ctx.shadowBlur=18;ctx.shadowColor=COLORS.blue;ctx.fillStyle=COLORS.blue;ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#eaf6ff';ctx.beginPath();ctx.arc(player.x-4,player.y-5,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#10243c';ctx.beginPath();ctx.arc(player.x+5,player.y-2,2.5,0,Math.PI*2);ctx.fill();ctx.restore();
 for(const p of particles){ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1
}
function loop(now){if(state!=='playing')return;let dt=Math.min((now-last)/1000,.035);last=now;update(dt);draw();if(state==='playing')requestAnimationFrame(loop)}
window.addEventListener('keydown',e=>{let k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keys[e.key]=keys[k]=true;if((k==='p'||k==='escape')&&!e.repeat)pause();if(k==='enter'&&state==='over')start()});
window.addEventListener('keyup',e=>{keys[e.key]=false;keys[e.key.toLowerCase()]=false});window.addEventListener('blur',()=>{if(state==='playing')pause()});
$('start').addEventListener('click',()=>{if(state==='paused')pause();else start()});
$('pause').addEventListener('click',pause);
$('sound').addEventListener('click',()=>{soundOn=!soundOn;$('sound').textContent=soundOn?'♫ SOUND ON':'♫ SOUND OFF';$('sound').setAttribute('aria-pressed',String(soundOn));if(soundOn)beep()});
$('fullscreen').addEventListener('click',()=>{const el=$('gameShell');if(!document.fullscreenElement)el.requestFullscreen?.();else document.exitFullscreen?.()});
document.querySelectorAll('[data-dir]').forEach(b=>{let d=b.dataset.dir,on=e=>{e.preventDefault();touch[d]=true},off=e=>{e.preventDefault();touch[d]=false};b.addEventListener('pointerdown',on);['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,off))});
canvas.addEventListener('pointerdown',e=>{if(state!=='playing')return;let r=canvas.getBoundingClientRect();pointer={x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!pointer||state!=='playing')return;let r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;touch.left=x<pointer.x-12;touch.right=x>pointer.x+12;touch.up=y<pointer.y-12;touch.down=y>pointer.y+12});
function clearTouch(){pointer=null;touch={}}canvas.addEventListener('pointerup',clearTouch);canvas.addEventListener('pointercancel',clearTouch);
reset();draw();
})();