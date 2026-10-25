'use strict';
// =====================================================================
//  2-Spieler-Spiele
//  Jedes Spiel bekommt einen Kontext c (siehe makeCtx in zweiSpieler.html):
//  c.el, c.me (0 = Raum-Ersteller, 1 = Gast), c.other, c.host, c.seed, c.rng,
//  c.names, c.send(d), c.status(html), c.every/after/frame/on/key, c.end(r),
//  c.n(p) (Name farbig, "Du" für mich), c.dran(p)
//  create(c) gibt {msg(d)} zurück: msg bekommt alles, was der andere schickt.
// =====================================================================

const FARBE=['#0a9fe0','#ff4a3d'];
const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function rngFrom(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ri=(r,n)=>Math.floor(r()*n);
function shuffle(a,r){for(let i=a.length-1;i>0;i--){const j=ri(r,i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
const norm=s=>String(s).toLowerCase().trim().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]/g,'');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Canvas mit fester logischer Größe, skaliert per CSS
function leinwand(c,W,H){
  const cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;cv.className='cv';
  cv.style.aspectRatio=W+'/'+H;cv.style.maxWidth='calc(64vh * '+(W/H).toFixed(3)+')';
  c.el.appendChild(cv);const g=cv.getContext('2d');g.scale(2,2);
  return{cv,g,pos(e){const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]}};
}
// Steuerkreuz für Touch-Geräte
function steuerkreuz(c,f){
  const p=document.createElement('div');p.className='pad';
  p.innerHTML='<button type="button" data-d="0,-1" aria-label="Hoch">▲</button><button type="button" data-d="-1,0" aria-label="Links">◀</button><button type="button" data-d="1,0" aria-label="Rechts">▶</button><button type="button" data-d="0,1" aria-label="Runter">▼</button>';
  c.el.appendChild(p);
  c.on(p,'pointerdown',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();f(b.dataset.d.split(',').map(Number))});
  return p;
}
// Wischgesten
function wischen(c,el,f){
  let s=null;
  c.on(el,'pointerdown',e=>{s=[e.clientX,e.clientY]});
  c.on(el,'pointerup',e=>{if(!s)return;const dx=e.clientX-s[0],dy=e.clientY-s[1];s=null;
    if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;f(Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)])});
}
const PFEIL={arrowup:[0,-1],arrowdown:[0,1],arrowleft:[-1,0],arrowright:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
const richtung=e=>PFEIL[e.key.toLowerCase()];

const SPIELE=[];

// ---------------------------------------------------------------------
//  1 · Vier gewinnt
// ---------------------------------------------------------------------
SPIELE.push({id:'vier',name:'Vier gewinnt',emoji:'🔴',mode:'vs',
  desc:'Der Klassiker: Wer zuerst vier Steine in eine Reihe bringt, gewinnt.',
  how:'Klick auf eine Spalte, um deinen Stein hineinfallen zu lassen. Vier in einer Reihe (waagrecht, senkrecht oder schräg) gewinnt.',
  create(c){
    const W=7,H=6,b=Array(W*H).fill(-1);let dran=c.seed%2,aus=false;
    c.el.innerHTML='<div class="c4"></div>';const g=c.el.firstChild;
    for(let i=0;i<W*H;i++){const d=document.createElement('div');d.className='c4c';d.dataset.x=i%W;g.appendChild(d)}
    const zelle=(x,y)=>g.children[y*W+x];
    const info=()=>{c.status(c.dran(dran));g.classList.toggle('mein',dran===c.me&&!aus)};
    const reihe=(x,y,p)=>{
      for(const[dx,dy]of[[1,0],[0,1],[1,1],[1,-1]]){
        const l=[[x,y]];
        for(const s of[1,-1])for(let i=1;;i++){const nx=x+dx*i*s,ny=y+dy*i*s;if(nx<0||ny<0||nx>=W||ny>=H||b[ny*W+nx]!==p)break;l.push([nx,ny])}
        if(l.length>=4)return l;
      }
      return null;
    };
    const zug=(x,p)=>{
      let y=H-1;while(y>=0&&b[y*W+x]>=0)y--;
      if(y<0)return false;
      b[y*W+x]=p;zelle(x,y).innerHTML=`<i class="st p${p}" style="--f:${y+1}"></i>`;
      const l=reihe(x,y,p);
      if(l){aus=true;l.forEach(([a,bb])=>zelle(a,bb).classList.add('win'));g.classList.remove('mein');
        c.status(p===c.me?'Vier in einer Reihe!':c.n(p)+' hat vier in einer Reihe.');c.end({w:p})}
      else if(b.every(v=>v>=0)){aus=true;c.end({w:-1,text:'Das Brett ist voll.'})}
      else{dran=1-dran;info()}
      return true;
    };
    c.on(g,'click',e=>{const z=e.target.closest('.c4c');if(!z||aus||dran!==c.me)return;const x=+z.dataset.x;if(zug(x,c.me))c.send({x})});
    c.on(g,'pointerover',e=>{const z=e.target.closest('.c4c');for(const k of g.children)k.classList.toggle('hov',!!z&&k.dataset.x===z.dataset.x)});
    c.on(g,'pointerleave',()=>{for(const k of g.children)k.classList.remove('hov')});
    info();
    return{msg(d){if(!aus)zug(d.x,c.other)}};
  }});

// ---------------------------------------------------------------------
//  2 · Schiffe versenken
// ---------------------------------------------------------------------
SPIELE.push({id:'schiffe',name:'Schiffe versenken',emoji:'🚢',mode:'vs',
  desc:'Versteckte Flotten, ein Raster, gute Nerven. Treffer heißt: nochmal schießen.',
  how:'Lass deine Flotte so lange neu verteilen, bis sie dir gefällt, und drück <b>Bereit!</b>. Dann schießt ihr abwechselnd aufs gegnerische Meer. Bei einem Treffer darfst du gleich nochmal. Schiffe berühren sich nie, auch nicht schräg. Wer zuerst alle gegnerischen Schiffe versenkt, gewinnt.',
  create(c){
    const N=8,L=[4,3,3,2,2];
    let flotte,feld;
    const bereit=[false,false];let dran=c.seed%2,wartet=false,aus=false,versenkt=0;
    const beschossen=new Set();
    const gegner=Array(N*N).fill(0); // 0 unbekannt, 1 Wasser, 2 Treffer, 3 versenkt
    const nachbarn=i=>{const x=i%N,y=(i/N)|0,r=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const ax=x+dx,ay=y+dy;if(ax>=0&&ay>=0&&ax<N&&ay<N)r.push(ay*N+ax)}return r};
    function verteilen(){
      for(;;){
        const f=Array(N*N).fill(-1),fl=[];let ok=true;
        for(let s=0;s<L.length&&ok;s++){
          let gesetzt=false;
          for(let t=0;t<200&&!gesetzt;t++){
            const h=Math.random()<.5,x=ri(Math.random,h?N-L[s]+1:N),y=ri(Math.random,h?N:N-L[s]+1),z=[];
            for(let k=0;k<L[s];k++)z.push((y+(h?0:k))*N+x+(h?k:0));
            if(z.every(i=>nachbarn(i).every(j=>f[j]<0))){z.forEach(i=>f[i]=s);fl.push({z,tr:0});gesetzt=true}
          }
          if(!gesetzt)ok=false;
        }
        if(ok){feld=f;flotte=fl;return}
      }
    }
    verteilen();
    c.el.innerHTML=`<div class="bs"><div class="bsw"><h4>Gegnerisches Meer <span class="bsr"></span></h4><div class="bsg gegner"></div></div>
      <div class="bsw klein"><h4>Deine Flotte</h4><div class="bsg mein"></div>
      <div class="bsk"><button type="button" class="btn sm" data-a="neu">🎲 Neu verteilen</button><button type="button" class="btn sm primary" data-a="ok">Bereit!</button></div></div></div>`;
    const gG=c.el.querySelector('.gegner'),gM=c.el.querySelector('.mein'),knopf=c.el.querySelector('.bsk');
    for(let i=0;i<N*N;i++){gG.appendChild(document.createElement('div'));gM.appendChild(document.createElement('div'))}
    const spiel=()=>bereit[0]&&bereit[1];
    function zeichneMein(){[...gM.children].forEach((d,i)=>{const s=feld[i];let k=s>=0?'schiff':'';if(beschossen.has(i))k+=s>=0?(flotte[s].tr===flotte[s].z.length?' sunk':' hit'):' miss';d.className=k})}
    function zeichneGegner(){
      [...gG.children].forEach((d,i)=>d.className=['','miss','hit','sunk'][gegner[i]]);
      gG.classList.toggle('zielen',spiel()&&dran===c.me&&!wartet&&!aus);
      c.el.querySelector('.bsr').textContent=`· ${L.length-versenkt} von ${L.length} Schiffen übrig`;
    }
    function info(){
      zeichneGegner();if(aus)return;
      if(!bereit[c.me])c.status('Stell deine Flotte auf und drück <b>Bereit!</b>');
      else if(!bereit[c.other])c.status('Warte auf '+c.n(c.other)+' …');
      else c.status(dran===c.me?(wartet?'Schuss unterwegs …':'Du bist dran: <b>Schieß aufs gegnerische Meer!</b>'):c.n(c.other)+' zielt auf deine Flotte …');
    }
    c.on(knopf,'click',e=>{const a=e.target.closest('button')?.dataset.a;if(!a||bereit[c.me])return;
      if(a==='neu'){verteilen();zeichneMein()}else{bereit[c.me]=true;knopf.remove();c.send({bereit:1});info()}});
    c.on(gG,'click',e=>{const d=e.target.closest('.gegner>div');if(!d)return;const i=[...gG.children].indexOf(d);
      if(!spiel()||dran!==c.me||wartet||aus||gegner[i])return;wartet=true;c.send({schuss:i});info()});
    zeichneMein();info();
    return{msg(d){
      if(d.bereit){bereit[c.other]=true;info()}
      else if(d.schuss!=null){
        const i=d.schuss,s=feld[i],tr=s>=0;let weg=null,alle=false;
        if(!beschossen.has(i)&&tr)flotte[s].tr++;
        beschossen.add(i);
        if(tr){if(flotte[s].tr===flotte[s].z.length)weg=flotte[s].z;alle=flotte.every(f=>f.tr===f.z.length)}
        c.send({erg:{i,tr,weg,alle}});zeichneMein();
        if(alle){aus=true;info();c.status(c.n(c.other)+' hat deine ganze Flotte versenkt.');c.end({w:c.other})}
        else{dran=tr?c.other:c.me;info()}
      }
      else if(d.erg){
        const{i,tr,weg,alle}=d.erg;gegner[i]=tr?2:1;
        if(weg){versenkt++;weg.forEach(k=>nachbarn(k).forEach(j=>{if(!gegner[j])gegner[j]=1}));weg.forEach(k=>gegner[k]=3)}
        wartet=false;
        if(alle){aus=true;info();c.status('Alle Schiffe versenkt!');c.end({w:c.me})}
        else{dran=tr?c.me:c.other;info()}
      }
    }};
  }});

// ---------------------------------------------------------------------
//  3 · Pong
// ---------------------------------------------------------------------
SPIELE.push({id:'pong',name:'Pong',emoji:'🏓',mode:'vs',
  desc:'Retro-Tennis in Echtzeit. Der Ball wird mit jedem Treffer schneller.',
  how:'Bewege deinen Schläger mit ↑ und ↓ (oder W und S), mit der Maus oder per Finger. Triffst du den Ball mit dem Rand des Schlägers, fliegt er schräger. Wer zuerst 7 Punkte hat, gewinnt.',
  create(c){
    const W=800,H=500,PH=90,PW=14,R=9,ZIEL=7;const{g,cv,pos}=leinwand(c,W,H);
    const st={p:[H/2,H/2],b:[W/2,H/2],s:[0,0],h:0};let aus=false,blitz=0,altH=0;
    const ein=[{d:0,y:null},{d:0,y:null}],mein={d:0,y:null},tast={hoch:false,runter:false};
    const schick=()=>{if(c.host)ein[0]={...mein};else c.send({in:mein})};
    c.key((e,dn)=>{const k=e.key.toLowerCase();if(k==='arrowup'||k==='w')tast.hoch=dn;else if(k==='arrowdown'||k==='s')tast.runter=dn;else return;
      e.preventDefault();mein.d=(tast.runter?1:0)-(tast.hoch?1:0);mein.y=null;schick()});
    let letzt=0;
    c.on(cv,'pointermove',e=>{if(e.pointerType!=='mouse'&&!e.buttons)return;mein.y=pos(e)[1];mein.d=0;const t=performance.now();if(t-letzt>30){letzt=t;schick()}});
    c.on(cv,'pointerdown',e=>{mein.y=pos(e)[1];mein.d=0;schick()});
    if(c.host){
      let ball={x:W/2,y:H/2,vx:0,vy:0},pause=1.4,auf=c.seed%2?1:-1,alt=performance.now();
      const los=()=>{const a=Math.random()*.8-.4;ball.vx=Math.cos(a)*330*auf;ball.vy=Math.sin(a)*330};
      c.every(1000/60,()=>{
        const t=performance.now(),dt=Math.min(.05,(t-alt)/1000);alt=t;if(aus)return;
        for(let p=0;p<2;p++){const e=ein[p];if(e.y!=null){const df=e.y-st.p[p];st.p[p]+=Math.sign(df)*Math.min(Math.abs(df),900*dt)}else st.p[p]+=e.d*520*dt;st.p[p]=clamp(st.p[p],PH/2,H-PH/2)}
        if(pause>0){pause-=dt;if(pause<=0)los()}
        else{
          ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
          if(ball.y<R){ball.y=R;ball.vy=Math.abs(ball.vy)}
          if(ball.y>H-R){ball.y=H-R;ball.vy=-Math.abs(ball.vy)}
          for(let p=0;p<2;p++){
            const px=p?W-30-PW:30,richtig=p?ball.vx>0:ball.vx<0;
            if(richtig&&ball.x+R>px&&ball.x-R<px+PW&&Math.abs(ball.y-st.p[p])<PH/2+R){
              const rel=clamp((ball.y-st.p[p])/(PH/2),-1,1),sp=Math.min(950,Math.hypot(ball.vx,ball.vy)*1.06),a=rel*1.05;
              ball.vx=Math.cos(a)*sp*(p?-1:1);ball.vy=Math.sin(a)*sp;ball.x=p?px-R:px+PW+R;st.h++;
            }
          }
          if(ball.x<-R||ball.x>W+R){
            const sc=ball.x<0?1:0;st.s[sc]++;auf=sc===1?-1:1;
            ball={x:W/2,y:H/2,vx:0,vy:0};pause=1;
            if(st.s[sc]>=ZIEL){aus=true;st.e=sc;c.end({w:sc,text:`${st.s[0]} : ${st.s[1]}`})}
          }
        }
        st.b=[ball.x,ball.y];
        c.send({st:{p:st.p.map(Math.round),b:st.b.map(Math.round),s:st.s,h:st.h,e:st.e}});
      });
    }
    c.frame(()=>{
      if(st.h!==altH){altH=st.h;blitz=1}blitz*=.88;
      g.fillStyle='#1c1c1e';g.fillRect(0,0,W,H);
      g.fillStyle='rgba(255,255,255,.16)';for(let y=10;y<H;y+=28)g.fillRect(W/2-2,y,4,14);
      g.font='800 46px ui-rounded,system-ui,sans-serif';g.textAlign='center';g.textBaseline='top';
      for(let p=0;p<2;p++){g.fillStyle=FARBE[p];g.globalAlpha=.9;g.fillText(st.s[p],W/2+(p?80:-80),18);g.globalAlpha=1}
      g.font='700 13px "JetBrains Mono",monospace';g.fillStyle='rgba(255,255,255,.55)';
      for(let p=0;p<2;p++)g.fillText((p===c.me?'DU':c.names[p]).toUpperCase().slice(0,14),p?W-110:110,H-26);
      for(let p=0;p<2;p++){const px=p?W-30-PW:30;g.fillStyle=FARBE[p];g.fillRect(px,st.p[p]-PH/2,PW,PH);g.fillStyle='#fff';g.globalAlpha=.35;g.fillRect(px+(p?0:PW-3),st.p[p]-PH/2,3,PH);g.globalAlpha=1}
      g.fillStyle='#fff';g.shadowColor='#9db6ff';g.shadowBlur=10+blitz*30;g.beginPath();g.arc(st.b[0],st.b[1],R,0,7);g.fill();g.shadowBlur=0;
    });
    return{msg(d){
      if(c.host){if(d.in)ein[1]=d.in}
      else if(d.st){Object.assign(st,d.st);if(d.st.e!=null&&!aus){aus=true;c.end({w:d.st.e,text:`${st.s[0]} : ${st.s[1]}`})}}
    }};
  }});

