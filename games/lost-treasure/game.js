(()=> {
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),overlay=document.querySelector('#overlay');
const scoreEl=document.querySelector('#gems'),hpEl=document.querySelector('#hp');
const W=canvas.width,H=canvas.height,keys={left:false,right:false};
const themes=[{name:'GREEN FOREST',sky:'#173d36',ground:'#376b43',glow:'#9be66a'},{name:'DARK CAVE',sky:'#171d3b',ground:'#45436c',glow:'#66dcff'},{name:'ANCIENT TEMPLE',sky:'#503329',ground:'#97704a',glow:'#ffd36a'}];
let player,loot,world=0,gems=0,hp=3,running=false,raf=0,lastTime=0,invulnerable=0;
const platforms=[{x:80,y:370,w:100},{x:250,y:325,w:100},{x:420,y:280,w:100},{x:590,y:325,w:100},{x:720,y:370,w:100}];
function setupLevel(){player={x:35,y:388,vx:0,vy:0,w:30,h:42,onGround:true};loot=Array.from({length:7},(_,i)=>({x:145+i*92,y:285-(i%3)*48,r:9,got:false}));invulnerable=0;}
function updateHud(){scoreEl.textContent=gems;hpEl.textContent='♥ '.repeat(hp).trim()||'—';}
function draw(){
 const t=themes[world];ctx.clearRect(0,0,W,H);ctx.fillStyle=t.sky;ctx.fillRect(0,0,W,H);
 for(let i=0;i<35;i++){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect((i*83)%W,(i*47)%300,2,2)}
 ctx.fillStyle=t.ground;ctx.fillRect(0,430,W,70);
 platforms.forEach((p,i)=>{ctx.fillStyle=t.ground;ctx.fillRect(p.x,p.y,p.w,16);ctx.fillStyle=t.glow;ctx.fillRect(p.x,p.y,p.w,3)});
 loot.forEach(g=>{if(g.got)return;ctx.save();ctx.shadowColor='#ffd34e';ctx.shadowBlur=14;ctx.fillStyle='#ffd34e';ctx.beginPath();ctx.moveTo(g.x,g.y-g.r);ctx.lineTo(g.x+g.r,g.y);ctx.lineTo(g.x,g.y+g.r);ctx.lineTo(g.x-g.r,g.y);ctx.closePath();ctx.fill();ctx.restore()});
 ctx.save();ctx.shadowColor=t.glow;ctx.shadowBlur=20;ctx.fillStyle=t.glow;ctx.fillRect(842,335,18,95);ctx.restore();
 if(!(invulnerable>0&&Math.floor(invulnerable/80)%2===0)){ctx.fillStyle='#087bff';ctx.fillRect(player.x,player.y,player.w,player.h);ctx.fillStyle='#eaf8ff';ctx.fillRect(player.x+6,player.y+8,18,10);ctx.fillStyle='#06101d';ctx.fillRect(player.x+10,player.y+11,4,4);ctx.fillRect(player.x+19,player.y+11,4,4)}
 ctx.fillStyle=t.glow;ctx.font='bold 16px Arial';ctx.fillText(t.name,20,28);
 ctx.fillStyle='rgba(255,255,255,.7)';ctx.font='12px Arial';ctx.fillText('LAND '+(world+1)+'/3',20,49);
}
function showOverlay(title,message,buttonText,action){running=false;cancelAnimationFrame(raf);overlay.classList.remove('hidden');overlay.innerHTML='<h2>'+title+'</h2><p>'+message+'</p><button class="btn" id="overlay-action">'+buttonText+'</button>';document.querySelector('#overlay-action').addEventListener('click',action);}
function levelComplete(){if(world<2){world++;setupLevel();updateHud();draw();ctx.fillStyle='rgba(0,0,0,.58)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 30px Arial';ctx.fillText('LAND '+(world+1)+' UNLOCKED!',W/2,H/2);ctx.textAlign='left';}else{showOverlay('TREASURE FOUND!', 'You explored all three lands and collected '+gems+' gems. Excellent adventure!', 'PLAY AGAIN',start);}}
function gameOver(){showOverlay('ADVENTURE OVER','You collected '+gems+' gems. Give it another try!', 'TRY AGAIN',start);}
function jump(){if(running&&player.onGround){player.vy=-11.5;player.onGround=false}}
function update(dt){
 const step=Math.min(dt/16.67,2.2),oldY=player.y;
 player.vx=(keys.right?3.7:0)-(keys.left?3.7:0);player.x=Math.max(0,Math.min(W-player.w,player.x+player.vx*step));
 player.vy=Math.min(12,player.vy+.55*step);player.y+=player.vy*step;player.onGround=false;
 if(player.y+player.h>=430){player.y=430-player.h;player.vy=0;player.onGround=true}
 platforms.forEach(p=>{if(player.vy>=0&&oldY+player.h<=p.y+5&&player.y+player.h>=p.y&&player.x+player.w>p.x&&player.x<p.x+p.w){player.y=p.y-player.h;player.vy=0;player.onGround=true}});
 loot.forEach(g=>{if(!g.got&&Math.abs(player.x+player.w/2-g.x)<24&&Math.abs(player.y+player.h/2-g.y)<28){g.got=true;gems++;updateHud()}});
 if(invulnerable>0)invulnerable-=dt;
 // Small harmless bump from the stage boundary is avoided; the portal is the level exit.
 if(player.x+player.w>=838){levelComplete();return}
 if(player.y>H+50){hp--;updateHud();if(hp<=0){gameOver();return}player.x=35;player.y=388;player.vy=0;invulnerable=1300}
}
function loop(time){if(!running)return;const dt=lastTime?time-lastTime:16.67;lastTime=time;update(dt);if(!running)return;draw();raf=requestAnimationFrame(loop)}
function start(){cancelAnimationFrame(raf);world=0;gems=0;hp=3;lastTime=0;setupLevel();updateHud();overlay.classList.add('hidden');running=true;draw();raf=requestAnimationFrame(loop)}
function setKey(key,value){if(key==='left')keys.left=value;if(key==='right')keys.right=value}
function bindHold(id,key){const el=document.querySelector('#'+id);const down=e=>{e.preventDefault();el.setPointerCapture?.(e.pointerId);setKey(key,true)};const up=e=>{e.preventDefault();setKey(key,false)};el.addEventListener('pointerdown',down);['pointerup','pointercancel','lostpointercapture','pointerleave'].forEach(type=>el.addEventListener(type,up));}
bindHold('left','left');bindHold('right','right');
const jumpBtn=document.querySelector('#jump');jumpBtn.addEventListener('pointerdown',e=>{e.preventDefault();jump()});
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowleft','a','arrowright','d',' ','arrowup','w'].includes(k))e.preventDefault();if(k==='arrowleft'||k==='a')setKey('left',true);if(k==='arrowright'||k==='d')setKey('right',true);if(k===' '||k==='arrowup'||k==='w')jump()});
document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(k==='arrowleft'||k==='a')setKey('left',false);if(k==='arrowright'||k==='d')setKey('right',false)});
window.addEventListener('blur',()=>{keys.left=false;keys.right=false});
document.querySelector('#start').addEventListener('click',start);setupLevel();updateHud();draw();
})();