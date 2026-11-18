/* ===== 12A1 – Nâng cấp tương tác toàn diện (chạy ngoài React) =====
   - Thanh tiến độ cuộn, menu sáng, nút Trang trước / Trang sau, đồng bộ nhạc nền
   - Hành trình 3 năm (có tab "Tất cả 3 năm" + lightbox)
   - Phòng 12A1 (mở khóa mật khẩu PBKDF2 + bộ lọc + pháo giấy)
   - Trả bài cũ (vòng quay + âm thanh tíc-tắc + pháo giấy + tải thiệp PNG & TXT)
   - Lưu bút tương tác (viết thêm lời nhắn, lưu localStorage & xuất thiệp PNG)
   - Tự động xử lý ảnh chưa cập nhật thành thẻ monogram hoài niệm
*/
(function(){
var st={
  g:function(k,d){try{var v=localStorage.getItem("x12_"+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  s:function(k,v){try{localStorage.setItem("x12_"+k,JSON.stringify(v))}catch(e){}}
};
function prog(){var h=document.documentElement,m=h.scrollHeight-innerHeight;h.style.setProperty("--x12p",m>0?Math.min(1,scrollY/m):0)}
addEventListener("scroll",prog,{passive:true});prog();

/* ---------- Tiện ích chung ---------- */
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
var cache={};
function get(u,json){
  var rel=u.replace(/^\//,"");
  var target=(/^https?:\/\//.test(u))?u:("./"+rel);
  var k=target+json;
  if(!cache[k])cache[k]=fetch(target,{cache:"no-cache"}).then(function(r){if(!r.ok)throw 0;return json?r.json():r.text()});
  return cache[k];
}
function csv(t){
  t=t.replace(/^\uFEFF/,"");var rows=[],r=[],f="",q=false;
  for(var i=0;i<t.length;i++){var c=t[i];
    if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}
    else if(c=='"')q=true;else if(c==","){r.push(f);f=""}else if(c=="\n"){r.push(f);rows.push(r);r=[];f=""}else if(c!="\r")f+=c}
  if(f!==""||r.length){r.push(f);rows.push(r)}
  return rows.slice(1).filter(function(r){return r.some(function(x){return x.trim()})}).map(function(r){return r.map(function(x){return x.trim()})});
}
function im(p){
  p=(p||"").trim();
  if(!p)return "";
  var full=/^(\.\/|\/|https?:)/.test(p)?p:"./media/images/"+p;
  return (full.charAt(0)==="/")?("."+full):full;
}
function lop(s){var m=(s||"").match(/\d+/);return m?m[0]:""}
function mount(id,html){
  var m=document.querySelector("main");if(!m||document.getElementById(id))return null;
  var s=document.createElement("section");s.id=id;s.className="x12-pg";s.innerHTML=html;
  var pl=document.getElementById("music-player");if(pl&&pl.parentNode===m)m.insertBefore(s,pl);else m.appendChild(s);
  return s;
}
function head(eye,title,sub){return '<p class="eye">'+eye+'</p><h2>'+title+'</h2><p class="sub">'+sub+'</p><div class="rule"></div>'}
function lightbox(src){
  var o=el("div","x12-lb");var i=el("img");i.src=src;o.appendChild(i);
  o.onclick=function(){o.remove()};document.body.appendChild(o);
}
addEventListener("keydown",function(e){if(e.key==="Escape"){var l=document.querySelector(".x12-lb");if(l)l.remove()}});

/* Hiệu ứng pháo giấy ăn mừng */
function celebrate(){
  var cv=document.createElement("canvas");cv.className="x12-confetti";
  cv.width=innerWidth;cv.height=innerHeight;document.body.appendChild(cv);
  var cx=cv.getContext("2d"),cols=["#b08d4f","#e8d6ac","#9a5b2e","#d97706","#fef3c7","#5c432c"];
  var pts=Array.from({length:75},function(){
    return {x:innerWidth*(0.2+Math.random()*0.6),y:innerHeight*0.45,vx:(Math.random()-0.5)*11,vy:-6-Math.random()*9,r:4+Math.random()*5,c:cols[Math.random()*cols.length|0],a:Math.random()*6.28,va:(Math.random()-0.5)*0.2};
  });
  var t0=performance.now();
  (function step(now){
    var dt=(now-t0)/1000;cx.clearRect(0,0,cv.width,cv.height);
    pts.forEach(function(p){
      p.x+=p.vx;p.y+=p.vy;p.vy+=0.34;p.a+=p.va;
      cx.save();cx.translate(p.x,p.y);cx.rotate(p.a);cx.fillStyle=p.c;cx.fillRect(-p.r,-p.r/2,p.r*2,p.r);cx.restore();
    });
    if(dt<2.2)requestAnimationFrame(step);else cv.remove();
  })(t0);
}

/* Xuất thiệp ảnh PNG hoài niệm 1200x760 */
function downloadPostcardPNG(author, roleOrDate, message, filename){
  var W=1200,H=760,cv=document.createElement("canvas");cv.width=W;cv.height=H;
  var cx=cv.getContext("2d");
  cx.fillStyle="#f4ede0";cx.fillRect(0,0,W,H);
  cx.strokeStyle="#b08d4f";cx.lineWidth=3;cx.strokeRect(36,36,W-72,H-72);
  cx.strokeStyle="rgba(176,141,79,0.4)";cx.lineWidth=1;cx.strokeRect(48,48,W-96,H-96);

  cx.fillStyle="#8a6d3b";cx.font="600 18px system-ui, sans-serif";
  cx.fillText("KỶ YẾU THANH XUÂN · LỚP 12A1 (2023 – 2026)",84,106);

  cx.fillStyle="#2c2416";cx.font="italic 700 44px Georgia, serif";
  cx.fillText("Lưu Bút Thanh Xuân",84,166);

  cx.strokeStyle="#d9c79e";cx.lineWidth=1.5;
  cx.beginPath();cx.moveTo(84,192);cx.lineTo(W-84,192);cx.stroke();

  cx.fillStyle="#292218";cx.font="italic 30px Georgia, serif";
  var words=("“"+message+"”").split(/\s+/),line="",y=258,maxW=W-168;
  for(var i=0;i<words.length;i++){
    var test=line+words[i]+" ";
    if(cx.measureText(test).width>maxW&&i>0){cx.fillText(line.trim(),84,y);line=words[i]+" ";y+=46;if(y>570)break;}
    else line=test;
  }
  if(y<=570)cx.fillText(line.trim(),84,y);

  cx.fillStyle="#8a6d3b";cx.font="italic 700 28px Georgia, serif";
  cx.textAlign="right";
  cx.fillText("— "+author,W-84,H-105);
  cx.font="18px system-ui, sans-serif";
  cx.fillText(roleOrDate||"Tập thể 12A1",W-84,H-74);

  var a=document.createElement("a");
  a.href=cv.toDataURL("image/png");
  a.download=filename||"thiep-luu-but-12A1.png";
  a.click();
}

/* ================= HÀNH TRÌNH 3 NĂM ================= */
var TEN_LOP={"all":["Tất cả 3 năm","2023 – 2026"],"10":["10A1","Năm nhất"],"11":["11A1","Năm hai"],"12":["12A1","Năm cuối"]};
function journey(){
  if(document.getElementById("ht"))return;
  Promise.all([get("./data/hanh-trinh.csv"),get("./data/chuong.csv").catch(function(){return ""})]).then(function(r){
    if(document.getElementById("ht"))return;
    var L={"10":{ev:[],ch:{}},"11":{ev:[],ch:{}},"12":{ev:[],ch:{}}};
    csv(r[0]).forEach(function(x){
      var k=lop(x[0]);
      if(L[k])L[k].ev.push({lop:TEN_LOP[k][0],tg:x[1],td:x[2],mt:x[3],a:im(x[4]),tag:x[5]||"",ph:(x[6]||"").split(";").map(im).filter(Boolean)});
    });
    csv(r[1]).forEach(function(x){
      var k=lop(x[0]);
      if(L[k])L[k].ch={sub:x[1],intro:x[2],ct:x[3],cq:x[4],ph:im(x[5])};
    });
    var s=mount("ht",'<div class="in">'+head("1000 ngày bên nhau","Hành Trình 3 Năm","Chạm vào từng mốc để xem thêm ảnh và kỷ niệm.")+'<div class="tabs" id="ht-tabs"></div><div id="ht-body"></div></div>');
    if(!s)return;
    var tabs=s.querySelector("#ht-tabs"),body=s.querySelector("#ht-body");
    var cur=({"#10a1":"10","#11a1":"11","#12a1":"12","#all":"all"})[location.hash.toLowerCase()]||"all";

    function show(k){
      cur=k;
      history.replaceState(null,"","#"+(k==="all"?"all":TEN_LOP[k][0].toLowerCase()));
      [].forEach.call(tabs.children,function(b){b.classList.toggle("on",b.dataset.k===k)});
      body.innerHTML="";
      var evList=k==="all"?[].concat(L["10"].ev,L["11"].ev,L["12"].ev):L[k].ev;
      var chInfo=k==="all"?{sub:"10A1 → 11A1 → 12A1",intro:"Trọn vẹn 1.000 ngày thanh xuân từ những bỡ ngỡ đầu tiên đến giây phút trưởng thành."}:L[k].ch;

      var hd=el("div","ch");
      hd.appendChild(el("h3","",TEN_LOP[k][0]+" · "+TEN_LOP[k][1]));
      if(chInfo.sub)hd.appendChild(el("p","sb",chInfo.sub));
      if(chInfo.intro)hd.appendChild(el("p","it",chInfo.intro));
      body.appendChild(hd);

      var ol=el("ol","tl");
      if(!evList.length)ol.appendChild(el("li","em","Chưa có mốc nào. Thêm dòng mới trong data/hanh-trinh.csv nhé."));
      evList.forEach(function(e){
        var li=el("li","ev"),bd=el("div","bd"),m=el("div","mt");
        if(k==="all"&&e.lop)m.appendChild(el("span","tg",e.lop));
        m.appendChild(el("span","dt",e.tg));
        if(e.tag)m.appendChild(el("span","tg",e.tag));
        bd.appendChild(m);
        bd.appendChild(el("h4","",e.td));
        if(e.mt)bd.appendChild(el("p","ds",e.mt));
        var more=e.ph.length||(e.mt&&e.mt.length>150);
        if(e.ph.length){
          var g=el("div","ph");
          e.ph.forEach(function(u){
            var i=el("img");i.loading="lazy";i.src=u;i.alt="";
            i.onerror=function(){i.remove()};
            i.onclick=function(ev){ev.stopPropagation();lightbox(u)};
            g.appendChild(i);
          });
          bd.appendChild(g);
        }
        li.appendChild(bd);
        if(e.a){
          var t=el("img","th");t.loading="lazy";t.src=e.a;t.alt="";
          t.onerror=function(){t.remove()};
          t.onclick=function(ev){ev.stopPropagation();lightbox(e.a)};
          li.appendChild(t);
        }
        if(more){li.classList.add("mo");li.onclick=function(){li.classList.toggle("open")}}
        ol.appendChild(li);
      });
      body.appendChild(ol);

      if(k!=="all"&&(chInfo.ct||chInfo.cq||chInfo.ph)){
        var c=el("div","cl");
        if(chInfo.ph){var i=el("img");i.loading="lazy";i.src=chInfo.ph;i.alt="";i.onerror=function(){i.remove()};i.onclick=function(){lightbox(chInfo.ph)};c.appendChild(i)}
        if(chInfo.ct)c.appendChild(el("h4","",chInfo.ct));
        if(chInfo.cq)c.appendChild(el("p","",chInfo.cq));
        body.appendChild(c);
      }
    }
    ["all","10","11","12"].forEach(function(k){
      var b=el("button","tab",TEN_LOP[k][0]);b.dataset.k=k;b.onclick=function(){show(k)};tabs.appendChild(b);
    });
    show(cur);
  }).catch(function(){});
}

/* ================= PHÒNG 12A1 (khóa mật khẩu) ================= */
function b64(s){var b=atob(s),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function same(a,b){if(a.length!==b.length)return false;var d=0;for(var i=0;i<a.length;i++)d|=a[i]^b[i];return d===0}
async function mo(m,it,pw){
  var enc=new TextEncoder();pw=pw.trim().toLowerCase().normalize("NFC");
  var k=await crypto.subtle.importKey("raw",enc.encode(pw),"PBKDF2",false,["deriveBits"]);
  var bits=new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt:b64(m.s),iterations:it,hash:"SHA-256"},k,512));
  if(!same(bits.slice(0,32),b64(m.c)))return null;
  var key=bits.slice(32),ct=b64(m.e),out=new Uint8Array(ct.length);
  for(var i=0;i<ct.length;i+=32){
    var blk=new Uint8Array(36);blk.set(key,0);new DataView(blk.buffer).setUint32(32,i/32,false);
    var h=new Uint8Array(await crypto.subtle.digest("SHA-256",blk));
    for(var j=0;j<32&&i+j<ct.length;j++)out[i+j]=ct[i+j]^h[j];
  }
  return new TextDecoder().decode(out);
}
function ini(n){var p=n.trim().split(/\s+/);return (p.length>1?p[p.length-2][0]+p[p.length-1][0]:p[0][0]).toUpperCase()}
var LOCK='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    UNLOCK='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/></svg>';

function room(){
  if(document.getElementById("rm"))return;
  get("./data/phong.json",true).then(function(D){
    if(document.getElementById("rm"))return;
    var s=mount("rm",'<div class="in">'+head("Khu vực riêng","Phòng 12A1","Mỗi người một chiếc chìa khóa. Nhập đúng mật khẩu của bạn để mở ra câu nói của chính mình.")+
      '<div class="rm-bar"><input id="rm-q" type="search" placeholder="Tìm tên bạn…" autocomplete="off">'+
      '<div class="rm-filters" id="rm-flt"><button type="button" class="rm-flt on" data-f="all">Tất cả</button><button type="button" class="rm-flt" data-f="open">Đã mở</button><button type="button" class="rm-flt" data-f="lock">Có mật khẩu</button></div>'+
      '<span id="rm-c"></span></div><div class="rm-grid" id="rm-g"></div></div>');
    if(!s)return;
    var opened=st.g("room",{}),g=s.querySelector("#rm-g"),q=s.querySelector("#rm-q"),flt="all";
    s.querySelectorAll(".rm-flt").forEach(function(btn){
      btn.onclick=function(){
        flt=btn.dataset.f;
        s.querySelectorAll(".rm-flt").forEach(function(x){x.classList.toggle("on",x===btn)});
        draw();
      };
    });
    function count(){var n=Object.keys(opened).length;s.querySelector("#rm-c").textContent="Đã mở "+n+" / "+D.m.length+" phòng"}
    function draw(){
      var f=q.value.trim().toLowerCase();g.innerHTML="";
      D.m.forEach(function(m){
        if(f&&m.n.toLowerCase().indexOf(f)<0)return;
        var open=opened[m.n]!=null;
        if(flt==="open"&&!open)return;
        if(flt==="lock"&&!m.s)return;
        var c=el("button","rc"+(open?" open":"")+(m.s?"":" none"));c.type="button";
        var top=el("div","tp");top.appendChild(el("span","av",ini(m.n)));
        var ic=el("span","ic");ic.innerHTML=open?UNLOCK:LOCK;top.appendChild(ic);c.appendChild(top);
        c.appendChild(el("div","nm",m.n));
        if(open)c.appendChild(el("p","qt","“"+opened[m.n]+"”"));
        else c.appendChild(el("div","hn",m.s?"Chạm để mở khóa":"Chưa đặt mật khẩu"));
        c.onclick=function(){ask(m)};g.appendChild(c);
      });
      if(!g.children.length)g.appendChild(el("div","em","Không có phòng phù hợp bộ lọc này."));
      count();
    }
    function ask(m){
      var o=el("div","x12-md"),b=el("div","bx");o.appendChild(b);
      function close(){o.remove();document.removeEventListener("keydown",esc)}
      function esc(e){if(e.key==="Escape")close()}document.addEventListener("keydown",esc);
      o.onclick=function(e){if(e.target===o)close()};
      function ico(){var i=el("div","ico");i.innerHTML=opened[m.n]!=null?UNLOCK:LOCK;return i}
      function showMsg(t){
        b.innerHTML="";b.appendChild(ico());b.appendChild(el("h3","",m.n));
        b.appendChild(el("p","big","“"+t+"”"));
        var act=el("div","act");
        var dl=el("button","btn g","Tải thiệp (.png)");
        dl.onclick=function(){downloadPostcardPNG(m.n,"Góc bí mật Phòng 12A1",t,"phong-12a1-"+m.n+".png")};
        var x=el("button","btn","Đóng");x.onclick=close;
        act.appendChild(dl);act.appendChild(x);b.appendChild(act);
      }
      if(opened[m.n]!=null){showMsg(opened[m.n]);document.body.appendChild(o);return}
      b.appendChild(ico());b.appendChild(el("h3","",m.n));
      if(!m.s){
        b.appendChild(el("p","tx","Phòng này chưa được đặt mật khẩu trong data/thanh-vien.csv."));
        var x=el("button","btn","Đóng");x.onclick=close;b.appendChild(x);document.body.appendChild(o);return;
      }
      b.appendChild(el("p","tx","Nhập mật khẩu của bạn để mở khóa."));
      var inp=el("input");inp.type="password";inp.placeholder="Mật khẩu";inp.autocomplete="off";b.appendChild(inp);
      var er=el("p","er","");b.appendChild(er);
      var row=el("div","act"),ok=el("button","btn","Mở khóa"),no=el("button","btn g","Hủy");row.appendChild(ok);row.appendChild(no);b.appendChild(row);
      no.onclick=close;
      async function go(){
        er.textContent="";
        if(!(window.crypto&&crypto.subtle)){er.textContent="Cần mở web qua BAT-WEB.bat (http://localhost:3000) để giải mã.";return}
        if(!inp.value.trim()){inp.focus();return}
        ok.disabled=true;var t=null;try{t=await mo(m,D.it,inp.value)}catch(e){}
        ok.disabled=false;
        if(t==null){er.textContent="Sai mật khẩu, thử lại nhé.";b.classList.remove("sk");void b.offsetWidth;b.classList.add("sk");inp.select();return}
        opened[m.n]=t;st.s("room",opened);celebrate();showMsg(t);draw();
      }
      ok.onclick=go;inp.onkeydown=function(e){if(e.key==="Enter")go()};
      document.body.appendChild(o);setTimeout(function(){inp.focus()},50);
    }
    q.oninput=draw;draw();
  }).catch(function(){});
}

/* ================= TRẢ BÀI CŨ (Vòng quay + Tíc-tắc + Xuất thiệp PNG) ================= */
var TAU=Math.PI*2;
function tickSound(){
  try{
    var ctx=tickSound.ctx||(tickSound.ctx=new (window.AudioContext||window.webkitAudioContext)());
    var o=ctx.createOscillator(),g=ctx.createGain();
    o.type="triangle";o.frequency.value=620;
    g.gain.setValueAtTime(0.05,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.045);
    o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+0.05);
  }catch(e){}
}

function trabai(){
  if(document.getElementById("tra-bai"))return;
  get("./data/thanh-vien.json",true).then(function(N){
    if(document.getElementById("tra-bai")||!N.length)return;
    var s=mount("tra-bai",'<div class="in">'+head("Tri ân · Trò chơi của lớp","Trả Bài Cũ","Quay đến ai, lời chúc của người ấy sẽ hiện ra trên bảng.")+
      '<div class="grid"><div class="wb"><div class="ptr"></div><canvas id="tb-c" role="img" aria-label="Vòng quay tên '+N.length+' thành viên 12A1"></canvas><button class="btn" id="tb-spin">Quay gọi tên</button><label class="chk"><input type="checkbox" id="tb-only" checked> Chỉ quay những bạn chưa được gọi</label></div>'+
      '<div class="card"><div class="st" id="tb-st"></div><div class="nm" id="tb-name"></div><p class="wish" id="tb-wish"></p><div class="act" id="tb-card-act" style="display:none"><button class="btn g" id="tb-png">Tải thiệp lời chúc (.png)</button></div><div class="pg"><span id="tb-pt"></span><div class="bar"><i id="tb-pb"></i></div></div></div></div>'+
      '<h3 class="h">Sổ lời chúc đã gọi</h3><div class="list" id="tb-list"></div><div class="act" style="margin-top:22px"><button class="btn g" id="tb-dl">Tải sổ lời chúc (.txt)</button><button class="btn g" id="tb-rs">Làm lại từ đầu</button></div></div>');
    if(!s)return;
    var $=function(i){return s.querySelector("#"+i)},A=TAU/N.length,W=st.g("wish2",[]),rot=0,busy=false,cv=$("tb-c"),cx=cv.getContext("2d"),S=880,curPick=null;
    cv.width=S;cv.height=S;
    var done=function(){var o={};W.forEach(function(w){o[w.n]=1});return o};
    function draw(){
      var d=done(),R=S/2;cx.clearRect(0,0,S,S);
      N.forEach(function(p,i){
        var a0=rot+i*A,a1=a0+A,dn=d[p.n];
        cx.beginPath();cx.moveTo(R,R);cx.arc(R,R,R-6,a0,a1);cx.closePath();
        cx.fillStyle=dn?"#e7e2d4":(i%2?"#f1e8d0":"#e6d9b8");cx.fill();
        cx.strokeStyle="#fffdf8";cx.lineWidth=2;cx.stroke();
        cx.save();cx.translate(R,R);cx.rotate(a0+A/2);cx.textAlign="right";cx.textBaseline="middle";
        cx.fillStyle=dn?"#a8a29e":"#3b2f1c";cx.font="600 21px system-ui,sans-serif";
        cx.fillText(p.n.split(" ").pop(),R-26,0);cx.restore();
      });
      cx.beginPath();cx.arc(R,R,R-6,0,TAU);cx.lineWidth=6;cx.strokeStyle="#2c2416";cx.stroke();
      cx.beginPath();cx.arc(R,R,58,0,TAU);cx.fillStyle="#2c2416";cx.fill();
      cx.fillStyle="#e8d6ac";cx.font="italic 700 34px Georgia,serif";cx.textAlign="center";cx.textBaseline="middle";
      cx.fillText("12A1",R,R+2);
    }
    function upd(){
      var c=Object.keys(done()).length;$("tb-pt").textContent="Đã gọi "+c+" / "+N.length+" bạn";
      $("tb-pb").style.width=(c/N.length*100)+"%";draw();
      var l=$("tb-list");l.innerHTML="";
      if(!W.length)l.appendChild(el("div","em","Chưa có lời chúc nào. Hãy quay để gọi bạn đầu tiên."));
      W.forEach(function(w){
        var d=el("div","w");d.appendChild(el("p","","“"+w.m+"”"));
        d.appendChild(el("small","",w.n+" · "+w.t));l.appendChild(d);
      });
    }
    function card(i){
      var on=i>=0;curPick=on?N[i]:null;
      $("tb-st").textContent=on?"Được gọi lên bảng":"Chưa gọi tên";
      $("tb-name").textContent=on?N[i].n:"—";
      $("tb-card-act").style.display=on?"flex":"none";
      var w=$("tb-wish");w.classList.remove("in");
      w.textContent=on?"“"+N[i].w+"”":"Bấm “Quay gọi tên” để bắt đầu.";
      if(on){void w.offsetWidth;w.classList.add("in")}
    }
    $("tb-png").onclick=function(){
      if(curPick)downloadPostcardPNG(curPick.n,"Trả bài cũ · Lớp 12A1",curPick.w,"loi-chuc-"+curPick.n+".png");
    };
    $("tb-spin").onclick=function(){
      if(busy)return;var d=done(),pool=[];
      N.forEach(function(p,i){if(!$("tb-only").checked||!d[p.n])pool.push(i)});
      if(!pool.length){$("tb-st").textContent="Cả lớp đã được gọi hết rồi";return}
      var t=pool[Math.random()*pool.length|0],target=-Math.PI/2-(t+.5)*A,delta=(((target-rot)%TAU)+TAU)%TAU+TAU*6,r0=rot,t0=performance.now(),D=4600,lastSlice=-1;
      busy=true;$("tb-spin").disabled=true;$("tb-card-act").style.display="none";
      $("tb-st").textContent="Đang quay…";$("tb-name").textContent="…";$("tb-wish").textContent="";
      (function f(n){
        var k=Math.min(1,(n-t0)/D),e=1-Math.pow(1-k,4);rot=r0+delta*e;draw();
        var sl=Math.floor(((rot%TAU)+TAU)/A);
        if(sl!==lastSlice){lastSlice=sl;tickSound()}
        if(k<1)requestAnimationFrame(f);
        else{
          busy=false;$("tb-spin").disabled=false;card(t);celebrate();
          if(!done()[N[t].n]){W.unshift({n:N[t].n,m:N[t].w,t:new Date().toLocaleDateString("vi-VN")});st.s("wish2",W)}
          upd();
        }
      })(t0);
    };
    $("tb-dl").onclick=function(){
      var t="SỔ LỜI CHÚC 12A1\n\n"+W.map(function(w){return w.n+":\n"+w.m}).join("\n\n"),a=document.createElement("a");
      a.href=URL.createObjectURL(new Blob([t],{type:"text/plain;charset=utf-8"}));a.download="so-loi-chuc-12A1.txt";a.click();
    };
    $("tb-rs").onclick=function(){if(confirm("Xóa sổ lời chúc và quay lại từ đầu?")){W=[];st.s("wish2",W);card(-1);upd()}};
    card(-1);upd();
  }).catch(function(){});
}

/* ================= GÓC VIẾT THÊM LƯU BÚT & IN THIỆP (luu-but.html) ================= */
function luubutStudio(){
  if(document.getElementById("lb-studio"))return;
  var m=document.querySelector("main");if(!m)return;
  var sec=document.createElement("section");sec.id="lb-studio";
  sec.innerHTML='<div class="in"><p class="eye">Góc Sáng Tác Kỷ Niệm</p><h3>Viết Thêm Trang Lưu Bút Mới</h3>'+
    '<p class="sub">Gửi lại đôi dòng nhắn nhủ cho tập thể 12A1 — bạn có thể lưu vào sổ hoặc xuất thành tấm thiệp ảnh PNG mang về.</p>'+
    '<div class="form-box"><div class="row2"><input id="lb-author" type="text" placeholder="Tên hoặc biệt danh của bạn…"><input id="lb-tag" type="text" placeholder="Gửi tới (vd: Cả lớp 12A1, Tổ 2…)"></div>'+
    '<textarea id="lb-msg" rows="3" placeholder="Viết dòng lưu bút của bạn tại đây…"></textarea>'+
    '<div class="acts"><button type="button" class="btn" id="lb-add">Ghi vào sổ lưu bút</button><button type="button" class="btn g" id="lb-export-txt">Tải toàn bộ lưu bút (.txt)</button></div></div>'+
    '<div class="notes-grid" id="lb-grid"></div></div>';
  var pl=document.getElementById("music-player");
  if(pl&&pl.parentNode===m)m.insertBefore(sec,pl);else m.appendChild(sec);

  var notes=st.g("luubut_notes",[
    {a:"Tập thể 12A1",to:"Thanh xuân 2023 – 2026",m:"Dẫu sau này mỗi đứa một phương trời, chỉ cần nhớ rằng chúng ta đã từng có những năm tháng rực rỡ nhất bên nhau dưới mái nhà 12A1.",d:"Lưu giữ"}
  ]);
  var grid=sec.querySelector("#lb-grid");
  function renderNotes(){
    grid.innerHTML="";
    notes.forEach(function(item){
      var card=el("div","note-card");
      card.appendChild(el("p","","“"+item.m+"”"));
      var meta=el("div","meta");
      meta.appendChild(el("span","",item.a+" → "+item.to+" · "+item.d));
      var btn=el("button","card-dl","Tải thiệp PNG");btn.type="button";
      btn.onclick=function(){downloadPostcardPNG(item.a,"Gửi: "+item.to+" · "+item.d,item.m,"luu-but-"+item.a+".png")};
      meta.appendChild(btn);
      card.appendChild(meta);grid.appendChild(card);
    });
  }
  sec.querySelector("#lb-add").onclick=function(){
    var a=sec.querySelector("#lb-author").value.trim()||"Thành viên 12A1";
    var to=sec.querySelector("#lb-tag").value.trim()||"Lớp 12A1";
    var msg=sec.querySelector("#lb-msg").value.trim();
    if(!msg){sec.querySelector("#lb-msg").focus();return}
    notes.unshift({a:a,to:to,m:msg,d:new Date().toLocaleDateString("vi-VN")});
    st.s("luubut_notes",notes);
    sec.querySelector("#lb-msg").value="";
    celebrate();renderNotes();
  };
  sec.querySelector("#lb-export-txt").onclick=function(){
    var txt="SỔ LƯU BÚT LỚP 12A1\n\n"+notes.map(function(x){return x.a+" (gửi "+x.to+"):\n"+x.m}).join("\n\n");
    var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([txt],{type:"text/plain;charset=utf-8"}));
    a.download="luu-but-12A1.txt";a.click();
  };
  renderNotes();
}

/* ================= XỬ LÝ ẢNH LỖI & LIGHTBOX KHOẢNH KHẮC ================= */
function polishMedia(){
  document.querySelectorAll("img").forEach(function(img){
    if(img.__x12img)return;img.__x12img=1;
    function toFb(){if(img.dataset.fb)return;img.dataset.fb="1";var alt=img.getAttribute("alt")||"Kỷ niệm 12A1";var box=el("div","x12-img-fallback");box.innerHTML="<b>12A1</b><span>"+alt+"</span>";if(img.parentNode)img.parentNode.replaceChild(box,img);}if(img.complete&&img.naturalWidth===0){toFb();return;}img.addEventListener("error",toFb);if(false){
      if(img.dataset.fb)return;img.dataset.fb="1";
      var alt=img.getAttribute("alt")||"Kỷ niệm 12A1";
      var box=el("div","x12-img-fallback");
      box.innerHTML="<b>12A1</b><span>"+alt+"</span>";
      if(img.parentNode)img.parentNode.replaceChild(box,img);
    });
  });
  var h=here();
  if(h==="./khoanh-khac.html"){
    document.querySelectorAll("#moments img, #memory-wall img").forEach(function(img){
      if(img.__x12zoom)return;img.__x12zoom=1;
      img.style.cursor="zoom-in";
      img.addEventListener("click",function(){if(img.src)lightbox(img.src)});
    });
  }
}

/* ================= ĐIỀU HƯỚNG CHUNG ================= */
function fab(){
  if(document.getElementById("x12-fab")||here()==="./tra-bai-cu.html")return;
  var a=document.createElement("a");a.id="x12-fab";a.href="./tra-bai-cu.html";
  a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>Trả bài cũ';
  document.body.appendChild(a);
}
function back(){
  if(document.getElementById("x12-back")||!document.getElementById("members")||document.getElementById("hero"))return;
  var a=document.createElement("a");a.id="x12-back";a.href="./index.html";
  a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>Sổ tay 3D';
  document.body.appendChild(a);
}
var PG=[["./index.html","Sổ tay 3D"],["./sao.html","Thành viên"],["./video.html","Video"],["./khoanh-khac.html","Khoảnh khắc"],["./hanh-trinh.html","Hành trình"],["./thay-co.html","Thầy cô"],["./luu-but.html","Lưu bút"],["./phong-12a1.html","Phòng 12A1"],["./tra-bai-cu.html","Trả bài cũ"],["./ket-thuc.html","Lời kết"]];
function here(){var f=location.pathname.split("/").pop()||"index.html";if(!/\.html$/i.test(f))f="index.html";return "./"+f;}
function nav(){
  var h=here();if(h==="./index.html")return;
  document.querySelectorAll("header a[href]").forEach(function(a){var hf=(a.getAttribute("href")||"").replace(/^\.\//,"");var cur=h.replace(/^\.\//,"");if(hf===cur||((hf==="/"||hf==="")&&cur==="index.html"))a.classList.add("x12-on")});
}
function pager(){
  if(document.getElementById("x12-pager"))return;
  var h=here(),i=-1;PG.forEach(function(x,k){if(x[0]===h)i=k});if(i<2)return;
  var d=document.createElement("nav");d.id="x12-pager";d.setAttribute("aria-label","Chuyển trang");
  var p=PG[i-1],n=PG[i+1];
  d.innerHTML=(p?'<a class="pv" href="'+p[0]+'">← '+p[1]+'</a>':"<span></span>")+(n?'<a class="nx" href="'+n[0]+'">'+n[1]+' →</a>':"<span></span>");
  document.body.appendChild(d);
}
function nextBtn(){
  if(document.getElementById("x12-next")||here()!=="./sao.html")return;
  var a=document.createElement("a");a.id="x12-next";a.href="./video.html";
  a.innerHTML='Video<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
  document.body.appendChild(a);
}
function aud(){
  var a=document.querySelector("audio");if(!a||a.__x12)return;a.__x12=1;var sv=st.g("at",null);
  function put(){if(sv&&Date.now()-sv.d<900000){try{a.currentTime=sv.t}catch(e){}}}
  a.readyState>=1?put():a.addEventListener("loadedmetadata",put,{once:true});
  addEventListener("pagehide",function(){st.s("at",{s:a.getAttribute("src"),t:a.currentTime,d:Date.now()})});
}
function boot(){
  nav();pager();aud();nextBtn();polishMedia();
  var h=here();
  if(h==="./hanh-trinh.html")journey();
  else if(h==="./phong-12a1.html")room();
  else if(h==="./tra-bai-cu.html")trabai();
  else if(h==="./luu-but.html")luubutStudio();
  if(document.getElementById("members")&&!document.getElementById("hero"))back();
  fab();
}
function start(){var n=0,t=setInterval(function(){boot();if(++n>12)clearInterval(t)},700)}
if(document.readyState==="complete")setTimeout(start,800);else addEventListener("load",function(){setTimeout(start,800)});
})();