// ---------------------------------------------------------------------
//  4 · Lichtrenner
// ---------------------------------------------------------------------
SPIELE.push({id:'tron',name:'Lichtrenner',emoji:'🏍️',mode:'vs',
  desc:'Ihr zieht leuchtende Spuren übers Feld. Wer zuerst irgendwo reinkracht, verliert.',
  how:'Lenke mit den Pfeiltasten oder WASD, am Handy durch Wischen oder mit dem Steuerkreuz. Du fährst immer weiter und hinterlässt eine Lichtspur. Krachst du in eine Wand oder eine Spur, geht die Runde an den anderen. Wer zuerst 3 Runden gewinnt, gewinnt.',
  create(c){
    const GW=60,GH=38,Z=13,W=GW*Z,H=GH*Z,ZIEL=3;const{g,cv}=leinwand(c,W,H);
    const gr=new Uint8Array(GW*GH);let kopf=[[0,0],[0,0]],crash=[false,false],siege=[0,0],text='',aus=false;
    function anwenden(m){
      if(m.r){gr.fill(0);kopf=m.r.k;crash=[false,false];siege=m.r.s;kopf.forEach((k,p)=>gr[k[1]*GW+k[0]]=p+1);text=''}
      if(m.cd!=null)text=m.cd;
      if(m.t){m.t.k.forEach((k,p)=>{if(!m.t.c[p]){gr[k[1]*GW+k[0]]=p+1;kopf[p]=k}});crash=m.t.c;text=''}
      if(m.rs){siege=m.rs.s;const w=m.rs.w;
        text=w<0?'Beide gecrasht!':(w===c.me?'Runde für dich!':'Runde für '+c.names[w]+'!');
        c.status(`Runden: ${c.n(0)} ${siege[0]} : ${siege[1]} ${c.n(1)}`);
        if(w>=0&&siege[w]>=ZIEL&&!aus){aus=true;c.end({w,text:`${siege[0]} : ${siege[1]} Runden`})}}
    }
    // Host steuert alles
    let dir=[[1,0],[-1,0]],queue=[[],[]],laeuft=false;
    const lenken=(p,d)=>{const q=queue[p],last=q.length?q[q.length-1]:dir[p];
      if(q.length>=3||(d[0]===-last[0]&&d[1]===-last[1])||(d[0]===last[0]&&d[1]===last[1]))return;q.push(d)};
    const send=m=>{anwenden(m);c.send({m})};
    if(c.host){
      const runde=()=>{dir=[[1,0],[-1,0]];queue=[[],[]];laeuft=false;send({r:{k:[[12,GH>>1],[GW-13,GH>>1]],s:siege}});
        let n=3;const cd=()=>{if(n>0){send({cd:String(n)});n--;c.after(700,cd)}else{send({cd:'LOS!'});laeuft=true}};cd()};
      c.every(70,()=>{
        if(!laeuft)return;
        const nk=[0,1].map(p=>{if(queue[p].length)dir[p]=queue[p].shift();return[kopf[p][0]+dir[p][0],kopf[p][1]+dir[p][1]]});
        const cr=nk.map(([x,y])=>x<0||y<0||x>=GW||y>=GH||gr[y*GW+x]>0);
        if(nk[0][0]===nk[1][0]&&nk[0][1]===nk[1][1])cr[0]=cr[1]=true;
        send({t:{k:nk,c:cr}});
        if(cr[0]||cr[1]){laeuft=false;const w=cr[0]&&cr[1]?-1:cr[0]?1:0;if(w>=0)siege[w]++;
          send({rs:{w,s:siege.slice()}});if(w<0||siege[w]<ZIEL)c.after(1800,runde)}
      });
      c.after(400,runde);
    }
    const ich=d=>{if(c.host)lenken(0,d);else c.send({d})};
    c.key((e,dn)=>{const d=dn&&richtung(e);if(!d)return;e.preventDefault();ich(d)});
    wischen(c,cv,ich);steuerkreuz(c,ich);
    c.status(`Du fährst <b style="color:${FARBE[c.me]}">${c.me?'rechts':'links'}</b> los. Erster mit 3 Runden gewinnt.`);
    c.frame(t=>{
      g.fillStyle='#1c1c1e';g.fillRect(0,0,W,H);
      g.strokeStyle='rgba(157,182,255,.07)';g.lineWidth=1;g.beginPath();
      for(let x=0;x<=GW;x+=2){g.moveTo(x*Z,0);g.lineTo(x*Z,H)}for(let y=0;y<=GH;y+=2){g.moveTo(0,y*Z);g.lineTo(W,y*Z)}g.stroke();
      for(let i=0;i<gr.length;i++)if(gr[i]){g.fillStyle=FARBE[gr[i]-1];g.fillRect((i%GW)*Z+1,((i/GW)|0)*Z+1,Z-2,Z-2)}
      kopf.forEach((k,p)=>{g.shadowColor=FARBE[p];g.shadowBlur=16;g.fillStyle=crash[p]?'#ffd400':'#fff';g.fillRect(k[0]*Z,k[1]*Z,Z,Z);g.shadowBlur=0;
        if(crash[p]){g.font='30px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('💥',k[0]*Z+Z/2,k[1]*Z+Z/2)}});
      g.font='700 12px "JetBrains Mono",monospace';g.textAlign='left';g.textBaseline='top';
      [0,1].forEach(p=>{g.fillStyle=FARBE[p];g.fillText(`${p===c.me?'DU':c.names[p].toUpperCase()} ${'■'.repeat(siege[p])}${'□'.repeat(ZIEL-siege[p])}`,p?W-200:10,8)});
      if(text){g.font='800 46px ui-rounded,system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#fff';g.fillText(text,W/2,H/2)}
    });
    return{msg(d){if(c.host){if(d.d)lenken(1,d.d)}else if(d.m)anwenden(d.m)}};
  }});

// ---------------------------------------------------------------------
//  5 · Schnellziehen
// ---------------------------------------------------------------------
SPIELE.push({id:'duell',name:'Schnellziehen',emoji:'🤠',mode:'vs',
  desc:'Western-Duell der Reflexe. Wer zu früh zieht oder auf eine Falle reinfällt, verliert.',
  how:'Warte, bis groß <b>ZIEH!</b> erscheint, dann so schnell wie möglich klicken, tippen oder die Leertaste drücken. Wer zu früh drückt oder auf ein falsches Wort reinfällt (zum Beispiel „ZIEGE!“), schenkt dem anderen den Punkt. Gemessen wird die Reaktionszeit auf dem eigenen Bildschirm, also ist es auch bei langsamer Verbindung fair. Wer zuerst 5 Punkte hat, gewinnt.',
  create(c){
    const ZIEL=5,FALLEN=['ZIEGE!','ZIEL!','ZIELEN …','ZIEHHARMONIKA','ZIERFISCH','ZIEH … NOCH NICHT','ZWIEBEL!','ZISCH!'];
    c.el.innerHTML='<div class="duell warte"><div class="dpunkte"></div><div class="dschild">Mach dich bereit …</div><div class="dinfo">Klick, tipp oder Leertaste</div></div>';
    const box=c.el.firstChild,schild=box.querySelector('.dschild'),info=box.querySelector('.dinfo'),pk=box.querySelector('.dpunkte');
    let phase='pause',t0=0,getan=true,punkte=[0,0];
    const zeige=(txt,k)=>{schild.textContent=txt;box.className='duell '+k};
    const zeigePunkte=()=>pk.innerHTML=`${c.n(0)} <b>${punkte[0]} : ${punkte[1]}</b> ${c.n(1)}`;
    zeigePunkte();
    function anwenden(m){
      if(m.neu){phase='warte';getan=false;zeige('Warte …','warte');info.textContent='Finger bereit halten …';c.status('Noch nicht drücken!')}
      if(m.falle&&phase==='warte'){phase='falle';zeige(m.falle,'falle')}
      if(m.weg&&phase==='falle'){phase='warte';zeige('Warte …','warte')}
      if(m.los){phase='los';t0=performance.now();zeige('ZIEH!','los')}
      if(m.erg){
        phase='pause';const{w,rt,foul}=m.erg;punkte=m.erg.p;zeigePunkte();
        const ms=p=>rt[p]==null?'—':rt[p]+' ms';
        if(w<0){zeige('Keiner hat gezogen','warte');info.textContent='Die Runde zählt nicht.'}
        else{
          zeige(w===c.me?'TREFFER!':'ERWISCHT …',w===c.me?'sieg':'nieder');
          if(foul!=null)info.innerHTML=(foul===c.me?'Du hast zu früh gezogen.':esc(c.names[foul])+' hat zu früh gezogen.')+(w===c.me?' Punkt für dich!':' Punkt für '+esc(c.names[w])+'.');
          else info.innerHTML=`Du: ${ms(c.me)} · ${esc(c.names[c.other])}: ${ms(c.other)}`;
        }
        c.status('Nächste Runde kommt gleich …');
        if(w>=0&&punkte[w]>=ZIEL)c.end({w,text:`${punkte[0]} : ${punkte[1]}`});
      }
    }
    const send=m=>{anwenden(m);c.send({m})};
    let akt=[null,null],entschieden=true;
    function entscheiden(foulW,foulP){
      if(entschieden)return;entschieden=true;
      let w;
      if(foulW!=null)w=foulW;
      else{const a=akt[0]?.rt??Infinity,b=akt[1]?.rt??Infinity;w=a===Infinity&&b===Infinity?-1:a<b?0:b<a?1:ri(Math.random,2)}
      if(w>=0)punkte[w]++;
      send({erg:{w,p:punkte.slice(),rt:akt.map(a=>a&&a.rt!=null?a.rt:null),foul:foulP??null}});
      if(w<0||punkte[w]<ZIEL)c.after(2800,runde);
    }
    function hostAktion(p,a){
      if(entschieden||akt[p])return;akt[p]=a;
      if(a.foul)entscheiden(1-p,p);
      else if(akt[1-p])entscheiden();
    }
    function runde(){
      akt=[null,null];entschieden=false;send({neu:1});
      let t=1500+Math.random()*3000;
      if(Math.random()<.45){const ft=t;c.after(ft,()=>{if(!entschieden)send({falle:FALLEN[ri(Math.random,FALLEN.length)]})});
        c.after(ft+900,()=>{if(!entschieden)send({weg:1})});t=ft+900+700+Math.random()*2500}
      c.after(t,()=>{if(entschieden)return;send({los:1});c.after(2500,()=>entscheiden())});
    }
    const aktion=()=>{
      if(getan||phase==='pause')return;getan=true;let a;
      if(phase==='los'){a={rt:Math.round(performance.now()-t0)};info.textContent=`Deine Zeit: ${a.rt} ms`}
      else{a={foul:1};info.textContent=phase==='falle'?'Reingefallen!':'Zu früh!'}
      box.classList.add('gedrueckt');
      if(c.host)hostAktion(0,a);else c.send({a});
    };
    c.on(box,'pointerdown',e=>{e.preventDefault();aktion()});
    c.key((e,dn)=>{if(dn&&(e.key===' '||e.key==='Enter')){e.preventDefault();if(!e.repeat)aktion()}});
    c.status('Gleich geht es los …');
    if(c.host)c.after(1500,runde);
    return{msg(d){if(c.host){if(d.a)hostAktion(1,d.a)}else if(d.m)anwenden(d.m)}};
  }});

// ---------------------------------------------------------------------
//  6 · Schnick Schnack Schnuck
// ---------------------------------------------------------------------
SPIELE.push({id:'ssp',name:'Schnick Schnack Schnuck',emoji:'✌️',mode:'vs',
  desc:'Schere, Stein, Papier mit einem Dino-Joker, der einmal alles frisst.',
  how:'Wählt gleichzeitig Schere, Stein oder Papier. Schere schlägt Papier, Papier schlägt Stein, Stein schlägt Schere. Jeder hat <b>einmal pro Spiel</b> den 🦖 Dino-Joker: Der frisst alles, außer einen anderen Dino. Wer zuerst 4 Runden gewinnt, gewinnt.',
  create(c){
    const ZIEL=4,SYM={schere:'✌️',stein:'✊',papier:'✋',dino:'🦖'},SCHL={schere:'papier',papier:'stein',stein:'schere'};
    let r=0,wahl=[null,null],punkte=[0,0],joker=[true,true],aus=false,zeigt=false;const vorrat={};
    c.el.innerHTML=`<div class="ssp"><div class="sspf"><div class="ssph"><span class="hand l">❔</span><small></small></div><div class="sspvs">VS</div><div class="ssph"><span class="hand r">❔</span><small></small></div></div>
      <div class="sspmsg"></div><div class="sspk">${Object.keys(SYM).map(k=>`<button type="button" data-k="${k}"><span>${SYM[k]}</span>${k==='dino'?'Dino-Joker':k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div></div>`;
    const hand=[c.el.querySelector('.hand.l'),c.el.querySelector('.hand.r')],sm=c.el.querySelectorAll('.ssph small'),msg=c.el.querySelector('.sspmsg'),kn=c.el.querySelector('.sspk');
    // links bin immer ich
    const seite=p=>p===c.me?0:1;
    function ui(){
      sm[0].innerHTML=`Du · <b>${punkte[c.me]}</b>`;sm[1].innerHTML=`${esc(c.names[c.other])} · <b>${punkte[c.other]}</b>`;
      kn.querySelectorAll('button').forEach(b=>{b.disabled=aus||zeigt||!!wahl[c.me]||(b.dataset.k==='dino'&&!joker[c.me]);b.classList.toggle('sel',wahl[c.me]===b.dataset.k)});
      if(!zeigt){hand[0].textContent=wahl[c.me]?SYM[wahl[c.me]]:'❔';hand[1].textContent=wahl[c.other]?'✔️':'❔';hand.forEach(h=>h.classList.remove('gew','verl'))}
      if(!aus&&!zeigt)c.status(wahl[c.me]?(wahl[c.other]?'':'Warte auf '+c.n(c.other)+' …'):`Runde ${r+1}: <b>Wähl deine Hand!</b>`+(joker[c.other]?'':' ('+c.n(c.other)+' hat den Dino schon verbraucht.)'));
    }
    function pruefen(){
      if(!wahl[0]||!wahl[1])return;
      zeigt=true;const[a,b]=wahl;
      const w=a===b?-1:a==='dino'?0:b==='dino'?1:SCHL[a]===b?0:1;
      wahl.forEach((k,p)=>{if(k==='dino')joker[p]=false});
      if(w>=0)punkte[w]++;
      hand[0].textContent=SYM[wahl[c.me]];hand[1].textContent=SYM[wahl[c.other]];
      hand.forEach(h=>h.classList.add('auf'));
      if(w>=0){hand[seite(w)].classList.add('gew');hand[1-seite(w)].classList.add('verl')}
      msg.textContent=w<0?'Unentschieden!':w===c.me?'Runde für dich!':'Runde für '+c.names[w]+'!';
      ui();c.status('');
      if(w>=0&&punkte[w]>=ZIEL){aus=true;ui();c.end({w,text:`${punkte[0]} : ${punkte[1]}`,delay:1600});return}
      c.after(1900,()=>{r++;wahl=[null,null];wahl[c.other]=vorrat[r]||null;zeigt=false;msg.textContent='';hand.forEach(h=>h.classList.remove('auf'));ui();pruefen()});
    }
    c.on(kn,'click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;wahl[c.me]=b.dataset.k;c.send({r,k:b.dataset.k});ui();pruefen()});
    ui();
    return{msg(d){vorrat[d.r]=d.k;if(d.r===r&&!zeigt){wahl[c.other]=d.k;ui();pruefen()}}};
  }});

// ---------------------------------------------------------------------
//  7 · Tauziehen
// ---------------------------------------------------------------------
SPIELE.push({id:'tau',name:'Tauziehen',emoji:'🪢',mode:'vs',
  desc:'Abwechselnd hämmern, bis der andere über die Linie fliegt.',
  how:'Drücke <b>abwechselnd</b> ← und → (oder A und D), am Handy abwechselnd die zwei großen Knöpfe. Jeder richtige Wechsel ist ein Zug am Seil. Zieh die Markierung ganz auf deine Seite! Nach 30 Sekunden gewinnt, wer vorne liegt.',
  create(c){
    c.el.innerHTML=`<div class="tau"><div class="taubig">3</div><div class="taut"><div class="taul l"></div><div class="taul r"></div><div class="taurope"><span class="dn l">🦖</span><span class="knot"></span><span class="dn r">🦕</span></div></div>
      <div class="tauzeit">30</div><div class="taukn"><button type="button" data-s="l">◀</button><button type="button" data-s="r">▶</button></div></div>`;
    const big=c.el.querySelector('.taubig'),rope=c.el.querySelector('.taurope'),zeitEl=c.el.querySelector('.tauzeit'),kn=c.el.querySelector('.taukn');
    let pos=0,phase='count',letzte=null,aus=false;
    c.status(`Du bist <b style="color:${FARBE[c.me]}">${c.me?'rechts':'links'}</b> und ziehst nach ${c.me?'rechts':'links'}.`);
    const zeichnen=()=>{rope.style.transform=`translateX(${pos*.42}%)`};
    function anwenden(m){
      if(m.pos!=null){pos=m.pos;zeichnen();rope.classList.remove('ruck');void rope.offsetWidth;rope.classList.add('ruck')}
      if(m.cd!=null){big.textContent=m.cd;big.style.display=''}
      if(m.los){phase='los';big.textContent='ZIEH!';c.after(600,()=>big.style.display='none')}
      if(m.zeit!=null)zeitEl.textContent=m.zeit;
      if(m.ende){phase='aus';aus=true;big.style.display='';big.textContent=m.ende.w<0?'Gleichstand!':m.ende.w===c.me?'Gewonnen!':'Verloren!';
        c.end({w:m.ende.w,text:m.ende.w<0?'Das Seil steht genau in der Mitte.':'Über die Linie gezogen!'})}
    }
    const send=m=>{anwenden(m);c.send({m})};
    const ziehen=p=>{if(phase!=='los'||aus)return;pos=clamp(pos+(p?2:-2),-100,100);dirty=true;if(Math.abs(pos)>=100)fertig(p)};
    let dirty=false;
    function fertig(w){if(aus)return;send({pos});send({ende:{w}})}
    const zug=s=>{if(phase!=='los'||s===letzte)return;letzte=s;if(c.host)ziehen(0);else c.send({z:1})};
    c.key((e,dn)=>{if(!dn||e.repeat)return;const k=e.key.toLowerCase();
      if(k==='arrowleft'||k==='a'){e.preventDefault();zug('l')}else if(k==='arrowright'||k==='d'){e.preventDefault();zug('r')}});
    c.on(kn,'pointerdown',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();zug(b.dataset.s)});
    if(c.host){
      let n=3;const cd=()=>{if(n>0){send({cd:n});n--;c.after(800,cd)}else{send({los:1});start()}};c.after(600,cd);
      function start(){let t=30;c.every(1000,()=>{if(aus)return;t--;send({zeit:t});if(t<=0)fertig(pos<0?0:pos>0?1:-1)})}
      c.every(50,()=>{if(dirty&&!aus){dirty=false;send({pos})}});
    }
    zeichnen();
    return{msg(d){if(c.host){if(d.z)ziehen(1)}else if(d.m)anwenden(d.m)}};
  }});

// ---------------------------------------------------------------------
//  8 · Käsekästchen
// ---------------------------------------------------------------------
SPIELE.push({id:'kaestchen',name:'Käsekästchen',emoji:'🔲',mode:'vs',
  desc:'Striche ziehen, Kästchen schließen, Punkte sammeln. Wer schließt, darf nochmal.',
  how:'Zieht abwechselnd einen Strich zwischen zwei benachbarten Punkten. Wer den vierten Strich um ein Kästchen setzt, bekommt es und ist gleich nochmal dran. Am Ende gewinnt, wer mehr Kästchen hat.',
  create(c){
    const N=5,S=60,O=16,G=N*S+O*2;
    const h=Array((N+1)*N).fill(-1),v=Array(N*(N+1)).fill(-1),box=Array(N*N).fill(-1);let dran=c.seed%2,aus=false;
    let svg=`<svg class="dots" viewBox="0 0 ${G} ${G}">`;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++)svg+=`<rect class="b" data-i="${y*N+x}" x="${O+x*S+4}" y="${O+y*S+4}" width="${S-8}" height="${S-8}"/>`;
    const kante=(k,i,x1,y1,x2,y2)=>`<g class="e" data-k="${k}" data-i="${i}"><line class="hit" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line class="vis" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/></g>`;
    for(let y=0;y<=N;y++)for(let x=0;x<N;x++)svg+=kante('h',y*N+x,O+x*S,O+y*S,O+(x+1)*S,O+y*S);
    for(let y=0;y<N;y++)for(let x=0;x<=N;x++)svg+=kante('v',y*(N+1)+x,O+x*S,O+y*S,O+x*S,O+(y+1)*S);
    for(let y=0;y<=N;y++)for(let x=0;x<=N;x++)svg+=`<circle cx="${O+x*S}" cy="${O+y*S}" r="6"/>`;
    c.el.innerHTML=svg+'</svg>';
    const el=c.el.firstChild;
    const voll=i=>{const x=i%N,y=(i/N)|0;return h[y*N+x]>=0&&h[(y+1)*N+x]>=0&&v[y*(N+1)+x]>=0&&v[y*(N+1)+x+1]>=0};
    const zahl=p=>box.filter(b=>b===p).length;
    const info=()=>{el.classList.toggle('mein',dran===c.me&&!aus);c.status(`${c.dran(dran)} · Kästchen: ${c.n(0)} ${zahl(0)} : ${zahl(1)} ${c.n(1)}`)};
    function zug(k,i,p){
      const arr=k==='h'?h:v;if(arr[i]>=0)return false;arr[i]=p;
      el.querySelector(`.e[data-k="${k}"][data-i="${i}"]`).classList.add('p'+p,'gesetzt');
      const kand=[];
      if(k==='h'){const y=(i/N)|0,x=i%N;if(y>0)kand.push((y-1)*N+x);if(y<N)kand.push(y*N+x)}
      else{const y=(i/(N+1))|0,x=i%(N+1);if(x>0)kand.push(y*N+x-1);if(x<N)kand.push(y*N+x)}
      let zu=false;
      kand.forEach(b=>{if(box[b]<0&&voll(b)){box[b]=p;zu=true;el.querySelector(`.b[data-i="${b}"]`).classList.add('p'+p)}});
      if(!zu)dran=1-dran;
      if(box.every(b=>b>=0)){aus=true;info();const a=zahl(0),b=zahl(1);c.end({w:a===b?-1:a>b?0:1,text:`${a} : ${b} Kästchen`})}
      else info();
      return true;
    }
    c.on(el,'click',e=>{const k=e.target.closest('.e');if(!k||aus||dran!==c.me)return;if(zug(k.dataset.k,+k.dataset.i,c.me))c.send({k:k.dataset.k,i:+k.dataset.i})});
    info();
    return{msg(d){if(!aus)zug(d.k,d.i,c.other)}};
  }});

// ---------------------------------------------------------------------
//  9 · Bombe entschärfen
// ---------------------------------------------------------------------
const BOMBE_SPALTEN=[
  ['Ω','★','☾','ψ','♞','∞','¶'],
  ['§','Ω','✿','♣','☾','λ','Ж'],
  ['♫','¶','Ж','★','Ѯ','¿','✂'],
  ['∆','♣','ψ','✂','§','ϗ','Ѯ'],
  ['λ','ϗ','∞','¿','✿','♫','∆']];
const BOMBE_FH={rot:'#e2342b',blau:'#1740d8',gelb:'#f5c518',weiß:'#f4f2ec',schwarz:'#15151a',grün:'#1f9d55'};
const BOMBE_ZIFFER={blau:4,gelb:5,rot:3,weiß:1};
// Farbfolge: [Vokal ja/nein][Fehler 0/1/2][blinkende Farbe] → zu drückende Farbe
const BOMBE_SIMON_F=['rot','blau','grün','gelb'];
const BOMBE_SIMON=[[[1,0,3,2],[3,2,1,0],[2,0,3,1]],[[1,3,2,0],[0,1,3,2],[3,2,1,0]]];
const BOMBE_WORTE=['ANKER','APFEL','BIRNE','BLITZ','BLUME','BRIEF','DACHS','DRAHT','EIMER','FEDER','FISCH','GABEL','GEIST','HONIG','INSEL','KATZE','KERZE','KRONE','LAMPE','MAUER','NEBEL','PIRAT','RADIO','REGEN','SONNE','STERN','TIGER','WOLKE','ZANGE','ZEBRA'];
const BOMBE_LEVEL=[
  {name:'Übungsbombe',mods:['draht','knopf'],zeit:300},
  {name:'Der Klassiker',mods:['draht','knopf','symbol'],zeit:240},
  {name:'Blinklichter',mods:['draht','simon','symbol'],zeit:240},
  {name:'Wortsalat',mods:['passwort','knopf','gedaechtnis'],zeit:240},
  {name:'Viererpack',mods:['draht','simon','passwort','gedaechtnis'],zeit:300},
  {name:'Turbo',mods:['draht','knopf','symbol','simon','passwort','gedaechtnis'],zeit:360,turbo:true},
  {name:'Endgegner',mods:['draht','knopf','symbol','simon','passwort','gedaechtnis'],zeit:270,turbo:true,max:2}];
function bombeDraht(d,serie,batt){
  const n=d.length,anz=f=>d.filter(x=>x===f).length,letzt=f=>d.lastIndexOf(f),gerade=+serie.slice(-1)%2===0,vokal=/[AEIOU]/.test(serie);
  if(n===3){if(!anz('blau'))return 1;if(d[2]==='rot')return 2;if(anz('weiß')>1)return d.indexOf('weiß');return 0}
  if(n===4){if(gerade&&anz('rot')>=2)return letzt('rot');if(d[0]==='gelb')return 2;if(anz('schwarz')===1)return d.indexOf('schwarz');return 1}
  if(n===5){if(!anz('gelb'))return 3;if(batt>=2&&d[4]==='weiß')return 0;if(anz('grün')===1)return d.indexOf('grün');return 4}
  if(vokal)return 2;if(!anz('rot'))return 4;if(anz('blau')>anz('gelb'))return letzt('blau');return 5;
}
function bombeKnopfHalten(f,t,batt){
  if(f==='blau'&&t==='STOPP')return true;
  if(batt>=2&&t==='BUMM')return false;
  if(f==='weiß')return true;
  if(t==='HALTEN'&&f==='rot')return false;
  if(batt>=3)return false;
  return true;
}
const BOMBE_HB={
  draht:`<div class="hb"><h4>Drähte</h4><p>Die Drähte werden von oben nach unten gezählt. Nimm die Regeln für die passende Anzahl und geh sie der Reihe nach durch. Die <b>erste</b> zutreffende Regel gilt. Es wird genau ein Draht geschnitten.</p>
<p><b>3 Drähte</b></p><ol><li>Kein blauer Draht dabei: schneide den <b>zweiten</b>.</li><li>Sonst, wenn der letzte Draht rot ist: schneide den <b>letzten</b>.</li><li>Sonst, wenn es mehr als einen weißen gibt: schneide den <b>ersten weißen</b>.</li><li>Sonst: schneide den <b>ersten</b>.</li></ol>
<p><b>4 Drähte</b></p><ol><li>Seriennummer endet mit einer geraden Ziffer und es gibt mindestens zwei rote: schneide den <b>letzten roten</b>.</li><li>Sonst, wenn der erste Draht gelb ist: schneide den <b>dritten</b>.</li><li>Sonst, wenn es genau einen schwarzen gibt: schneide den <b>schwarzen</b>.</li><li>Sonst: schneide den <b>zweiten</b>.</li></ol>
<p><b>5 Drähte</b></p><ol><li>Kein gelber Draht dabei: schneide den <b>vierten</b>.</li><li>Sonst, wenn es mindestens 2 Batterien gibt und der letzte Draht weiß ist: schneide den <b>ersten</b>.</li><li>Sonst, wenn es genau einen grünen gibt: schneide den <b>grünen</b>.</li><li>Sonst: schneide den <b>letzten</b>.</li></ol>
<p><b>6 Drähte</b></p><ol><li>Seriennummer enthält einen Vokal (A, E, I, O, U): schneide den <b>dritten</b>.</li><li>Sonst, wenn es keinen roten gibt: schneide den <b>fünften</b>.</li><li>Sonst, wenn es mehr blaue als gelbe gibt: schneide den <b>letzten blauen</b>.</li><li>Sonst: schneide den <b>letzten</b>.</li></ol></div>`,
  knopf:`<div class="hb"><h4>Der Knopf</h4><p>Geh die Regeln der Reihe nach durch, die <b>erste</b> zutreffende gilt.</p>
<ol><li>Blauer Knopf mit der Aufschrift „STOPP“: <b>halten</b>.</li><li>Mindestens 2 Batterien und Aufschrift „BUMM“: <b>kurz drücken</b>.</li><li>Weißer Knopf: <b>halten</b>.</li><li>Roter Knopf mit der Aufschrift „HALTEN“: <b>kurz drücken</b>.</li><li>Mindestens 3 Batterien: <b>kurz drücken</b>.</li><li>Sonst: <b>halten</b>.</li></ol>
<p><b>Kurz drücken:</b> drücken und sofort loslassen.<br><b>Halten:</b> Gedrückt halten, bis rechts ein farbiger Streifen leuchtet. Loslassen, wenn irgendwo im Timer diese Ziffer steht:</p>
<table class="hbt"><tr><th>Streifen</th><td>Blau</td><td>Gelb</td><td>Rot</td><td>Weiß</td></tr><tr><th>Ziffer</th><td>4</td><td>5</td><td>3</td><td>1</td></tr></table></div>`,
  symbol:`<div class="hb"><h4>Symbole</h4><p>Auf der Bombe sind vier Symbole. Genau eine Spalte hier enthält alle vier. Sie müssen in der Reihenfolge gedrückt werden, in der sie in dieser Spalte <b>von oben nach unten</b> stehen.</p>
<div class="hbs">${BOMBE_SPALTEN.map(s=>`<div>${s.map(x=>`<span>${x}</span>`).join('')}</div>`).join('')}</div></div>`,
  simon:`<div class="hb"><h4>Farbfolge</h4><p>Vier Farbfelder blinken eine Folge. Für jede blinkende Farbe muss eine <b>andere</b> Farbe gedrückt werden, und zwar für die ganze bisher geblinkte Folge. Danach wird die Folge um eine Farbe länger. Nach 3 bis 5 Stufen ist das Modul gelöst.</p>
<p>Welche Farbe gedrückt wird, hängt davon ab, ob die <b>Seriennummer einen Vokal</b> hat und wie viele <b>Fehler</b> ihr gerade habt:</p>
${['Seriennummer MIT Vokal','Seriennummer OHNE Vokal'].map((t,v)=>`<p><b>${t}</b></p><table class="hbt"><tr><th>Blinkt</th>${BOMBE_SIMON_F.map(f=>`<td>${f[0].toUpperCase()+f.slice(1)}</td>`).join('')}</tr>${[0,1,2].map(f=>`<tr><th>${f===2?'2+ Fehler':f+' Fehler'}</th>${BOMBE_SIMON[v][f].map(k=>`<td style="color:${BOMBE_FH[BOMBE_SIMON_F[k]]};font-weight:800">${BOMBE_SIMON_F[k][0].toUpperCase()+BOMBE_SIMON_F[k].slice(1)}</td>`).join('')}</tr>`).join('')}</table>`).join('')}</div>`,
  passwort:`<div class="hb"><h4>Passwort</h4><p>Fünf Buchstabenrollen. Mit ▲ und ▼ lassen sich in jeder Spalte fünf Buchstaben durchblättern. Genau eines dieser Wörter lässt sich damit bilden. Einstellen und <b>SENDEN</b> drücken.</p>
<p class="hbw">${BOMBE_WORTE.join(' ')}</p><p>Tipp: Lass dir die Buchstaben der ersten Spalte vorlesen, das schließt schon viele Wörter aus.</p></div>`,
  gedaechtnis:`<div class="hb"><h4>Gedächtnis</h4><p>Eine große Zahl im Display, darunter vier Tasten mit den Zahlen 1 bis 4 (durcheinander). Das Modul hat <b>4 Stufen</b>. Merk dir in jeder Stufe, welche <b>Position</b> (1 = ganz links) und welche <b>Beschriftung</b> gedrückt wurde. Ein Fehler setzt das Modul auf Stufe 1 zurück.</p>
<p><b>Stufe 1</b> · Display 1: Position 2 · 2: Position 2 · 3: Position 3 · 4: Position 4</p>
<p><b>Stufe 2</b> · Display 1: Taste mit der Beschriftung „4“ · 2: gleiche Position wie in Stufe 1 · 3: Position 1 · 4: gleiche Position wie in Stufe 1</p>
<p><b>Stufe 3</b> · Display 1: gleiche Beschriftung wie in Stufe 2 · 2: gleiche Beschriftung wie in Stufe 1 · 3: Position 3 · 4: Beschriftung „4“</p>
<p><b>Stufe 4</b> · Display 1: gleiche Position wie in Stufe 1 · 2: Position 1 · 3: gleiche Position wie in Stufe 2 · 4: gleiche Position wie in Stufe 2</p></div>`};
// Module der Bombe: html (Entschärfer-Ansicht) und init(el) mit der Spiellogik.
// a: {loesen, falsch, fehler(), aus(), ok(), rest(), on, every, serie, batt, vokal}
const BOMBE_MOD={
  draht(r,a){
    const FARBEN=Object.keys(BOMBE_FH),d=[],n=3+ri(r,4);for(let i=0;i<n;i++)d.push(FARBEN[ri(r,FARBEN.length)]);
    const richtig=bombeDraht(d,a.serie,a.batt);
    return{html:`<svg class="drw" viewBox="0 0 240 ${n*34+16}">${d.map((f,i)=>`<g data-i="${i}"><rect x="0" y="${8+i*34}" width="240" height="30" fill="transparent"/><line x1="16" y1="${23+i*34}" x2="224" y2="${23+i*34}" stroke="#000" stroke-width="13" stroke-linecap="round"/><line class="dr" x1="16" y1="${23+i*34}" x2="224" y2="${23+i*34}" stroke="${BOMBE_FH[f]}" stroke-width="9" stroke-linecap="round"/></g>`).join('')}</svg>`,
      init(m){a.on(m,'click',e=>{const gr=e.target.closest('g[data-i]');if(!gr||a.aus()||a.ok()||gr.classList.contains('cut'))return;gr.classList.add('cut');if(+gr.dataset.i===richtig)a.loesen();else a.falsch()})}};
  },
  knopf(r,a){
    const kf=['rot','blau','gelb','weiß'][ri(r,4)],kt=['DRÜCKEN','HALTEN','STOPP','BUMM'][ri(r,4)],ks=['blau','gelb','rot','weiß'][ri(r,4)];
    const halten=bombeKnopfHalten(kf,kt,a.batt);
    return{html:`<div class="knw"><button type="button" class="bkn" style="--k:${BOMBE_FH[kf]};color:${kf==='gelb'||kf==='weiß'?'#1c1c1e':'#fff'}">${kt}</button><span class="bstr"></span></div>`,
      init(m){
        const kn=m.querySelector('.bkn'),str=m.querySelector('.bstr');let haltT=null,gehalten=false;
        a.on(kn,'pointerdown',e=>{e.preventDefault();if(a.aus()||a.ok())return;try{kn.setPointerCapture(e.pointerId)}catch(_){}gehalten=false;
          haltT=setTimeout(()=>{gehalten=true;str.style.background=BOMBE_FH[ks];str.classList.add('an')},600)});
        const los=()=>{if(haltT==null)return;clearTimeout(haltT);haltT=null;str.style.background='';str.classList.remove('an');if(a.aus()||a.ok())return;
          if(!gehalten){if(!halten)a.loesen();else a.falsch()}
          else if(halten&&a.uhr().includes(String(BOMBE_ZIFFER[ks])))a.loesen();else a.falsch()};
        a.on(kn,'pointerup',los);a.on(kn,'pointercancel',los);
      }};
  },
  symbol(r,a){
    let sp,sym;for(;;){sp=ri(r,5);sym=shuffle(BOMBE_SPALTEN[sp].slice(),r).slice(0,4);if(BOMBE_SPALTEN.filter(s=>sym.every(x=>s.includes(x))).length===1)break}
    const reihe=BOMBE_SPALTEN[sp].filter(x=>sym.includes(x)),anzeige=shuffle(sym.slice(),r);
    return{html:`<div class="bsym">${anzeige.map(s=>`<button type="button" data-s="${s}">${s}</button>`).join('')}</div>`,
      init(m){let nx=0;a.on(m,'click',e=>{const b=e.target.closest('button[data-s]');if(!b||a.aus()||a.ok()||b.classList.contains('an'))return;
        if(b.dataset.s===reihe[nx]){b.classList.add('an');nx++;if(nx===4)a.loesen()}else a.falsch()})}};
  },
  simon(r,a){
    const len=3+ri(r,3),seq=[];for(let i=0;i<len;i++)seq.push(ri(r,4));
    return{html:`<div class="bsim">${BOMBE_SIMON_F.map((f,i)=>`<button type="button" data-i="${i}" style="--k:${BOMBE_FH[f]}" aria-label="${f}"></button>`).join('')}</div>`,
      init(m){
        const kn=[...m.querySelectorAll('button')];let st=0,pos=0,start=performance.now()+1200,druck=-1,druckBis=0;
        a.every(80,()=>{const t=performance.now();let an=-1;
          if(t<druckBis)an=druck;
          else if(!a.ok()&&!a.aus()&&t>start){const cyc=(st+1)*650+1600,tt=(t-start)%cyc,i=Math.floor(tt/650);if(i<=st&&tt%650<400)an=seq[i]}
          kn.forEach((b,j)=>b.classList.toggle('an',j===an))});
        a.on(m,'pointerdown',e=>{const b=e.target.closest('button[data-i]');if(!b||a.aus()||a.ok())return;e.preventDefault();
          const k=+b.dataset.i,t=performance.now();druck=k;druckBis=t+220;start=t+2600;
          const soll=BOMBE_SIMON[a.vokal?0:1][Math.min(2,a.fehler())][seq[pos]];
          if(k===soll){pos++;if(pos>st){st++;pos=0;start=t+900;if(st===len)a.loesen()}}else{pos=0;a.falsch()}});
      }};
  },
  passwort(r,a){
    const AB='ABCDEFGHIKLMNOPRSTUWZ';let wort,sp;
    for(;;){wort=BOMBE_WORTE[ri(r,BOMBE_WORTE.length)];
      sp=[...wort].map(ch=>{const s=new Set([ch]);while(s.size<5)s.add(AB[ri(r,AB.length)]);return shuffle([...s],r)});
      if(BOMBE_WORTE.filter(w=>[...w].every((ch,i)=>sp[i].includes(ch))).length===1)break}
    return{html:`<div class="bpw"><div class="bpwr">${sp.map((s,i)=>`<div data-i="${i}"><button type="button" data-d="-1" aria-label="Hoch">▲</button><b>${s[0]}</b><button type="button" data-d="1" aria-label="Runter">▼</button></div>`).join('')}</div><button type="button" class="bpwok">SENDEN</button></div>`,
      init(m){const idx=[0,0,0,0,0];
        a.on(m,'click',e=>{const b=e.target.closest('button');if(!b||a.aus()||a.ok())return;
          if(b.dataset.d){const col=b.parentElement,i=+col.dataset.i;idx[i]=(idx[i]+ +b.dataset.d+5)%5;col.querySelector('b').textContent=sp[i][idx[i]]}
          else if(idx.map((k,i)=>sp[i][k]).join('')===wort)a.loesen();else a.falsch()})}};
  },
  gedaechtnis(r,a){
    return{html:`<div class="bmem"><div class="bmemd">–</div><div class="bmemk"></div><div class="bmems"></div></div>`,
      init(m){
        let st=0,anz,lab;const h=[];
        const neu=()=>{anz=1+ri(Math.random,4);lab=shuffle([1,2,3,4],Math.random);m.querySelector('.bmemd').textContent=anz;
          m.querySelector('.bmemk').innerHTML=lab.map((l,i)=>`<button type="button" data-p="${i}">${l}</button>`).join('');
          m.querySelector('.bmems').innerHTML=[0,1,2,3].map(i=>`<i class="${i<st?'an':''}"></i>`).join('')};
        const soll=()=>{const L=l=>lab.indexOf(l);
          if(st===0)return[1,1,2,3][anz-1];
          if(st===1)return[L(4),h[0].p,0,h[0].p][anz-1];
          if(st===2)return[L(h[1].l),L(h[0].l),2,L(4)][anz-1];
          return[h[0].p,0,h[1].p,h[1].p][anz-1]};
        a.on(m,'click',e=>{const b=e.target.closest('button[data-p]');if(!b||a.aus()||a.ok())return;const p=+b.dataset.p;
          if(p===soll()){h.push({p,l:lab[p]});st++;if(st===4){m.querySelector('.bmems').innerHTML='<i class="an"></i>'.repeat(4);m.querySelector('.bmemk').innerHTML='';m.querySelector('.bmemd').textContent='✓';a.loesen()}else neu()}
          else{st=0;h.length=0;a.falsch();neu()}});
        neu();
      }};
  }};
const BOMBE_NAME={draht:'Drähte',knopf:'Knopf',symbol:'Symbole',simon:'Farbfolge',passwort:'Passwort',gedaechtnis:'Gedächtnis'};

SPIELE.push({id:'bombe',name:'Bombe entschärfen',emoji:'💣',mode:'coop',
  desc:'Einer sieht die Bombe, der andere das Handbuch. 7 Level, von der Übungsbombe bis zum Endgegner.',
  how:'Einer ist <b>Entschärfer</b> und sieht die Bombe, der andere ist <b>Experte</b> und hat das Handbuch. Der Entschärfer beschreibt, was er sieht, der Experte sagt, was zu tun ist. Redet über den Chat rechts (oder ruft euch an). Löst alle Module, bevor die Zeit abläuft. Zu viele Fehler und es macht BUMM. Es gibt <b>7 Level</b> mit immer mehr Modulen (Drähte, Knopf, Symbole, Farbfolge, Passwort, Gedächtnis). Ab Level 6 läuft der Timer mit jedem Fehler schneller. Nach jeder Bombe tauscht ihr die Rollen.',
  create(c){
    const MAXLV=BOMBE_LEVEL.length;
    let best=0;try{best=+localStorage.getItem('lm2p-bombe-lv')||0}catch(_){}
    let n=0,lv=-1,lokal=[],netz=null;
    const aufraeumen=()=>{lokal.forEach(id=>{clearInterval(id);clearTimeout(id)});lokal=[];netz=null};
    const mmss=t=>{t=Math.max(0,Math.ceil(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')};
    // Level-Auswahl: der Host startet, der Gast fragt an
    const waehle=l=>{if(c.host)starte(l);else c.send({will:l})};
    function starte(l){n++;c.send({start:l,n});bauen(l,n)}
    function auswahl(){
      aufraeumen();lv=-1;
      c.el.innerHTML=`<div class="bwahl"><h4>Welche Bombe?</h4><div class="bwl">${BOMBE_LEVEL.map((L,i)=>`<button type="button" data-l="${i}" class="${i<best?'fertig':''}"><b>${i+1}</b><span>${L.name}</span><small>${L.mods.length} Module · ${mmss(L.zeit)}${L.turbo?' · Turbo':''}${L.max?' · nur '+L.max+' Fehler':''}</small>${i<best?'<i>✓</i>':''}</button>`).join('')}</div><p class="small">Wer ein Level anklickt, startet es für euch beide. Nach jeder Bombe tauscht ihr die Rollen.</p></div>`;
      c.on(c.el.querySelector('.bwl'),'click',e=>{const b=e.target.closest('button[data-l]');if(b)waehle(+b.dataset.l)});
      c.status('Sucht euch ein Level aus. Neu dabei? Fangt mit der Übungsbombe an!');
    }
    function ergebnis(win,text){
      if(win&&lv+1>best){best=lv+1;try{localStorage.setItem('lm2p-bombe-lv',best)}catch(_){}}
      if(win&&lv===MAXLV-1){c.end({coop:true,win:true,text:'Alle 7 Bomben entschärft! '+text,delay:1600});return}
      const box=document.createElement('div');box.className='bres '+(win?'gut':'schlecht');
      box.innerHTML=`<h4>${win?'Entschärft! 🎉':'BUMM! 💥'}</h4><p>${esc(text)}</p><div>${win?`<button type="button" class="btn primary" data-l="${lv+1}">Weiter: Level ${lv+2} →</button>`:`<button type="button" class="btn primary" data-l="${lv}">↻ Nochmal versuchen</button>`}<button type="button" class="btn" data-m="1">Level wählen</button></div>`;
      c.el.prepend(box);
      c.on(box,'click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.m){c.send({menu:1});auswahl()}else waehle(+b.dataset.l)});
      c.status(win?'Geschafft! Weiter geht’s, diesmal mit getauschten Rollen.':'Das ging schief. Nochmal, diesmal mit getauschten Rollen?');
      box.scrollIntoView({block:'nearest',behavior:'smooth'});
    }
    function bauen(l,nr){
      aufraeumen();lv=l;const L=BOMBE_LEVEL[l],r=rngFrom(c.seed+l*7919+nr*104729),E=((c.seed>>>3)+nr)%2,ich=c.me===E?'ent':'exp',MAXF=L.max||3;
      const A='ABCDEFGHIJKLMNOPQRSTUVWXZ',Z='0123456789';
      let serie='';for(let i=0;i<5;i++){const q=r()<.6?A:Z;serie+=q[ri(r,q.length)]}serie+=Z[ri(r,10)];
      const batt=ri(r,4);
      let rest=L.zeit,fehler=0,aus=false;const ok=L.mods.map(()=>false);
      const kopf=`<div class="blv">Level ${l+1} · ${esc(L.name)}${L.turbo?' · ⚡ Turbo':''}</div>`;
      const lage=()=>`<div class="bstat"><span class="btimer">${mmss(rest)}</span><span class="bfehl">${'✖'.repeat(fehler)}${'·'.repeat(Math.max(0,MAXF-fehler))}</span><span>Module: ${ok.filter(Boolean).length}/${ok.length}</span><span class="small">${L.mods.map((k,i)=>(ok[i]?'✅ ':'')+BOMBE_NAME[k]).join(' · ')}</span></div>`;
      if(ich==='exp'){
        c.el.innerHTML=`<div class="bexp">${kopf}<div class="brolle">📖 Du bist der <b>Experte</b>. ${c.n(c.other)} sieht die Bombe. Frag nach, was drauf ist, und sag, was zu tun ist!</div><div class="blage">${lage()}</div>
          <div class="hbuch"><div class="hb"><h4>Allgemein</h4><p>Die Bombe hat eine <b>Seriennummer</b> und eine Anzahl <b>Batterien</b>. Frag den Entschärfer danach, viele Regeln brauchen das. ${MAXF} Fehler und die Bombe explodiert.${L.turbo?' <b>Turbo:</b> Mit jedem Fehler läuft der Timer schneller!':''}</p><p>Auf dieser Bombe: <b>${L.mods.map(k=>BOMBE_NAME[k]).join(', ')}</b>.</p></div>${[...new Set(L.mods)].map(k=>BOMBE_HB[k]).join('')}</div></div>`;
        const lg=c.el.querySelector('.blage');
        c.status('Lies das Handbuch und lotse über den Chat.');
        netz=d=>{if(d.n!==nr)return;if(d.st){rest=d.st.t;fehler=d.st.f;d.st.ok.forEach((v,i)=>ok[i]=v);lg.innerHTML=lage()}if(d.ende&&!aus){aus=true;ergebnis(d.ende.win,d.ende.text)}};
        return;
      }
      const api={serie,batt,vokal:/[AEIOU]/.test(serie),fehler:()=>fehler,aus:()=>aus,uhr:()=>mmss(rest),on:c.on,every:(ms,f)=>{const id=c.every(ms,f);lokal.push(id);return id}};
      const mods=L.mods.map((k,i)=>BOMBE_MOD[k](r,{...api,ok:()=>ok[i],loesen:()=>loesen(i),falsch:()=>falsch()}));
      c.el.innerHTML=`<div class="bomb">${kopf}<div class="brolle">💣 Du bist der <b>Entschärfer</b>. Beschreib ${c.n(c.other)} genau, was du siehst. Nur dein Partner hat das Handbuch!</div>
        <div class="bcase"><div class="btop"><div class="bt btimer">${mmss(rest)}</div><div class="bt bfehl"></div><div class="bser">SERIENNR. <b>${serie}</b></div><div class="bbat">${batt?'🔋'.repeat(batt):'keine Batterien'}</div></div>
        <div class="bmods">${mods.map((m,i)=>`<div class="bmod" data-m="${i}"><i class="led"></i><span class="bmn">${BOMBE_NAME[L.mods[i]]}</span>${m.html}</div>`).join('')}</div></div></div>`;
      const caseEl=c.el.querySelector('.bcase'),modEl=c.el.querySelectorAll('.bmod');
      const sendeLage=()=>c.send({n:nr,st:{t:rest,f:fehler,ok}});
      const zeichne=()=>{c.el.querySelector('.btimer').textContent=mmss(rest);c.el.querySelector('.bfehl').textContent='✖'.repeat(fehler)+'·'.repeat(Math.max(0,MAXF-fehler));modEl.forEach((m,i)=>m.classList.toggle('ok',ok[i]))};
      function ende(win,text){if(aus)return;aus=true;zeichne();sendeLage();caseEl.classList.add(win?'gerettet':'bumm');c.send({n:nr,ende:{win,text}});lokal.push(c.after(1200,()=>ergebnis(win,text)))}
      function loesen(i){if(ok[i])return;ok[i]=true;zeichne();sendeLage();if(ok.every(Boolean))ende(true,`Level ${l+1} entschärft mit ${mmss(rest)} auf der Uhr und ${fehler} Fehler${fehler===1?'':'n'}.`)}
      function falsch(){fehler++;zeichne();sendeLage();caseEl.classList.remove('wackel');void caseEl.offsetWidth;caseEl.classList.add('wackel');if(fehler>=MAXF)ende(false,`${MAXF} Fehler. Die Bombe ist explodiert.`)}
      mods.forEach((m,i)=>m.init(modEl[i]));
      let alt=performance.now();
      api.every(100,()=>{if(aus)return;const t=performance.now(),vor=Math.ceil(rest);rest-=(t-alt)/1000*(L.turbo?1+fehler*.25:1);alt=t;
        if(Math.ceil(rest)!==vor){zeichne();sendeLage()}if(rest<=0){rest=0;ende(false,'Die Zeit ist abgelaufen.')}});
      zeichne();
      c.status('Die Zeit läuft! Beschreib deinem Experten die Bombe.');
      sendeLage();
    }
    auswahl();
    return{msg(d){
      if(d.will!=null&&c.host)starte(clamp(d.will|0,0,MAXLV-1));
      else if(d.start!=null&&!c.host){n=d.n;bauen(clamp(d.start|0,0,MAXLV-1),d.n)}
      else if(d.menu)auswahl();
      else if(netz)netz(d);
    }};
  }});

// ---------------------------------------------------------------------
//  10 · Blind-Labyrinth
// ---------------------------------------------------------------------
SPIELE.push({id:'labyrinth',name:'Blind-Labyrinth',emoji:'🌀',mode:'coop',
  desc:'Einer läuft blind durchs Labyrinth, der andere lotst ihn vorbei an Fallen.',
  how:'Der <b>Läufer</b> sieht keine Wände, nur die, gegen die er schon gelaufen ist. Der <b>Lotse</b> sieht das ganze Labyrinth, das Ziel und die Fallen und gibt im Chat Anweisungen („3 runter, dann rechts!“). Tritt der Läufer in eine Falle, muss er zurück zum Start. Nach jedem Level tauscht ihr die Rollen. Schafft alle 3 Level so schnell wie möglich!',
  create(c){
    const GR=[6,8,10],FA=[2,4,6],W=520,P=20;const{g,cv}=leinwand(c,W,W);
    let lv=0,n,E,Sd,fallen,ziel,laeufer,pos,spur,gesehen,fallenGes,stoesse=0,fallenZahl=0,pause=false,wackel=0,aus=false;const t0=performance.now();
    function bau(){
      n=GR[lv];const r=rngFrom(c.seed+lv*7919);E=Array(n*n).fill(true);Sd=Array(n*n).fill(true);
      const bes=new Uint8Array(n*n),st=[0];bes[0]=1;
      while(st.length){const i=st[st.length-1],x=i%n,y=(i/n)|0,nb=[];
        if(x>0&&!bes[i-1])nb.push(i-1);if(x<n-1&&!bes[i+1])nb.push(i+1);if(y>0&&!bes[i-n])nb.push(i-n);if(y<n-1&&!bes[i+n])nb.push(i+n);
        if(!nb.length){st.pop();continue}
        const j=nb[ri(r,nb.length)];if(j===i+1)E[i]=false;else if(j===i-1)E[j]=false;else if(j===i+n)Sd[i]=false;else Sd[j]=false;bes[j]=1;st.push(j)}
      ziel=n*n-1;
      const vor=new Int32Array(n*n).fill(-1),q=[0];vor[0]=0;
      while(q.length){const i=q.shift();for(const j of nachbarn(i))if(vor[j]<0){vor[j]=i;q.push(j)}}
      const weg=new Set();for(let i=ziel;i!==0;i=vor[i])weg.add(i);weg.add(0);
      const kand=shuffle([...Array(n*n).keys()].filter(i=>!weg.has(i)),r);fallen=new Set(kand.slice(0,FA[lv]));
      laeufer=(c.seed+lv)%2;pos=0;spur=new Set([0]);gesehen=new Set();fallenGes=new Set();pause=false;info();
    }
    function offen(i,d){const x=i%n,y=(i/n)|0;
      if(d[0]===1)return x<n-1&&!E[i];if(d[0]===-1)return x>0&&!E[i-1];if(d[1]===1)return y<n-1&&!Sd[i];return y>0&&!Sd[i-n]}
    function nachbarn(i){const r=[];for(const d of[[1,0],[-1,0],[0,1],[0,-1]])if(offen(i,d))r.push(i+d[0]+d[1]*n);return r}
    const wandKey=(i,d)=>d[0]===1?'e'+i:d[0]===-1?'e'+(i-1):d[1]===1?'s'+i:'s'+(i-n);
    function info(){
      const rolle=laeufer===c.me?`Du bist <b>Läufer</b>. Du siehst die Wände nicht. Hör auf ${c.n(c.other)}!`:`Du bist <b>Lotse</b>. Sag ${c.n(c.other)} im Chat, wo es langgeht.`;
      c.status(`Level ${lv+1}/3 · ${rolle} · Stöße: ${stoesse} · Fallen: ${fallenZahl}`);
    }
    function anwenden(m){
      if(m.w){gesehen.add(m.w);stoesse++;wackel=1;info()}
      if(m.p!=null){pos=m.p;spur.add(pos)}
      if(m.f!=null){fallenGes.add(m.f);fallenZahl++;wackel=1;pos=0;info()}
      if(m.ziel){pause=true;
        if(lv<2)c.after(2000,()=>{lv++;bau()});
        else if(!aus){aus=true;const s=Math.round((performance.now()-t0)/1000);c.end({coop:true,win:true,text:`Alle 3 Level in ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} Minuten · ${stoesse} Stöße · ${fallenZahl} Fallen`})}}
    }
    function gehe(d){
      if(laeufer!==c.me||pause||aus)return;
      const x=pos%n,y=(pos/n)|0,nx=x+d[0],ny=y+d[1];
      let m;
      if(nx<0||ny<0||nx>=n||ny>=n){wackel=1;return}
      if(!offen(pos,d))m={w:wandKey(pos,d)};
      else{const j=ny*n+nx;m=fallen.has(j)?{p:j,f:j}:{p:j};if(j===ziel)m.ziel=1}
      anwenden(m);c.send(m);
    }
    c.key((e,dn)=>{const d=dn&&richtung(e);if(!d)return;e.preventDefault();gehe(d)});
    wischen(c,cv,gehe);steuerkreuz(c,gehe);
    bau();
    c.frame(()=>{
      const cs=(W-P*2)/n,lotse=laeufer!==c.me,X=i=>P+(i%n)*cs,Y=i=>P+((i/n)|0)*cs;
      wackel*=.85;const sx=(Math.random()-.5)*wackel*10;
      g.setTransform(2,0,0,2,0,0);g.fillStyle='#f4f2ec';g.fillRect(0,0,W,W);g.translate(sx,0);
      g.fillStyle='#fff';g.fillRect(P,P,W-P*2,W-P*2);
      spur.forEach(i=>{g.fillStyle='rgba(23,64,216,.12)';g.fillRect(X(i),Y(i),cs,cs)});
      const loch=i=>{g.fillStyle='#1c1c1e';g.beginPath();g.ellipse(X(i)+cs/2,Y(i)+cs/2,cs*.32,cs*.22,0,0,7);g.fill();g.strokeStyle='#e2342b';g.lineWidth=3;g.stroke()};
      if(lotse)fallen.forEach(loch);
      fallenGes.forEach(i=>{g.fillStyle='rgba(226,52,43,.25)';g.fillRect(X(i),Y(i),cs,cs);loch(i)});
      if(lotse){g.font=`${cs*.6}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('🏁',X(ziel)+cs/2,Y(ziel)+cs/2)}
      g.lineCap='round';
      if(lotse){g.strokeStyle='#1c1c1e';g.lineWidth=4;g.beginPath();
        for(let i=0;i<n*n;i++){const x=i%n,y=(i/n)|0;if(x<n-1&&E[i]){g.moveTo(X(i)+cs,Y(i));g.lineTo(X(i)+cs,Y(i)+cs)}if(y<n-1&&Sd[i]){g.moveTo(X(i),Y(i)+cs);g.lineTo(X(i)+cs,Y(i)+cs)}}g.stroke()}
      else{g.fillStyle='rgba(28,28,30,.25)';for(let y=0;y<=n;y++)for(let x=0;x<=n;x++)g.fillRect(P+x*cs-2,P+y*cs-2,4,4)}
      g.strokeStyle='#e2342b';g.lineWidth=6;g.beginPath();
      gesehen.forEach(k=>{const i=+k.slice(1);if(k[0]==='e'){g.moveTo(X(i)+cs,Y(i));g.lineTo(X(i)+cs,Y(i)+cs)}else{g.moveTo(X(i),Y(i)+cs);g.lineTo(X(i)+cs,Y(i)+cs)}});g.stroke();
      g.strokeStyle='#1c1c1e';g.lineWidth=6;g.strokeRect(P,P,W-P*2,W-P*2);
      g.fillStyle=FARBE[laeufer];g.beginPath();g.arc(X(pos)+cs/2,Y(pos)+cs/2,cs*.3,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=3;g.stroke();
      if(pause){g.fillStyle='rgba(28,28,30,.75)';g.fillRect(P,W/2-40,W-P*2,80);g.fillStyle='#fff';g.font='800 32px ui-rounded,system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(lv<2?'LEVEL GESCHAFFT! ROLLENTAUSCH …':'ZIEL ERREICHT!',W/2,W/2)}
    });
    return{msg(d){anwenden(d)}};
  }});

// ---------------------------------------------------------------------
//  11 · Gedankenleser
// ---------------------------------------------------------------------
SPIELE.push({id:'gedanken',name:'Gedankenleser',emoji:'🧠',mode:'coop',
  desc:'Sagt gleichzeitig dasselbe Wort. Klingt leicht? Ist es nicht.',
  how:'Jeder tippt heimlich ein Wort ein, dann werden beide gleichzeitig aufgedeckt. Sind sie gleich, habt ihr gewonnen! Wenn nicht, sucht ihr in der nächsten Runde ein Wort, das zu <b>beiden</b> letzten Wörtern passt (zum Beispiel „Meer“ und „Sand“ → „Strand“). Ihr habt 10 Versuche. Schon benutzte Wörter sind tabu. Im Chat nichts absprechen!',
  create(c){
    const MAX=10;let r=0,wahl=[null,null],aus=false;const vorrat={},verlauf=[],benutzt=new Set();
    c.el.innerHTML=`<div class="gl"><div class="glv"></div><div class="glauf"></div><form class="glf"><input maxlength="30" autocomplete="off" placeholder="Dein Wort …" aria-label="Dein Wort"><button class="btn primary sm">Abgeben</button></form><div class="glh"></div></div>`;
    const v=c.el.querySelector('.glv'),auf=c.el.querySelector('.glauf'),f=c.el.querySelector('.glf'),inp=f.querySelector('input'),hint=c.el.querySelector('.glh');
    function ui(){
      v.innerHTML=verlauf.map((p,i)=>`<div><em>${i+1}</em><span style="color:${FARBE[c.me]}">${esc(p[c.me])}</span><i>≠</i><span style="color:${FARBE[c.other]}">${esc(p[c.other])}</span></div>`).join('');
      inp.disabled=aus||!!wahl[c.me];f.querySelector('button').disabled=inp.disabled;
      if(aus)return;
      const letzte=verlauf[verlauf.length-1];
      c.status(`Versuch ${r+1} von ${MAX} · `+(wahl[c.me]?(wahl[c.other]?'':'Warte auf '+c.n(c.other)+' …'):letzte?`Was verbindet <b>${esc(letzte[0])}</b> und <b>${esc(letzte[1])}</b>?`:'Erstes Wort: einfach irgendwas!')+(wahl[c.other]&&!wahl[c.me]?' ('+c.n(c.other)+' hat schon gewählt)':''));
    }
    function pruefen(){
      if(!wahl[0]||!wahl[1])return;
      const[a,b]=wahl;verlauf.push([a,b]);benutzt.add(norm(a));benutzt.add(norm(b));
      auf.innerHTML=`<span style="background:${FARBE[c.me]}">${esc(wahl[c.me])}</span><span style="background:${FARBE[c.other]}">${esc(wahl[c.other])}</span>`;
      auf.classList.remove('neu');void auf.offsetWidth;auf.classList.add('neu');
      if(norm(a)===norm(b)){aus=true;verlauf.pop();ui();auf.classList.add('match');c.status('Gedanken gelesen!');c.end({coop:true,win:true,text:`Nach ${r+1} Versuch${r?'en':''}: „${a}“`});return}
      r++;
      if(r>=MAX){aus=true;ui();c.end({coop:true,win:false,text:'Zehn Versuche, keine Gedankenübertragung. Nochmal?'});return}
      wahl=[null,null];wahl[c.other]=vorrat[r]||null;hint.textContent='';ui();inp.focus();
    }
    c.on(f,'submit',e=>{e.preventDefault();const w=inp.value.trim();if(!w||aus||wahl[c.me])return;
      if(!norm(w)){hint.textContent='Bitte ein richtiges Wort.';return}
      if(benutzt.has(norm(w))){hint.textContent='Das Wort war schon dran, nimm ein anderes!';return}
      hint.textContent='';wahl[c.me]=w;inp.value='';c.send({r,w});ui();pruefen()});
    ui();setTimeout(()=>inp.focus(),50);
    return{msg(d){vorrat[d.r]=d.w;if(d.r===r&&!aus){wahl[c.other]=d.w;ui();pruefen()}}};
  }});

// ---------------------------------------------------------------------
//  12 · Dino-Eier retten
// ---------------------------------------------------------------------
SPIELE.push({id:'eier',name:'Dino-Eier retten',emoji:'🥚',mode:'coop',
  desc:'Fangt die fallenden Dino-Eier zusammen, aber jede Farbe nur mit dem passenden Nest.',
  how:'Bewege dein Nest mit ← und → (oder A und D), mit der Maus oder per Finger. <b>Blaue Eier</b> fängt nur das blaue Nest, <b>rote</b> nur das rote, <b>goldene</b> beide (+5 Punkte). Ein Ei, das ins falsche Nest fällt, springt wieder raus. Fällt ein Ei auf den Boden, verliert ihr ein Leben. <b>Meteore</b> nicht fangen! Ihr habt zusammen 5 Leben.',
  create(c){
    const W=800,H=500,NW=110,NY=440;const{g,cv,pos}=leinwand(c,W,H);
    const st={n:[W*.33,W*.67],o:[],p:0,l:5,e:null};let aus=false;const fx=[];
    const ein=[{d:0,x:null},{d:0,x:null}],mein={d:0,x:null},tast={l:false,r:false};
    const schick=()=>{if(c.host)ein[0]={...mein};else c.send({in:mein})};
    c.key((e,dn)=>{const k=e.key.toLowerCase();if(k==='arrowleft'||k==='a')tast.l=dn;else if(k==='arrowright'||k==='d')tast.r=dn;else return;e.preventDefault();mein.d=(tast.r?1:0)-(tast.l?1:0);mein.x=null;schick()});
    let letzt=0;
    c.on(cv,'pointermove',e=>{if(e.pointerType!=='mouse'&&!e.buttons)return;mein.x=pos(e)[0];mein.d=0;const t=performance.now();if(t-letzt>30){letzt=t;schick()}});
    c.on(cv,'pointerdown',e=>{mein.x=pos(e)[0];mein.d=0;schick()});
    const effekt=ev=>ev.forEach(([x,y,k])=>{for(let i=0;i<14;i++)fx.push({x,y,vx:(Math.random()-.5)*300,vy:-Math.random()*260,l:1,k})});
    if(c.host){
      let objs=[],zeit=0,spawn=1,alt=performance.now();
      c.every(1000/60,()=>{
        const t=performance.now(),dt=Math.min(.05,(t-alt)/1000);alt=t;if(aus)return;zeit+=dt;const ev=[];
        for(let p=0;p<2;p++){const e=ein[p];if(e.x!=null){const df=e.x-st.n[p];st.n[p]+=Math.sign(df)*Math.min(Math.abs(df),1000*dt)}else st.n[p]+=e.d*560*dt;st.n[p]=clamp(st.n[p],NW/2,W-NW/2)}
        spawn-=dt;
        if(spawn<=0){spawn=Math.max(.38,1.25-zeit*.012)*(.7+Math.random()*.6);
          const z=Math.random();const typ=zeit>8&&z<.16?3:z<.24?2:Math.random()<.5?0:1;
          objs.push({x:40+Math.random()*(W-80),y:-20,v:110+Math.min(220,zeit*3.2)+Math.random()*60,a:0,t:typ})}
        for(const o of objs){
          o.v+=o.a*dt;o.y+=o.v*dt;
          if(o.v>0&&o.y>NY-14&&o.y<NY+16&&!o.weg){
            for(let p=0;p<2;p++)if(!o.weg&&Math.abs(o.x-st.n[p])<NW/2){
              if(o.t===3){st.l--;ev.push([o.x,NY,3]);o.weg=1}
              else if(o.t===2){st.p+=5;ev.push([o.x,NY,2]);o.weg=1}
              else if(o.t===p){st.p++;ev.push([o.x,NY,p]);o.weg=1}
              else{o.v=-260;o.a=620;o.x=clamp(o.x+(o.x<st.n[p]?-30:30),20,W-20)}
            }
          }
          if(!o.weg&&o.y>H+10){o.weg=1;if(o.t<2){st.l--;ev.push([o.x,H-8,4])}}
        }
        objs=objs.filter(o=>!o.weg);
        st.o=objs.map(o=>[Math.round(o.x),Math.round(o.y),o.t]);
        if(st.l<=0&&!aus){st.l=0;aus=true;st.e=1;ende()}
        effekt(ev);
        c.send({st:{n:st.n.map(Math.round),o:st.o,p:st.p,l:st.l,e:st.e},ev});
      });
    }
    function ende(){
      let best=0;try{best=+localStorage.getItem('lm2p-eier-best')||0}catch(_){}
      const neu=st.p>best;if(neu)try{localStorage.setItem('lm2p-eier-best',st.p)}catch(_){}
      c.end({coop:true,win:null,text:`Ihr habt ${st.p} Punkte gesammelt.`+(neu?' Neuer Rekord!':` Rekord auf diesem Gerät: ${best}.`)});
    }
    c.status(`Dein Nest ist <b style="color:${FARBE[c.me]}">${c.me?'rot':'blau'}</b>. Fang deine Farbe und die goldenen Eier!`);
    const ei=(x,y,f)=>{g.fillStyle=f;g.beginPath();g.ellipse(x,y,13,17,0,0,7);g.fill();g.strokeStyle='#1c1c1e';g.lineWidth=3;g.stroke();g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.ellipse(x-4,y-6,3,5,-.4,0,7);g.fill()};
    let altT=performance.now();
    c.frame(()=>{
      const t=performance.now(),dt=Math.min(.05,(t-altT)/1000);altT=t;
      const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#9db6ff');gr.addColorStop(1,'#f4f2ec');g.fillStyle=gr;g.fillRect(0,0,W,H);
      g.fillStyle='#1c1c1e';g.fillRect(0,H-22,W,22);
      for(const o of st.o){const[x,y,k]=o;
        if(k===3){g.fillStyle='rgba(255,140,0,.5)';g.beginPath();g.moveTo(x-12,y-6);g.lineTo(x,y-50);g.lineTo(x+12,y-6);g.fill();g.fillStyle='#3a2f2a';g.beginPath();g.arc(x,y,15,0,7);g.fill();g.fillStyle='#ff7a00';g.beginPath();g.arc(x-4,y-3,4,0,7);g.fill()}
        else ei(x,y,k===2?'#f5c518':FARBE[k])}
      for(let p=0;p<2;p++){const x=st.n[p];g.fillStyle=FARBE[p];g.beginPath();g.moveTo(x-NW/2,NY-6);g.quadraticCurveTo(x,NY+46,x+NW/2,NY-6);g.closePath();g.fill();g.strokeStyle='#1c1c1e';g.lineWidth=4;g.stroke();
        g.fillStyle='#fff';g.font='700 12px "JetBrains Mono",monospace';g.textAlign='center';g.textBaseline='middle';g.fillText(p===c.me?'DU':c.names[p].toUpperCase().slice(0,10),x,NY+12)}
      for(const f of fx){f.vy+=600*dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.l-=dt*1.4;g.globalAlpha=Math.max(0,f.l);g.fillStyle=f.k===3?'#ff7a00':f.k===4?'#fff3c4':f.k===2?'#f5c518':FARBE[f.k];g.fillRect(f.x,f.y,6,6)}
      g.globalAlpha=1;for(let i=fx.length-1;i>=0;i--)if(fx[i].l<=0)fx.splice(i,1);
      g.fillStyle='#1c1c1e';g.font='800 24px ui-rounded,system-ui,sans-serif';g.textAlign='left';g.textBaseline='top';g.fillText(st.p+' PUNKTE',16,12);
      g.textAlign='right';g.font='26px sans-serif';g.fillText('❤️'.repeat(Math.max(0,st.l))+'🖤'.repeat(5-Math.max(0,st.l)),W-14,14);
    });
    return{msg(d){
      if(c.host){if(d.in)ein[1]=d.in}
      else if(d.st){Object.assign(st,d.st);effekt(d.ev||[]);if(d.st.e&&!aus){aus=true;ende()}}
    }};
  }});

// ---------------------------------------------------------------------
//  13 · Zahlengefühl
// ---------------------------------------------------------------------
SPIELE.push({id:'zahlen',name:'Zahlengefühl',emoji:'🔢',mode:'coop',
  desc:'Legt eure Karten aufsteigend ab, ohne zu verraten, welche Zahlen ihr habt.',
  how:'Jeder bekommt Karten mit Zahlen von 1 bis 100. Gemeinsam müsst ihr <b>alle Karten aufsteigend</b> ablegen. Es gibt keine Reihenfolge, wer dran ist: Wer glaubt, die niedrigste Karte zu haben, legt sie einfach. Aber <b>keine Zahlen im Chat verraten!</b> Nur Gefühl und Timing. Wird zu früh gelegt, verliert ihr ein Leben. In Level 1 hat jeder 1 Karte, in Level 2 zwei und so weiter. Schafft ihr Level 8?',
  create(c){
    const MAX=8;let st={lv:1,l:3,h:[[],[]],stapel:[],bereit:[false,false],phase:'bereit',ev:null};let aus=false;
    c.el.innerHTML=`<div class="zg"><div class="zgtop"><span class="zglv"></span><span class="zgl"></span></div><div class="zgo"></div><div class="zgst"><div class="zgk gross">–</div><div class="zgalt"></div></div><div class="zgev"></div><div class="zgh"></div><div class="zgb"></div></div>`;
    const q=s=>c.el.querySelector(s);
    function ui(){
      q('.zglv').textContent=`Level ${st.lv} / ${MAX}`;q('.zgl').textContent='❤️'.repeat(st.l);
      const o=st.h[c.other].length;q('.zgo').innerHTML=`${c.n(c.other)}: `+(o?'<span class="zgr"></span>'.repeat(o):'keine Karten mehr');
      const top=st.stapel[st.stapel.length-1];q('.zgk').textContent=top??'–';
      q('.zgalt').textContent=st.stapel.slice(-6,-1).join(' · ');
      const ev=st.ev;let et='';
      if(ev&&ev.t==='zufrueh'){et=`${ev.p===c.me?'Du hast':esc(c.names[ev.p])+' hat'} die ${ev.k} gelegt, aber ${1-ev.p===c.me?'du hattest':esc(c.names[1-ev.p])+' hatte'} noch ${ev.weg.join(', ')}. Ein Leben weg!`}
      else if(ev&&ev.t==='level')et=`Level geschafft!${ev.bonus?' Bonus: +1 Leben ❤️':''}`;
      q('.zgev').innerHTML=et;q('.zgev').className='zgev'+(ev&&ev.t==='zufrueh'?' schlecht':ev?' gut':'');
      const h=st.h[c.me];
      q('.zgh').innerHTML=h.map((k,i)=>`<span class="zgk${i?' klein':''}">${k}</span>`).join('')||'<em>Alle deine Karten liegen.</em>';
      const b=q('.zgb');
      if(st.phase==='bereit')b.innerHTML=st.bereit[c.me]?`<p>Warte auf ${c.n(c.other)} …</p>`:'<button type="button" class="btn primary" data-a="bereit">Bereit, Konzentration!</button>';
      else if(st.phase==='spiel')b.innerHTML=h.length?`<button type="button" class="btn primary big" data-a="lege">${h[0]} ablegen</button>`:'';
      else b.innerHTML='';
      if(!aus)c.status(st.phase==='bereit'?'Schaut euch eure Karten an. Wenn beide bereit sind, geht es los.':st.phase==='spiel'?'Legt die Karten in aufsteigender Reihenfolge. Keine Zahlen verraten!':'');
    }
    const aktion=a=>{if(c.host)hostAktion(0,a);else c.send({a})};
    c.on(q('.zgb'),'click',e=>{const b=e.target.closest('button');if(!b)return;b.disabled=true;aktion({[b.dataset.a]:1})});
    c.key((e,dn)=>{if(dn&&e.key===' '&&!e.repeat&&st.phase==='spiel'){e.preventDefault();aktion({lege:1})}});
    const send=()=>{c.send({st});ui()};
    function geben(){const z=shuffle([...Array(100)].map((_,i)=>i+1),Math.random);st.h=[z.slice(0,st.lv).sort((a,b)=>a-b),z.slice(st.lv,st.lv*2).sort((a,b)=>a-b)];st.stapel=[];st.bereit=[false,false];st.phase='bereit'}
    function hostAktion(p,a){
      if(aus)return;
      if(a.bereit&&st.phase==='bereit'){st.bereit[p]=true;if(st.bereit[0]&&st.bereit[1]){st.phase='spiel';st.ev=null}send()}
      if(a.lege&&st.phase==='spiel'&&st.h[p].length){
        const k=st.h[p].shift(),weg=st.h[1-p].filter(x=>x<k);st.stapel.push(k);
        if(weg.length){st.l--;st.h[1-p]=st.h[1-p].filter(x=>x>k);st.ev={t:'zufrueh',p,k,weg}}else st.ev=null;
        if(st.l<=0){st.phase='aus';send();fertig(false);return}
        if(!st.h[0].length&&!st.h[1].length){
          if(st.lv>=MAX){st.phase='aus';send();fertig(true);return}
          const bonus=(st.lv===2||st.lv===5)&&st.l<5;if(bonus)st.l++;
          st.phase='pause';st.ev={t:'level',bonus};send();
          c.after(2200,()=>{st.lv++;geben();send()});return;
        }
        send();
      }
    }
    function fertig(win){if(aus)return;aus=true;ui();c.end({coop:true,win,text:win?'Alle 8 Level geschafft. Ihr seid ein eingespieltes Team!':`Ihr habt es bis Level ${st.lv} geschafft.`})}
    if(c.host){geben();send()}
    ui();
    return{msg(d){
      if(c.host){if(d.a)hostAktion(1,d.a)}
      else if(d.st){st=d.st;ui();if(st.phase==='aus'&&!aus){aus=true;const win=st.l>0;c.end({coop:true,win,text:win?'Alle 8 Level geschafft. Ihr seid ein eingespieltes Team!':`Ihr habt es bis Level ${st.lv} geschafft.`})}}
    }};
  }});

// ---------------------------------------------------------------------
//  14 · Montagsmaler
// ---------------------------------------------------------------------
const MALWORTE=['Haus','Baum','Sonne','Katze','Hund','Auto','Fahrrad','Pizza','Brille','Rakete','Schneemann','Regenbogen','Gitarre','Elefant','Giraffe','Schlange','Fisch','Blume','Wolke','Blitz','Berg','Insel','Burg','Krone','Schlüssel','Uhr','Handy','Computer','Lampe','Stuhl','Bett','Zahnbürste','Banane','Apfel','Erdbeere','Eis','Kuchen','Ballon','Drache','Dino','Pirat','Schatz','Schiff','Anker','Flugzeug','Hubschrauber','Zug','Brücke','Leuchtturm','Zelt','Lagerfeuer','Mond','Stern','Vulkan','Kaktus','Pinguin','Eule','Spinne','Schmetterling','Schnecke','Biene','Hai','Krake','Roboter','Geist','Hexe','Zauberer','Ritter','Schwert','Ampel','Fußball','Pokal','Kamera','Brief','Herz','Regenschirm','Schneeflocke','Tannenbaum','Geschenk','Kerze','Hamburger','Pommes','Brezel','Kaffee','Hut','Schuh','Socke','Zahn','Auge','Nase','Hand','Skateboard','Schaukel','Bagger','Kuh','Schwein','Maus','Käse','Tomate','Karotte','Pilz','Wal','Frosch','Igel','Tisch','Fenster','Tür','Treppe','Sofa','Badewanne','Toilette','Gabel','Topf','Flasche','Glühbirne','Batterie','Mikrofon','Kopfhörer','Trompete','Trommel','Zebra','Löwe','Affe','Bär','Hase','Ente','Huhn','Ei','Nest','Feder','Kompass','Landkarte','Rucksack','Koffer','Laterne','Wurm'];
SPIELE.push({id:'malen',name:'Montagsmaler',emoji:'🎨',mode:'coop',
  desc:'Einer malt, der andere rät. Zusammen sammelt ihr so viele Punkte wie möglich.',
  how:'Abwechselnd malt einer einen Begriff, den nur er sieht, und der andere tippt Vermutungen ein. Je schneller richtig geraten wird, desto mehr Punkte bekommt ihr <b>gemeinsam</b>. 6 Runden mit je 80 Sekunden. Buchstaben und Zahlen malen ist verboten!',
  create(c){
    const W=800,H=500,RUNDEN=6,ZEIT=80,FARBEN=['#1c1c1e','#e2342b','#1740d8','#1f9d55','#f5c518','#ff7a00','#8b4513','#ffffff'],GROESSE=[4,10,26];
    const worte=shuffle(MALWORTE.slice(),rngFrom(c.seed));
    let rd=-1,maler=0,t=ZEIT,phase='',punkte=0,richtig=0,aus=false,farbe=0,groesse=0;
    c.el.innerHTML=`<div class="mm"><div class="mmtop"><span class="mmwort"></span><span class="mmzeit"></span><span class="mmpkt"></span></div><div class="mmcv"></div>
      <div class="mmtools">${FARBEN.map((f,i)=>`<button type="button" data-f="${i}" style="background:${f}" aria-label="Farbe ${i+1}"></button>`).join('')}<span class="sep"></span>${GROESSE.map((s,i)=>`<button type="button" data-g="${i}" aria-label="Pinsel ${i+1}"><i style="width:${Math.max(4,s*.6)}px;height:${Math.max(4,s*.6)}px"></i></button>`).join('')}<button type="button" class="btn sm" data-x="1">🗑 Löschen</button></div>
      <form class="mmf"><input maxlength="40" autocomplete="off" placeholder="Was wird gemalt?" aria-label="Deine Vermutung"><button class="btn primary sm">Raten</button></form><div class="mmlog"></div></div>`;
    const q=s=>c.el.querySelector(s);
    const holder=q('.mmcv');const{g,cv,pos}=leinwand({el:holder},W,H);
    const tools=q('.mmtools'),form=q('.mmf'),inp=form.querySelector('input'),log=q('.mmlog');
    const leeren=()=>{g.fillStyle='#fff';g.fillRect(0,0,W,H)};
    const strich=s=>{const[x0,y0,x1,y1,f,gr]=s;g.strokeStyle=FARBEN[f];g.lineWidth=GROESSE[gr];g.lineCap='round';g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke()};
    const wort=()=>worte[rd];
    const ichMale=()=>maler===c.me;
    function ui(){
      const w=wort()||'';
      q('.mmwort').innerHTML=phase==='rv'?`Es war: <b>${esc(w)}</b>`:ichMale()?`Mal: <b>${esc(w)}</b>`:'Rate: <b class="mono">'+[...w].map((ch,i)=>i===0&&t<=40?esc(ch):'_').join(' ')+'</b>';
      q('.mmzeit').textContent=phase==='mal'?`⏱ ${t}s`:'';q('.mmpkt').textContent=`Runde ${rd+1}/${RUNDEN} · ${punkte} Punkte`;
      tools.style.display=ichMale()&&phase==='mal'?'':'none';form.style.display=!ichMale()&&phase==='mal'?'':'none';
      cv.classList.toggle('malen',ichMale()&&phase==='mal');
      tools.querySelectorAll('[data-f]').forEach(b=>b.classList.toggle('sel',+b.dataset.f===farbe));tools.querySelectorAll('[data-g]').forEach(b=>b.classList.toggle('sel',+b.dataset.g===groesse));
      if(!aus)c.status(phase==='mal'?(ichMale()?'Du malst! '+c.n(c.other)+' rät.':c.n(c.other)+' malt. Tipp deine Vermutungen ein!'):'');
    }
    const eintrag=(html,k)=>{const d=document.createElement('div');d.className=k||'';d.innerHTML=html;log.prepend(d)};
    function anwenden(m){
      if(m.rd!=null){rd=m.rd;maler=(c.seed+rd)%2;t=ZEIT;phase='mal';leeren();log.innerHTML='';ui();if(!ichMale())setTimeout(()=>inp.focus(),50)}
      if(m.t!=null){t=m.t;ui()}
      if(m.gs){eintrag(`<b style="color:${FARBE[1-maler]}">${1-maler===c.me?'Du':esc(c.names[1-maler])}:</b> ${esc(m.gs)}`)}
      if(m.rv){phase='rv';punkte=m.rv.sum;if(m.rv.ok)richtig++;eintrag(m.rv.ok?`✅ Richtig! +${m.rv.pts} Punkte`:'⌛ Zeit abgelaufen.',m.rv.ok?'gut':'schlecht');ui()}
      if(m.ende&&!aus){aus=true;c.end({coop:true,win:null,text:`Ihr habt zusammen ${punkte} Punkte. ${richtig} von ${RUNDEN} Bildern erraten.`})}
    }
    const send=m=>{anwenden(m);c.send({m})};
    let tick=null;
    function hostRunde(){
      if(rd+1>=RUNDEN){send({ende:1});return}
      send({rd:rd+1});
      if(tick)clearInterval(tick);
      tick=c.every(1000,()=>{if(phase!=='mal')return;const nt=t-1;send({t:nt});if(nt<=0)aufloesen(false)});
    }
    function aufloesen(ok){if(phase!=='mal')return;const pts=ok?2+Math.ceil(t/10):0;send({rv:{ok,pts,sum:punkte+pts}});c.after(3200,hostRunde)}
    const passt=gs=>{const a=norm(gs),b=norm(wort());return a===b||a.replace(/^(der|die|das|ein|eine|einen)/,'')===b};
    function hostRaten(gs){if(phase!=='mal')return;send({gs});if(passt(gs))aufloesen(true)}
    c.on(form,'submit',e=>{e.preventDefault();const v=inp.value.trim().slice(0,40);inp.value='';if(!v||phase!=='mal'||ichMale())return;if(c.host)hostRaten(v);else c.send({rate:v})});
    // Malen
    let zuletzt=null,puffer=[];
    c.on(cv,'pointerdown',e=>{if(!ichMale()||phase!=='mal')return;e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}const p=pos(e);zuletzt=p;const s=[p[0],p[1],p[0]+.1,p[1],farbe,groesse].map((v,i)=>i<4?Math.round(v*10)/10:v);strich(s);puffer.push(s)});
    c.on(cv,'pointermove',e=>{if(!zuletzt)return;const p=pos(e);const s=[zuletzt[0],zuletzt[1],p[0],p[1]].map(v=>Math.round(v*10)/10).concat([farbe,groesse]);strich(s);puffer.push(s);zuletzt=p});
    const auf=()=>{zuletzt=null};c.on(cv,'pointerup',auf);c.on(cv,'pointercancel',auf);
    c.every(40,()=>{if(puffer.length){c.send({ln:puffer});puffer=[]}});
    c.on(tools,'click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.f!=null)farbe=+b.dataset.f;else if(b.dataset.g!=null)groesse=+b.dataset.g;else if(b.dataset.x){leeren();puffer=[];c.send({clr:1})}ui()});
    leeren();
    if(c.host)c.after(500,hostRunde);
    ui();
    return{msg(d){
      if(d.ln)d.ln.forEach(strich);
      if(d.clr)leeren();
      if(c.host){if(d.rate)hostRaten(String(d.rate).slice(0,40))}
      else if(d.m)anwenden(d.m);
    }};
  }});

// ---------------------------------------------------------------------
//  15 · Reversi
// ---------------------------------------------------------------------
SPIELE.push({id:'reversi',name:'Reversi',emoji:'⚫',mode:'vs',
  desc:'Steine einklemmen und umdrehen. Das Brett kippt oft in letzter Sekunde.',
  how:'Setz deinen Stein so, dass du gegnerische Steine zwischen ihm und einem deiner Steine einklemmst (waagrecht, senkrecht oder schräg). Alle eingeklemmten Steine werden zu deinen. Die hellen Punkte zeigen, wo du setzen darfst. Wer nicht ziehen kann, muss aussetzen. Am Ende gewinnt, wer mehr Steine hat.',
  create(c){
    const N=8,b=Array(N*N).fill(-1);b[27]=b[36]=0;b[28]=b[35]=1;let dran=c.seed%2,aus=false,hinweis='';
    c.el.innerHTML='<div class="rv"></div>';const g=c.el.firstChild;
    const D=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],drin=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
    const flips=(i,p)=>{if(b[i]>=0)return[];const x=i%N,y=(i/N)|0,r=[];
      for(const[dx,dy]of D){const l=[];let nx=x+dx,ny=y+dy;while(drin(nx,ny)&&b[ny*N+nx]===1-p){l.push(ny*N+nx);nx+=dx;ny+=dy}if(l.length&&drin(nx,ny)&&b[ny*N+nx]===p)r.push(...l)}return r};
    const zuege=p=>b.map((_,i)=>i).filter(i=>flips(i,p).length);
    const zahl=p=>b.filter(v=>v===p).length;
    function zeichne(neu,gedreht){
      const ok=!aus&&dran===c.me?new Set(zuege(c.me)):new Set();
      g.innerHTML=b.map((v,i)=>`<div data-i="${i}" class="${ok.has(i)?'ok':''}">${v>=0?`<i class="rs p${v}${i===neu?' neu':''}${gedreht.includes(i)?' flip':''}"></i>`:''}</div>`).join('');
      g.classList.toggle('mein',dran===c.me&&!aus);
      if(!aus)c.status(`${hinweis}${c.dran(dran)} · Steine: ${c.n(0)} ${zahl(0)} : ${zahl(1)} ${c.n(1)}`);
    }
    function zug(i,p){
      const f=flips(i,p);if(!f.length||aus||dran!==p)return false;
      b[i]=p;f.forEach(j=>b[j]=p);hinweis='';
      if(zuege(1-p).length)dran=1-p;
      else if(zuege(p).length)hinweis=`${c.n(1-p)} kann nicht ziehen und muss aussetzen. `;
      else aus=true;
      zeichne(i,f);
      if(aus){const x=zahl(0),y=zahl(1);c.status(`Keiner kann mehr ziehen · ${c.n(0)} ${x} : ${y} ${c.n(1)}`);c.end({w:x===y?-1:x>y?0:1,text:`${x} : ${y} Steine`})}
      return true;
    }
    c.on(g,'click',e=>{const z=e.target.closest('[data-i]');if(!z||aus||dran!==c.me)return;const i=+z.dataset.i;if(zug(i,c.me))c.send({i})});
    zeichne(-1,[]);
    return{msg(d){zug(d.i,c.other)}};
  }});

// ---------------------------------------------------------------------
//  16 · Mäxchen
// ---------------------------------------------------------------------
const MAEX_W=['31','32','41','42','43','51','52','53','54','61','62','63','64','65','11','22','33','44','55','66','21'];
const maexName=w=>w==='21'?'Mäxchen':w[0]===w[1]?w[0]+'er-Pasch':w;
const WUERFEL=['','⚀','⚁','⚂','⚃','⚄','⚅'];
SPIELE.push({id:'maexchen',name:'Mäxchen',emoji:'🎲',mode:'vs',
  desc:'Würfeln, ansagen, bluffen. Glaubst du deinem Gegenüber oder deckst du auf?',
  how:'Wer dran ist, würfelt verdeckt mit zwei Würfeln und sagt einen Wert an, der <b>höher</b> sein muss als die letzte Ansage. Lügen ist erlaubt! Der andere glaubt es (und muss dann selbst höher würfeln) oder deckt auf. Gelogen? Dann verliert der Lügner ein Leben, sonst der Zweifler. Die höhere Zahl kommt immer vorne (5 und 3 ist 53). Reihenfolge: 31 ist am niedrigsten, dann bis 65, dann die Päsche (11 bis 66), und ganz oben steht <b>Mäxchen</b> (21). Beim Mäxchen geht es um 2 Leben. Jeder hat 5 Leben.',
  create(c){
    const LEBEN=5;let leben=[LEBEN,LEBEN],dran=c.seed%2,letzte=null,wurf=null,phase='wuerfeln',ansage=null,echt=null,aus=false,info='';
    c.el.innerHTML=`<div class="mx"><div class="mxl"></div><div class="mxb"><div class="mxw"></div><div class="mxa"></div></div><div class="mxi"></div><div class="mxk"></div></div>`;
    const q=s=>c.el.querySelector(s);
    const rang=w=>MAEX_W.indexOf(w);
    const wert=(a,b)=>{const h=Math.max(a,b),n=Math.min(a,b);return''+h+n};
    const ich=()=>dran===c.me;
    function ui(){
      q('.mxl').innerHTML=[0,1].map(p=>`<span>${c.n(p)} ${'❤️'.repeat(Math.max(0,leben[p]))}${'🖤'.repeat(LEBEN-Math.max(0,leben[p]))}</span>`).join('');
      let w='';
      if(phase==='auf')w=echt.split('').map(x=>WUERFEL[x]).join('');
      else if(ich()&&wurf)w=wurf.map(x=>WUERFEL[x]).join('');
      else w=`<span class="vd${phase==='wuerfeln'?' leer':''}">?</span><span class="vd${phase==='wuerfeln'?' leer':''}">?</span>`;
      q('.mxw').innerHTML=w;
      q('.mxa').innerHTML=ansage?`Ansage: <b>${maexName(ansage)}</b>`:letzte?`Zu schlagen: <b>${maexName(letzte)}</b>`:'Neue Runde, alles ist erlaubt.';
      q('.mxi').innerHTML=info;
      const k=q('.mxk');
      if(aus){k.innerHTML='';return}
      if(phase==='wuerfeln'&&ich())k.innerHTML='<button type="button" class="btn primary big" data-a="w">🎲 Würfeln</button>';
      else if(phase==='ansagen'&&ich()){
        const echtW=wert(wurf[0],wurf[1]);
        k.innerHTML='<p>Was sagst du an?</p><div class="mxg">'+MAEX_W.filter(x=>letzte==null||rang(x)>rang(letzte)).map(x=>`<button type="button" data-v="${x}" class="${x===echtW?'wahr':''}">${maexName(x)}</button>`).join('')+'</div>';
      }
      else if(phase==='reagieren'&&!ich())k.innerHTML=(ansage==='21'?'':'<button type="button" class="btn" data-a="g">👍 Glaub ich</button>')+'<button type="button" class="btn primary" data-a="z">🔍 Aufdecken!</button>';
      else k.innerHTML='';
      c.status(phase==='wuerfeln'?(ich()?'<b>Du bist dran:</b> würfeln!':c.n(dran)+' würfelt …'):phase==='ansagen'?(ich()?'Sag einen Wert an. Grün ist das, was du wirklich hast.':c.n(dran)+' überlegt sich eine Ansage …'):phase==='reagieren'?(ich()?'Glaubt '+c.n(1-dran)+' dir?':`${c.n(dran)} sagt <b>${maexName(ansage)}</b>. Glaubst du das?`+(ansage==='21'?' (Mäxchen musst du aufdecken.)':'')):'');
    }
    function anwenden(d,p){
      if(aus)return;
      if(d.an&&phase==='ansagen'&&p===dran){ansage=d.an;echt=d.w;phase='reagieren';info=''}
      else if(d.glaub&&phase==='reagieren'&&p!==dran){letzte=ansage;ansage=null;wurf=null;dran=1-dran;phase='wuerfeln';info=`${c.n(p)} glaubt es. Jetzt muss es höher werden.`}
      else if(d.zweifel&&phase==='reagieren'&&p!==dran){
        phase='auf';const luege=rang(echt)<rang(ansage),verl=luege?dran:p,schaden=ansage==='21'?2:1;
        leben[verl]-=schaden;
        info=`Aufgedeckt: <b>${maexName(echt)}</b>. ${luege?`${c.n(dran)} hat geblufft!`:'Es stimmt!'} ${c.n(verl)} verliert ${schaden===2?'zwei Leben':'ein Leben'}.`;
        ui();
        if(leben[verl]<=0){aus=true;ui();c.end({w:1-verl,text:`${maexName(ansage)} angesagt, ${maexName(echt)} gewürfelt.`,delay:2200});return}
        c.after(2800,()=>{dran=verl;letzte=null;ansage=null;wurf=null;echt=null;phase='wuerfeln';info=`${c.n(verl)} fängt die neue Runde an.`;ui()});
      }
      ui();
    }
    c.on(q('.mxk'),'click',e=>{const b=e.target.closest('button');if(!b||aus)return;
      if(b.dataset.a==='w'&&phase==='wuerfeln'&&ich()){wurf=[1+ri(Math.random,6),1+ri(Math.random,6)];phase='ansagen';c.send({gew:1});ui();return}
      let d=null;
      if(b.dataset.v)d={an:b.dataset.v,w:wert(wurf[0],wurf[1])};
      else if(b.dataset.a==='g')d={glaub:1};
      else if(b.dataset.a==='z')d={zweifel:1};
      if(d){c.send(d);anwenden(d,c.me)}});
    ui();
    return{msg(d){if(d.gew&&phase==='wuerfeln'&&dran===c.other){phase='ansagen';ui()}else anwenden(d,c.other)}};
  }});

// ---------------------------------------------------------------------
//  17 · Maulwurf-Duell
// ---------------------------------------------------------------------
SPIELE.push({id:'maulwurf',name:'Maulwurf-Duell',emoji:'🔨',mode:'vs',
  desc:'Neun Löcher, ein Hammer pro Person. Wer zuerst draufhaut, kriegt den Punkt.',
  how:'Haut auf alles, was aus den Löchern schaut, aber schneller als der andere! 🐹 gibt 1 Punkt, 🌟 gibt 3 Punkte, wer die 💣 erwischt, verliert 2 Punkte. Auf dem Computer gehen auch die Tasten 1 bis 9 (wie auf dem Ziffernblock). Nach 40 Sekunden gewinnt, wer mehr Punkte hat.',
  create(c){
    const ZEIT=40,TYP=['','🐹','🌟','💣'],PKT=[0,1,3,-2];
    let st={h:Array(9).fill(null),s:[0,0],t:ZEIT,cd:3,e:null},aus=false;
    c.el.innerHTML=`<div class="mw"><div class="mwtop"><span class="mws"></span><span class="mwt"></span></div><div class="mwg">${[...Array(9)].map((_,i)=>`<button type="button" data-i="${i}"><span></span></button>`).join('')}</div></div>`;
    const kn=[...c.el.querySelectorAll('.mwg button')];
    function ui(ev){
      c.el.querySelector('.mws').innerHTML=`${c.n(0)} <b>${st.s[0]} : ${st.s[1]}</b> ${c.n(1)}`;
      c.el.querySelector('.mwt').textContent=st.cd>0?'Gleich geht’s los: '+st.cd:`⏱ ${st.t}s`;
      kn.forEach((b,i)=>{const h=st.h[i];b.querySelector('span').textContent=h?TYP[h[1]]:'';b.classList.toggle('raus',!!h)});
      (ev||[]).forEach(([i,p,t])=>{const b=kn[i];b.style.setProperty('--hf',FARBE[p]);b.dataset.pk=(PKT[t]>0?'+':'')+PKT[t];b.classList.remove('treff');void b.offsetWidth;b.classList.add('treff')});
    }
    const hau=i=>{if(aus||st.cd>0)return;const h=st.h[i];if(!h)return;kn[i].classList.add('klopf');setTimeout(()=>kn[i].classList.remove('klopf'),120);if(c.host)hostHau(0,i,h[0]);else c.send({hau:i,id:h[0]})};
    c.on(c.el.querySelector('.mwg'),'pointerdown',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();hau(+b.dataset.i)});
    const TASTE={'7':0,'8':1,'9':2,'4':3,'5':4,'6':5,'1':6,'2':7,'3':8};
    c.key((e,dn)=>{if(dn&&!e.repeat&&TASTE[e.key]!=null){e.preventDefault();hau(TASTE[e.key])}});
    let ev=[];
    const sende=()=>{c.send({st,ev});ui(ev);ev=[]};
    let lebt=Array(9).fill(0),nid=1;
    function hostHau(p,i,id){const h=st.h[i];if(!h||h[0]!==id||aus)return;st.s[p]+=PKT[h[1]];st.h[i]=null;ev.push([i,p,h[1]]);sende()}
    if(c.host){
      const cdf=()=>{st.cd--;sende();if(st.cd>0)c.after(800,cdf);else start()};c.after(800,cdf);
      function start(){
        const t0=performance.now();let naechst=0;
        c.every(50,()=>{if(aus)return;const t=performance.now(),el=(t-t0)/1000;let neu=false;
          const nt=Math.max(0,ZEIT-Math.floor(el));if(nt!==st.t){st.t=nt;neu=true}
          for(let i=0;i<9;i++)if(st.h[i]&&t>lebt[i]){st.h[i]=null;neu=true}
          if(t>naechst){const frei=st.h.map((h,i)=>h?-1:i).filter(i=>i>=0);
            if(frei.length){const i=frei[ri(Math.random,frei.length)],z=Math.random(),typ=z<.12?2:z<.27?3:1;
              st.h[i]=[nid++,typ];lebt[i]=t+Math.max(520,1100-el*12)*(typ===2?.75:1);neu=true}
            naechst=t+Math.max(260,720-el*11)*(.6+Math.random()*.8)}
          if(st.t<=0){st.h.fill(null);st.e=1;aus=true;neu=true}
          if(neu)sende();
          if(aus)fertig();
        });
      }
    }
    function fertig(){const[a,b]=st.s;c.end({w:a===b?-1:a>b?0:1,text:`${a} : ${b} Punkte`})}
    ui();
    return{msg(d){
      if(c.host){if(d.hau!=null)hostHau(1,d.hau,d.id)}
      else if(d.st){st=d.st;ui(d.ev);if(st.e&&!aus){aus=true;fertig()}}
    }};
  }});

// ---------------------------------------------------------------------
//  18 · Codewörter
// ---------------------------------------------------------------------
SPIELE.push({id:'codewort',name:'Codewörter',emoji:'🕵️',mode:'coop',
  desc:'Findet gemeinsam alle Agenten mit nur einem Wort als Hinweis. Aber Vorsicht vor den Attentätern.',
  how:'Auf dem Tisch liegen 25 Wörter. Jeder von euch sieht eine eigene Geheimkarte: <b>grün umrandet</b> sind die Agenten, die dein Partner finden muss, <b>schwarz</b> die Attentäter. Wer dran ist, gibt <b>ein Wort und eine Zahl</b> als Hinweis („Tier 2“). Der andere tippt Wörter an: Agent? Weiter raten! Unbeteiligter? Zug vorbei. Attentäter? Verloren! Danach wechselt ihr. Findet alle 15 Agenten in 9 Zügen. Im Chat bitte keine weiteren Tipps.',
  create(c){
    const r=rngFrom(c.seed),ZUEGE=9;
    const worte=shuffle(MALWORTE.slice(),r).slice(0,25),ix=shuffle([...Array(25).keys()],r);
    // key[p][i]: 'g' Agent, 's' Attentäter, '' unbeteiligt (aus Sicht von Spieler p)
    const key=[Array(25).fill(''),Array(25).fill('')];
    ix.slice(0,3).forEach(i=>key[0][i]=key[1][i]='g');
    ix.slice(3,8).forEach(i=>key[0][i]='g');ix.slice(8,13).forEach(i=>key[1][i]='g');
    key[0][ix[13]]='g';key[1][ix[13]]='s';key[1][ix[14]]='g';key[0][ix[14]]='s';
    key[0][ix[15]]=key[1][ix[15]]='s';key[0][ix[16]]='s';key[1][ix[17]]='s';
    const gefunden=new Set(),neutral=[new Set(),new Set()];
    let geber=c.seed%2,zug=1,hinweis=null,geraten=0,aus=false,info='';
    c.el.innerHTML=`<div class="cw"><div class="cwtop"><span class="cwz"></span><span class="cwa"></span></div><div class="cwh"></div><div class="cwg"></div><div class="cwk"></div></div>`;
    const q=s=>c.el.querySelector(s);
    const offen=p=>key[p].some((k,i)=>k==='g'&&!gefunden.has(i));
    const total=()=>gefunden.size;
    function ui(){
      q('.cwz').textContent=`Zug ${Math.min(zug,ZUEGE)} von ${ZUEGE}`;
      q('.cwa').textContent=`Agenten: ${total()} / 15`;
      const rat=!aus&&hinweis&&geber!==c.me;
      q('.cwg').innerHTML=worte.map((w,i)=>{const k=key[c.me][i],cls=['cwc'];
        if(gefunden.has(i))cls.push('gef');else{if(k==='g')cls.push('mg');if(k==='s')cls.push('ms');if(neutral[geber].has(i)&&!aus)cls.push('nx')}
        if(neutral[0].has(i)||neutral[1].has(i))cls.push('nt');
        return`<button type="button" data-i="${i}" class="${cls.join(' ')}"${rat&&!gefunden.has(i)&&!neutral[geber].has(i)?'':' disabled'}>${esc(w)}</button>`}).join('');
      q('.cwh').innerHTML=info+(hinweis?` Hinweis von ${c.n(geber)}: <b class="cwhw">${esc(hinweis.w)} ${hinweis.z}</b>`:'');
      const k=q('.cwk');
      if(aus)k.innerHTML='';
      else if(geber===c.me&&!hinweis)k.innerHTML=`<form class="cwf"><input maxlength="24" autocomplete="off" placeholder="Ein Wort …" aria-label="Hinweiswort"><select aria-label="Anzahl">${[1,2,3,4,5,6,7,8,9].map(z=>`<option>${z}</option>`).join('')}</select><button class="btn primary sm">Hinweis geben</button></form><p class="small">Grün umrandet: die Agenten, die ${c.n(c.other)} finden soll.</p>`;
      else if(geber!==c.me&&hinweis)k.innerHTML=geraten?'<button type="button" class="btn sm" data-a="stopp">Zug beenden</button>':'';
      else k.innerHTML='';
      if(!aus)c.status(geber===c.me?(hinweis?c.n(c.other)+' rät …':'<b>Gib einen Hinweis!</b> Ein Wort und eine Zahl.'):(hinweis?'<b>Tipp die passenden Wörter an!</b>':c.n(geber)+' überlegt sich einen Hinweis …'));
    }
    function zugEnde(){
      hinweis=null;geraten=0;zug++;
      if(!offen(0)&&!offen(1))return;
      if(zug>ZUEGE){aus=true;ui();c.end({coop:true,win:false,text:`Die Zeit ist um. ${total()} von 15 Agenten gefunden.`});return}
      if(offen(1-geber))geber=1-geber;
    }
    function anwenden(d,p){
      if(aus)return;
      if(d.hw&&p===geber&&!hinweis){hinweis={w:String(d.hw).slice(0,24),z:clamp(d.z|0,1,9)};info=''}
      else if(d.tipp!=null&&p!==geber&&hinweis){
        const i=d.tipp|0;if(gefunden.has(i)||neutral[geber].has(i))return;const k=key[geber][i];geraten++;
        if(k==='s'){aus=true;info=`💀 <b>${esc(worte[i])}</b> war ein Attentäter!`;ui();q(`[data-i="${i}"]`).classList.add('tot');c.end({coop:true,win:false,text:`„${worte[i]}“ war ein Attentäter. ${total()} von 15 Agenten gefunden.`,delay:1800});return}
        if(k==='g'){gefunden.add(i);info=`✅ ${esc(worte[i])} ist ein Agent!`;
          if(total()===15){aus=true;ui();c.end({coop:true,win:true,text:`Alle 15 Agenten in ${zug} Zügen gefunden!`});return}
          if(!offen(geber)){info+=' Alle Agenten dieser Karte gefunden.';zugEnde()}}
        else{neutral[geber].add(i);info=`😐 ${esc(worte[i])} ist unbeteiligt. Zug vorbei.`;zugEnde()}
      }
      else if(d.stopp&&p!==geber&&hinweis){info='Zug beendet.';zugEnde()}
      ui();
    }
    const tu=d=>{c.send(d);anwenden(d,c.me)};
    c.on(c.el,'submit',e=>{e.preventDefault();const f=e.target,w=f.querySelector('input').value.trim();
      if(!w||/\s/.test(w)){f.querySelector('input').placeholder='Genau ein Wort!';f.querySelector('input').value='';return}
      if(worte.some(x=>norm(x)===norm(w))){f.querySelector('input').value='';f.querySelector('input').placeholder='Kein Wort vom Tisch!';return}
      tu({hw:w,z:+f.querySelector('select').value})});
    c.on(c.el,'click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.i!=null)tu({tipp:+b.dataset.i});else if(b.dataset.a==='stopp')tu({stopp:1})});
    ui();
    return{msg(d){anwenden(d,c.other)}};
  }});

// ---------------------------------------------------------------------
//  19 · Doppel-Dino
// ---------------------------------------------------------------------
SPIELE.push({id:'doppeldino',name:'Doppel-Dino',emoji:'🦖',mode:'coop',
  desc:'Ein Dino, zwei Gehirne: Einer springt, der andere duckt sich. Wie weit kommt ihr?',
  how:'Ihr steuert <b>zusammen einen Dino</b>. Einer ist fürs <b>Springen</b> zuständig (über Kakteen), der andere fürs <b>Ducken</b> (unter Flugsauriern durch). Deine Aufgabe steht oben. Taste: Leertaste oder ↑/↓, am Handy aufs Spielfeld tippen (zum Ducken gedrückt halten). Alle 300 Meter wird getauscht! Ihr habt 3 Leben.',
  create(c){
    const W=800,H=300,BODEN=250,DX=110;const{g,cv}=leinwand(c,W,H);
    let st={y:0,du:0,o:[],s:0,l:3,r:c.seed%2,inv:0,e:0,tausch:0},aus=false,mein=false;
    const schick=v=>{if(v===mein)return;mein=v;if(c.host)ein[0]=v;else c.send({k:v?1:0})};
    const ein=[false,false];
    c.key((e,dn)=>{if([' ','arrowup','arrowdown','w','s'].includes(e.key.toLowerCase())){e.preventDefault();schick(dn)}});
    c.on(cv,'pointerdown',e=>{e.preventDefault();schick(true)});
    const los=()=>schick(false);c.on(cv,'pointerup',los);c.on(cv,'pointercancel',los);c.on(cv,'pointerleave',los);
    if(c.host){
      let vy=0,dist=0,tempo=330,spawn=1.2,alt=performance.now(),objs=[],letzteRolle=0;
      c.every(1000/60,()=>{
        const t=performance.now(),dt=Math.min(.05,(t-alt)/1000);alt=t;if(aus)return;
        const springer=st.r,ducker=1-st.r;
        if(ein[springer]&&st.y===0){vy=690}
        st.du=ein[ducker]&&st.y===0?1:0;
        if(st.y>0||vy>0){vy-=2000*dt;st.y=Math.max(0,st.y+vy*dt);if(st.y===0)vy=0}
        tempo=Math.min(720,330+dist*.12);dist+=tempo*dt/10;st.s=Math.floor(dist);
        const rolle=Math.floor(dist/300);if(rolle!==letzteRolle){letzteRolle=rolle;st.r=1-st.r;st.tausch=2.2;ein[0]=ein[1]=false}
        st.tausch=Math.max(0,st.tausch-dt);
        spawn-=dt;
        if(spawn<=0){const vogel=dist>40&&Math.random()<.42;objs.push({x:W+30,t:vogel?1:0,w:vogel?44:20+ri(Math.random,3)*12});spawn=Math.max(.75,1.6-dist*.0008)+Math.random()*.8;if(st.tausch>0)spawn+=.8}
        for(const o of objs)o.x-=tempo*dt;
        objs=objs.filter(o=>o.x>-60);
        st.inv=Math.max(0,st.inv-dt);
        const dh=st.du?28:52,dy0=st.y,dy1=st.y+dh;
        for(const o of objs){
          if(o.hit||o.x>DX+36||o.x+o.w<DX+6)continue;
          const[a,b]=o.t?[34,64]:[0,46];
          if(dy0<b&&dy1>a&&st.inv<=0){o.hit=1;st.l--;st.inv=1.3}
        }
        if(st.l<=0){st.l=0;st.e=1;aus=true}
        st.o=objs.map(o=>[Math.round(o.x),o.t,o.w]);
        c.send({st:{...st,y:Math.round(st.y)}});
        if(aus)ende();
      });
    }
    function ende(){
      let best=0;try{best=+localStorage.getItem('lm2p-dino-best')||0}catch(_){}
      const neu=st.s>best;if(neu)try{localStorage.setItem('lm2p-dino-best',st.s)}catch(_){}
      c.end({coop:true,win:null,text:`Ihr seid ${st.s} Meter weit gekommen.`+(neu?' Neuer Rekord!':` Rekord auf diesem Gerät: ${best} m.`)});
    }
    let altRolle=-1,boden=0,altT=performance.now();
    c.frame(()=>{
      const t=performance.now(),dt=Math.min(.05,(t-altT)/1000);altT=t;
      if(st.r!==altRolle){altRolle=st.r;c.status(`Du bist für das <b>${st.r===c.me?'⬆️ Springen':'⬇️ Ducken'}</b> zuständig. Leertaste oder aufs Spielfeld tippen.`)}
      if(!aus)boden=(boden+dt*(330+st.s*.12))%40;
      g.fillStyle='#dfe6ff';g.fillRect(0,0,W,H);
      g.fillStyle='#1c1c1e';g.fillRect(0,BODEN,W,4);
      g.fillStyle='rgba(28,28,30,.3)';for(let x=-boden;x<W;x+=40)g.fillRect(x,BODEN+14,14,3);
      g.textAlign='center';g.textBaseline='alphabetic';
      for(const[x,typ,w]of st.o){
        if(typ){g.font='44px sans-serif';g.save();g.translate(x+w/2,BODEN-34);g.scale(-1,1);g.fillText('🦅',0,0);g.restore()}
        else{g.fillStyle='#1f9d55';g.fillRect(x,BODEN-46,w,46);g.fillRect(x-8,BODEN-34,8,6);g.fillRect(x+w,BODEN-28,8,6);g.strokeStyle='#1c1c1e';g.lineWidth=3;g.strokeRect(x,BODEN-46,w,46)}
      }
      if(!(st.inv>0&&Math.floor(t/100)%2)){
        g.save();g.translate(DX+20,BODEN-st.y);g.scale(-1,st.du?.55:1);g.font='56px sans-serif';g.fillText('🦖',0,0);g.restore();
      }
      g.fillStyle='#1c1c1e';g.font='800 22px ui-rounded,system-ui,sans-serif';g.textAlign='left';g.textBaseline='top';g.fillText(st.s+' M',14,12);
      g.textAlign='right';g.font='24px sans-serif';g.fillText('❤️'.repeat(st.l)+'🖤'.repeat(3-st.l),W-12,12);
      g.textAlign='center';g.font='700 15px "JetBrains Mono",monospace';
      g.fillStyle=FARBE[st.r];g.fillText(`⬆️ SPRINGEN: ${st.r===c.me?'DU':c.names[st.r].toUpperCase().slice(0,12)}`,W/2-150,16);
      g.fillStyle=FARBE[1-st.r];g.fillText(`⬇️ DUCKEN: ${1-st.r===c.me?'DU':c.names[1-st.r].toUpperCase().slice(0,12)}`,W/2+150,16);
      if(st.tausch>0){g.fillStyle='rgba(28,28,30,.8)';g.fillRect(W/2-190,H/2-50,380,64);g.fillStyle='#fff';g.font='800 29px ui-rounded,system-ui,sans-serif';g.textBaseline='middle';g.fillText('ROLLENTAUSCH!',W/2,H/2-18)}
    });
    return{msg(d){
      if(c.host){if(d.k!=null)ein[1]=!!d.k}
      else if(d.st){st=d.st;if(st.e&&!aus){aus=true;ende()}}
    }};
  }});

// ---------------------------------------------------------------------
//  20 · Echo-Kette
// ---------------------------------------------------------------------
SPIELE.push({id:'echo',name:'Echo-Kette',emoji:'🎵',mode:'coop',
  desc:'Abwechselnd die Ton-Kette nachspielen und einen Ton dranhängen. Wie lang wird sie?',
  how:'Vier bunte Tasten mit vier Tönen. Wer dran ist, spielt die <b>ganze bisherige Kette</b> nach und hängt dann <b>einen neuen Ton</b> an. Dann ist der andere dran. Der Partner sieht und hört jeden Tastendruck mit, also gut aufpassen! Ein falscher Ton und die Kette reißt. Tasten: 1 bis 4 oder Klick.',
  create(c){
    const F=['#1f9d55','#e2342b','#f5c518','#1740d8'],TON=[392,330,262,196];
    let seq=[],pos=0,dran=c.seed%2,aus=false;
    c.el.innerHTML=`<div class="ek"><div class="ekl"></div><div class="ekg">${F.map((f,i)=>`<button type="button" data-i="${i}" style="--k:${f}" aria-label="Ton ${i+1}"><span>${i+1}</span></button>`).join('')}</div><div class="ekp"></div></div>`;
    const kn=[...c.el.querySelectorAll('.ekg button')];
    let ac=null;
    const ton=i=>{try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),v=ac.createGain();o.type='triangle';o.frequency.value=TON[i];v.gain.setValueAtTime(.25,ac.currentTime);v.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.35);o.connect(v);v.connect(ac.destination);o.start();o.stop(ac.currentTime+.36)}catch(_){}};
    const blink=i=>{ton(i);const b=kn[i];b.classList.remove('an');void b.offsetWidth;b.classList.add('an')};
    function ui(){
      c.el.querySelector('.ekl').innerHTML=`Kette: <b>${seq.length}</b>`;
      c.el.querySelector('.ekp').innerHTML=seq.length&&!aus?`${'●'.repeat(Math.min(pos,seq.length))}${'○'.repeat(Math.max(0,seq.length-pos))}${pos>=seq.length?' + neuer Ton':''}`:'';
      c.el.querySelector('.ekg').classList.toggle('mein',dran===c.me&&!aus);
      if(!aus)c.status(dran===c.me?(seq.length?(pos<seq.length?`<b>Du bist dran:</b> Spiel die Kette nach (${pos}/${seq.length}).`:'<b>Jetzt einen neuen Ton anhängen!</b>'):'<b>Du fängst an:</b> Drück einen Ton.'):`${c.n(dran)} spielt. Gut zuhören!`);
    }
    function tipp(i,p){
      if(aus||p!==dran)return;blink(i);
      if(pos<seq.length){
        if(seq[pos]!==i){aus=true;kn[i].classList.add('falsch');kn[seq[pos]].classList.add('richtig');ui();
          let best=0;try{best=+localStorage.getItem('lm2p-echo-best')||0}catch(_){}
          const neu=seq.length>best;if(neu)try{localStorage.setItem('lm2p-echo-best',seq.length)}catch(_){}
          c.status(`${p===c.me?'Du hast':esc(c.names[p])+' hat'} sich verspielt.`);
          c.end({coop:true,win:null,text:`Eure Kette war ${seq.length} Töne lang.`+(neu?' Neuer Rekord!':` Rekord auf diesem Gerät: ${best}.`),delay:1800});return}
        pos++;
      }
      else{seq.push(i);pos=0;dran=1-dran}
      ui();
    }
    const druck=i=>{if(aus||dran!==c.me)return;c.send({i});tipp(i,c.me)};
    c.on(c.el.querySelector('.ekg'),'pointerdown',e=>{const b=e.target.closest('button');if(!b)return;e.preventDefault();druck(+b.dataset.i)});
    c.key((e,dn)=>{const k='1234'.indexOf(e.key);if(dn&&!e.repeat&&k>=0){e.preventDefault();druck(k)}});
    ui();
    return{msg(d){tipp(d.i|0,c.other)}};
  }});

// ---------------------------------------------------------------------
//  21 · Kritzel-Gedächtnis
// ---------------------------------------------------------------------
SPIELE.push({id:'kritzel',name:'Kritzel-Gedächtnis',emoji:'✏️',mode:'vs',
  desc:'15 Wörter, je 2 Sekunden zum Kritzeln. Erkennst du danach noch, was du gemalt hast?',
  how:'Ihr bekommt beide dieselben <b>15 Wörter</b> nacheinander, jedes nur <b>2 Sekunden</b> lang. Kritzel es so schnell du kannst, dann wird das Blatt leer und das nächste Wort kommt. Danach siehst du deine eigenen Zeichnungen in zufälliger Reihenfolge und schreibst ohne Zeitdruck dazu, was sie darstellen sollten. Jedes richtige Wort gibt einen Punkt (ein kleiner Tippfehler zählt noch). Die Auflösung mit den Bildern von euch beiden gibt es erst ganz am Ende.',
  create(c){
    const N=15,ZEIT=2000,W=300,H=300;
    const worte=shuffle(MALWORTE.slice(),rngFrom(c.seed^0x5f3a)).slice(0,N);
    const tipp=a=>{try{haptik(a)}catch(_){}};
    const bilder=Array.from({length:N},()=>[]),antw=Array(N).fill('');
    let phase='start',nr=-1,strich=null,fertig=[null,null];
    const q=s=>c.el.querySelector(s);

    // Zeichnungen sind Listen von Strichen, jeder Strich [x,y,x,y,…] in 0…300
    const zeichne=(g,s)=>{
      g.strokeStyle='#1c1c1e';g.lineWidth=7;g.lineCap='round';g.lineJoin='round';g.beginPath();
      g.moveTo(s[0],s[1]);if(s.length===2)g.lineTo(s[0]+.1,s[1]);for(let i=2;i<s.length;i+=2)g.lineTo(s[i],s[i+1]);g.stroke();
    };
    function bild(st){
      const cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;cv.className='kgb';
      const g=cv.getContext('2d');g.scale(2,2);g.fillStyle='#fff';g.fillRect(0,0,W,H);(st||[]).forEach(s=>zeichne(g,s));
      const d=document.createElement('div');d.className='kgbw'+((st||[]).length?'':' leer');d.appendChild(cv);return d;
    }
    const richtig=(a,w)=>{a=norm(a);const o=a.replace(/^(einen|eine|ein|der|die|das)/,'');return!!a&&(nah(a,norm(w))||nah(o,norm(w)))};
    const nah=(a,w)=>{
      if(a===w)return true;
      if(w.length<5||Math.abs(a.length-w.length)>1)return false;
      // höchstens ein Tippfehler (Levenshtein ≤ 1)
      let i=0,j=0,f=0;
      while(i<a.length&&j<w.length){if(a[i]===w[j]){i++;j++;continue}if(++f>1)return false;
        if(a.length>w.length)i++;else if(a.length<w.length)j++;else{i++;j++}}
      return f+(a.length-i)+(w.length-j)<=1;
    };

    // ---- 1. Zeichnen ----
    c.el.innerHTML=`<div class="kg"><div class="kgtop"><span class="kgnr"></span><b class="kgwort"></b><button type="button" class="btn primary big kglos">Los geht’s</button></div><div class="kgbar"><i></i></div><div class="kgcv"></div></div>`;
    const{g,cv,pos}=leinwand({el:q('.kgcv')},W,H);
    const leeren=()=>{g.fillStyle='#fff';g.fillRect(0,0,W,H)};
    const pt=e=>pos(e).map((v,i)=>Math.round(clamp(v,0,i?H:W)));
    c.on(cv,'pointerdown',e=>{if(phase!=='mal')return;e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}
      strich=pt(e);bilder[nr].push(strich);zeichne(g,strich)});
    c.on(cv,'pointermove',e=>{if(!strich||phase!=='mal')return;const[x,y]=pt(e),l=strich.length;
      if(Math.abs(x-strich[l-2])+Math.abs(y-strich[l-1])<2)return;
      g.strokeStyle='#1c1c1e';g.lineWidth=7;g.lineCap='round';g.beginPath();g.moveTo(strich[l-2],strich[l-1]);g.lineTo(x,y);g.stroke();strich.push(x,y)});
    const auf=()=>{strich=null};c.on(cv,'pointerup',auf);c.on(cv,'pointercancel',auf);
    const bar=q('.kgbar i');
    function naechstes(){
      strich=null;nr++;leeren();
      if(nr>=N){raten();return}
      phase='mal';q('.kgnr').textContent=`${nr+1} / ${N}`;q('.kgwort').textContent=worte[nr];
      bar.style.animation='none';void bar.offsetWidth;bar.style.animation=`kgbar ${ZEIT}ms linear forwards`;
      cv.classList.add('malen');tipp('tick');
      c.after(ZEIT,naechstes);
    }
    function countdown(n){
      q('.kgnr').textContent='Gleich geht’s los';q('.kgwort').textContent=n;tipp('tap');
      c.after(900,()=>n>1?countdown(n-1):naechstes());
    }
    leeren();q('.kgnr').textContent='15 Wörter · je 2 Sekunden';
    c.status('Drück auf <b>Los geht’s</b>, wenn du bereit bist. Dann kritzeln, so schnell du kannst!');
    c.on(q('.kglos'),'click',e=>{e.currentTarget.remove();
      // Ganzes Blatt sichtbar machen, solange die Wörter laufen
      c.status('Kritzel schnell!');countdown(3);
      const kg=q('.kg'),nav=document.querySelector('nav');scrollTo({top:kg.getBoundingClientRect().top+scrollY-(nav?nav.offsetHeight:0)-8,behavior:'smooth'})});

    // ---- 2. Eigene Zeichnungen wiedererkennen ----
    let reihe,k=0;
    function raten(){
      phase='raten';reihe=shuffle([...Array(N).keys()],Math.random);
      c.el.innerHTML=`<div class="kgr"><div class="kgnr"></div><div class="kgbild"></div>
        <form class="kgf"><input maxlength="40" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" enterkeyhint="next" placeholder="Was sollte das sein?" aria-label="Was sollte das sein?"><button class="btn primary">Weiter</button></form>
        <button type="button" class="btn sm kgzur">‹ Zurück</button></div>`;
      const form=q('.kgf'),inp=form.querySelector('input');
      c.on(form,'submit',e=>{e.preventDefault();antw[reihe[k]]=inp.value.trim().slice(0,40);
        if(k<N-1){k++;zeige()}else{inp.blur();abgeben()}});
      c.on(q('.kgzur'),'click',()=>{antw[reihe[k]]=inp.value.trim().slice(0,40);if(k>0){k--;zeige()}});
      zeige();
    }
    function zeige(){
      const wi=reihe[k],inp=q('.kgf input');
      q('.kgnr').textContent=`Bild ${k+1} von ${N}`;
      const b=q('.kgbild');b.innerHTML='';b.appendChild(bild(bilder[wi]));
      inp.value=antw[wi];q('.kgf button').textContent=k<N-1?'Weiter':'Fertig';
      inp.enterKeyHint=k<N-1?'next':'done';q('.kgzur').style.visibility=k?'':'hidden';
      c.status('Was wolltest du da malen? Kein Zeitlimit.');
      setTimeout(()=>{try{inp.focus({preventScroll:true})}catch(_){}},30);
    }
    function abgeben(){
      phase='warten';fertig[c.me]={b:bilder,a:antw};c.send({fertig:fertig[c.me]});
      if(fertig[c.other])auswerten();
      else{c.el.innerHTML=`<div class="kgwarte">Fertig! Warte auf ${c.n(c.other)} …</div>`;c.status('Warte auf '+c.n(c.other)+' …')}
    }

    // ---- 3. Auflösung ----
    function auswerten(){
      phase='ende';
      const pk=[0,1].map(p=>worte.filter((w,i)=>richtig(fertig[p].a[i]||'',w)).length);
      const nm=p=>p===c.me?'Du':esc(c.names[p]);
      c.el.innerHTML=`<div class="kge"><div class="kgsc">${[0,1].map(p=>`<div class="p${p}"><span>${nm(p)}</span><b>${pk[p]}</b><small>von ${N}</small></div>`).join('')}</div>
        <div class="kgl"></div><button type="button" class="btn primary kgok">Weiter</button></div>`;
      const l=q('.kgl');
      worte.forEach((w,i)=>{
        const z=document.createElement('div');z.className='kgw';z.innerHTML=`<h4>${esc(w)}</h4><div class="kgpaar"></div>`;
        for(const p of[0,1]){
          const a=fertig[p].a[i]||'',ok=richtig(a,w),f=document.createElement('figure');f.className='p'+p;
          f.appendChild(bild(fertig[p].b[i]));
          const cap=document.createElement('figcaption');cap.className=ok?'gut':'schlecht';
          cap.innerHTML=`<i>${ok?'✓':'✗'}</i> ${a?esc(a):'<em>nichts</em>'}`;f.appendChild(cap);z.lastChild.appendChild(f);
        }
        l.appendChild(z);
      });
      const w=pk[0]===pk[1]?-1:pk[0]>pk[1]?0:1;
      c.status(w<0?'Gleichstand!':w===c.me?'Du hast gewonnen!':c.n(w)+' hat gewonnen.');
      tipp(w===c.me?'sieg':'tap');
      c.on(q('.kgok'),'click',()=>c.end({w,delay:0,text:`${pk[c.me]} : ${pk[c.other]} erkannte Bilder.`}));
      if(innerWidth<=700)scrollTo(0,0);
    }

    return{msg(d){
      if(d.fertig&&!fertig[c.other]){
        const b=Array.isArray(d.fertig.b)?d.fertig.b:[],a=Array.isArray(d.fertig.a)?d.fertig.a:[];
        fertig[c.other]={b:worte.map((_,i)=>Array.isArray(b[i])?b[i].filter(s=>Array.isArray(s)&&s.length>=2).map(s=>s.map(Number)):[]),
          a:worte.map((_,i)=>String(a[i]??'').slice(0,40))};
        if(phase==='warten')auswerten();
      }
    }};
  }});
