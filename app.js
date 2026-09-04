/* ===== AMKINA SCRIPT BLOCK 1 | id="amkina-artists-profile-link-v1" ===== */
/* ARTISTS cards use profiles.nickname/avatar_url when uploader_id exists. */
window.amkinaArtistProfiles = window.amkinaArtistProfiles || new Map();
async function amkinaLoadArtistProfiles(){
  const ids=[...new Set(amkinaArtistTracks().map(t=>t.uploader_id).filter(Boolean).map(String))];
  window.amkinaArtistProfiles=new Map();
  if(!ids.length)return;
  try{
    const filter="("+ids.map(encodeURIComponent).join(",")+")";
    const r=await fetch(SUPABASE_URL+"/rest/v1/profiles?id=in."+filter+"&select=id,nickname,avatar_url,bio,genres,social_url,updated_at",{headers:mpHeaders(false)});
    if(!r.ok)throw new Error(await r.text());
    const rows=await r.json();
    rows.forEach(p=>window.amkinaArtistProfiles.set(String(p.id),p));
  }catch(e){console.warn("ARTISTS 프로필 연동 실패",e);}
}
function amkinaArtistProfile(uid){return uid?window.amkinaArtistProfiles.get(String(uid))||null:null;}

/* ===== AMKINA SCRIPT BLOCK 2 | id="amkina-artists-script" ===== */
function amkinaArtistEscape(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function amkinaArtistTracks(){
 return (typeof tracks!=="undefined" && Array.isArray(tracks)?tracks:[]).filter(t=>t&&t.artist);
}
function amkinaArtistGroups(){
 const map=new Map();
 amkinaArtistTracks().forEach(t=>{
   const key=t.uploader_id ? "u:"+String(t.uploader_id) : "a:"+String(t.artist).trim().toLowerCase();
   if(!map.has(key))map.set(key,{key,name:String(t.artist||"Unknown Artist").trim(),uploader_id:t.uploader_id||null,tracks:[]});
   map.get(key).tracks.push(t);
 });
 return [...map.values()].map(a=>{
   a.plays=a.tracks.reduce((n,t)=>n+(Number(t.play_count)||0),0);
   a.likes=a.tracks.reduce((n,t)=>n+(Number(t._live_like_count ?? t.like_count ?? t.likes)||0),0);
   a.top=a.tracks.slice().sort((x,y)=>(Number(y.play_count)||0)-(Number(x.play_count)||0))[0]||null;
   a.cover=(a.top&&(a.top.cover_url||a.top.cover))||"";
   const profile=amkinaArtistProfile(a.uploader_id);
   if(profile){
     a.profile=profile;
     a.name=String(profile.nickname||a.name||"Unknown Artist").trim();
     a.avatar=profile.avatar_url||a.cover||"";
     a.bio=profile.bio||"";
     a.genres=profile.genres||"";
   }else{a.avatar=a.cover||"";}
   return a;
 }).sort((a,b)=>b.plays-a.plays||a.name.localeCompare(b.name,"ko"));
}
function renderArtistsPage(q=""){
 const grid=document.getElementById("artist-grid");if(!grid)return;
 const query=String(q||"").trim().toLowerCase();
 const groups=amkinaArtistGroups().filter(a=>!query||a.name.toLowerCase().includes(query));
 if(!groups.length){grid.innerHTML='<div class="artist-empty" style="grid-column:1/-1">표시할 아티스트가 없습니다.</div>';return;}
 grid.innerHTML=groups.map(a=>{
   const initial=amkinaArtistEscape(a.name.slice(0,1).toUpperCase());
   const avatar=a.avatar?'<img src="'+amkinaArtistEscape(a.avatar)+'" alt="">':initial;
   return '<article class="artist-card" onclick="openArtistDetail('+JSON.stringify(a.key).replace(/"/g,"&quot;")+')">'+
    '<div class="artist-avatar">'+avatar+'</div>'+
    '<div class="artist-name">'+amkinaArtistEscape(a.name)+'</div>'+
    '<div class="artist-handle">ARTIST</div>'+
    '<div class="artist-mini-stats"><div class="artist-mini-stat"><b>'+a.tracks.length+'</b><span>곡</span></div><div class="artist-mini-stat"><b>'+a.plays.toLocaleString()+'</b><span>재생</span></div><div class="artist-mini-stat"><b>'+a.likes.toLocaleString()+'</b><span>좋아요</span></div></div>'+
    '<div class="artist-top-song">대표곡 · <b>'+amkinaArtistEscape(a.top?.title||"-")+'</b></div></article>';
 }).join("");
}
function openArtistDetail(key){
 const a=amkinaArtistGroups().find(x=>x.key===key);if(!a)return;
 document.getElementById("artist-list-view")?.classList.add("hidden");
 const d=document.getElementById("artist-detail");d.classList.add("active");
 const initial=amkinaArtistEscape(a.name.slice(0,1).toUpperCase());
 const avatar=a.avatar?'<img src="'+amkinaArtistEscape(a.avatar)+'" alt="">':initial;
 const rows=a.tracks.slice().sort((x,y)=>(Number(y.play_count)||0)-(Number(x.play_count)||0)).map((t,i)=>
  '<div class="artist-track-row" onclick="amkinaPlayChartTrack('+JSON.stringify(String(t.id)).replace(/"/g,"&quot;")+')"><div>'+(i+1)+'</div><img class="artist-track-cover" src="'+amkinaArtistEscape(t.cover_url||t.cover||"")+'"><div><div class="artist-track-title">'+amkinaArtistEscape(t.title||"Untitled")+'</div><div class="artist-track-genre">'+amkinaArtistEscape(t.genre||"ORIGINAL")+'</div></div><div class="artist-track-stat">▷ '+(Number(t.play_count)||0).toLocaleString()+'</div><div class="artist-track-stat likes-stat">♡ '+(Number(t._live_like_count ?? t.like_count ?? t.likes)||0).toLocaleString()+'</div></div>'
 ).join("");
 d.innerHTML='<button class="artist-back" onclick="closeArtistDetail()">← 아티스트 목록</button><div class="artist-hero"><div class="artist-avatar">'+avatar+'</div><div><div class="artist-detail-name">'+amkinaArtistEscape(a.name)+'</div><div class="artist-detail-sub">AMKINA MUSIC ARTIST</div><div class="artist-detail-stats"><div><b>'+a.tracks.length+'</b><span>곡</span></div><div><b>'+a.plays.toLocaleString()+'</b><span>총 재생</span></div><div><b>'+a.likes.toLocaleString()+'</b><span>좋아요</span></div></div></div></div><div class="artist-track-list">'+rows+'</div>';
}
function closeArtistDetail(){document.getElementById("artist-detail")?.classList.remove("active");document.getElementById("artist-list-view")?.classList.remove("hidden");}
async function showArtistsPage(e){
 if(e)e.preventDefault();
 ["music","studio","community","chart100-page","mypage"].forEach(id=>{const x=document.getElementById(id);if(x)x.style.setProperty("display","none","important")});
 const p=document.getElementById("artists-page");if(p){p.style.setProperty("display","block","important");p.classList.add("active")}
 document.querySelectorAll(".amkina-sidebar-nav a").forEach(a=>a.classList.remove("menu-active"));
 document.getElementById("artists-nav")?.classList.add("menu-active");
 closeArtistDetail();

 // 직접 ARTISTS로 들어왔거나 데이터 로딩 전이라면 Supabase 음원을 먼저 불러온다.
 if((typeof tracks==="undefined" || !Array.isArray(tracks) || tracks.length===0) && typeof loadMusic==="function"){
   try{ await loadMusic(); }catch(err){ console.warn("아티스트용 음원 로딩 실패",err); }
 }
 await amkinaLoadArtistProfiles();
 renderArtistsPage(document.getElementById("artist-search")?.value||"");
 window.scrollTo({top:0,behavior:"smooth"});return false;
}

/* ===== AMKINA SCRIPT BLOCK 3 | id="amkina-artist-sort-ui-20260902" ===== */
document.addEventListener("DOMContentLoaded", function(){
  function installArtistSort(){
    const page = document.querySelector("#artists-page, .artists-page");
    const grid = document.querySelector("#artist-list, #artists-page .artists-grid, .artists-page .artists-grid");
    if(!page || !grid || page.querySelector(".amkina-artist-sort")) return;

    const tabs = page.querySelector(".artists-tabs");
    const bar = document.createElement("div");
    bar.className = "amkina-artist-sort";
    bar.innerHTML = `
      <span>정렬</span>
      <button type="button" data-sort="default" class="active">추천</button>
      <button type="button" data-sort="plays">재생</button>
      <button type="button" data-sort="likes">좋아요</button>
      <button type="button" data-sort="songs">곡 수</button>
    `;
    Object.assign(bar.style,{
      display:"flex",alignItems:"center",gap:"6px",overflowX:"auto",
      margin:"12px 0 16px",padding:"2px 0",fontSize:"11px",whiteSpace:"nowrap"
    });
    bar.querySelector("span").style.cssText="color:#999;font-weight:700;margin-right:2px";
    [...bar.querySelectorAll("button")].forEach(b=>{
      b.style.cssText="border:1px solid #e1e1df;background:#fff;color:#666;border-radius:999px;padding:7px 11px;font-weight:700;cursor:pointer";
    });
    (tabs || grid).insertAdjacentElement(tabs ? "afterend" : "beforebegin", bar);

    const original = [...grid.children];
    function nums(card){
      const values=[...card.querySelectorAll(".artist-stat strong")].map(x=>parseInt((x.textContent||"").replace(/[^0-9]/g,""),10)||0);
      return {songs:values[0]||0,plays:values[1]||0,likes:values[2]||0};
    }
    bar.addEventListener("click",e=>{
      const btn=e.target.closest("button[data-sort]");
      if(!btn) return;
      const mode=btn.dataset.sort;
      let cards=[...grid.children];
      if(mode==="default") cards=original.filter(x=>x.isConnected);
      else cards.sort((a,b)=>nums(b)[mode]-nums(a)[mode]);
      cards.forEach(c=>grid.appendChild(c));
      [...bar.querySelectorAll("button")].forEach(x=>{
        x.classList.toggle("active",x===btn);
        x.style.background=x===btn?"#111":"#fff";
        x.style.color=x===btn?"#fff":"#666";
        x.style.borderColor=x===btn?"#111":"#e1e1df";
      });
    });
  }
  installArtistSort();
  setTimeout(installArtistSort,700);
});

/* ===== AMKINA SCRIPT BLOCK 4 | id="amkina-sound-lab-v5-script" ===== */
(function(){
  // SAFE RULE: no MutationObserver, no Supabase changes, no track-render changes.
  document.addEventListener("DOMContentLoaded", function(){
    const audio = document.getElementById("audio") || document.querySelector("audio");
    const player = document.querySelector(".player");
    if(!audio || !player || document.getElementById("ak-sound-toggle")) return;

    const host = player.querySelector(".volume") || player.querySelector(".now") || player;
    const toggle = document.createElement("button");
    toggle.id="ak-sound-toggle";
    toggle.type="button";
    toggle.className="ak-sound-btn";
    toggle.textContent="SOUND";
    toggle.title="AMKINA SOUND";
    host.appendChild(toggle);

    const panel=document.createElement("div");
    panel.className="ak-sound-panel";
    panel.innerHTML=`
      <div class="ak-sound-head"><b>AMKINA SOUND</b><button class="ak-sound-close" type="button">×</button></div>
      <div class="ak-sound-label">LISTENING MODE</div>
      <div class="ak-sound-modes">
        <button class="ak-sound-mode active" data-mode="original">ORIGINAL</button>
        <button class="ak-sound-mode" data-mode="deep">DEEP</button>
        <button class="ak-sound-mode" data-mode="wide">WIDE</button>
        <button class="ak-sound-mode" data-mode="vocal">VOCAL</button>
        <button class="ak-sound-mode" data-mode="night">NIGHT</button>
      </div>
      <div class="ak-sound-label">EQ PRESET</div>
      <div class="ak-eq-presets">
        <button class="ak-eq-preset active" data-eq="flat">FLAT</button>
        <button class="ak-eq-preset" data-eq="bass">BASS</button>
        <button class="ak-eq-preset" data-eq="vocal">VOCAL</button>
        <button class="ak-eq-preset" data-eq="bright">BRIGHT</button>
        <button class="ak-eq-preset" data-eq="warm">WARM</button>
        <button class="ak-eq-preset" data-eq="club">CLUB</button>
      </div>
      <div class="ak-sound-note">플레이어에만 적용됩니다. 로그인·좋아요·차트·Supabase 로직은 변경하지 않습니다.</div>`;
    document.body.appendChild(panel);

    let ctx=null, source=null, low=null, mid=null, high=null, comp=null, panner=null;
    let initialized=false;

    function initAudio(){
      if(initialized) { if(ctx && ctx.state==="suspended") ctx.resume(); return true; }
      try{
        const AC=window.AudioContext||window.webkitAudioContext;
        if(!AC) return false;
        ctx=new AC();
        source=ctx.createMediaElementSource(audio);
        low=ctx.createBiquadFilter(); low.type="lowshelf"; low.frequency.value=180;
        mid=ctx.createBiquadFilter(); mid.type="peaking"; mid.frequency.value=1800; mid.Q.value=.8;
        high=ctx.createBiquadFilter(); high.type="highshelf"; high.frequency.value=6000;
        comp=ctx.createDynamicsCompressor();
        panner=ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        source.connect(low); low.connect(mid); mid.connect(high); high.connect(comp);
        if(panner){ comp.connect(panner); panner.connect(ctx.destination); }
        else comp.connect(ctx.destination);
        initialized=true;
        return true;
      }catch(e){
        console.warn("AMKINA SOUND unavailable:",e);
        return false;
      }
    }

    function setEQ(a,b,c){
      if(!initAudio()) return;
      low.gain.value=a; mid.gain.value=b; high.gain.value=c;
    }
    const eqs={
      flat:[0,0,0], bass:[6,-1,0], vocal:[-2,4,2],
      bright:[-1,1,5], warm:[3,1,-2], club:[5,-1,3]
    };
    const modes={
      original:{eq:[0,0,0],pan:0,threshold:-24,ratio:3},
      deep:{eq:[7,-1,-2],pan:0,threshold:-24,ratio:3},
      wide:{eq:[1,0,2],pan:0,threshold:-24,ratio:2.5},
      vocal:{eq:[-2,5,2],pan:0,threshold:-24,ratio:3},
      night:{eq:[2,1,-5],pan:0,threshold:-32,ratio:5}
    };

    function select(group,button){
      panel.querySelectorAll(group).forEach(x=>x.classList.remove("active"));
      button.classList.add("active");
    }

    panel.addEventListener("click",function(e){
      const mode=e.target.closest(".ak-sound-mode");
      const eq=e.target.closest(".ak-eq-preset");
      if(mode){
        const m=modes[mode.dataset.mode];
        setEQ(...m.eq);
        if(comp){comp.threshold.value=m.threshold;comp.ratio.value=m.ratio}
        if(panner) panner.pan.value=m.pan;
        select(".ak-sound-mode",mode);
      }
      if(eq){
        setEQ(...eqs[eq.dataset.eq]);
        select(".ak-eq-preset",eq);
      }
      if(e.target.closest(".ak-sound-close")){
        panel.classList.remove("open"); toggle.classList.remove("active");
      }
    });

    toggle.addEventListener("click",function(){
      initAudio();
      panel.classList.toggle("open");
      toggle.classList.toggle("active",panel.classList.contains("open"));
    });
  });
})();

/* ===== AMKINA SCRIPT BLOCK 5 | id="amkina-faq-script" ===== */
(function(){
  function hideFaq(){ var f=document.getElementById("amkina-faq-page"); if(f) f.style.display="none"; }
  window.hideFaqPage=function(){
    hideFaq();
    document.querySelectorAll(".amkina-home-notice").forEach(function(el){el.style.removeProperty("display");});
  };

  window.showFaqPage=function(event){
    if(event && event.preventDefault) event.preventDefault();

    ["music","studio","community","artists-page","chart100-page","mypage","library-page","amkina-home-flow","amkina-home-community-latest"].forEach(function(id){
      var el=document.getElementById(id);
      if(el) el.style.display="none";
    });
    document.querySelectorAll(".hero,.hero-slider").forEach(function(el){el.style.setProperty("display","none","important");});
    document.querySelectorAll(".amkina-home-notice").forEach(function(el){el.style.setProperty("display","none","important");});

    var faq=document.getElementById("amkina-faq-page");
    if(faq) faq.style.display="block";

    document.querySelectorAll("body > header nav a").forEach(function(a){a.classList.remove("menu-active");});
    document.getElementById("faq-nav")?.classList.add("menu-active");
    document.querySelector("body > header nav")?.classList.remove("mobile-open");
    window.scrollTo({top:0,behavior:"smooth"});
    return false;
  };

  document.addEventListener("click",function(e){
    var q=e.target.closest(".amkina-faq-q");
    if(q){
      var item=q.closest(".amkina-faq-item");
      if(item) item.classList.toggle("open");
      return;
    }
    var nav=e.target.closest("body > header nav a");
    if(nav && nav.id!=="faq-nav") window.hideFaqPage();
  },true);
})();

/* ===== AMKINA SCRIPT BLOCK 6 | no-id ===== */
const SUPABASE_URL =
"https://bbtzasddvodrprpnbeos.supabase.co";

const SUPABASE_ANON_KEY =
"sb_publishable_0xwgASnyXne6PdTKMbh6MQ_oleIl594";

const API =
SUPABASE_URL +
"/rest/v1/tracks?select=*&order=id.desc";


let tracks=[];
let currentIndex=-1;
let shuffleMode=false;

const audio =
document.getElementById("audio");

const playButton =
document.getElementById("main-play");

const progress =
document.getElementById("progress");

const volume =
document.getElementById("volume");


function safe(value){
  return value ?? "";
}


async function loadMusic(){

  const container =
    document.getElementById("music-list");

  try{

    const response =
      await fetch(API,{
        headers:{
          apikey:SUPABASE_ANON_KEY,
          Authorization:
            "Bearer " + SUPABASE_ANON_KEY
        }
      });

    if(!response.ok){
      throw new Error(
        "HTTP " + response.status
      );
    }

    tracks =
      await response.json();

    document.getElementById(
      "track-count"
    ).textContent =
      tracks.length + " RELEASES";

    container.innerHTML="";

    if(!tracks.length){

      container.innerHTML =
        '<div class="loading">등록된 음악이 없습니다.</div>';

      return;
    }


    tracks.forEach((track,index)=>{

      const card =
        document.createElement("article");

      card.className="track";
      card.dataset.originalIndex = String(index);
      card.dataset.artist = String(safe(track.artist) || "AMKINA").trim();
      card.dataset.genre = String(safe(track.genre) || "ORIGINAL").trim();
      card.dataset.plays = String(Number(track.play_count || 0));
      card.dataset.likes = String(Number(track.like_count || track.likes || 0));
      card.dataset.trackId = String(track.id ?? "");
      card.dataset.title = String(safe(track.title) || "Untitled").trim();
      card.dataset.isNew = index < 3 ? "1" : "0";

      card.innerHTML=`

        <div class="cover-wrap">

          ${index < 3 ? '<span class="amkina-new-badge">NEW</span>' : ''}
          ${track.is_adult ? '<span class="ak-content-badge ak-badge-adult">19+</span>' :
            (Array.isArray(track.content_warnings) && track.content_warnings.length ? '<span class="ak-content-badge ak-badge-warning">주의</span>' : '')}

          <img
            class="cover"
            src="${safe(track.cover_url)}"
            alt="${safe(track.title)}">

          <button
            class="play-circle"
            aria-label="Play">
            ▶
          </button>

        </div>

        <div class="info">

          <div class="track-title-row">
            <div class="title">
              ${safe(track.title) || "Untitled"}
            </div>
            <button class="track-edit-btn"
                    type="button"
                    data-edit-track="${String(track.id ?? "")}"
                    aria-label="곡 정보 수정"
                    title="곡 정보 수정">⋮</button>
          </div>

          <div class="artist">
            ${safe(track.artist) || "AMKINA"}
          </div>

          <div class="meta">
            ${safe(track.genre) || "ORIGINAL"}
            ${track.release_date
              ? " · " + track.release_date
              : ""}
          </div>

          <div class="track-stats" aria-label="트랙 통계">
            <span class="track-stat"><span class="stat-play">▷</span><span>${Number(track.play_count || 0).toLocaleString()}</span></span>
            <button type="button" class="track-stat track-like-btn" data-like-track="${String(track.id ?? "")}" aria-label="좋아요"
              onclick="event.preventDefault();event.stopPropagation();toggleTrackLike(this.dataset.likeTrack);return false;">
              <span class="stat-heart">♡</span><span class="like-count">${Number(track.like_count || track.likes || 0).toLocaleString()}</span>
            </button>
            <button type="button" class="track-stat track-comment-btn" data-comment-track="${String(track.id ?? "")}" aria-label="댓글"
              onclick="event.preventDefault();event.stopPropagation();openTrackComments(this.dataset.commentTrack);return false;">
              <span class="stat-comment">▢</span><span class="comment-count">${Number(track.comment_count || track.comments || 0).toLocaleString()}</span>
            </button>
          </div>

        </div>
      `;

      card.addEventListener("click",(e)=>{
        if(e.target.closest("button, a, input, textarea, select, .track-stats")){
          return;
        }
        playTrack(index);
      });

      container.appendChild(card);

    });

    container.querySelectorAll(".track-edit-btn").forEach(btn=>{
      const id=btn.dataset.editTrack;
      btn.style.display="inline-flex";
      btn.title="곡 메뉴";
      btn.setAttribute("aria-label","곡 메뉴");
      btn.addEventListener("click",(e)=>{
        e.preventDefault();
        e.stopPropagation();
        openTrackActionMenu(id,btn);
      });
    });

    if(typeof window.amkinaRefreshDiscovery === "function"){
      window.amkinaRefreshDiscovery();
    }

  }

  catch(error){

    console.error(error);

    container.innerHTML =
      '<div class="loading">음악을 불러오지 못했습니다.</div>';

  }

}


function playTrack(index){
  window.amkinaEndClip?.();

  if(!tracks[index]) return;

  currentIndex=index;

  const track=tracks[index];

  if(document.getElementById("track-full-page")?.classList.contains("open") && typeof renderTrackFullPage==="function") renderTrackFullPage(track);

  audio.src=track.audio_url;

  document.getElementById(
    "now-cover"
  ).src=track.cover_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='18' fill='%230b0b0c'/%3E%3Cpath d='M24 71V49M34 80V40M44 67V53M54 87V33M64 72V48M74 82V38M84 67V53M94 76V44' stroke='%23fff' stroke-width='3' stroke-linecap='round' opacity='.9'/%3E%3Ctext x='60' y='104' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='10' font-weight='700' letter-spacing='2'%3EAMKINA%3C/text%3E%3C/svg%3E";

  document.getElementById("now-cover").onerror=function(){
    this.onerror=null;
    this.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='18' fill='%230b0b0c'/%3E%3Cpath d='M24 71V49M34 80V40M44 67V53M54 87V33M64 72V48M74 82V38M84 67V53M94 76V44' stroke='%23fff' stroke-width='3' stroke-linecap='round' opacity='.9'/%3E%3Ctext x='60' y='104' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='10' font-weight='700' letter-spacing='2'%3EAMKINA%3C/text%3E%3C/svg%3E";
  };

  document.getElementById(
    "now-title"
  ).textContent=
    track.title || "Untitled";

  document.getElementById(
    "now-artist"
  ).textContent=
    track.artist || "AMKINA";

  if(typeof refreshLyricsButton==="function") refreshLyricsButton();
  if(typeof renderCompactLyrics==="function") renderCompactLyrics();

  audio.play();
fetch(SUPABASE_URL + "/rest/v1/rpc/increment_play_count", {
  method: "POST",
  headers: {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": "Bearer " + SUPABASE_ANON_KEY,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    track_id: track.id
  })
}).then(() => {
  track.play_count = (track.play_count || 0) + 1;
});
// 기간별 차트용 재생 이벤트 기록 (일간/주간)
fetch(SUPABASE_URL + "/rest/v1/play_events", {
  method:"POST",
  headers:{
    "apikey":SUPABASE_ANON_KEY,
    "Authorization":"Bearer "+SUPABASE_ANON_KEY,
    "Content-Type":"application/json",
    "Prefer":"return=minimal"
  },
  body:JSON.stringify({track_id:track.id})
}).catch(e=>console.warn("재생 이벤트 기록 실패",e));
}


function togglePlay(){

  if(currentIndex===-1){

    if(tracks.length){
      playTrack(0);
    }

    return;
  }

  if(audio.paused){
    audio.play();
  }else{
    audio.pause();
  }

}


function previousTrack(){
 if(window.amkinaHighlightStep?.(-1))return;

  if(!tracks.length) return;

  let next =
    currentIndex <= 0
      ? tracks.length-1
      : currentIndex-1;

  playTrack(next);

}


function nextTrack(){
 if(window.amkinaHighlightStep?.(1))return;

  if(!tracks.length) return;

  let next;

  if(shuffleMode && tracks.length > 1){
    do{
      next=Math.floor(Math.random()*tracks.length);
    }while(next===currentIndex);
  }else{
    next =
      currentIndex >= tracks.length-1
        ? 0
        : currentIndex+1;
  }

  playTrack(next);

}


function toggleShuffle(){

  shuffleMode=!shuffleMode;

  const btn=document.getElementById("shuffle-btn");

  if(btn){
    btn.classList.toggle("active",shuffleMode);
    btn.setAttribute("aria-pressed",shuffleMode ? "true" : "false");
    btn.title=shuffleMode ? "랜덤 재생 켜짐" : "랜덤 재생";
  }

}


function formatTime(seconds){

  if(!Number.isFinite(seconds)){
    return "0:00";
  }

  const m =
    Math.floor(seconds/60);

  const s =
    Math.floor(seconds%60)
      .toString()
      .padStart(2,"0");

  return m+":"+s;

}


audio.addEventListener(
  "play",
  ()=>{
    playButton.textContent="❚❚";
  }
);


audio.addEventListener(
  "pause",
  ()=>{
    playButton.textContent="▶";
  }
);


audio.addEventListener(
  "ended",
  nextTrack
);


audio.addEventListener(
  "timeupdate",
  ()=>{

    if(!audio.duration) return;

    const clip=window.amkinaClipRange;
    const start=clip?.start||0,end=clip?Math.min(clip.end,audio.duration):audio.duration;
    progress.value=Math.max(0,Math.min(100,(audio.currentTime-start)/(end-start)*100));

    document.getElementById(
      "current-time"
    ).textContent =
      formatTime(Math.max(0,audio.currentTime-start));

    document.getElementById(
      "duration-time"
    ).textContent =
      formatTime(end-start);

  }
);


progress.addEventListener(
  "input",
  ()=>{

    if(!audio.duration) return;

    const clip=window.amkinaClipRange,start=clip?.start||0;
    const end=clip?Math.min(clip.end,audio.duration):audio.duration;
    audio.currentTime=start+(progress.value/100)*(end-start);

  }
);


volume.addEventListener(
  "input",
  ()=>{
    audio.volume=volume.value;
  }
);


audio.volume=.8;

loadMusic();
// ===== AMKINA AUTH SESSION MANAGER =====
let amkinaAuthRefreshPromise=null;
function amkinaAuthGetSession(){try{return JSON.parse(localStorage.getItem("amkina_session")||"null")}catch(e){return null}}
function amkinaAuthSaveSession(data){
  const old=amkinaAuthGetSession()||{};
  const next={...old,...data};
  if(!next.refresh_token&&old.refresh_token)next.refresh_token=old.refresh_token;
  if(!next.user&&old.user)next.user=old.user;
  if(next.expires_in&&!next.expires_at)next.expires_at=Math.floor(Date.now()/1000)+Number(next.expires_in);
  localStorage.setItem("amkina_session",JSON.stringify(next));
  return next;
}
function amkinaAuthUpdateUI(){
  const s=amkinaAuthGetSession();
  const b=document.getElementById("login-btn");
  if(b)b.textContent=s?.access_token&&s?.user?.id?"LOGOUT":"LOGIN";
}
function amkinaAuthNeedsRefresh(s){
  if(!s?.access_token)return false;
  let exp=Number(s.expires_at||0);
  if(!exp){try{exp=JSON.parse(atob(s.access_token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).exp||0}catch(e){}}
  return !!exp && exp*1000-Date.now()<5*60*1000;
}
async function amkinaAuthRefresh(force=false){
  const s=amkinaAuthGetSession();
  if(!s?.refresh_token)return null;
  if(!force&&!amkinaAuthNeedsRefresh(s))return s;
  if(amkinaAuthRefreshPromise)return amkinaAuthRefreshPromise;
  amkinaAuthRefreshPromise=(async()=>{
    try{
      const r=await window.__amkinaNativeFetch(SUPABASE_URL+"/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:{apikey:SUPABASE_ANON_KEY,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:(amkinaAuthGetSession()||s).refresh_token})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||!d.access_token){
        if(r.status===400||r.status===401){localStorage.removeItem("amkina_session");amkinaAuthUpdateUI()}
        return null;
      }
      const saved=amkinaAuthSaveSession(d);amkinaAuthUpdateUI();return saved;
    }catch(e){console.warn("session refresh failed",e);return null}
    finally{amkinaAuthRefreshPromise=null}
  })();
  return amkinaAuthRefreshPromise;
}
async function amkinaAuthSignOut(){
  const s=amkinaAuthGetSession();
  try{if(s?.access_token)await window.__amkinaNativeFetch(SUPABASE_URL+"/auth/v1/logout",{method:"POST",headers:{apikey:SUPABASE_ANON_KEY,Authorization:"Bearer "+s.access_token}})}catch(e){}
  localStorage.removeItem("amkina_session");amkinaAuthUpdateUI();
  if(typeof loadMusic==="function")await loadMusic();
  alert("로그아웃되었습니다.");
}
window.__amkinaNativeFetch=window.__amkinaNativeFetch||window.fetch.bind(window);
window.fetch=async function(input,init={}){
  const url=typeof input==="string"?input:(input?.url||"");
  const isSb=typeof SUPABASE_URL!=="undefined"&&url.startsWith(SUPABASE_URL);
  const isAuth=url.includes("/auth/v1/");
  let opts={...init};
  if(isSb&&!isAuth){
    const before=amkinaAuthGetSession();
    if(before?.refresh_token&&amkinaAuthNeedsRefresh(before))await amkinaAuthRefresh(true);
    const fresh=amkinaAuthGetSession();
    if(fresh?.access_token&&opts.headers){const h=new Headers(opts.headers);if((h.get("Authorization")||"").startsWith("Bearer "))h.set("Authorization","Bearer "+fresh.access_token);opts.headers=h}
  }
  let r=await window.__amkinaNativeFetch(input,opts);
  if(isSb&&!isAuth&&r.status===401&&(amkinaAuthGetSession()?.refresh_token)){
    const fresh=await amkinaAuthRefresh(true);
    if(fresh?.access_token){const retry={...opts};const h=new Headers(retry.headers||{});if((h.get("Authorization")||"").startsWith("Bearer "))h.set("Authorization","Bearer "+fresh.access_token);retry.headers=h;r=await window.__amkinaNativeFetch(input,retry)}
  }
  return r;
};
setInterval(()=>{const s=amkinaAuthGetSession();if(s?.refresh_token&&amkinaAuthNeedsRefresh(s))amkinaAuthRefresh(true)},60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden){const s=amkinaAuthGetSession();if(s?.refresh_token&&amkinaAuthNeedsRefresh(s))amkinaAuthRefresh(true)}});
setTimeout(()=>{amkinaAuthUpdateUI();const s=amkinaAuthGetSession();if(s?.refresh_token&&amkinaAuthNeedsRefresh(s))amkinaAuthRefresh(true)},200);

// ===== LOGIN / SIGN UP =====

const loginBtn = document.getElementById("login-btn");
const authModal = document.getElementById("auth-modal");
const authClose = document.getElementById("auth-close");
const authMode = document.getElementById("auth-mode");
const authSubmit = document.getElementById("auth-submit");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authTitle = document.getElementById("auth-title");
const authMessage = document.getElementById("auth-message");
const authForgot = document.getElementById("auth-forgot");

let signupMode = false;

loginBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  const current = amkinaAuthGetSession();
  if(current?.access_token && current?.user?.id){
    await amkinaAuthSignOut();
    return;
  }
  authModal.style.display = "flex";
});

authClose.addEventListener("click", () => {
  authModal.style.display = "none";
});

authMode.addEventListener("click", () => {
  signupMode = !signupMode;

  authTitle.textContent = signupMode ? "SIGN UP" : "LOGIN";
  authSubmit.textContent = signupMode ? "SIGN UP" : "LOGIN";
  authMessage.textContent =
    signupMode ? "이미 계정이 있으신가요?" : "계정이 없으신가요?";
  authMode.textContent = signupMode ? "LOGIN" : "SIGN UP";
  if(authForgot) authForgot.style.display = signupMode ? "none" : "inline-block";
});

if(authForgot){
  authForgot.addEventListener("click", () => {
    const currentEmail=(authEmail.value||"").trim();
    authModal.style.display="none";
    const emailInput=document.getElementById("password-reset-email");
    if(emailInput) emailInput.value=currentEmail;
    document.getElementById("password-reset-request-modal").style.display="flex";
  });
}

authSubmit.addEventListener("click", async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password) {
    alert("이메일과 비밀번호를 입력해주세요.");
    return;
  }

  const endpoint = signupMode ? "signup" : "token?grant_type=password";
  const originalText = authSubmit.textContent;
  authSubmit.disabled = true;
  authSubmit.textContent = signupMode ? "가입 중..." : "로그인 중...";

  try {
    // 로그인 직전 오래된 로컬 세션을 비워 이전 JWT와 새 로그인이 섞이지 않게 한다.
    if(!signupMode) localStorage.removeItem("amkina_session");

    const response = await fetch(SUPABASE_URL + "/auth/v1/" + endpoint, {
      method: "POST",
      headers: {"apikey": SUPABASE_ANON_KEY,"Content-Type": "application/json"},
      body: JSON.stringify({email,password})
    });

    const data = await response.json().catch(()=>({}));

    if (!response.ok) {
      const raw = String(data.msg || data.error_description || data.message || "").toLowerCase();
      let message = data.msg || data.error_description || data.message || "로그인에 실패했습니다.";
      if(raw.includes("invalid login credentials")) message="이메일 또는 비밀번호가 맞지 않습니다. 비밀번호가 기억나지 않으면 비밀번호 찾기를 이용해주세요.";
      else if(raw.includes("email not confirmed")) message="이메일 인증이 아직 완료되지 않았습니다. 인증 메일을 확인해주세요.";
      else if(response.status===429) message="로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.";
      alert(message);
      return;
    }

    if (signupMode) {
      alert("회원가입 완료! 이메일 인증 메일을 확인해주세요.");
      signupMode = false;
      authTitle.textContent = "LOGIN";
      authSubmit.textContent = "LOGIN";
      authMessage.textContent = "계정이 없으신가요?";
      authMode.textContent = "SIGN UP";
    } else {
      amkinaAuthSaveSession(data);
      authPassword.value="";
      authModal.style.display = "none";
      amkinaAuthUpdateUI();
      if(typeof loadMusic==="function") await loadMusic();
      if(typeof refreshTrackSocial==="function") await refreshTrackSocial();
      alert("로그인되었습니다.");
    }
  } catch (error) {
    alert("서버 연결에 실패했습니다. 인터넷 연결을 확인한 뒤 다시 시도해주세요.");
    console.error(error);
  } finally {
    authSubmit.disabled = false;
    authSubmit.textContent = signupMode ? "SIGN UP" : "LOGIN";
  }
});
async function amkinaValidateMp3(file){
  if(!file || !/\.mp3$/i.test(file.name||'')) return 'MP3 파일만 업로드할 수 있습니다. 음원을 MP3로 변환한 뒤 선택해주세요.';
  if(!file.size) return '빈 파일은 업로드할 수 없습니다.';
  const mime=(file.type||'').toLowerCase().split(';')[0];
  if(mime && !['audio/mpeg','audio/mp3','audio/x-mp3','audio/mpeg3','audio/x-mpeg-3','application/octet-stream'].includes(mime)) return 'MP3 형식이 아닌 파일입니다. 확장자만 바꾸지 말고 MP3로 변환해주세요.';
  try{
    const bytes=new Uint8Array(await file.slice(0,4096).arrayBuffer());
    // Recognize an ID3v2 tag or a valid MPEG Layer III frame header.
    const id3=bytes.length>=10&&bytes[0]===73&&bytes[1]===68&&bytes[2]===51&&bytes[3]>=2&&bytes[3]<=4&&[6,7,8,9].every(i=>bytes[i]<128);
    let frame=false;
    for(let i=0;i+3<bytes.length;i++){
      const b=bytes[i+1],c=bytes[i+2];
      if(bytes[i]===255&&(b&224)===224&&((b>>3)&3)!==1&&((b>>1)&3)===1&&(c>>4)>0&&(c>>4)<15&&((c>>2)&3)!==3){frame=true;break;}
    }
    if(!id3&&!frame)return 'MP3 파일 형식을 확인할 수 없습니다. MP3로 다시 변환한 뒤 올려주세요.';
  }catch(e){return '파일을 읽지 못했습니다. 파일을 다시 선택해주세요.';}
  return '';
}

  async function uploadMusic(file) {
  const mp3Error=await amkinaValidateMp3(file);
  if(mp3Error){alert(mp3Error);return;}
  const session = JSON.parse(localStorage.getItem("amkina_session"));

  if (!session?.access_token || !session?.user?.id) {
    alert("먼저 로그인해주세요.");
    return;
  }

  const filePath = `${session.user.id}/${Date.now()}-${file.name}`;

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/music/${filePath}`,
    {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "audio/mpeg"
      },
      body: file
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(error);
    alert("음악 업로드 실패");
    return;
  }

  alert("음악 업로드 완료!");
  }
  async function uploadSelectedMusic() {
  const input = document.getElementById("music-file");
  const file = input.files[0];

  if (!file) {
    alert("음악 파일을 선택해주세요.");
    return;
  }

  await uploadMusic(file);
  }
 /* ===== STUDIO MUSIC UPLOAD ===== */

async function uploadStudioMusic(){

    const title = document.getElementById('studio-title').value.trim();
    const artist = document.getElementById('studio-artist').value.trim() || 'AMKINA';
    const genre = document.getElementById('studio-genre').value.trim() || 'ORIGINAL';
    const lyrics = document.getElementById('studio-lyrics').value.trim();
    const description = document.getElementById('studio-description').value.trim();
    const contentWarnings = [
      document.getElementById('studio-warning-explicit')?.checked ? 'explicit' : null,
      document.getElementById('studio-warning-violence')?.checked ? 'violence' : null,
      document.getElementById('studio-warning-disturbing')?.checked ? 'disturbing' : null
    ].filter(Boolean);
    const isAdult = !!document.getElementById('studio-warning-adult')?.checked;

    const audioInput = document.getElementById('studio-audio');
    const coverInput = document.getElementById('studio-cover');

    const audioFile = audioInput.files[0];
    const coverFile = coverInput.files[0];

    /* 입력 확인 */
    if(!title){
        alert('곡 제목을 입력해주세요.');
        return;
    }

    if(!audioFile){
        alert('음원 파일을 선택해주세요.');
        return;
    }

    if(!coverFile){
        alert('앨범 커버를 선택해주세요.');
        return;
    }

    const mp3Error=await amkinaValidateMp3(audioFile);
    if(mp3Error){alert(mp3Error);audioInput.value='';return;}

    /* 로그인 확인 */
    const session = JSON.parse(
        localStorage.getItem('amkina_session')
    );

    if(!session?.access_token || !session?.user?.id){
        alert('먼저 로그인해주세요.');
        return;
    }

    try{

        const userId = session.user.id;
        const timestamp = Date.now();

        /* =========================
           1. 음원 업로드
        ========================= */

   const audioExt = audioFile.name.split('.').pop().toLowerCase();
const audioPath = `${userId}/${timestamp}-audio.${audioExt}`;

        const audioResponse = await fetch(
            `${SUPABASE_URL}/storage/v1/object/music/${audioPath}`,
            {
                method:'POST',

                headers:{
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization':
                        `Bearer ${session.access_token}`,
                    'Content-Type': 'audio/mpeg'
                },

                body:audioFile
            }
        );

        if(!audioResponse.ok){
            const error = await audioResponse.text();
            console.error(error);
            throw new Error('음원 업로드 실패');
        }

        /* =========================
           2. 커버 업로드
        ========================= */
      
const coverExt = coverFile.name.split('.').pop().toLowerCase();
const coverPath = `${userId}/${timestamp}-cover.${coverExt}`;

        const coverResponse = await fetch(
            `${SUPABASE_URL}/storage/v1/object/covers/${coverPath}`,
            {
                method:'POST',

                headers:{
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization':
                        `Bearer ${session.access_token}`,
                    'Content-Type': coverFile.type
                },

                body:coverFile
            }
        );

        if(!coverResponse.ok){
            const error = await coverResponse.text();
            console.error(error);
            throw new Error('커버 업로드 실패');
        }

        /* =========================
           3. Public URL 생성
        ========================= */

        const audioUrl =
            `${SUPABASE_URL}/storage/v1/object/public/music/${audioPath}`;

        const coverUrl =
            `${SUPABASE_URL}/storage/v1/object/public/covers/${coverPath}`;

        /* =========================
           4. tracks 테이블 등록
        ========================= */

        const trackResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/tracks`,
            {
                method:'POST',

                headers:{
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization':
                        `Bearer ${session.access_token}`,
                    'Content-Type':'application/json',
                    'Prefer':'return=representation'
                },

                body:JSON.stringify({
                    title:title,
                    artist:artist,
                    genre:genre,
                    description:description,
                    lyrics:lyrics,
                    content_warnings:contentWarnings,
                    is_adult:isAdult,
                    audio_url:audioUrl,
                    cover_url:coverUrl,
                    release_date:
                        new Date().toISOString().slice(0,10),
                    uploader_id:userId,
                    highlight_enabled: document.getElementById('studio-highlight-enabled')?.checked ?? true,
                    highlight_start: Math.max(0, Number(document.getElementById('studio-highlight-start')?.value || 0)),
                    highlight_end: Math.max(5, Number(document.getElementById('studio-highlight-end')?.value || 25))
                })
            }
        );

        if(!trackResponse.ok){
            const error = await trackResponse.text();
            console.error(error);
            throw new Error('곡 정보 등록 실패');
        }

        alert('음악 등록 완료!');

        /* 입력창 초기화 */

        document.getElementById('studio-title').value = '';
        document.getElementById('studio-genre').value = '';
        document.getElementById('studio-description').value = '';
        document.getElementById('studio-lyrics').value = '';
        ['studio-warning-explicit','studio-warning-violence','studio-warning-disturbing','studio-warning-adult'].forEach(id=>{
          const el=document.getElementById(id); if(el)el.checked=false;
        });

        audioInput.value = '';
        coverInput.value = '';

        /* MUSIC 목록 새로 불러오기 */

        if(typeof loadTracks === 'function'){
            await loadTracks();
        }

    }catch(error){

        console.error(error);

        alert(
            '업로드 중 문제가 발생했습니다.\n' +
            error.message
        );
    }
}

/* ===== AMKINA SCRIPT BLOCK 7 | no-id ===== */


/* ===== AMKINA SCRIPT BLOCK 8 | no-id ===== */
/* ===== AMKINA HERO AUTO SLIDER ===== */

document.addEventListener("DOMContentLoaded", function(){

  const slides = document.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-dot");

  if(slides.length === 0) return;

  let currentSlide = 0;
  let sliderTimer;

  function showSlide(index){

    slides.forEach(function(slide){
      slide.classList.remove("active");
    });

    dots.forEach(function(dot){
      dot.classList.remove("active");
    });

    currentSlide = index;

    slides[currentSlide].classList.add("active");

    if(dots[currentSlide]){
      dots[currentSlide].classList.add("active");
    }
  }

  function nextSlide(){
    let next = currentSlide + 1;

    if(next >= slides.length){
      next = 0;
    }

    showSlide(next);
  }

  function startSlider(){
    clearInterval(sliderTimer);
    sliderTimer = setInterval(nextSlide, 3000);
  }

  dots.forEach(function(dot, index){
    dot.addEventListener("click", function(){
      showSlide(index);
      startSlider();
    });
  });

  showSlide(0);
  startSlider();

});

/* ===== AMKINA SCRIPT BLOCK 9 | no-id ===== */
function setActiveMenu(clickedMenu){
    document.querySelectorAll('body > header nav a').forEach(function(item){
        item.classList.remove('menu-active');
    });

    if(clickedMenu){
        clickedMenu.classList.add('menu-active');
    }
}


/* =========================
   HOME
========================= */

function showHomePage(event){
    if(event) event.preventDefault();

    setActiveMenu(event ? event.currentTarget : null);

    const hero = document.querySelector('.hero');
    const studio = document.getElementById('studio');
    const musicSection =
        document.getElementById('music') ||
        document.querySelector('.music-grid');

    if(hero){
        hero.style.setProperty('display', 'flex', 'important');
    }

    if(musicSection){
        const container =
            musicSection.closest('section') ||
            musicSection.parentElement;

        if(container){
            container.style.display = '';
        }
    }

    if(studio){
        studio.style.display = 'none';
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/* =========================
   MUSIC
========================= */

function showMusicPage(event){
    event.preventDefault();

     setActiveMenu(event.currentTarget);

    const hero = document.querySelector('.hero');
    const music = document.getElementById('music');
  const studio = document.getElementById('studio');

  // MUSIC에서는 스튜디오 숨김
if(studio){
    studio.style.display = 'none';
}

    // MUSIC에서는 메인 배너 완전히 숨김
    if(hero){
   hero.style.setProperty('display', 'none', 'important');
    }

    // 음악 영역 표시
    if(music){
        music.style.display = 'block';
    }
closeMobileMenu();
    // 화면 맨 위로 이동
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
  /* ===== STUDIO ===== */
function showStudioPage(event){
    if(event){
        event.preventDefault();
        event.stopPropagation();
    }

    const hero = document.querySelector('.hero');
    const music = document.getElementById('music');
    const studio = document.getElementById('studio');

    if(!studio){
        alert('STUDIO 영역을 찾을 수 없습니다.');
        return false;
    }

    // 홈 배너 숨기기
    if(hero){
        hero.style.setProperty('display', 'none', 'important');
    }

    // MUSIC 숨기기
    if(music){
        music.style.setProperty('display', 'none', 'important');
    }

    // STUDIO 강제 표시
    studio.style.setProperty('display', 'block', 'important');
    studio.style.setProperty('visibility', 'visible', 'important');
    studio.style.setProperty('opacity', '1', 'important');

    // 모바일 메뉴 닫기
    const nav = document.querySelector('header nav');
if(nav){
    nav.classList.remove('mobile-open');
}

    // 맨 위로
    window.scrollTo(0, 0);

    return false;
}
  /* ===== MUSIC SEARCH ===== */

const musicSearch = document.getElementById('music-search');

if(musicSearch){
    musicSearch.addEventListener('input', function(){

        const keyword = this.value.trim().toLowerCase();

        document.querySelectorAll('#music-list .track').forEach(function(card){

            const title =
                card.querySelector('.title')?.textContent.toLowerCase() || '';

            const artist =
                card.querySelector('.artist')?.textContent.toLowerCase() || '';

            const match =
                title.includes(keyword) ||
                artist.includes(keyword);

            card.style.display = match ? '' : 'none';
        });
    });
}
  /* ===== MOBILE MENU ===== */
function toggleMobileMenu(){
    const nav = document.querySelector('header nav');

    if(nav){
        nav.classList.toggle('mobile-open');
    }
}

/* ===== AMKINA SCRIPT BLOCK 10 | no-id ===== */
document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.querySelector(".mobile-menu-btn");
    const nav = document.querySelector("body > header nav");

    if (!menuBtn || !nav) return;

    menuBtn.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();

        nav.classList.toggle("mobile-open");

        if (nav.classList.contains("mobile-open")) {
            menuBtn.textContent = "×";
        } else {
            menuBtn.textContent = "☰";
        }
    });
});
function closeMobileMenu(){

    const nav = document.querySelector("body > header nav");
    const menuBtn = document.querySelector(".mobile-menu-btn");

    if(nav){
        nav.classList.remove("mobile-open");
        nav.style.removeProperty("display");
    }

    if(menuBtn){
        menuBtn.textContent = "☰";
    }
}

/* ===== AMKINA SCRIPT BLOCK 11 | no-id ===== */
document.addEventListener("DOMContentLoaded", function () {

    const slides = document.querySelectorAll(".hero-slider .hero-slide");
    const dots = document.querySelectorAll(".hero-slider .hero-dot");

    if (slides.length < 2) return;

    let currentSlide = 0;

    function showHeroSlide(index) {

        slides.forEach(function(slide) {
            slide.classList.remove("active");
        });

        dots.forEach(function(dot) {
            dot.classList.remove("active");
        });

        slides[index].classList.add("active");

        if (dots[index]) {
            dots[index].classList.add("active");
        }

        currentSlide = index;
    }

    /* 점 누르면 해당 배너로 이동 */
    dots.forEach(function(dot, index) {
        dot.addEventListener("click", function() {
            showHeroSlide(index);
        });
    });

    /* 3초마다 자동 전환 */
    setInterval(function() {

        let nextSlide = currentSlide + 1;

        if (nextSlide >= slides.length) {
            nextSlide = 0;
        }

        showHeroSlide(nextSlide);

    }, 3000);

});

/* ===== AMKINA SCRIPT BLOCK 12 | id="amkina-community-script" ===== */
let communityPosts=[];
let communityFilter="all";

function amkinaSession(){
  try{return JSON.parse(localStorage.getItem("amkina_session")||"null")}catch(e){return null}
}
function communityHeaders(auth=false){
  const s=amkinaSession();
  const h={"apikey":SUPABASE_ANON_KEY,"Content-Type":"application/json"};
  h.Authorization="Bearer "+(auth && s?.access_token ? s.access_token : SUPABASE_ANON_KEY);
  return h;
}
function escapeCommunity(v=""){
  return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}
function communityCategory(v){
  return ({music:"음악 이야기",feedback:"피드백",free:"자유"})[v]||"자유";
}
function communityDate(v){
  if(!v)return "";
  return new Date(v).toLocaleString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});
}

function showCommunityPage(event){
  if(event) event.preventDefault();
  const music=document.getElementById("music");
  const studio=document.getElementById("studio");
  const community=document.getElementById("community");
  const hero=document.querySelector(".hero");
  if(music) music.style.display="none";
  if(studio) studio.style.display="none";
  if(hero) hero.style.display="none";
  if(community) community.style.display="block";
  document.querySelectorAll("body > header nav a").forEach(a=>a.classList.remove("menu-active"));
  document.getElementById("community-nav")?.classList.add("menu-active");
  document.querySelector("body > header nav")?.classList.remove("mobile-open");
  window.scrollTo({top:0,behavior:"smooth"});
  loadCommunityPosts();
}

async function loadCommunityPosts(){
  const list=document.getElementById("community-list");
  if(!list)return;
  list.innerHTML='<div class="community-empty">게시글을 불러오는 중...</div>';
  try{
    const r=await fetch(SUPABASE_URL+"/rest/v1/community_posts?select=*&order=created_at.desc&limit=100",{headers:communityHeaders(false)});
    if(!r.ok) throw new Error("HTTP "+r.status);
    communityPosts=await r.json();
    renderCommunityPosts();
  }catch(e){
    console.error(e);
    list.innerHTML='<div class="community-empty">커뮤니티 DB 연결이 필요합니다.<br>함께 드린 SQL을 Supabase에서 한 번 실행해주세요.</div>';
  }
}

function renderCommunityPosts(){
  const list=document.getElementById("community-list");
  const q=(document.getElementById("community-search")?.value||"").trim().toLowerCase();
  const rows=communityPosts.filter(p=>{
    const filterOk=communityFilter==="all"||p.category===communityFilter;
    const searchOk=!q||String(p.title||"").toLowerCase().includes(q)||String(p.content||"").toLowerCase().includes(q);
    return filterOk&&searchOk;
  });
  if(!rows.length){list.innerHTML='<div class="community-empty">아직 게시글이 없습니다. 첫 글을 남겨보세요.</div>';return}
  list.innerHTML=rows.map(p=>`
    <article class="community-post" onclick="openCommunityDetail('${p.id}')">
      <div class="community-cat">${escapeCommunity(communityCategory(p.category))}</div>
      <div>
        <div class="community-post-title">${escapeCommunity(p.title)}</div>
        <div class="community-post-preview">${escapeCommunity(p.content)}</div>
      </div>
      <div class="community-meta">${escapeCommunity(p.author_name||"AMKINA USER")}<br>${communityDate(p.created_at)}</div>
    </article>`).join("");
}

function openCommunityComposer(){
  const s=amkinaSession();
  if(!s?.access_token||!s?.user?.id){
    alert("커뮤니티 글 작성은 로그인이 필요합니다.");
    document.getElementById("auth-modal").style.display="flex";
    return;
  }
  document.getElementById("community-compose-modal").style.display="flex";
}
function closeCommunityComposer(){document.getElementById("community-compose-modal").style.display="none"}

async function submitCommunityPost(){
  const s=amkinaSession();
  if(!s?.access_token||!s?.user?.id){alert("다시 로그인해주세요.");return}
  const title=document.getElementById("community-title").value.trim();
  const content=document.getElementById("community-content").value.trim();
  const category=document.getElementById("community-category").value;
  if(title.length<2||content.length<2){alert("제목과 내용을 입력해주세요.");return}
  const status=document.getElementById("community-compose-status");
  status.textContent="게시 중...";
  try{
    const r=await fetch(SUPABASE_URL+"/rest/v1/community_posts",{
      method:"POST",headers:{...communityHeaders(true),"Prefer":"return=representation"},
      body:JSON.stringify({
        user_id:s.user.id,
        author_name:(s.user.email||"AMKINA USER").split("@")[0],
        category,title,content
      })
    });
    if(!r.ok) throw new Error(await r.text());
    document.getElementById("community-title").value="";
    document.getElementById("community-content").value="";
    closeCommunityComposer();
    await loadCommunityPosts();
  }catch(e){console.error(e);alert("게시글 등록에 실패했습니다. Supabase SQL/RLS 설정을 확인해주세요.")}
  finally{status.textContent=""}
}

let currentCommunityPostId=null;
let communityComments=[];

async function openCommunityDetail(id){
  const p=communityPosts.find(x=>String(x.id)===String(id));
  if(!p)return;

  currentCommunityPostId=String(p.id);
  const s=amkinaSession();
  const mine=s?.user?.id===p.user_id;

  document.getElementById("community-detail").innerHTML=`
    <div class="community-detail-category">${escapeCommunity(communityCategory(p.category))}</div>
    <h2 class="community-detail-title">${escapeCommunity(p.title)}</h2>
    <div class="community-detail-meta">${escapeCommunity(p.author_name||"AMKINA USER")} · ${communityDate(p.created_at)}</div>
    <div class="community-detail-content">${escapeCommunity(p.content)}</div>
    ${mine?`<button class="community-delete" onclick="deleteCommunityPost('${p.id}')">내 글 삭제</button>`:""}

    <section class="community-comments">
      <div class="community-comments-head">
        <strong>댓글</strong>
        <span id="community-comment-count">0</span>
      </div>

      ${s?.access_token && s?.user?.id ? `
        <div class="community-comment-compose">
          <textarea id="community-comment-input" maxlength="1000" placeholder="댓글을 입력해주세요."></textarea>
          <button id="community-comment-submit" class="community-comment-submit"
                  type="button" onclick="submitCommunityComment()">등록</button>
        </div>
      ` : `
        <div class="community-comment-login">
          댓글을 작성하려면
          <button type="button" onclick="openCommunityLogin()">로그인</button>
          해주세요.
        </div>
      `}

      <div id="community-comment-list" class="community-comment-list">
        <div class="community-comment-empty">댓글을 불러오는 중...</div>
      </div>
    </section>
  `;

  document.getElementById("community-detail-modal").style.display="flex";
  await loadCommunityComments(currentCommunityPostId);
}

function closeCommunityDetail(){
  document.getElementById("community-detail-modal").style.display="none";
  currentCommunityPostId=null;
  communityComments=[];
}

function openCommunityLogin(){
  document.getElementById("community-detail-modal").style.display="none";
  document.getElementById("auth-modal").style.display="flex";
}

async function loadCommunityComments(postId){
  const list=document.getElementById("community-comment-list");
  if(!list)return;

  try{
    const url=SUPABASE_URL+"/rest/v1/community_comments?post_id=eq."
      +encodeURIComponent(String(postId))
      +"&select=*&order=created_at.asc";

    const r=await fetch(url,{headers:communityHeaders(false)});
    if(!r.ok)throw new Error(await r.text());

    communityComments=await r.json();
    renderCommunityComments();
  }catch(e){
    console.error("댓글 불러오기 실패:",e);
    list.innerHTML='<div class="community-comment-empty">댓글을 불러오지 못했습니다.<br>Supabase 댓글 SQL을 먼저 실행해주세요.</div>';
  }
}

function renderCommunityComments(){
  const list=document.getElementById("community-comment-list");
  const count=document.getElementById("community-comment-count");
  if(!list)return;

  if(count)count.textContent=communityComments.length.toLocaleString();

  if(!communityComments.length){
    list.innerHTML='<div class="community-comment-empty">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</div>';
    return;
  }

  const s=amkinaSession();

  list.innerHTML=communityComments.map(c=>{
    const mine=s?.user?.id===c.user_id;
    return `
      <div class="community-comment">
        <div class="community-comment-top">
          <span class="community-comment-author">${escapeCommunity(c.author_name||"AMKINA USER")}</span>
          <span class="community-comment-date">${communityDate(c.created_at)}</span>
          ${mine?`<button type="button" class="community-comment-delete"
                   onclick="deleteCommunityComment('${c.id}')">삭제</button>`:""}
        </div>
        <div class="community-comment-body">${escapeCommunity(c.content||"")}</div>
      </div>
    `;
  }).join("");
}

async function submitCommunityComment(){
  const s=amkinaSession();
  if(!s?.access_token||!s?.user?.id){
    alert("댓글 작성은 로그인이 필요합니다.");
    openCommunityLogin();
    return;
  }
  if(!currentCommunityPostId)return;

  const input=document.getElementById("community-comment-input");
  const button=document.getElementById("community-comment-submit");
  const content=(input?.value||"").trim();

  if(!content){
    alert("댓글을 입력해주세요.");
    input?.focus();
    return;
  }

  if(button)button.disabled=true;

  try{
    const r=await fetch(SUPABASE_URL+"/rest/v1/community_comments",{
      method:"POST",
      headers:{...communityHeaders(true),"Prefer":"return=representation"},
      body:JSON.stringify({
        post_id:String(currentCommunityPostId),
        user_id:s.user.id,
        author_name:(s.user.email||"AMKINA USER").split("@")[0],
        content:content
      })
    });

    if(!r.ok)throw new Error(await r.text());

    if(input)input.value="";
    await loadCommunityComments(currentCommunityPostId);
  }catch(e){
    console.error("댓글 등록 실패:",e);
    alert("댓글 등록에 실패했습니다. Supabase 댓글 SQL/RLS 설정을 확인해주세요.");
  }finally{
    if(button)button.disabled=false;
  }
}

async function deleteCommunityComment(id){
  const s=amkinaSession();
  if(!s?.access_token||!s?.user?.id)return;
  if(!confirm("이 댓글을 삭제할까요?"))return;

  try{
    const r=await fetch(
      SUPABASE_URL+"/rest/v1/community_comments?id=eq."+encodeURIComponent(id),
      {method:"DELETE",headers:communityHeaders(true)}
    );
    if(!r.ok)throw new Error(await r.text());
    await loadCommunityComments(currentCommunityPostId);
  }catch(e){
    console.error("댓글 삭제 실패:",e);
    alert("댓글을 삭제하지 못했습니다.");
  }
}

async function deleteCommunityPost(id){
  if(!confirm("이 게시글을 삭제할까요?"))return;
  try{
    const r=await fetch(SUPABASE_URL+"/rest/v1/community_posts?id=eq."+encodeURIComponent(id),{method:"DELETE",headers:communityHeaders(true)});
    if(!r.ok) throw new Error(await r.text());
    closeCommunityDetail(); await loadCommunityPosts();
  }catch(e){console.error(e);alert("삭제하지 못했습니다.")}
}

document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll(".community-filter").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".community-filter").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active"); communityFilter=btn.dataset.filter; renderCommunityPosts();
  }));
  document.getElementById("community-search")?.addEventListener("input",renderCommunityPosts);
});
  /* =====================================================
   AMKINA PAGE SWITCH FIX
   페이지 중복 표시 완전 방지
===================================================== */

function hideAllAmkinaPages() {

    // HOME
    const hero = document.querySelector(".hero");
    const heroSlider = document.querySelector(".hero-slider");
    const music = document.getElementById("music");

    if (hero) hero.style.display = "none";
    if (heroSlider) heroSlider.style.display = "none";
    if (music) music.style.display = "none";

    // STUDIO
    const studio = document.getElementById("studio");
    if (studio) studio.style.display = "none";

    // COMMUNITY
    const community = document.getElementById("community");
    if (community) community.style.display = "none";

}


/* ================= HOME ================= */

window.showHomePage = function(event) {

    if (event) event.preventDefault();

    hideAllAmkinaPages();

    const hero = document.querySelector(".hero");
    const heroSlider = document.querySelector(".hero-slider");
    const music = document.getElementById("music");

    if (hero) hero.style.display = "";
    if (heroSlider) heroSlider.style.display = "";
    if (music) music.style.display = "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};


/* ================= MUSIC ================= */

window.showMusicPage = function(event) {

    if (event) event.preventDefault();

    hideAllAmkinaPages();

    const music = document.getElementById("music");

    if (music) {
        music.style.display = "";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};


/* ================= STUDIO ================= */

window.showStudioPage = function(event) {
    if (event) event.preventDefault();

    // 커뮤니티 강제 종료
    const community = document.getElementById("community");
    if (community) {
        community.style.setProperty("display", "none", "important");
        community.classList.remove("active");
    }

    // 홈/음악 화면 종료
    const hero = document.querySelector(".hero");
    const heroSlider = document.querySelector(".hero-slider");
    const music = document.getElementById("music");

    if (hero) hero.style.setProperty("display", "none", "important");
    if (heroSlider) heroSlider.style.setProperty("display", "none", "important");
    if (music) music.style.setProperty("display", "none", "important");

    // 스튜디오만 표시
    const studio = document.getElementById("studio");

    if (studio) {
        studio.style.setProperty("display", "block", "important");
        studio.classList.add("active");
    }

    window.scrollTo(0, 0);
};
/* ================= COMMUNITY ================= */

window.showCommunityPage = function(event) {

    if (event) event.preventDefault();

    hideAllAmkinaPages();

    const community = document.getElementById("community");

    if (community) {
        community.style.display = "block";
    }

    // 기존 커뮤니티 게시글 불러오기 함수가 있으면 실행
    if (typeof loadCommunityPosts === "function") {
        loadCommunityPosts();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
};

/* ===== AMKINA SCRIPT BLOCK 13 | id="amkina-discovery-filter-js" ===== */
(function(){
  let activeFilter = "all";

  function norm(v){
    return String(v || "").trim().toLowerCase();
  }

  function cards(){
    return Array.from(document.querySelectorAll("#music-list .track"));
  }

  function uniqueSorted(values){
    return [...new Set(values.filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b, "ko"));
  }

  function rebuildSelect(select, values, allLabel){
    if(!select) return;
    const previous = select.value;
    select.innerHTML = '<option value="all">' + allLabel + '</option>';
    values.forEach(value=>{
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
    if(Array.from(select.options).some(o=>o.value === previous)){
      select.value = previous;
    }
  }

  function applyDiscovery(){
    const list = document.getElementById("music-list");
    if(!list) return;

    const genre = document.getElementById("amkina-genre-filter")?.value || "all";
    const artist = document.getElementById("amkina-artist-filter")?.value || "all";
    const sort = document.getElementById("amkina-sort-filter")?.value || "latest";
    const keyword = norm(document.getElementById("music-search")?.value);

    let allCards = cards();

    allCards.forEach(card=>{
      const title = norm(card.dataset.title || card.querySelector(".title")?.textContent);
      const cardArtist = card.dataset.artist || "";
      const cardGenre = card.dataset.genre || "";
      const plays = Number(card.dataset.plays || 0);
      const isNew = card.dataset.isNew === "1";

      let show = true;

      if(activeFilter === "popular"){
        // 인기 탭은 전체 곡 중 상위 재생 곡을 보여주되,
        // 장르/아티스트/검색 조건은 그대로 함께 적용합니다.
        show = plays > 0;
      }else if(activeFilter === "new"){
        show = isNew;
      }

      if(genre !== "all" && cardGenre !== genre) show = false;
      if(artist !== "all" && cardArtist !== artist) show = false;
      if(keyword && !(title.includes(keyword) || norm(cardArtist).includes(keyword))) show = false;

      card.classList.toggle("amkina-hidden", !show);
      if(show){
        card.classList.remove("amkina-filter-pop");
        void card.offsetWidth;
        card.classList.add("amkina-filter-pop");
      }
    });

    let ordered = cards();
    ordered.sort((a,b)=>{
      if(activeFilter === "popular" || sort === "popular"){
        return Number(b.dataset.plays || 0) - Number(a.dataset.plays || 0);
      }
      if(sort === "likes"){
        return Number(b.dataset.likes || 0) - Number(a.dataset.likes || 0);
      }
      if(sort === "title"){
        return String(a.dataset.title || "").localeCompare(String(b.dataset.title || ""), "ko");
      }
      return Number(a.dataset.originalIndex || 0) - Number(b.dataset.originalIndex || 0);
    });
    ordered.forEach(card=>list.appendChild(card));

    const visible = ordered.filter(card=>!card.classList.contains("amkina-hidden")).length;
    const result = document.getElementById("amkina-filter-result");
    if(result){
      const labels = [];
      if(activeFilter === "popular") labels.push("인기");
      if(activeFilter === "new") labels.push("NEW");
      if(genre !== "all") labels.push(genre);
      if(artist !== "all") labels.push(artist);
      result.textContent = labels.length
        ? labels.join(" · ") + "  /  " + visible + "곡"
        : "";
    }
  }

  window.amkinaRefreshDiscovery = function(){
    const allCards = cards();
    rebuildSelect(
      document.getElementById("amkina-genre-filter"),
      uniqueSorted(allCards.map(c=>c.dataset.genre)),
      "모든 장르"
    );
    rebuildSelect(
      document.getElementById("amkina-artist-filter"),
      uniqueSorted(allCards.map(c=>c.dataset.artist)),
      "모든 아티스트"
    );
    applyDiscovery();
  };

  document.addEventListener("click", function(e){
    const btn = e.target.closest(".amkina-filter-btn");
    if(!btn) return;

    document.querySelectorAll(".amkina-filter-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter || "all";
    applyDiscovery();
  });

  ["amkina-genre-filter","amkina-artist-filter","amkina-sort-filter"].forEach(id=>{
    document.addEventListener("change", function(e){
      if(e.target && e.target.id === id) applyDiscovery();
    });
  });

  // 기존 검색 기능과 충돌하지 않도록 캡처 단계에서 같은 필터 엔진을 다시 적용.
  document.addEventListener("input", function(e){
    if(e.target && e.target.id === "music-search"){
      setTimeout(applyDiscovery, 0);
    }
  });

  // loadMusic 완료 전/후 어느 경우에도 작동.
  document.addEventListener("DOMContentLoaded", function(){
    setTimeout(function(){
      if(cards().length) window.amkinaRefreshDiscovery();
    }, 500);
  });
})();

/* ===== AMKINA SCRIPT BLOCK 14 | id="amkina-track-edit-script" ===== */
let amkinaEditingTrackId=null;

function amkinaGetSession(){
  try{return JSON.parse(localStorage.getItem("amkina_session")||"null")}catch(e){return null}
}
function amkinaTrackHeaders(auth=true){
  const s=amkinaGetSession();
  const h={"apikey":SUPABASE_ANON_KEY,"Content-Type":"application/json"};
  h.Authorization="Bearer "+(auth && s?.access_token ? s.access_token : SUPABASE_ANON_KEY);
  return h;
}
function openTrackEdit(id){
  const s=amkinaGetSession();
  const track=tracks.find(t=>String(t.id)===String(id));
  if(!s?.user?.id){alert("로그인이 필요합니다.");return}
  if(!track){alert("곡 정보를 찾지 못했습니다.");return}
  const isAdmin=String(s.user.email||"").toLowerCase()==="psy88all@naver.com".toLowerCase();
  const mine=!!(track.uploader_id && String(track.uploader_id)===String(s.user.id));
  if(!isAdmin && !mine){
    alert("본인이 업로드한 곡만 수정할 수 있습니다.");
    return;
  }
  amkinaEditingTrackId=String(id);
  document.getElementById("track-edit-title").value=track.title||"";
  document.getElementById("track-edit-artist").value=track.artist||"";
  document.getElementById("track-edit-genre").value=track.genre||"";
  document.getElementById("track-edit-lyrics").value=track.lyrics||"";
  document.getElementById("track-edit-cover").value="";
  document.getElementById("track-edit-status").textContent="";
  const modal=document.getElementById("track-edit-modal");
  modal.style.display="flex";
  modal.setAttribute("aria-hidden","false");
}
function closeTrackEdit(){
  const modal=document.getElementById("track-edit-modal");
  modal.style.display="none";
  modal.setAttribute("aria-hidden","true");
  amkinaEditingTrackId=null;
}
async function saveTrackEdit(){
  const s=amkinaGetSession();
  const track=tracks.find(t=>String(t.id)===String(amkinaEditingTrackId));
  if(!s?.access_token||!s?.user?.id||!track){alert("다시 로그인해주세요.");return}
  const isAdmin=String(s.user.email||"").toLowerCase()==="psy88all@naver.com".toLowerCase();
  const mine=!!(track.uploader_id && String(track.uploader_id)===String(s.user.id));
  if(!isAdmin && !mine){alert("본인이 업로드한 곡만 수정할 수 있습니다.");return}

  const title=document.getElementById("track-edit-title").value.trim();
  const artist=document.getElementById("track-edit-artist").value.trim();
  const genre=document.getElementById("track-edit-genre").value.trim();
  const lyrics=document.getElementById("track-edit-lyrics").value.trim();
  const coverFile=document.getElementById("track-edit-cover").files[0];
  const status=document.getElementById("track-edit-status");
  if(!title||!artist){alert("곡 제목과 아티스트를 입력해주세요.");return}

  try{
    status.textContent="저장 중...";
    let coverUrl=track.cover_url||"";

    if(coverFile){
      const ext=(coverFile.name.split(".").pop()||"jpg").toLowerCase();
      const path=`${s.user.id}/${Date.now()}-edit-cover.${ext}`;
      const up=await fetch(`${SUPABASE_URL}/storage/v1/object/profile-images/${path}`,{
        method:"POST",
        headers:{
          "apikey":SUPABASE_ANON_KEY,
          "Authorization":`Bearer ${s.access_token}`,
          "Content-Type":coverFile.type||"image/jpeg"
        },
        body:coverFile
      });
      if(!up.ok)throw new Error("새 커버 업로드 실패");
      coverUrl=`${SUPABASE_URL}/storage/v1/object/public/profile-images/${path}`;
    }

    const editFilter=isAdmin
      ? `id=eq.${encodeURIComponent(track.id)}`
      : `id=eq.${encodeURIComponent(track.id)}&uploader_id=eq.${encodeURIComponent(s.user.id)}`;

    const r=await fetch(`${SUPABASE_URL}/rest/v1/tracks?${editFilter}`,{
      method:"PATCH",
      headers:{...amkinaTrackHeaders(true),"Prefer":"return=representation"},
      body:JSON.stringify({title,artist,genre:genre||"ORIGINAL",lyrics,cover_url:coverUrl})
    });
    if(!r.ok)throw new Error(await r.text());
    const changed=await r.json();
    if(!changed.length)throw new Error("수정 권한이 없거나 곡을 찾지 못했습니다.");

    closeTrackEdit();
    await loadMusic();
    alert("곡 정보가 수정되었습니다.");
  }catch(e){
    console.error(e);
    status.textContent="";
    alert("수정하지 못했습니다. Supabase의 tracks 수정 권한 설정을 확인해주세요.");
  }
}

document.addEventListener("click",(e)=>{
  const modal=document.getElementById("track-edit-modal");
  if(e.target===modal)closeTrackEdit();
});

/* ===== AMKINA SCRIPT BLOCK 15 | id="amkina-lyrics-script" ===== */
function currentLyricsTrack(){
  return (typeof currentIndex==="number" && currentIndex>=0 && tracks[currentIndex]) ? tracks[currentIndex] : null;
}
function refreshLyricsButton(){
  const btn=document.getElementById("lyrics-player-btn");
  if(!btn)return;
  const t=currentLyricsTrack();
  const has=!!String(t?.lyrics||"").trim();
  btn.classList.toggle("has-lyrics",has);
  btn.title=has ? "가사 보기" : "등록된 가사 없음";
}
function openLyricsPanel(){
  const modal=document.getElementById("lyrics-modal");
  const meta=document.getElementById("lyrics-track-meta");
  const content=document.getElementById("lyrics-content");
  const t=currentLyricsTrack();

  if(!t){
    meta.textContent="AMKINA MUSIC";
    content.textContent="곡을 선택하면 가사를 볼 수 있습니다.";
    content.classList.add("empty");
  }else{
    meta.textContent=`${t.title||"Untitled"} · ${t.artist||"AMKINA"}`;
    const lyrics=String(t.lyrics||"").trim();
    content.textContent=lyrics || "등록된 가사가 없습니다.";
    content.classList.toggle("empty",!lyrics);
  }
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.documentElement.style.overflow="hidden";
}
function closeLyricsPanel(){
  const modal=document.getElementById("lyrics-modal");
  if(!modal)return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  document.documentElement.style.overflow="";
}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeLyricsPanel()});

/* ===== AMKINA SCRIPT BLOCK 16 | id="amkina-compact-lyrics-script" ===== */
function getCompactLyricsLines(track){
  return String(track?.lyrics || "")
    .replace(/\r/g,"")
    .split("\n")
    .map(v=>v.trim())
    .filter(Boolean);
}
function renderCompactLyrics(){
  const wrap=document.getElementById("compact-lyrics-preview");
  if(!wrap)return;
  const t=(typeof currentIndex==="number" && currentIndex>=0 && tracks[currentIndex]) ? tracks[currentIndex] : null;
  const cols=wrap.querySelectorAll(".compact-lyrics-col");
  if(!t){
    cols[0].textContent="곡을 선택해주세요.";
    cols[1].textContent="";
    cols[2].textContent="";
    return;
  }
  const lines=getCompactLyricsLines(t);
  if(!lines.length){
    cols[0].textContent="";
    cols[1].innerHTML='<span class="active-line">등록된 가사가 없습니다.</span>';
    cols[2].textContent="";
    return;
  }

  // Compact preview: distribute the lyrics into three short columns.
  // This is intentionally not time-synced yet.
  const chunk=Math.max(1,Math.ceil(lines.length/3));
  const parts=[lines.slice(0,chunk),lines.slice(chunk,chunk*2),lines.slice(chunk*2)];
  cols.forEach((el,i)=>{
    el.textContent="";
    (parts[i]||[]).slice(0,4).forEach((line,j)=>{
      const span=document.createElement("span");
      span.textContent=line;
      span.style.display="block";
      if(i===0 && j===Math.min(3,(parts[i]||[]).length-1)) span.className="active-line";
      el.appendChild(span);
    });
  });
}
function toggleCompactLyrics(){
  if(window.matchMedia("(max-width: 768px)").matches){
    openLyricsPanel();
    return;
  }
  const panel=document.getElementById("compact-lyrics-panel");
  if(!panel)return;
  const opening=!panel.classList.contains("open");
  panel.classList.toggle("open",opening);
  panel.setAttribute("aria-hidden",opening?"false":"true");
  document.body.classList.toggle("compact-lyrics-open",opening);
  if(opening)renderCompactLyrics();
}

/* ===== AMKINA SCRIPT BLOCK 17 | id="amkina-owner-edit-menu-script" ===== */
function amkinaCanEditTrack(track){
  const s=typeof amkinaGetSession==="function" ? amkinaGetSession() : null;
  if(!s?.user?.id || !track) return false;
  const isAdmin=String(s.user.email||"").toLowerCase()==="psy88all@naver.com";
  const mine=!!(track.uploader_id && String(track.uploader_id)===String(s.user.id));
  return isAdmin || mine;
}

function amkinaAttachOwnerEditButtons(){
  return; // 통합 곡 메뉴 사용
  if(!Array.isArray(window.tracks) && typeof tracks==="undefined") return;
  const list=(typeof tracks!=="undefined" && Array.isArray(tracks)) ? tracks : window.tracks;

  document.querySelectorAll(".track-card").forEach((card)=>{
    const existing=card.querySelector(".amkina-owner-edit-btn");
    if(existing) existing.remove();

    let track=null;

    // Prefer a card data-id if the current renderer provides one.
    const id=card.dataset?.id || card.dataset?.trackId || card.getAttribute("data-track-id");
    if(id!=null) track=list.find(t=>String(t.id)===String(id));

    // Fallback: infer from play button onclick containing the track id.
    if(!track){
      const clickable=card.querySelector("[onclick]");
      const oc=clickable?.getAttribute("onclick")||"";
      const m=oc.match(/(?:playTrack|selectTrack|openTrackEdit)\s*\(\s*['"]?([^,'")]+)/);
      if(m) track=list.find(t=>String(t.id)===String(m[1]));
    }

    // Last fallback: exact title + artist shown in card.
    if(!track){
      const txt=(card.innerText||"").trim();
      track=list.find(t=>txt.includes(String(t.title||"")) && txt.includes(String(t.artist||"")));
    }

    if(!track || !amkinaCanEditTrack(track)) return;

    const btn=document.createElement("button");
    btn.type="button";
    btn.className="amkina-owner-edit-btn";
    btn.title="내 곡 수정";
    btn.setAttribute("aria-label","내 곡 수정");
    btn.textContent="⋯";
    btn.addEventListener("click",(e)=>{
      e.preventDefault();
      e.stopPropagation();
      openTrackEdit(track.id);
    });
    card.appendChild(btn);
  });
}

// Re-attach after track list redraws.
const amkinaOwnerObserver=new MutationObserver(()=>{
  clearTimeout(window.__amkinaOwnerEditTimer);
  window.__amkinaOwnerEditTimer=setTimeout(amkinaAttachOwnerEditButtons,50);
});
document.addEventListener("DOMContentLoaded",()=>{
  amkinaOwnerObserver.observe(document.body,{childList:true,subtree:true});
  setTimeout(amkinaAttachOwnerEditButtons,250);
});

/* ===== AMKINA SCRIPT BLOCK 18 | id="amkina-chart100-script" ===== */
function amkinaTrackPlays(t){
  return Number(t?.plays ?? t?.play_count ?? t?.views ?? t?.view_count ?? 0) || 0;
}
function amkinaChartLikeCount(t){
  return Number(t?._live_like_count ?? t?.like_count ?? t?.likes ?? 0) || 0;
}

let amkinaChartSnapshotMeta={latest:null,previous:null,moves:{}};
let amkinaChartPeriod="all";
let amkinaPeriodPlayCounts={};

async function amkinaLoadPeriodPlays(period){
  if(period==="all"){amkinaPeriodPlayCounts={};return {}}
  const hours=period==="daily"?24:168;
  const since=new Date(Date.now()-hours*60*60*1000).toISOString();
  try{
    const r=await fetch(
      SUPABASE_URL+"/rest/v1/play_events?select=track_id,played_at&played_at=gte."+encodeURIComponent(since)+"&limit=10000",
      {headers:{apikey:SUPABASE_ANON_KEY,Authorization:"Bearer "+SUPABASE_ANON_KEY}}
    );
    if(!r.ok) throw new Error(await r.text());
    const rows=await r.json(), counts={};
    rows.forEach(x=>{const id=String(x.track_id);counts[id]=(counts[id]||0)+1});
    amkinaPeriodPlayCounts=counts;
    return counts;
  }catch(e){
    console.warn("기간별 재생 집계 실패",e);
    amkinaPeriodPlayCounts={};
    return {};
  }
}
function amkinaChartDisplayPlays(t){
  return amkinaChartPeriod==="all"?amkinaTrackPlays(t):Number(amkinaPeriodPlayCounts[String(t.id)]||0);
}
function amkinaInitChartTabs(){
  document.querySelectorAll(".chart100-tab[data-period]").forEach(btn=>{
    if(btn.dataset.bound)return; btn.dataset.bound="1";
    btn.addEventListener("click",async()=>{
      amkinaChartPeriod=btn.dataset.period||"all";
      document.querySelectorAll(".chart100-tab[data-period]").forEach(b=>b.classList.toggle("active",b===btn));
      const sub=document.getElementById("chart100-subtitle");
      if(sub) sub.textContent=amkinaChartPeriod==="daily"?"최근 24시간 재생수를 기준으로 집계한 인기 음원 차트입니다.":amkinaChartPeriod==="weekly"?"최근 7일 재생수를 기준으로 집계한 인기 음원 차트입니다.":"AMKINA MUSIC 누적 재생수를 기준으로 집계한 인기 음원 차트입니다.";
      await renderChart100();
    });
  });
}


async function amkinaLoadChartSnapshots(){
  try{
    const r=await fetch(
      SUPABASE_URL+"/rest/v1/chart_snapshots?select=track_id,rank_position,snapshot_at&order=snapshot_at.desc,rank_position.asc&limit=250",
      {headers:{apikey:SUPABASE_ANON_KEY,Authorization:"Bearer "+SUPABASE_ANON_KEY}}
    );
    if(!r.ok) throw new Error(await r.text());
    const rows=await r.json();
    const times=[...new Set(rows.map(x=>x.snapshot_at))].slice(0,2);
    const latest=times[0]||null, previous=times[1]||null;
    const latestMap={}, prevMap={}, moves={};
    rows.forEach(x=>{
      if(x.snapshot_at===latest) latestMap[String(x.track_id)]=Number(x.rank_position);
      else if(x.snapshot_at===previous) prevMap[String(x.track_id)]=Number(x.rank_position);
    });
    Object.keys(latestMap).forEach(id=>{
      if(!previous){ moves[id]={type:"same",delta:0}; return; }
      if(prevMap[id]==null) moves[id]={type:"new",delta:0};
      else{
        const delta=prevMap[id]-latestMap[id];
        moves[id]=delta>0?{type:"up",delta}:delta<0?{type:"down",delta:Math.abs(delta)}:{type:"same",delta:0};
      }
    });
    amkinaChartSnapshotMeta={latest,previous,moves,latestMap};
    return amkinaChartSnapshotMeta;
  }catch(e){
    console.warn("CHART 100 스냅샷 조회 실패",e);
    return amkinaChartSnapshotMeta;
  }
}
function amkinaChartMoveHtml(id){
  const m=amkinaChartSnapshotMeta.moves[String(id)]||{type:"same",delta:0};
  if(m.type==="new") return '<span class="new">NEW</span>';
  if(m.type==="up") return '<span class="arrow up">▲</span><span class="move-num">'+m.delta+'</span>';
  if(m.type==="down") return '<span class="arrow down">▼</span><span class="move-num">'+m.delta+'</span>';
  return '<span class="same">―</span>';
}
function amkinaRankHtml(rank){
  if(rank===1)return '<span class="chart100-medal">1</span>01';
  if(rank===2)return '<span class="chart100-medal">2</span>02';
  if(rank===3)return '<span class="chart100-medal">3</span>03';
  return String(rank).padStart(2,"0");
}
function amkinaStartChartCountdown(){
  clearInterval(window.__amkinaChartCountdownTimer);
  const draw=()=>{
    const el=document.getElementById("chart100-countdown"); if(!el)return;
    const base=amkinaChartSnapshotMeta.latest?new Date(amkinaChartSnapshotMeta.latest):new Date();
    let next=new Date(base.getTime()+2*60*60*1000);
    const now=new Date();
    while(next<=now) next=new Date(next.getTime()+2*60*60*1000);
    const sec=Math.max(0,Math.floor((next-now)/1000));
    const h=String(Math.floor(sec/3600)).padStart(2,"0");
    const m=String(Math.floor((sec%3600)/60)).padStart(2,"0");
    const ss=String(sec%60).padStart(2,"0");
    el.textContent=h+":"+m+":"+ss;
  };
  draw(); window.__amkinaChartCountdownTimer=setInterval(draw,1000);
}

async function renderChart100(){
  const el=document.getElementById("chart100-list");
  if(!el)return;

  const likeCounts={};
  try{
    const r=await fetch(
      SUPABASE_URL+"/rest/v1/track_likes?select=track_id",
      {headers:{apikey:SUPABASE_ANON_KEY,Authorization:"Bearer "+SUPABASE_ANON_KEY}}
    );
    if(r.ok){
      const rows=await r.json();
      rows.forEach(x=>{const id=String(x.track_id);likeCounts[id]=(likeCounts[id]||0)+1;});
    }
  }catch(e){console.warn("CHART 100 좋아요 집계 실패",e);}

  await amkinaLoadPeriodPlays(amkinaChartPeriod);
  if(amkinaChartPeriod==="all") await amkinaLoadChartSnapshots();
  amkinaStartChartCountdown();

  const source=(typeof tracks!=="undefined" && Array.isArray(tracks)?tracks:[]);
  source.forEach(t=>{t._live_like_count=likeCounts[String(t.id)]||0});

  let list=source.slice();
  const lm=amkinaChartPeriod==="all"?(amkinaChartSnapshotMeta.latestMap||{}):{};
  if(amkinaChartPeriod!=="all"){
    list=list.filter(t=>amkinaChartDisplayPlays(t)>0).sort((a,b)=>amkinaChartDisplayPlays(b)-amkinaChartDisplayPlays(a) || amkinaTrackPlays(b)-amkinaTrackPlays(a)).slice(0,100);
  }else if(amkinaChartSnapshotMeta.latest && Object.keys(lm).length){
    list=list.filter(t=>lm[String(t.id)]!=null).sort((a,b)=>lm[String(a.id)]-lm[String(b.id)]).slice(0,100);
  }else{
    list=list.sort((a,b)=>amkinaTrackPlays(b)-amkinaTrackPlays(a)).slice(0,100);
  }

  if(!list.length){el.innerHTML='<div class="chart100-empty">등록된 음원이 없습니다.</div>';return;}

  el.innerHTML=list.map((t,i)=>{
    const rank=amkinaChartPeriod==="all"?(lm[String(t.id)]||i+1):(i+1);
    const topClass=rank<=3?" top"+rank:"";
    return `
    <div class="chart100-row${topClass}" onclick="amkinaPlayChartTrack('${String(t.id).replace(/'/g,"\\'")}')">
      <div class="chart100-rank">${amkinaRankHtml(rank)}</div>
      <div class="chart100-move">${amkinaChartPeriod==="all"?amkinaChartMoveHtml(t.id):"―"}</div>
      <img class="chart100-cover" src="${t.cover_url||t.cover||''}" alt="">
      <div class="chart100-song"><b>${escapeHtmlChart(t.title||"Untitled")}</b><span>${escapeHtmlChart(t.artist||"AMKINA")}</span></div>
      <div class="chart100-genre">${escapeHtmlChart(t.genre||"ORIGINAL")}</div>
      <div class="chart100-stat">▷ ${amkinaChartDisplayPlays(t).toLocaleString()}</div>
      <div class="chart100-stat chart100-like">♡ ${amkinaChartLikeCount(t).toLocaleString()}</div>
    </div>`;
  }).join("");
}
function escapeHtmlChart(v){
 const d=document.createElement("div"); d.textContent=String(v??""); return d.innerHTML;
}
function amkinaPlayChartTrack(id){
 const list=(typeof tracks!=="undefined" && Array.isArray(tracks))?tracks:[];
 const idx=list.findIndex(t=>String(t.id)===String(id));
 if(idx<0)return;
 if(typeof playTrack==="function"){playTrack(idx);return}
 if(typeof selectTrack==="function"){selectTrack(idx);return}
}
document.addEventListener("DOMContentLoaded",amkinaInitChartTabs);

function openChart100(event){
 if(event){
   event.preventDefault();
   event.stopPropagation();
 }

 const hero=document.querySelector(".hero");
 const music=document.getElementById("music");
 const studio=document.getElementById("studio");
 const community=document.getElementById("community");
 const page=document.getElementById("chart100-page");

 if(hero) hero.style.setProperty("display","none","important");
 if(music) music.style.setProperty("display","none","important");
 if(studio) studio.style.setProperty("display","none","important");
 if(community) community.style.setProperty("display","none","important");

 if(page){
   page.style.setProperty("display","block","important");
   page.style.setProperty("visibility","visible","important");
   page.style.setProperty("opacity","1","important");
   page.classList.add("active");
 }

 const nav=document.getElementById("chart100-nav");
 if(typeof setActiveMenu==="function" && nav) setActiveMenu(nav);
 if(typeof closeMobileMenu==="function") closeMobileMenu();

 renderChart100();
 window.scrollTo(0,0);
 return false;
}
document.addEventListener("click",function(e){
 const a=e.target.closest("a");
 if(!a)return;
 const txt=(a.textContent||"").trim().toLowerCase();
 if(txt==="chrat 100" || txt==="chart 100"){
   e.preventDefault();
   openChart100();
   a.querySelector(".nav-text") ? a.querySelector(".nav-text").textContent="CHART 100" : null;
 }
});
document.addEventListener("DOMContentLoaded",()=>{
 document.querySelectorAll("a").forEach(a=>{
   if((a.textContent||"").trim().toLowerCase()==="chrat 100"){
     const n=a.querySelector(".nav-text"); if(n)n.textContent="CHART 100";
   }
 });
});

/* ===== AMKINA SCRIPT BLOCK 19 | id="amkina-chart100-nav-fix" ===== */
document.addEventListener("DOMContentLoaded",function(){
  const nav=document.getElementById("chart100-nav");
  if(nav){
    nav.classList.remove("coming-link");
    nav.onclick=function(e){
      return typeof openChart100==="function" ? openChart100(e) : false;
    };
  }
});

/* ===== AMKINA SCRIPT BLOCK 20 | id="amkina-track-social-script" ===== */
let currentTrackCommentId=null;
let amkinaTrackLikes=new Set();

function trackSocialSession(){
 try{return JSON.parse(localStorage.getItem("amkina_session")||"null")}catch(e){return null}
}
function trackSocialHeaders(auth){
 const s=trackSocialSession();
 const h={"apikey":SUPABASE_ANON_KEY,"Content-Type":"application/json"};
 h["Authorization"]="Bearer "+(auth&&s?.access_token?s.access_token:SUPABASE_ANON_KEY);
 return h;
}
function requireTrackLogin(){
 const s=trackSocialSession();
 if(s?.access_token&&s?.user?.id)return s;
 alert("좋아요와 댓글은 로그인이 필요합니다.");
 const m=document.getElementById("auth-modal"); if(m)m.style.display="flex";
 return null;
}
async function refreshTrackSocial(){
 const s=trackSocialSession();
 try{
   const [lr,cr]=await Promise.all([
     fetch(SUPABASE_URL+"/rest/v1/track_likes?select=track_id,user_id",{headers:trackSocialHeaders(false)}),
     fetch(SUPABASE_URL+"/rest/v1/track_comments?select=track_id",{headers:trackSocialHeaders(false)})
   ]);
   if(!lr.ok||!cr.ok)return;
   const likes=await lr.json(), comments=await cr.json();
   const lc={},cc={}; amkinaTrackLikes=new Set();
   likes.forEach(x=>{lc[String(x.track_id)]=(lc[String(x.track_id)]||0)+1;if(s?.user?.id===x.user_id)amkinaTrackLikes.add(String(x.track_id))});
   comments.forEach(x=>cc[String(x.track_id)]=(cc[String(x.track_id)]||0)+1);
   document.querySelectorAll(".track[data-track-id]").forEach(card=>{
     const id=String(card.dataset.trackId);
     const lb=card.querySelector(".track-like-btn"), cb=card.querySelector(".track-comment-btn");
     if(lb){lb.classList.toggle("liked",amkinaTrackLikes.has(id));const h=lb.querySelector(".stat-heart");if(h)h.textContent=amkinaTrackLikes.has(id)?"♥":"♡";const c=lb.querySelector(".like-count");if(c)c.textContent=(lc[id]||0).toLocaleString()}
     if(cb){const c=cb.querySelector(".comment-count");if(c)c.textContent=(cc[id]||0).toLocaleString()}
   });
 }catch(e){console.warn("track social refresh",e)}
}
async function toggleTrackLike(id){
 const s=requireTrackLogin(); if(!s)return;
 id=String(id);
 const liked=amkinaTrackLikes.has(id);
 try{
   const url=SUPABASE_URL+"/rest/v1/track_likes?track_id=eq."+encodeURIComponent(id)+"&user_id=eq."+encodeURIComponent(s.user.id);
   const r=await fetch(url,{method:liked?"DELETE":"POST",headers:{...trackSocialHeaders(true),...(liked?{}:{"Prefer":"return=minimal"})},body:liked?undefined:JSON.stringify({track_id:id,user_id:s.user.id})});
   if(!r.ok)throw new Error(await r.text());
   await refreshTrackSocial();
 }catch(e){console.error(e);alert("좋아요 처리에 실패했습니다. 먼저 제공된 Supabase SQL을 실행해주세요.")}
}
async function openTrackComments(id){
 currentTrackCommentId=String(id);
 const t=(typeof tracks!=="undefined"?tracks:[]).find(x=>String(x.id)===currentTrackCommentId);
 document.getElementById("track-social-title").textContent=(t?.title||"곡")+" · 댓글";
 document.getElementById("track-social-modal").style.display="flex";
 await loadTrackComments();
}
function closeTrackComments(){document.getElementById("track-social-modal").style.display="none";currentTrackCommentId=null}
async function loadTrackComments(){
 const el=document.getElementById("track-comment-list"); if(!el||!currentTrackCommentId)return;
 el.innerHTML='<div class="track-comment-empty">댓글을 불러오는 중...</div>';
 try{
   const r=await fetch(SUPABASE_URL+"/rest/v1/track_comments?track_id=eq."+encodeURIComponent(currentTrackCommentId)+"&select=*&order=created_at.asc",{headers:trackSocialHeaders(false)});
   if(!r.ok)throw new Error(await r.text());
   const rows=await r.json(),s=trackSocialSession();
   el.innerHTML=rows.length?rows.map(c=>`<div class="track-comment-item"><div class="track-comment-top"><span class="track-comment-author">${escapeHtmlChart(c.author_name||"AMKINA USER")}</span><span>${new Date(c.created_at).toLocaleString("ko-KR")}</span>${s?.user?.id===c.user_id?`<button class="track-comment-delete" onclick="deleteTrackComment('${c.id}')">삭제</button>`:""}</div><div class="track-comment-body">${escapeHtmlChart(c.content||"")}</div></div>`).join(""):'<div class="track-comment-empty">아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</div>';
 }catch(e){el.innerHTML='<div class="track-comment-empty">댓글 기능을 사용하려면 Supabase SQL 설정이 필요합니다.</div>'}
}
async function submitTrackComment(){
 const s=requireTrackLogin(); if(!s||!currentTrackCommentId)return;
 const input=document.getElementById("track-comment-input"),content=(input?.value||"").trim(); if(!content)return;
 try{
   const r=await fetch(SUPABASE_URL+"/rest/v1/track_comments",{method:"POST",headers:{...trackSocialHeaders(true),"Prefer":"return=minimal"},body:JSON.stringify({track_id:currentTrackCommentId,user_id:s.user.id,author_name:(s.user.email||"AMKINA USER").split("@")[0],content})});
   if(!r.ok)throw new Error(await r.text());
   input.value="";await loadTrackComments();await refreshTrackSocial();
 }catch(e){console.error(e);alert("댓글 등록에 실패했습니다. 먼저 제공된 Supabase SQL을 실행해주세요.")}
}
async function deleteTrackComment(id){
 const s=trackSocialSession();if(!s?.access_token)return;
 if(!confirm("댓글을 삭제할까요?"))return;
 const r=await fetch(SUPABASE_URL+"/rest/v1/track_comments?id=eq."+encodeURIComponent(id),{method:"DELETE",headers:trackSocialHeaders(true)});
 if(r.ok){await loadTrackComments();await refreshTrackSocial()}
}const socialObserver=new MutationObserver(()=>{clearTimeout(window.__socialTimer);window.__socialTimer=setTimeout(refreshTrackSocial,120)});
document.addEventListener("DOMContentLoaded",()=>{socialObserver.observe(document.getElementById("music-list")||document.body,{childList:true,subtree:true});setTimeout(refreshTrackSocial,700)});

/* ===== AMKINA SCRIPT BLOCK 21 | id="amkina-mypage-script" ===== */
let mpData={mine:[],likes:[],comments:[],profile:null,likeRows:[],featured:[]};
let mpTab="music";
const mpDefaultAvatar="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='60' fill='%23111111'/%3E%3Cpath d='M32 72c7-15 18-23 28-23s21 8 28 23' fill='none' stroke='%23fff' stroke-width='5'/%3E%3Ccircle cx='60' cy='38' r='14' fill='none' stroke='%23fff' stroke-width='5'/%3E%3C/svg%3E";

function mpSession(){try{return JSON.parse(localStorage.getItem("amkina_session")||"null")}catch(e){return null}}
function mpHeaders(auth=false){const s=mpSession();return {"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+(auth&&s?.access_token?s.access_token:SUPABASE_ANON_KEY),"Content-Type":"application/json"}}
function mpEsc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function mpCover(t){return t?.cover_url||mpDefaultAvatar}

async function showMyPage(event){
 if(event){event.preventDefault();event.stopPropagation()}
 const s=mpSession();
 if(!s?.user?.id){alert("마이페이지는 로그인이 필요합니다.");document.getElementById("auth-modal").style.display="flex";return false}
 ["music","studio","community","chart100-page","artists-page","library-page"].forEach(id=>{const x=document.getElementById(id);if(x){x.style.setProperty("display","none","important");x.classList.remove("active")}});
 const hero=document.querySelector(".hero");if(hero)hero.style.setProperty("display","none","important");
 const page=document.getElementById("mypage");page.style.setProperty("display","block","important");
 document.querySelectorAll("body > header nav a").forEach(a=>a.classList.remove("menu-active"));document.getElementById("mypage-nav")?.classList.add("menu-active");
 document.querySelector("body > header nav")?.classList.remove("mobile-open");window.scrollTo(0,0);
 await loadMyPage();return false;
}
async function loadMyPage(){
 const s=mpSession();if(!s?.user?.id)return;
 try{
  const uid=encodeURIComponent(s.user.id);

  // 마이페이지는 홈 화면의 tracks 배열을 기다리지 않고 DB에서 직접 집계합니다.
  const [pr,lr,cr,tr,allLikesR,featuredR]=await Promise.all([
   fetch(SUPABASE_URL+"/rest/v1/profiles?id=eq."+uid+"&select=*",{headers:mpHeaders(false)}),
   fetch(SUPABASE_URL+"/rest/v1/track_likes?select=track_id,user_id&user_id=eq."+uid,{headers:mpHeaders(false)}),
   fetch(SUPABASE_URL+"/rest/v1/track_comments?select=*&user_id=eq."+uid+"&order=created_at.desc",{headers:mpHeaders(false)}),
   fetch(SUPABASE_URL+"/rest/v1/tracks?uploader_id=eq."+uid+"&select=*&order=id.desc",{headers:mpHeaders(false)}),
   fetch(SUPABASE_URL+"/rest/v1/track_likes?select=track_id",{headers:mpHeaders(false)}),
   fetch(SUPABASE_URL+"/rest/v1/artist_featured_tracks?user_id=eq."+uid+"&select=track_id,position&order=position.asc",{headers:mpHeaders(false)})
  ]);

  mpData.profile=pr.ok?(await pr.json())[0]||null:null;
  mpData.likeRows=lr.ok?await lr.json():[];
  mpData.comments=cr.ok?await cr.json():[];
  mpData.mine=tr.ok?await tr.json():[];
  const featuredRows=featuredR.ok?await featuredR.json():[];
  mpData.featured=featuredRows.map(x=>mpData.mine.find(t=>String(t.id)===String(x.track_id))).filter(Boolean);

  // 좋아요한 곡도 DB에서 실제 곡을 찾아옵니다.
  const likedIds=mpData.likeRows.map(x=>String(x.track_id));
  if(likedIds.length){
    const inFilter="("+likedIds.map(x=>encodeURIComponent(x)).join(",")+")";
    const likedR=await fetch(SUPABASE_URL+"/rest/v1/tracks?id=in."+inFilter+"&select=*",{headers:mpHeaders(false)});
    mpData.likes=likedR.ok?await likedR.json():[];
  }else{
    mpData.likes=[];
  }

  const fallback=(s.user.email||"user").split("@")[0],p=mpData.profile||{};
  document.getElementById("mp-name").textContent=p.nickname||fallback;
  document.getElementById("mp-handle").textContent="@"+(p.nickname||fallback).replace(/\s+/g,"_").toLowerCase();
  document.getElementById("mp-bio").textContent=p.bio||"음악으로 소통하는 AMKINA MUSIC";
  document.getElementById("mp-genres").textContent=p.genres?("주 장르 · "+p.genres):"";
  const social=document.getElementById("mp-social");
  if(p.social_url){social.innerHTML='<a href="'+mpEsc(p.social_url)+'" target="_blank" rel="noopener">SNS / YouTube ↗</a>'}else social.innerHTML="";
  document.getElementById("mp-avatar").src=p.avatar_url||mpDefaultAvatar;
  document.getElementById("mp-joined").textContent="가입일 "+new Date(s.user.created_at||Date.now()).toLocaleDateString("ko-KR");

  const uploadCount=mpData.mine.length;
  const totalPlays=mpData.mine.reduce((sum,t)=>sum+Number(t.play_count||0),0);

  const allLikes=allLikesR.ok?await allLikesR.json():[];
  const myTrackIds=new Set(mpData.mine.map(t=>String(t.id)));
  const receivedLikes=allLikes.filter(x=>myTrackIds.has(String(x.track_id))).length;

  document.getElementById("mp-upload-count").textContent=uploadCount.toLocaleString();
  document.getElementById("mp-play-count").textContent=totalPlays.toLocaleString();
  document.getElementById("mp-like-count").textContent=receivedLikes.toLocaleString();

  // 통계 탭에서도 같은 실제 집계값을 사용
  mpData.uploadCount=uploadCount;
  mpData.totalPlays=totalPlays;
  mpData.receivedLikes=receivedLikes;

  renderMyPageTab();
 }catch(e){
  console.error("마이페이지:",e);
  document.getElementById("mp-content").innerHTML='<div class="mp-empty">마이페이지 데이터를 불러오지 못했습니다.</div>';
 }
}
function renderMyPageTab(){
 const el=document.getElementById("mp-content");if(!el)return;
 if(mpTab==="music"||mpTab==="likes"){
  const rows=mpTab==="music"?mpData.mine:mpData.likes;
  el.innerHTML=rows.length?'<div class="mp-grid">'+rows.map(t=>`<article class="mp-card" onclick="mpPlay('${t.id}')"><img src="${mpEsc(mpCover(t))}"><div class="mp-card-body"><div class="mp-card-title">${mpEsc(t.title||"Untitled")}</div><div class="mp-card-sub">${mpEsc(t.artist||"AMKINA")} · ${mpEsc(t.genre||"ORIGINAL")}</div><div class="mp-card-stat">▷ ${Number(t.play_count||0).toLocaleString()}</div></div></article>`).join("")+"</div>":'<div class="mp-empty">'+(mpTab==="music"?"아직 업로드한 음악이 없습니다.":"아직 좋아요한 곡이 없습니다.")+"</div>";return;
 }
 if(mpTab==="featured"){
  const chosen=new Set(mpData.featured.map(t=>String(t.id)));
  const selected=mpData.featured.length?'<div class="mp-grid">'+mpData.featured.map((t,i)=>`<article class="mp-card mp-feature-card"><span class="mp-feature-badge">대표곡 ${i+1}</span><img src="${mpEsc(mpCover(t))}" onclick="mpPlay('${t.id}')"><div class="mp-card-body"><div class="mp-card-title">${mpEsc(t.title)}</div><div class="mp-card-stat">▷ ${Number(t.play_count||0).toLocaleString()}</div><div class="mp-feature-actions"><button onclick="removeFeaturedTrack('${t.id}')">대표곡 해제</button></div></div></article>`).join("")+'</div>':'<div class="mp-empty" style="padding:25px">아직 대표곡을 지정하지 않았습니다.</div>';
  const choices=mpData.mine.filter(t=>!chosen.has(String(t.id)));
  el.innerHTML=`<div class="mp-feature-pick"><h3>대표곡 설정</h3><p>내 음악 중 최대 3곡을 아티스트 대표곡으로 지정할 수 있습니다.</p>${selected}</div>${mpData.featured.length<3&&choices.length?'<div class="mp-feature-list">'+choices.map(t=>`<div class="mp-feature-choice"><img src="${mpEsc(mpCover(t))}"><div>${mpEsc(t.title)}</div><button onclick="addFeaturedTrack('${t.id}')">선택</button></div>`).join("")+'</div>':""}`;
  return;
 }
 if(mpTab==="comments"){
  el.innerHTML=mpData.comments.length?'<div class="mp-list">'+mpData.comments.map(c=>{const t=(tracks||[]).find(x=>String(x.id)===String(c.track_id));return `<div class="mp-list-row" onclick="openTrackComments('${c.track_id}')"><img src="${mpEsc(mpCover(t))}"><div class="mp-list-main"><b>${mpEsc(t?.title||"음원")}</b><div>${mpEsc(c.content||"")}</div></div></div>`}).join("")+"</div>":'<div class="mp-empty">작성한 댓글이 없습니다.</div>';return;
 }
 const ranked=[...mpData.mine].sort((a,b)=>Number(b.play_count||0)-Number(a.play_count||0)),top=ranked[0],top5=ranked.slice(0,5);
 const avg=mpData.mine.length?Math.round(Number(mpData.totalPlays||0)/mpData.mine.length):0;
 el.innerHTML=`<div class="mp-creator-dashboard"><div class="mp-dash-box"><div class="mp-dash-title">내 인기곡 TOP 5<div class="mp-dash-sub">누적 재생수 기준</div></div>${top5.length?top5.map((t,i)=>`<div class="mp-top-row" onclick="mpPlay('${t.id}')" style="cursor:pointer"><div class="mp-top-rank">${i+1}</div><img src="${mpEsc(mpCover(t))}"><div class="mp-top-name">${mpEsc(t.title)}</div><div class="mp-top-play">${Number(t.play_count||0).toLocaleString()}회</div></div>`).join(""):'<div class="mp-empty">업로드한 곡이 없습니다.</div>'}</div><div class="mp-dash-box"><div class="mp-dash-title">Creator Summary<div class="mp-dash-sub">현재 누적 성과</div></div><div class="mp-mini-stats"><div class="mp-mini-stat"><span>총 재생수</span><b>${Number(mpData.totalPlays||0).toLocaleString()}</b></div><div class="mp-mini-stat"><span>받은 좋아요</span><b>${Number(mpData.receivedLikes||0).toLocaleString()}</b></div><div class="mp-mini-stat"><span>곡당 평균 재생</span><b>${avg.toLocaleString()}</b></div><div class="mp-mini-stat"><span>대표곡</span><b>${mpData.featured.length}/3</b></div></div>${top?`<div class="mp-dash-sub" style="margin-top:14px">최고 인기곡 · <b style="color:#111">${mpEsc(top.title)}</b></div>`:""}</div></div>`;
}
function mpPlay(id){const i=(tracks||[]).findIndex(t=>String(t.id)===String(id));if(i>=0)playTrack(i)}
document.addEventListener("click",e=>{const b=e.target.closest(".mp-tab");if(!b)return;document.querySelectorAll(".mp-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");mpTab=b.dataset.mptab;renderMyPageTab()});
let mpPendingAvatarFile=null;
function openMyProfileEdit(){
 const s=mpSession(),p=mpData.profile||{};
 document.getElementById("mp-edit-name").value=p.nickname||(s?.user?.email||"user").split("@")[0];
 document.getElementById("mp-edit-bio").value=p.bio||"";
 document.getElementById("mp-edit-genres").value=p.genres||"";
 document.getElementById("mp-edit-social").value=p.social_url||"";
 mpPendingAvatarFile=null;
 const fileInput=document.getElementById("mp-edit-avatar-file");if(fileInput)fileInput.value="";
 const preview=document.getElementById("mp-edit-avatar-preview");if(preview)preview.src=p.avatar_url||mpDefaultAvatar;
 const fileName=document.getElementById("mp-avatar-file-name");if(fileName)fileName.textContent="JPG, PNG, WEBP · 최대 5MB";
 document.getElementById("mp-profile-modal").style.display="flex";
}
function closeMyProfileEdit(){document.getElementById("mp-profile-modal").style.display="none";mpPendingAvatarFile=null}
function previewMyProfileAvatar(input){
 const f=input?.files?.[0];if(!f)return;
 const allowed=["image/jpeg","image/png","image/webp"];
 if(!allowed.includes(f.type)){alert("JPG, PNG, WEBP 이미지만 사용할 수 있습니다.");input.value="";return}
 if(f.size>5*1024*1024){alert("프로필 사진은 5MB 이하로 선택해주세요.");input.value="";return}
 mpPendingAvatarFile=f;
 const preview=document.getElementById("mp-edit-avatar-preview");
 if(preview)preview.src=URL.createObjectURL(f);
 const fileName=document.getElementById("mp-avatar-file-name");if(fileName)fileName.textContent=f.name;
}
async function uploadMyProfileAvatar(file,s){
 if(!file)return (mpData.profile||{}).avatar_url||"";
 const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
 const path=`${s.user.id}/profile-${Date.now()}.${ext}`;
 const r=await fetch(`${SUPABASE_URL}/storage/v1/object/profile-images/${path}`,{method:"POST",headers:{"apikey":SUPABASE_ANON_KEY,"Authorization":`Bearer ${s.access_token}`,"Content-Type":file.type,"x-upsert":"false"},body:file});
 if(!r.ok)throw new Error("프로필 사진 업로드 실패: "+await r.text());
 return `${SUPABASE_URL}/storage/v1/object/public/profile-images/${path}`;
}
async function saveMyProfile(){
 const s=mpSession();if(!s?.user?.id||!s?.access_token)return;
 const saveBtn=document.querySelector("#mp-profile-modal .mp-save");if(saveBtn){saveBtn.disabled=true;saveBtn.textContent="저장 중..."}
 try{
  const avatarUrl=await uploadMyProfileAvatar(mpPendingAvatarFile,s);
  const body={id:s.user.id,nickname:document.getElementById("mp-edit-name").value.trim(),bio:document.getElementById("mp-edit-bio").value.trim(),genres:document.getElementById("mp-edit-genres").value.trim(),social_url:document.getElementById("mp-edit-social").value.trim(),avatar_url:avatarUrl,updated_at:new Date().toISOString()};
  const r=await fetch(SUPABASE_URL+"/rest/v1/profiles",{method:"POST",headers:{...mpHeaders(true),"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(body)});
  if(!r.ok)throw new Error(await r.text());
  closeMyProfileEdit();await loadMyPage();
  if(typeof amkinaLoadArtistProfiles==="function"){
    await amkinaLoadArtistProfiles();
    if(document.getElementById("artists-page")?.classList.contains("active")) renderArtistsPage(document.getElementById("artist-search")?.value||"");
  }
 }catch(e){console.error(e);alert("프로필 저장에 실패했습니다. 이미지 업로드 권한과 profiles 설정을 확인해주세요.")}
 finally{if(saveBtn){saveBtn.disabled=false;saveBtn.textContent="저장하기"}}
}
async function addFeaturedTrack(trackId){const s=mpSession();if(!s?.user?.id)return;if(mpData.featured.length>=3)return alert("대표곡은 최대 3곡까지 지정할 수 있습니다.");const r=await fetch(SUPABASE_URL+"/rest/v1/artist_featured_tracks",{method:"POST",headers:{...mpHeaders(true),"Prefer":"return=minimal"},body:JSON.stringify({user_id:s.user.id,track_id:Number(trackId),position:mpData.featured.length+1})});if(!r.ok){console.error(await r.text());alert("대표곡 설정에 실패했습니다. 확장 SQL 실행 여부를 확인해주세요.");return}await loadMyPage();mpTab="featured";document.querySelectorAll(".mp-tab").forEach(b=>b.classList.toggle("active",b.dataset.mptab==="featured"));renderMyPageTab()}
async function removeFeaturedTrack(trackId){const s=mpSession();if(!s?.user?.id)return;const r=await fetch(SUPABASE_URL+"/rest/v1/artist_featured_tracks?user_id=eq."+encodeURIComponent(s.user.id)+"&track_id=eq."+encodeURIComponent(trackId),{method:"DELETE",headers:mpHeaders(true)});if(!r.ok){alert("대표곡 해제에 실패했습니다.");return}await loadMyPage();mpTab="featured";document.querySelectorAll(".mp-tab").forEach(b=>b.classList.toggle("active",b.dataset.mptab==="featured"));renderMyPageTab()}

/* ===== AMKINA SCRIPT BLOCK 22 | id="amkina-password-recovery-v1" ===== */
(function(){
  const REDIRECT_URL = "https://amkinaaimusic.github.io/amkina-music/";

  function authJsonHeaders(token){
    const h={"apikey":SUPABASE_ANON_KEY,"Content-Type":"application/json"};
    if(token) h.Authorization="Bearer "+token;
    return h;
  }
  function getStoredSession(){
    try{return JSON.parse(localStorage.getItem("amkina_session")||"null")}catch(e){return null}
  }
  function saveStoredSession(data){
    if(typeof amkinaAuthSaveSession==="function") return amkinaAuthSaveSession(data);
    localStorage.setItem("amkina_session",JSON.stringify(data));
    return data;
  }
  function friendlyRecoveryError(data,status){
    const raw=String(data?.msg||data?.message||data?.error_description||"").toLowerCase();
    if(status===429 || raw.includes("rate limit")) return "재설정 메일 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    if(raw.includes("expired")) return "재설정 링크가 만료되었습니다. 비밀번호 찾기에서 새 메일을 요청해주세요.";
    if(raw.includes("same password")) return "기존 비밀번호와 다른 새 비밀번호를 입력해주세요.";
    return data?.msg||data?.message||data?.error_description||"요청 처리에 실패했습니다.";
  }

  window.closePasswordResetRequest=function(){
    document.getElementById("password-reset-request-modal").style.display="none";
  };

  window.sendPasswordResetEmail=async function(){
    const input=document.getElementById("password-reset-email");
    const button=document.getElementById("password-reset-send");
    const email=(input?.value||"").trim();
    if(!email || !email.includes("@")){
      alert("가입할 때 사용한 이메일을 정확히 입력해주세요.");
      return;
    }
    const old=button.textContent; button.disabled=true; button.textContent="전송 중...";
    try{
      const r=await fetch(
        SUPABASE_URL+"/auth/v1/recover?redirect_to="+encodeURIComponent(REDIRECT_URL),
        {method:"POST",headers:authJsonHeaders(),body:JSON.stringify({email})}
      );
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(friendlyRecoveryError(d,r.status));
      closePasswordResetRequest();
      alert("비밀번호 재설정 메일을 요청했습니다.\n메일함과 스팸함을 확인해주세요.\n\n보안을 위해 가입 여부와 관계없이 같은 안내가 표시될 수 있습니다.");
    }catch(e){
      alert(e.message||"재설정 메일 전송에 실패했습니다.");
    }finally{
      button.disabled=false; button.textContent=old;
    }
  };

  window.openLoggedInPasswordChange=async function(){
    let s=getStoredSession();
    if(typeof amkinaAuthRefresh==="function" && s?.refresh_token){
      try{s=(await amkinaAuthRefresh(false))||getStoredSession()}catch(e){}
    }
    if(!s?.access_token||!s?.user?.id){
      alert("비밀번호 변경은 로그인이 필요합니다.");
      document.getElementById("auth-modal").style.display="flex";
      return;
    }
    document.getElementById("password-change-title").textContent="비밀번호 변경";
    document.getElementById("password-change-guide").textContent="새 비밀번호를 입력해주세요.";
    document.getElementById("password-new").value="";
    document.getElementById("password-new-confirm").value="";
    document.getElementById("password-change-modal").dataset.mode="loggedin";
    document.getElementById("password-change-modal").style.display="flex";
  };

  window.closePasswordChangeModal=function(){
    document.getElementById("password-change-modal").style.display="none";
  };

  async function sessionFromRecoveryHash(){
    const hash=new URLSearchParams(location.hash.replace(/^#/,""));
    const access=hash.get("access_token");
    const refresh=hash.get("refresh_token");
    const type=hash.get("type");
    const error=hash.get("error_description")||hash.get("error");
    if(error){
      alert("비밀번호 재설정 링크를 사용할 수 없습니다.\n"+decodeURIComponent(error));
      history.replaceState(null,"",location.pathname+location.search);
      return false;
    }
    if(type==="recovery" && access){
      let user=null;
      try{
        const ur=await fetch(SUPABASE_URL+"/auth/v1/user",{headers:authJsonHeaders(access)});
        if(ur.ok) user=await ur.json();
      }catch(e){}
      const session={
        access_token:access,
        refresh_token:refresh||"",
        token_type:hash.get("token_type")||"bearer",
        expires_in:Number(hash.get("expires_in")||3600),
        expires_at:Math.floor(Date.now()/1000)+Number(hash.get("expires_in")||3600),
        user:user
      };
      saveStoredSession(session);
      if(typeof amkinaAuthUpdateUI==="function")amkinaAuthUpdateUI();
      history.replaceState(null,"",location.pathname+location.search);
      document.getElementById("password-change-title").textContent="새 비밀번호 설정";
      document.getElementById("password-change-guide").textContent="메일 인증이 완료되었습니다. 사용할 새 비밀번호를 입력해주세요.";
      document.getElementById("password-change-modal").dataset.mode="recovery";
      document.getElementById("password-change-modal").style.display="flex";
      return true;
    }
    return false;
  }

  window.saveNewPassword=async function(){
    const p1=document.getElementById("password-new").value;
    const p2=document.getElementById("password-new-confirm").value;
    const button=document.getElementById("password-change-save");
    if(p1.length<8){alert("새 비밀번호는 8자 이상으로 입력해주세요.");return}
    if(p1!==p2){alert("새 비밀번호가 서로 일치하지 않습니다.");return}

    let s=getStoredSession();
    if(typeof amkinaAuthRefresh==="function" && s?.refresh_token){
      try{s=(await amkinaAuthRefresh(false))||getStoredSession()}catch(e){}
    }
    if(!s?.access_token){
      alert("인증 시간이 만료되었습니다. 비밀번호 찾기에서 재설정 메일을 다시 요청해주세요.");
      closePasswordChangeModal();
      return;
    }

    const old=button.textContent; button.disabled=true; button.textContent="변경 중...";
    try{
      const r=await fetch(SUPABASE_URL+"/auth/v1/user",{
        method:"PUT",
        headers:authJsonHeaders(s.access_token),
        body:JSON.stringify({password:p1})
      });
      const d=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(friendlyRecoveryError(d,r.status));

      closePasswordChangeModal();
      document.getElementById("password-new").value="";
      document.getElementById("password-new-confirm").value="";
      alert("비밀번호가 변경되었습니다.\n다음 로그인부터 새 비밀번호를 사용해주세요.");
    }catch(e){
      alert(e.message||"비밀번호 변경에 실패했습니다.");
    }finally{
      button.disabled=false; button.textContent=old;
    }
  };

  // Supabase recovery 메일 링크로 돌아왔을 때 자동으로 새 비밀번호 창을 연다.
  window.addEventListener("DOMContentLoaded",()=>setTimeout(sessionFromRecoveryHash,300));
})();

/* ===== AMKINA SCRIPT BLOCK 23 | id="amkina-library-v1" ===== */
let libraryCurrentPlaylist=null, libraryAddTrackId=null, libraryRecentMemory=[];

function libSession(){try{return JSON.parse(localStorage.getItem("amkina_session")||"null")}catch(e){return null}}
function libHeaders(auth=true){const s=libSession(),h={"apikey":SUPABASE_ANON_KEY,"Content-Type":"application/json"};if(auth&&s?.access_token)h.Authorization="Bearer "+s.access_token;return h}
function libTracks(){return (typeof tracks!=="undefined"&&Array.isArray(tracks))?tracks:[]}
function libTrack(id){return libTracks().find(t=>String(t.id)===String(id))}
function libEsc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function libCover(t){return t?.cover_url||t?.cover||""}
function hideForLibrary(){
 ["music","studio","community","chart100-page","mypage","artists-page","library-page"].forEach(id=>{const x=document.getElementById(id);if(x)x.style.setProperty("display","none","important")});
}
async function showLibraryPage(e){
 if(e)e.preventDefault(); hideForLibrary();
 const p=document.getElementById("library-page");p.style.setProperty("display","block","important");
 document.querySelectorAll(".amkina-sidebar-nav a").forEach(a=>a.classList.remove("menu-active"));
 document.getElementById("library-nav")?.classList.add("menu-active");
 if((!libTracks().length)&&typeof loadMusic==="function"){try{await loadMusic()}catch(e){}}
 await renderLibraryPlaylists();return false;
}
function switchLibraryTab(tab,btn){
 document.querySelectorAll(".lib-tabs button").forEach(b=>b.classList.toggle("active",b===btn));
 ["playlists","liked","recent"].forEach(x=>document.getElementById("library-"+x+"-view").style.display=x===tab?"block":"none");
 document.getElementById("library-detail").style.display="none";
 if(tab==="playlists")renderLibraryPlaylists();if(tab==="liked")renderLibraryLiked();if(tab==="recent")renderLibraryRecent();
}
function libraryNeedLogin(){
 const ok=!!libSession()?.user?.id;document.getElementById("library-login-note").style.display=ok?"none":"block";return ok;
}
async function libFetch(path,opt={}){
 const r=await fetch(SUPABASE_URL+"/rest/v1/"+path,{...opt,headers:{...libHeaders(true),...(opt.headers||{})}});
 if(!r.ok)throw new Error(await r.text());return r;
}
async function renderLibraryPlaylists(){
 const grid=document.getElementById("library-playlist-grid");grid.innerHTML="";
 if(!libraryNeedLogin())return;
 try{
  const r=await libFetch("playlists?select=id,name,description,created_at,playlist_items(track_id)&order=created_at.desc");
  const rows=await r.json();
  if(!rows.length){grid.innerHTML='<div class="lib-empty" style="grid-column:1/-1"><b>아직 플레이리스트가 없습니다.</b><br>좋아하는 곡을 모아 나만의 플레이리스트를 만들어보세요.</div>';return}
  grid.innerHTML=rows.map(p=>{const ids=(p.playlist_items||[]).map(x=>x.track_id),first=ids.map(libTrack).find(Boolean),cover=libCover(first);return `<div class="lib-card" onclick="openLibraryPlaylist('${p.id}')"><div class="lib-card-cover">${cover?`<img src="${libEsc(cover)}">`:"♪"}<button class="lib-card-menu" onclick="event.stopPropagation();openLibraryPlaylist('${p.id}')">•••</button></div><h3>${libEsc(p.name)}</h3><div class="lib-card-meta"><p>${ids.length}곡</p><p>${libEsc(p.description||"PLAYLIST")}</p></div></div>`}).join("");
 }catch(e){console.error(e);grid.innerHTML='<div class="lib-empty" style="grid-column:1/-1">라이브러리를 불러오지 못했습니다.<br>LIBRARY SQL 실행 여부를 확인해주세요.</div>'}
}
function openLibraryCreateModal(){if(!libraryNeedLogin()){document.getElementById("auth-modal").style.display="flex";return}document.getElementById("library-new-name").value="";document.getElementById("library-new-description").value="";document.getElementById("library-create-modal").style.display="flex"}
function closeLibraryCreateModal(){document.getElementById("library-create-modal").style.display="none"}
async function createLibraryPlaylist(){
 const s=libSession(),name=document.getElementById("library-new-name").value.trim(),description=document.getElementById("library-new-description").value.trim();
 if(!s?.user?.id||!name)return alert("플레이리스트 이름을 입력해주세요.");
 try{await libFetch("playlists",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({user_id:s.user.id,name,description})});closeLibraryCreateModal();await renderLibraryPlaylists()}catch(e){console.error(e);alert("플레이리스트 생성에 실패했습니다.")}
}
async function openLibraryPlaylist(id){
 try{
  const r=await libFetch("playlists?id=eq."+encodeURIComponent(id)+"&select=id,name,description,created_at,playlist_items(id,track_id,position,added_at)&limit=1");
  const p=(await r.json())[0];if(!p)return;
  libraryCurrentPlaylist=p;document.getElementById("library-playlists-view").style.display="none";document.getElementById("library-detail").style.display="block";
  const items=(p.playlist_items||[]).slice().sort((a,b)=>(a.position||0)-(b.position||0)),ts=items.map(i=>libTrack(i.track_id)).filter(Boolean);
  document.getElementById("lib-detail-name").textContent=p.name;document.getElementById("lib-detail-meta").textContent=(p.description?p.description+" · ":"")+ts.length+"곡";
  const cv=document.getElementById("lib-detail-cover"),cover=libCover(ts[0]);cv.innerHTML=cover?`<img src="${libEsc(cover)}">`:"♪";
  renderLibrarySongs(document.getElementById("lib-detail-songs"),ts,true);
 }catch(e){console.error(e)}
}
function closeLibraryDetail(){libraryCurrentPlaylist=null;document.getElementById("library-detail").style.display="none";document.getElementById("library-playlists-view").style.display="block";renderLibraryPlaylists()}
function renderLibrarySongs(el,arr,removable=false){
 if(!arr.length){el.innerHTML='<div class="lib-empty">표시할 곡이 없습니다.</div>';return}
 el.innerHTML=arr.map(t=>{const c=libCover(t);return `<div class="lib-song"><div class="lib-song-cover">${c?`<img src="${libEsc(c)}" style="width:100%;height:100%;object-fit:cover;border-radius:7px">`:"♪"}</div><div onclick="libraryPlayTrack('${t.id}')" style="cursor:pointer;min-width:0"><div class="lib-song-title">${libEsc(t.title)}</div><div class="lib-song-artist">${libEsc(t.artist)}</div></div><div class="lib-song-actions">${removable?`<button onclick="removeTrackFromLibraryPlaylist('${t.id}')">삭제</button>`:`<button onclick="openLibraryAddModal('${t.id}')">＋</button>`}</div></div>`}).join("")
}
async function renderLibraryLiked(){
 const el=document.getElementById("library-liked-list");if(!libraryNeedLogin()){el.innerHTML="";return}
 try{const r=await libFetch("track_likes?select=track_id&order=created_at.desc");const rows=await r.json();renderLibrarySongs(el,rows.map(x=>libTrack(x.track_id)).filter(Boolean))}catch(e){console.error(e);el.innerHTML='<div class="lib-empty">좋아요한 곡을 불러오지 못했습니다.</div>'}
}
async function renderLibraryRecent(){
 const el=document.getElementById("library-recent-list");if(!libraryNeedLogin()){el.innerHTML="";return}
 try{const r=await libFetch("listening_history?select=track_id,played_at&order=played_at.desc&limit=50");const rows=await r.json(),seen=new Set(),arr=[];for(const x of rows){if(!seen.has(String(x.track_id))){seen.add(String(x.track_id));const t=libTrack(x.track_id);if(t)arr.push(t)}}renderLibrarySongs(el,arr)}catch(e){console.error(e);renderLibrarySongs(el,libraryRecentMemory.map(libTrack).filter(Boolean))}
}
async function openLibraryAddModal(trackId){
 if(!libraryNeedLogin())return;libraryAddTrackId=trackId;
 try{const r=await libFetch("playlists?select=id,name&order=created_at.desc");const ps=await r.json(),box=document.getElementById("library-add-options");box.innerHTML=ps.length?ps.map(p=>`<button class="lib-add-option" onclick="addTrackToLibraryPlaylist('${p.id}')">${libEsc(p.name)}</button>`).join(""):'<div class="lib-empty">먼저 플레이리스트를 만들어주세요.</div>';document.getElementById("library-add-modal").style.display="flex"}catch(e){console.error(e)}
}
function closeLibraryAddModal(){document.getElementById("library-add-modal").style.display="none";libraryAddTrackId=null}
async function addTrackToLibraryPlaylist(pid){
 if(!libraryAddTrackId)return;
 try{
  const cr=await libFetch("playlist_items?playlist_id=eq."+encodeURIComponent(pid)+"&select=position&order=position.desc&limit=1"),last=(await cr.json())[0]?.position||0;
  await libFetch("playlist_items",{method:"POST",headers:{"Prefer":"resolution=ignore-duplicates,return=minimal"},body:JSON.stringify({playlist_id:pid,track_id:libraryAddTrackId,position:last+1})});
  closeLibraryAddModal();alert("플레이리스트에 추가했습니다.");
 }catch(e){console.error(e);alert("곡 추가에 실패했습니다.")}
}
async function removeTrackFromLibraryPlaylist(trackId){
 if(!libraryCurrentPlaylist||!confirm("이 곡을 플레이리스트에서 삭제할까요?"))return;
 try{await libFetch("playlist_items?playlist_id=eq."+encodeURIComponent(libraryCurrentPlaylist.id)+"&track_id=eq."+encodeURIComponent(trackId),{method:"DELETE"});openLibraryPlaylist(libraryCurrentPlaylist.id)}catch(e){console.error(e)}
}
async function deleteCurrentLibraryPlaylist(){
 if(!libraryCurrentPlaylist||!confirm("플레이리스트를 삭제할까요?"))return;
 try{await libFetch("playlists?id=eq."+encodeURIComponent(libraryCurrentPlaylist.id),{method:"DELETE"});closeLibraryDetail()}catch(e){console.error(e)}
}
function libraryPlayTrack(id){
 const t=libTrack(id);if(!t)return;
 recordLibraryRecent(id);
 if(typeof amkinaPlayChartTrack==="function")return amkinaPlayChartTrack(id);
 if(typeof playTrack==="function")return playTrack(t);
}
function playLibraryPlaylist(){
 if(!libraryCurrentPlaylist)return;const ids=(libraryCurrentPlaylist.playlist_items||[]).slice().sort((a,b)=>(a.position||0)-(b.position||0)).map(x=>x.track_id);if(ids.length)libraryPlayTrack(ids[0])
}
async function recordLibraryRecent(trackId){
 const s=libSession();libraryRecentMemory=[trackId,...libraryRecentMemory.filter(x=>String(x)!==String(trackId))].slice(0,50);
 if(!s?.user?.id)return;
 try{await libFetch("listening_history",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({user_id:s.user.id,track_id:trackId})})}catch(e){}
}
function libraryOpenSmart(tab){
 const btn=document.querySelector('.lib-tabs button[data-libtab="'+(tab==="top"?"recent":tab)+'"]');
 if(tab==="liked"){switchLibraryTab("liked",btn);return}
 if(tab==="recent"){switchLibraryTab("recent",btn);return}
 document.querySelectorAll(".lib-tabs button").forEach(b=>b.classList.remove("active"));
 ["library-playlists-view","library-liked-view"].forEach(id=>document.getElementById(id).style.display="none");
 document.getElementById("library-recent-view").style.display="block";
 const arr=[...libTracks()].sort((a,b)=>Number(b.play_count||0)-Number(a.play_count||0)).slice(0,20);
 renderLibrarySongs(document.getElementById("library-recent-list"),arr);
}
function libraryApplySearch(){
 const q=(document.getElementById("library-search")?.value||"").trim().toLowerCase();
 const sort=document.getElementById("library-sort")?.value||"recent";
 document.querySelectorAll("#library-playlist-grid .lib-card").forEach(card=>{
   const txt=card.textContent.toLowerCase();card.style.display=!q||txt.includes(q)?"block":"none";
 });
 const visible=document.querySelector("#library-liked-view")?.style.display!=="none"?document.getElementById("library-liked-list"):document.querySelector("#library-recent-view")?.style.display!=="none"?document.getElementById("library-recent-list"):null;
 if(visible&&q)visible.querySelectorAll(".lib-song").forEach(row=>row.style.display=row.textContent.toLowerCase().includes(q)?"grid":"none");
}
async function refreshLibrarySmartCounts(){
 if(!libSession()?.user?.id)return;
 try{
   const [lr,rr]=await Promise.all([libFetch("track_likes?select=track_id"),libFetch("listening_history?select=track_id&limit=100")]);
   const likes=await lr.json(),recent=await rr.json();
   const a=document.getElementById("lib-liked-count"),b=document.getElementById("lib-recent-count");
   if(a)a.textContent=likes.length+"곡 저장됨";
   if(b)b.textContent=new Set(recent.map(x=>String(x.track_id))).size+"곡 재생 기록";
 }catch(e){}
}
const _oldShowLibraryPage=showLibraryPage;
showLibraryPage=async function(e){const r=await _oldShowLibraryPage(e);refreshLibrarySmartCounts();return r}

/* ===== AMKINA SCRIPT BLOCK 24 | id="amkina-library-page-switch-fix" ===== */
(function(){
  function hideLibrary(){
    const p=document.getElementById("library-page");
    if(p){
      p.style.setProperty("display","none","important");
      p.classList.remove("active");
    }
    const d=document.getElementById("library-detail");
    if(d) d.style.display="none";
  }
  window.hideLibraryPage = hideLibrary;

  // 기존 페이지 전환 함수들을 감싸서 LIBRARY가 반드시 닫히게 한다.
  [
    "showHome",
    "showHomePage",
    "showMusic",
    "showMusicPage",
    "showStudio",
    "showStudioPage",
    "showCommunity",
    "showCommunityPage",
    "showChart100",
    "showChart100Page",
    "showMyPage",
    "showMypage",
    "showArtistsPage"
  ].forEach(function(name){
    const original=window[name];
    if(typeof original==="function" && !original.__librarySwitchWrapped){
      const wrapped=function(){
        hideLibrary();
        return original.apply(this,arguments);
      };
      wrapped.__librarySwitchWrapped=true;
      window[name]=wrapped;
    }
  });

  // 사이드바에서 LIBRARY 이외의 메뉴를 누르면 먼저 LIBRARY를 닫는다.
  document.addEventListener("click",function(e){
    const a=e.target.closest(".amkina-sidebar-nav a");
    if(!a || a.id==="library-nav") return;
    hideLibrary();
  },true);
})();

/* ===== AMKINA SCRIPT BLOCK 25 | id="amkina-real-notices-v1" ===== */
const AMKINA_ADMIN_EMAIL="psy88all@naver.com";
let amkinaNotices=[], currentNotice=null, editingNoticeId=null;
function noticeSession(){try{return JSON.parse(localStorage.getItem("amkina_session")||"null")}catch(e){return null}}
function noticeIsAdmin(){return String(noticeSession()?.user?.email||"").toLowerCase()===AMKINA_ADMIN_EMAIL}
function noticeHeaders(auth=false){const ss=noticeSession(),h={"apikey":SUPABASE_ANON_KEY,"Content-Type":"application/json"};h.Authorization="Bearer "+(auth&&ss?.access_token?ss.access_token:SUPABASE_ANON_KEY);return h}
function noticeEsc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function noticeClass(c){return c==="공지"?"important":c==="업데이트"?"update":"info"}
function noticeDate(v){try{return new Date(v).toLocaleDateString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit"}).replace(/\. /g,".").replace(/\.$/,"")}catch(e){return ""}}
function noticeRow(n){return `<div class="amkina-notice-row" onclick="openNoticeDetail('${n.id}')"><span class="amkina-notice-badge ${noticeClass(n.category)}">${noticeEsc(n.category||"안내")}</span><span class="amkina-notice-text">${n.pinned?"📌 ":""}${noticeEsc(n.title)}</span><span class="amkina-notice-date">${noticeDate(n.created_at)}</span></div>`}
async function loadNotices(){
 const box=document.getElementById("notice-list");if(!box)return;
 document.getElementById("notice-admin-write").style.display=noticeIsAdmin()?"inline-block":"none";
 try{
  const r=await fetch(SUPABASE_URL+"/rest/v1/notices?select=*&order=pinned.desc,created_at.desc&limit=100",{headers:noticeHeaders(false)});
  if(!r.ok)throw new Error(await r.text());amkinaNotices=await r.json();
  box.innerHTML=amkinaNotices.length?amkinaNotices.slice(0,3).map(noticeRow).join(""):'<div class="notice-empty">등록된 공지사항이 없습니다.</div>';
 }catch(e){console.error("공지사항:",e);box.innerHTML='<div class="notice-empty">공지사항을 불러오지 못했습니다.</div>'}
}
function openNoticeDetail(id){currentNotice=amkinaNotices.find(n=>String(n.id)===String(id));if(!currentNotice)return;document.getElementById("notice-detail-badge").innerHTML=`<span class="amkina-notice-badge ${noticeClass(currentNotice.category)}">${noticeEsc(currentNotice.category)}</span>`;document.getElementById("notice-detail-title").textContent=currentNotice.title;document.getElementById("notice-detail-date").textContent=noticeDate(currentNotice.created_at);document.getElementById("notice-detail-content").textContent=currentNotice.content||"";document.getElementById("notice-detail-admin").style.display=noticeIsAdmin()?"flex":"none";document.getElementById("notice-detail-modal").style.display="flex"}
function closeNoticeDetail(){document.getElementById("notice-detail-modal").style.display="none";currentNotice=null}
function openNoticeWriteModal(){if(!noticeIsAdmin())return alert("관리자만 공지사항을 작성할 수 있습니다.");editingNoticeId=null;document.getElementById("notice-write-heading").textContent="공지 작성";document.getElementById("notice-write-category").value="공지";document.getElementById("notice-write-title").value="";document.getElementById("notice-write-content").value="";document.getElementById("notice-write-pinned").checked=false;document.getElementById("notice-write-modal").style.display="flex"}
function closeNoticeWriteModal(){document.getElementById("notice-write-modal").style.display="none";editingNoticeId=null}
function editCurrentNotice(){if(!noticeIsAdmin()||!currentNotice)return;const n=currentNotice;closeNoticeDetail();editingNoticeId=n.id;document.getElementById("notice-write-heading").textContent="공지 수정";document.getElementById("notice-write-category").value=n.category||"공지";document.getElementById("notice-write-title").value=n.title||"";document.getElementById("notice-write-content").value=n.content||"";document.getElementById("notice-write-pinned").checked=!!n.pinned;document.getElementById("notice-write-modal").style.display="flex"}
async function saveNotice(){
 if(!noticeIsAdmin())return alert("관리자만 작성할 수 있습니다.");
 const title=document.getElementById("notice-write-title").value.trim(),content=document.getElementById("notice-write-content").value.trim(),category=document.getElementById("notice-write-category").value,pinned=document.getElementById("notice-write-pinned").checked;
 if(!title||!content)return alert("제목과 내용을 입력해주세요.");
 const body={title,content,category,pinned,updated_at:new Date().toISOString()};
 const url=SUPABASE_URL+"/rest/v1/notices"+(editingNoticeId?"?id=eq."+encodeURIComponent(editingNoticeId):"");
 const r=await fetch(url,{method:editingNoticeId?"PATCH":"POST",headers:{...noticeHeaders(true),"Prefer":"return=minimal"},body:JSON.stringify(body)});
 if(!r.ok){console.error(await r.text());return alert("공지 저장에 실패했습니다. 공지사항 SQL 실행 여부를 확인해주세요.")}
 closeNoticeWriteModal();await loadNotices();alert(editingNoticeId?"공지사항을 수정했습니다.":"공지사항을 게시했습니다.");
}
async function deleteCurrentNotice(){if(!noticeIsAdmin()||!currentNotice||!confirm("이 공지사항을 삭제할까요?"))return;const r=await fetch(SUPABASE_URL+"/rest/v1/notices?id=eq."+encodeURIComponent(currentNotice.id),{method:"DELETE",headers:noticeHeaders(true)});if(!r.ok)return alert("삭제에 실패했습니다.");closeNoticeDetail();await loadNotices()}
function openNoticeAll(){document.getElementById("notice-all-list").innerHTML=amkinaNotices.length?amkinaNotices.map(noticeRow).join(""):'<div class="notice-empty">등록된 공지사항이 없습니다.</div>';document.getElementById("notice-all-modal").style.display="flex"}
function closeNoticeAll(){document.getElementById("notice-all-modal").style.display="none"}
document.addEventListener("DOMContentLoaded",()=>setTimeout(loadNotices,400));
window.addEventListener("focus",()=>{const b=document.getElementById("notice-admin-write");if(b)b.style.display=noticeIsAdmin()?"inline-block":"none"});

/* ===== AMKINA SCRIPT BLOCK 26 | id="amkina-track-action-menu-v1" ===== */
let amkinaActionTrackId=null;
function actionMenuSession(){try{return JSON.parse(localStorage.getItem("amkina_session")||"null")}catch(e){return null}}
function actionMenuTrack(id){return (typeof tracks!=="undefined"&&Array.isArray(tracks)?tracks:[]).find(t=>String(t.id)===String(id))}
function actionMenuCanEdit(t){const s=actionMenuSession();if(!s?.user?.id||!t)return false;return String(s.user.email||"").toLowerCase()==="psy88all@naver.com"||!!(t.uploader_id&&String(t.uploader_id)===String(s.user.id))}
function actionMenuLiked(id){return typeof amkinaTrackLikes!=="undefined"&&amkinaTrackLikes?.has(String(id))}
function openTrackActionMenu(id,button){
 const menu=document.getElementById("track-action-menu"),t=actionMenuTrack(id);if(!menu||!t)return;amkinaActionTrackId=String(id);
 const canEdit=actionMenuCanEdit(t),liked=actionMenuLiked(id);
 menu.innerHTML=`<button onclick="actionMenuPlay()"><span class="menu-icon">▶</span>재생하기</button>
 <button onclick="actionMenuLike()"><span class="menu-icon">${liked?"♥":"♡"}</span>${liked?"좋아요 취소":"좋아요 누르기"}</button>
 <button onclick="actionMenuComment()"><span class="menu-icon">▢</span>댓글 달기</button>
 <button onclick="actionMenuPlaylist()"><span class="menu-icon">＋</span>플레이리스트에 추가</button>
 <button onclick="actionMenuOpenPage()"><span class="menu-icon">▣</span>곡 페이지 열기</button>
 <button onclick="copyTrackShareLink()"><span class="menu-icon">↗</span>링크 복사</button>
 ${canEdit?`<div class="menu-sep"></div><button onclick="actionMenuEdit()"><span class="menu-icon">✎</span>노래 정보 수정</button>`:""}`;
 menu.style.display="block";const r=button.getBoundingClientRect(),mw=218,mh=menu.offsetHeight||260;
 let left=Math.max(10,Math.min(r.right-mw,window.innerWidth-mw-10));let top=r.bottom+7;if(top+mh>window.innerHeight-10)top=Math.max(10,r.top-mh-7);
 menu.style.left=left+"px";menu.style.top=top+"px";
}
function closeTrackActionMenu(){const m=document.getElementById("track-action-menu");if(m)m.style.display="none";amkinaActionTrackId=null}
function actionMenuPlay(){const id=amkinaActionTrackId;closeTrackActionMenu();const idx=(typeof tracks!=="undefined"?tracks:[]).findIndex(x=>String(x.id)===String(id));if(idx>=0&&typeof playTrack==="function")playTrack(idx)}
async function actionMenuLike(){const id=amkinaActionTrackId;closeTrackActionMenu();if(id&&typeof toggleTrackLike==="function")await toggleTrackLike(id)}
function actionMenuComment(){const id=amkinaActionTrackId;closeTrackActionMenu();if(id&&typeof openTrackComments==="function")openTrackComments(id)}
function actionMenuPlaylist(){const id=amkinaActionTrackId;closeTrackActionMenu();if(id&&typeof openLibraryAddModal==="function")openLibraryAddModal(id)}
function actionMenuOpenPage(){const id=amkinaActionTrackId;closeTrackActionMenu();if(id&&typeof openTrackFullPage==="function")openTrackFullPage(id)}
function actionMenuEdit(){const id=amkinaActionTrackId;closeTrackActionMenu();if(id&&typeof openTrackEdit==="function")openTrackEdit(id)}
async function copyTrackShareLink(){
 const id=amkinaActionTrackId,t=actionMenuTrack(id);closeTrackActionMenu();if(!id)return;
 const link="https://bbtzasddvodrprpnbeos.supabase.co/functions/v1/track-share?id="+encodeURIComponent(id);
 try{await navigator.clipboard.writeText(link)}catch(e){const ta=document.createElement("textarea");ta.value=link;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove()}
 const toast=document.getElementById("track-link-toast");if(toast){toast.textContent="🔗 "+(t?.title||"음원")+" 앨범커버 공유 링크가 복사되었습니다.";toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1800)}
}
document.addEventListener("click",e=>{const m=document.getElementById("track-action-menu");if(m&&m.style.display==="block"&&!e.target.closest("#track-action-menu")&&!e.target.closest(".track-edit-btn"))closeTrackActionMenu()});
window.addEventListener("scroll",closeTrackActionMenu,true);window.addEventListener("resize",closeTrackActionMenu);document.addEventListener("keydown",e=>{if(e.key==="Escape")closeTrackActionMenu()});

/* ===== AMKINA SCRIPT BLOCK 27 | id="amkina-full-track-page-v1" ===== */
let tfTrackId=null, tfStartY=null, tfDragging=false;
function tfTrack(id){return (typeof tracks!=="undefined"&&Array.isArray(tracks)?tracks:[]).find(t=>String(t.id)===String(id))}
function tfCurrent(){return currentIndex>=0&&tracks[currentIndex]?tracks[currentIndex]:tfTrack(tfTrackId)}
function tfCover(t){return t?.cover_url||t?.cover||"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'%3E%3Crect width='500' height='500' fill='%23111'/%3E%3Ctext x='250' y='260' text-anchor='middle' fill='white' font-family='Arial' font-size='38' font-weight='700'%3EAMKINA MUSIC%3C/text%3E%3C/svg%3E"}
function tfLyrics(t){return String(t?.lyrics||t?.lyric||t?.lyrics_text||"").trim()}
function renderTrackFullPage(t){
 if(!t)return;tfTrackId=String(t.id);
 document.getElementById("tf-cover").src=tfCover(t);document.getElementById("tf-title").textContent=t.title||"Untitled";document.getElementById("tf-artist").textContent=t.artist||"AMKINA";document.getElementById("tf-lyrics-title").textContent=t.title||"";
 const lyr=tfLyrics(t);document.getElementById("tf-lyrics").textContent=lyr||"등록된 가사가 없습니다.";
 const liked=typeof amkinaTrackLikes!=="undefined"&&amkinaTrackLikes?.has(String(t.id));document.getElementById("tf-like").textContent=liked?"♥ 좋아요 취소":"♡ 좋아요";
}
function selectTrackForFullPage(id){
 const idx=(typeof tracks!=="undefined"&&Array.isArray(tracks))?tracks.findIndex(x=>String(x.id)===String(id)):-1;
 if(idx<0)return null;
 const t=tracks[idx];
 currentIndex=idx;
 // 상세페이지를 열 때는 자동재생하지 않고 실제 오디오 소스만 해당 곡으로 정확히 맞춘다.
 if(audio){
   const wanted=String(t.audio_url||"");
   if(wanted && audio.src!==wanted){
     audio.pause();
     audio.src=wanted;
     audio.load();
   }
 }
 const cover=document.getElementById("now-cover");
 if(cover)cover.src=t.cover_url||tfCover(t);
 const nt=document.getElementById("now-title");if(nt)nt.textContent=t.title||"Untitled";
 const na=document.getElementById("now-artist");if(na)na.textContent=t.artist||"AMKINA";
 if(typeof refreshLyricsButton==="function")refreshLyricsButton();
 if(typeof renderCompactLyrics==="function")renderCompactLyrics();
 return t;
}
function openTrackFullPage(id,opts={}){
 const t=selectTrackForFullPage(id)||tfTrack(id);if(!t)return false;renderTrackFullPage(t);
 const p=document.getElementById("track-full-page");p.style.display="block";requestAnimationFrame(()=>p.classList.add("open"));document.body.classList.add("track-full-open");
 if(opts.updateUrl!==false){const u=new URL(location.href);u.searchParams.set("track",t.id);history.pushState({track:t.id},"",u)}
 return true;
}
function closeTrackFullPage(updateUrl=true){
 const p=document.getElementById("track-full-page");p.classList.remove("open");document.body.classList.remove("track-full-open");setTimeout(()=>{if(!p.classList.contains("open"))p.style.display="none"},330);
 if(updateUrl){const u=new URL(location.href);u.searchParams.delete("track");history.pushState({},"",u)}
}
function tfTogglePlay(){
 const t=tfTrack(tfTrackId);if(!t)return;
 if(currentIndex<0 || !tracks[currentIndex] || String(tracks[currentIndex].id)!==String(t.id)){
   selectTrackForFullPage(t.id);
 }
 if(audio.paused){
   audio.play().catch(e=>console.warn("재생 실패",e));
 }else{
   audio.pause();
 }
}
function tfLike(){const t=tfCurrent();if(t&&typeof toggleTrackLike==="function"){toggleTrackLike(t.id).then(()=>renderTrackFullPage(t))}}
function tfComment(){const t=tfCurrent();if(t&&typeof openTrackComments==="function")openTrackComments(t.id)}
function tfPlaylist(){const t=tfCurrent();if(t&&typeof openLibraryAddModal==="function")openLibraryAddModal(t.id)}
async function tfCopy(){
 const t=tfCurrent();if(!t)return;
 const link="https://bbtzasddvodrprpnbeos.supabase.co/functions/v1/track-share?id="+encodeURIComponent(t.id);
 try{await navigator.clipboard.writeText(link)}catch(e){const ta=document.createElement("textarea");ta.value=link;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove()}
 const toast=document.getElementById("track-link-toast");if(toast){toast.textContent="🔗 "+(t.title||"음원")+" 앨범커버 공유 링크가 복사되었습니다.";toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1800)}
}
function syncTfPlayButton(){const b=document.getElementById("tf-main-play");if(b)b.textContent=audio&&!audio.paused?"❚❚":"▶"}
if(typeof audio!=="undefined"){audio.addEventListener("play",syncTfPlayButton);audio.addEventListener("pause",syncTfPlayButton)}
function openCurrentTrackFull(){const t=tfCurrent();if(t)openTrackFullPage(t.id)}
document.addEventListener("DOMContentLoaded",()=>{
 const now=document.querySelector(".player .now");if(now)now.addEventListener("click",openCurrentTrackFull);
 const player=document.querySelector(".player");
 if(player){
  player.addEventListener("pointerdown",e=>{if(e.target.closest("button,input"))return;tfStartY=e.clientY;tfDragging=true});
  player.addEventListener("pointerup",e=>{if(!tfDragging)return;const dy=e.clientY-tfStartY;tfDragging=false;if(dy<-45)openCurrentTrackFull()});
 }
});
window.addEventListener("popstate",()=>{const id=new URL(location.href).searchParams.get("track");if(id)openTrackFullPage(id,{updateUrl:false});else closeTrackFullPage(false)});
async function openDeepLinkedTrack(){
 const id=new URL(location.href).searchParams.get("track");if(!id)return;
 if((typeof tracks==="undefined"||!Array.isArray(tracks)||!tracks.length)&&typeof loadMusic==="function"){try{await loadMusic()}catch(e){}}
 let tries=0;
 const go=()=>{
   const idx=(typeof tracks!=="undefined"&&Array.isArray(tracks))?tracks.findIndex(x=>String(x.id)===String(id)):-1;
   if(idx>=0){
     selectTrackForFullPage(id);
     openTrackFullPage(id,{updateUrl:false});
     return;
   }
   if(++tries<30)setTimeout(go,150);
 };
 go();
}
setTimeout(openDeepLinkedTrack,250);

/* ===== AMKINA SCRIPT BLOCK 28 | id="amkina-visitors-v1-script" ===== */
(function(){
  const COUNT_INTERVAL = 2 * 60 * 60 * 1000; // same browser: max once every 6 hours
  const LAST_KEY = "amkina_last_visit_counted_at_v1";
  const VISITOR_KEY = "amkina_visitor_id_v1";

  function uid(){
    let id=localStorage.getItem(VISITOR_KEY);
    if(!id){
      id=(crypto&&crypto.randomUUID)?crypto.randomUUID():(Date.now().toString(36)+Math.random().toString(36).slice(2));
      localStorage.setItem(VISITOR_KEY,id);
    }
    return id;
  }
  function headers(json){
    const h={"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY};
    if(json) h["Content-Type"]="application/json";
    return h;
  }
  function fmt(n){return Number(n||0).toLocaleString("ko-KR")}
  function mount(){
    if(document.getElementById("amkina-visitors-card")) return true;
    const lang=document.getElementById("amkina-language-menu");
    if(!lang) return false;
    const card=document.createElement("section");
    card.id="amkina-visitors-card";
    card.innerHTML=`<div class="akv-label"><span class="akv-dot"></span> VISITORS</div>
      <div id="akv-total" class="akv-total">—</div>
      <div class="akv-caption">TOTAL VISITS</div>
      <div class="akv-bottom"><span class="akv-today-label">TODAY</span><span id="akv-today" class="akv-today">—</span></div>
      <div id="akv-status" class="akv-status"></div>`;
    lang.insertAdjacentElement("afterend",card);
    return true;
  }
  async function recordVisit(){
    const last=Number(localStorage.getItem(LAST_KEY)||0);
    if(Date.now()-last < COUNT_INTERVAL) return;
    const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/amkina_record_visit",{
      method:"POST",headers:headers(true),body:JSON.stringify({p_visitor_id:uid()})
    });
    if(!r.ok) throw new Error("record "+r.status+" "+await r.text());
    localStorage.setItem(LAST_KEY,String(Date.now()));
  }
  async function loadStats(){
    const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/amkina_visit_stats",{
      method:"POST",headers:headers(true),body:"{}"
    });
    if(!r.ok) throw new Error("stats "+r.status+" "+await r.text());
    const data=await r.json();
    const row=Array.isArray(data)?data[0]:data;
    document.getElementById("akv-total").textContent=fmt(row?.total_visits);
    document.getElementById("akv-today").textContent="+"+fmt(row?.today_visits);
  }
  async function start(){
    if(!mount()){setTimeout(start,500);return}
    try{await recordVisit();await loadStats()}
    catch(e){
      console.warn("AMKINA visitor counter:",e);
      const s=document.getElementById("akv-status");
      if(s){s.textContent="VISITOR DB SETUP REQUIRED";s.style.display="block"}
    }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(start,700));
  else setTimeout(start,700);
  window.addEventListener("focus",()=>{if(document.getElementById("amkina-visitors-card"))loadStats().catch(()=>{})});
})();

/* ===== AMKINA SCRIPT BLOCK 29 | id="amkina-collab-hub-script-v1" ===== */
(function(){
 let filter='전체',rows=[];
 const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const session=()=>{try{return JSON.parse(localStorage.getItem('amkina_session')||'null')}catch(e){return null}};
 const headers=(auth=false)=>{const s=session();return {'apikey':SUPABASE_ANON_KEY,'Authorization':'Bearer '+(auth&&s?.access_token?s.access_token:SUPABASE_ANON_KEY),'Content-Type':'application/json'}};
 function mount(){const view=document.getElementById('artist-list-view');if(!view||document.getElementById('ak-artist-tabs'))return;const head=view.querySelector('.artist-page-head');if(!head)return;head.insertAdjacentHTML('afterend','<div id="ak-artist-tabs" class="ak-artist-tabs"><button class="ak-artist-tab active" data-akartist="artists">ARTISTS</button><button class="ak-artist-tab" data-akartist="collab">COLLAB</button></div><div id="ak-collab-view"><div class="ak-collab-toolbar"><button class="ak-collab-filter active" data-role="전체">전체</button><button class="ak-collab-filter" data-role="보컬">보컬</button><button class="ak-collab-filter" data-role="랩">랩</button><button class="ak-collab-filter" data-role="작사">작사</button><button class="ak-collab-filter" data-role="작곡">작곡</button><button class="ak-collab-filter" data-role="프로듀싱">프로듀싱</button><button class="ak-collab-filter" data-role="커버아트">커버아트</button><button class="ak-collab-write" onclick="akOpenCollabModal()">+ 협업 모집</button></div><div id="ak-collab-grid" class="ak-collab-grid"></div></div>');
 document.getElementById('ak-artist-tabs').addEventListener('click',e=>{const b=e.target.closest('.ak-artist-tab');if(!b)return;document.querySelectorAll('.ak-artist-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');const col=b.dataset.akartist==='collab';document.getElementById('artist-grid').style.display=col?'none':'';document.getElementById('ak-collab-view').style.display=col?'block':'none';document.getElementById('artist-search').style.display=col?'none':'';if(col)load();});
 document.getElementById('ak-collab-view').addEventListener('click',e=>{const b=e.target.closest('.ak-collab-filter');if(!b)return;document.querySelectorAll('.ak-collab-filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.role;paint();});}
 async function load(){const g=document.getElementById('ak-collab-grid');if(!g)return;g.innerHTML='<div class="ak-collab-empty">협업 모집을 불러오는 중...</div>';try{const r=await fetch(SUPABASE_URL+'/rest/v1/collab_posts?select=*&order=created_at.desc&limit=100',{headers:headers()});if(!r.ok)throw new Error(await r.text());rows=await r.json();paint()}catch(e){console.warn(e);g.innerHTML='<div class="ak-collab-empty"><b>COLLAB 공간 준비가 필요합니다.</b><br><br>함께 드린 Supabase SQL을 한 번 실행하면<br>회원들이 실제로 협업 모집글을 올릴 수 있습니다.</div>'}}
 function paint(){const g=document.getElementById('ak-collab-grid');if(!g)return;const list=rows.filter(x=>filter==='전체'||x.role===filter);if(!list.length){g.innerHTML='<div class="ak-collab-empty">현재 모집 중인 협업이 없습니다.<br>첫 COLLAB을 시작해보세요.</div>';return}g.innerHTML=list.map(x=>'<article class="ak-collab-card"><div class="ak-collab-top"><span class="ak-collab-role">'+esc(x.role||'COLLAB')+'</span><span class="ak-collab-status '+(x.status==='open'?'open':'')+'">'+(x.status==='open'?'모집중':'마감')+'</span></div><div class="ak-collab-title">'+esc(x.title)+'</div><div class="ak-collab-desc">'+esc(x.description||'')+'</div><div class="ak-collab-meta"><span class="ak-collab-author">'+esc(x.author_name||'AMKINA ARTIST')+'</span><span>'+esc(x.genre||'ALL GENRE')+'</span><span>'+new Date(x.created_at).toLocaleDateString('ko-KR')+'</span></div></article>').join('')}
 window.akOpenCollabModal=function(prefill=''){const s=session();if(!s?.user?.id){alert('협업 모집은 로그인이 필요합니다.');document.getElementById('auth-modal').style.display='flex';return}document.getElementById('ak-col-title').value=prefill?prefill+'님과 협업하고 싶습니다':'';document.getElementById('ak-collab-modal').style.display='flex'};
 window.akCloseCollabModal=function(){document.getElementById('ak-collab-modal').style.display='none'};
 window.akSubmitCollab=async function(){const s=session();if(!s?.user?.id)return;const title=document.getElementById('ak-col-title').value.trim(),description=document.getElementById('ak-col-desc').value.trim();if(title.length<2||description.length<2)return alert('제목과 상세 내용을 입력해주세요.');const body={user_id:s.user.id,author_name:(s.user.email||'AMKINA ARTIST').split('@')[0],role:document.getElementById('ak-col-role').value,title,genre:document.getElementById('ak-col-genre').value.trim(),description,status:'open'};const r=await fetch(SUPABASE_URL+'/rest/v1/collab_posts',{method:'POST',headers:{...headers(true),'Prefer':'return=minimal'},body:JSON.stringify(body)});if(!r.ok){console.error(await r.text());return alert('COLLAB 등록에 실패했습니다. 함께 드린 Supabase SQL을 먼저 실행해주세요.')}akCloseCollabModal();document.getElementById('ak-col-title').value='';document.getElementById('ak-col-desc').value='';await load()};
 const oldShow=window.showArtistsPage;if(typeof oldShow==='function')window.showArtistsPage=async function(){const r=await oldShow.apply(this,arguments);mount();return r};
 const oldDetail=window.openArtistDetail;if(typeof oldDetail==='function')window.openArtistDetail=function(key){oldDetail.apply(this,arguments);setTimeout(()=>{const a=(typeof amkinaArtistGroups==='function'?amkinaArtistGroups():[]).find(x=>x.key===key),hero=document.querySelector('#artist-detail .artist-hero');if(hero&&a&&!hero.querySelector('.artist-collab-btn')){const btn=document.createElement('button');btn.className='artist-collab-btn';btn.textContent='COLLAB 요청';btn.onclick=e=>{e.stopPropagation();akOpenCollabModal(a.name)};const target=hero.querySelector('.artist-detail-sub')?.parentElement||hero;target.appendChild(btn)}},0)};
 document.addEventListener('DOMContentLoaded',mount);setTimeout(mount,500);
})();

/* ===== AMKINA SCRIPT BLOCK 30 | id="amkina-community-hub-v2-script" ===== */
(function(){
 const state={likes:{},comments:{},myLikes:new Set(),attached:null,feedbackTag:"",mode:"feed"};
 const sess=()=>{try{return JSON.parse(localStorage.getItem('amkina_session')||'null')}catch(e){return null}};
 const esc=v=>typeof escapeCommunity==='function'?escapeCommunity(v):String(v||'').replace(/[&<>"']/g,'');
 function trackById(id){return (typeof tracks!=='undefined'&&Array.isArray(tracks)?tracks:[]).find(t=>String(t.id)===String(id))}
 function ensureUI(){
  const shell=document.querySelector('#community .community-shell'),head=shell?.querySelector('.community-head'),toolbar=shell?.querySelector('.community-toolbar');if(!shell||!head||!toolbar)return;
  if(!document.getElementById('akc-hero'))head.insertAdjacentHTML('afterend',`<section class="akc-hero" id="akc-hero"><div class="akc-hero-copy"><div class="akc-eyebrow">AMKINA MUSIC COMMUNITY</div><h2>듣고, 나누고, 함께 만드세요.</h2><p>신곡을 공유하고 피드백을 주고받으며 새로운 협업 파트너를 발견하는 음악 커뮤니티.</p></div><div class="akc-hero-stats"><div class="akc-hero-stat"><b id="akc-posts">0</b><span>POSTS</span></div><div class="akc-hero-stat"><b id="akc-artists">0</b><span>CREATORS</span></div><div class="akc-hero-stat"><b id="akc-reactions">0</b><span>REACTIONS</span></div></div></section><div class="akc-tabs"><button class="akc-tab active" data-akcmode="feed">FEED</button><button class="akc-tab" data-akcmode="music">신곡공유</button><button class="akc-tab" data-akcmode="feedback">피드백</button><button class="akc-tab" data-akcmode="collab">COLLAB</button><button class="akc-tab" data-akcmode="free">자유</button></div><section class="akc-hot" id="akc-hot"><div class="akc-section-head"><h3>HOT NOW</h3><span>커뮤니티에서 반응이 좋은 이야기</span></div><div class="akc-hot-grid" id="akc-hot-grid"></div></section>`);
  let cf=toolbar.querySelector('[data-filter="collab"]');if(!cf){const free=toolbar.querySelector('[data-filter="free"]');free?.insertAdjacentHTML('beforebegin','<button class="community-filter" data-filter="collab">COLLAB</button>')}
  document.querySelectorAll('.akc-tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.akc-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.mode=b.dataset.akcmode;communityFilter=state.mode==='feed'?'all':state.mode;document.querySelectorAll('.community-filter').forEach(x=>x.classList.toggle('active',x.dataset.filter===communityFilter));renderCommunityPosts()});
  enhanceComposer();
 }
 function enhanceComposer(){const cat=document.getElementById('community-category'),ta=document.getElementById('community-content');if(cat&&!cat.querySelector('option[value="collab"]'))cat.insertAdjacentHTML('beforeend','<option value="collab">COLLAB</option>');if(ta&&!document.getElementById('akc-attach'))ta.insertAdjacentHTML('afterend',`<div class="akc-attach" id="akc-attach"><div class="akc-attach-title">내 음원 첨부 <span style="font-weight:400;color:#999">· 선택사항</span></div><select id="akc-track-select" class="akc-track-select"><option value="">음원을 첨부하지 않음</option></select><div class="akc-feedback-tags" id="akc-feedback-tags"><button type="button" class="akc-feedback-tag" data-tag="보컬">보컬</button><button type="button" class="akc-feedback-tag" data-tag="멜로디">멜로디</button><button type="button" class="akc-feedback-tag" data-tag="가사">가사</button><button type="button" class="akc-feedback-tag" data-tag="믹싱">믹싱</button><button type="button" class="akc-feedback-tag" data-tag="전체 느낌">전체 느낌</button></div></div>`);document.querySelectorAll('.akc-feedback-tag').forEach(b=>b.onclick=()=>{document.querySelectorAll('.akc-feedback-tag').forEach(x=>x.classList.remove('active'));if(state.feedbackTag===b.dataset.tag){state.feedbackTag=''}else{state.feedbackTag=b.dataset.tag;b.classList.add('active')}})}
 async function fillMyTracks(){const sel=document.getElementById('akc-track-select'),s=sess();if(!sel||!s?.user?.id)return;try{const r=await fetch(SUPABASE_URL+'/rest/v1/tracks?uploader_id=eq.'+encodeURIComponent(s.user.id)+'&select=id,title,artist,cover_url&order=id.desc',{headers:communityHeaders(false)});if(!r.ok)return;const a=await r.json();sel.innerHTML='<option value="">음원을 첨부하지 않음</option>'+a.map(t=>`<option value="${esc(t.id)}">${esc(t.title)} · ${esc(t.artist||'AMKINA')}</option>`).join('')}catch(e){}}
 async function social(){try{const [l,c]=await Promise.all([fetch(SUPABASE_URL+'/rest/v1/community_post_likes?select=post_id,user_id',{headers:communityHeaders(false)}),fetch(SUPABASE_URL+'/rest/v1/community_comments?select=post_id',{headers:communityHeaders(false)})]);state.likes={};state.comments={};state.myLikes=new Set();if(l.ok)(await l.json()).forEach(x=>{let k=String(x.post_id);state.likes[k]=(state.likes[k]||0)+1;if(sess()?.user?.id===x.user_id)state.myLikes.add(k)});if(c.ok)(await c.json()).forEach(x=>{let k=String(x.post_id);state.comments[k]=(state.comments[k]||0)+1})}catch(e){} }
 function hot(){const grid=document.getElementById('akc-hot-grid');if(!grid)return;const arr=[...(window.communityPosts||communityPosts||[])].sort((a,b)=>((state.likes[String(b.id)]||0)*3+(state.comments[String(b.id)]||0))-((state.likes[String(a.id)]||0)*3+(state.comments[String(a.id)]||0))).slice(0,3);grid.innerHTML=arr.length?arr.map((p,i)=>`<article class="akc-hot-card" onclick="openCommunityDetail('${p.id}')"><div class="akc-hot-rank">HOT 0${i+1}</div><div class="akc-hot-title">${esc(p.title)}</div><div class="akc-hot-meta">${esc(p.author_name||'AMKINA USER')} · ♥ ${state.likes[String(p.id)]||0} · 댓글 ${state.comments[String(p.id)]||0}</div></article>`).join(''):'<div style="font-size:11px;color:#999">아직 HOT 게시물이 없습니다.</div>';const posts=(window.communityPosts||communityPosts||[]);document.getElementById('akc-posts').textContent=posts.length;document.getElementById('akc-artists').textContent=new Set(posts.map(x=>x.user_id).filter(Boolean)).size;document.getElementById('akc-reactions').textContent=Object.values(state.likes).reduce((a,b)=>a+b,0)}
 const oldLoad=window.loadCommunityPosts;window.loadCommunityPosts=async function(){ensureUI();if(oldLoad)await oldLoad.apply(this,arguments);await social();renderCommunityPosts();hot()};
 const oldRender=window.renderCommunityPosts;window.renderCommunityPosts=function(){const list=document.getElementById('community-list');if(!list)return;const q=(document.getElementById('community-search')?.value||'').trim().toLowerCase(),posts=(window.communityPosts||communityPosts||[]),rows=posts.filter(p=>(communityFilter==='all'||p.category===communityFilter)&&(!q||String(p.title||'').toLowerCase().includes(q)||String(p.content||'').toLowerCase().includes(q)));if(!rows.length){list.innerHTML='<div class="community-empty">조건에 맞는 게시물이 없습니다.</div>';hot();return}list.innerHTML=rows.map(p=>{const id=String(p.id),attached=p.track_id?'<span class="akc-music-pill">▶ MUSIC</span>':'';return `<article class="community-post" onclick="openCommunityDetail('${id}')"><div class="community-cat">${esc(typeof communityCategory==='function'?communityCategory(p.category):p.category)}</div><div><div class="community-post-title">${esc(p.title)}${attached}</div><div class="community-post-preview">${esc(p.content)}</div><div class="akc-post-social"><span>♥ <b>${state.likes[id]||0}</b></span><span>댓글 <b>${state.comments[id]||0}</b></span>${p.feedback_tag?`<span>#${esc(p.feedback_tag)}</span>`:''}</div></div><div class="community-meta">${esc(p.author_name||'AMKINA USER')}<br>${typeof communityDate==='function'?communityDate(p.created_at):''}</div></article>`}).join('');hot()};
 const oldOpen=window.openCommunityComposer;window.openCommunityComposer=function(){ensureUI();const r=oldOpen?.apply(this,arguments);setTimeout(fillMyTracks,0);return r};
 const oldSubmit=window.submitCommunityPost;window.submitCommunityPost=async function(){const s=sess();if(!s?.user?.id)return oldSubmit?.apply(this,arguments);const title=document.getElementById('community-title')?.value.trim(),content=document.getElementById('community-content')?.value.trim(),category=document.getElementById('community-category')?.value;if(!title||!content)return oldSubmit?.apply(this,arguments);const trackId=document.getElementById('akc-track-select')?.value||null,status=document.getElementById('community-compose-status');if(status)status.textContent='게시 중...';try{const body={user_id:s.user.id,author_name:(s.user.email||'AMKINA USER').split('@')[0],category,title,content};if(trackId)body.track_id=Number(trackId);if(state.feedbackTag)body.feedback_tag=state.feedbackTag;let r=await fetch(SUPABASE_URL+'/rest/v1/community_posts',{method:'POST',headers:{...communityHeaders(true),'Prefer':'return=representation'},body:JSON.stringify(body)});if(!r.ok){const txt=await r.text();if((trackId||state.feedbackTag)&&/track_id|feedback_tag|column/i.test(txt)){delete body.track_id;delete body.feedback_tag;r=await fetch(SUPABASE_URL+'/rest/v1/community_posts',{method:'POST',headers:{...communityHeaders(true),'Prefer':'return=representation'},body:JSON.stringify(body)})}if(!r.ok)throw new Error(await r.text())}document.getElementById('community-title').value='';document.getElementById('community-content').value='';document.getElementById('akc-track-select').value='';state.feedbackTag='';document.querySelectorAll('.akc-feedback-tag').forEach(x=>x.classList.remove('active'));closeCommunityComposer();await loadCommunityPosts()}catch(e){console.error(e);alert('게시글 등록에 실패했습니다. COMMUNITY HUB SQL 설정을 확인해주세요.')}finally{if(status)status.textContent=''}};
 const oldDetail=window.openCommunityDetail;window.openCommunityDetail=async function(id){await oldDetail.apply(this,arguments);const p=(window.communityPosts||communityPosts||[]).find(x=>String(x.id)===String(id)),root=document.getElementById('community-detail');if(!p||!root)return;let html='';if(p.track_id){let t=trackById(p.track_id);if(!t){try{const r=await fetch(SUPABASE_URL+'/rest/v1/tracks?id=eq.'+encodeURIComponent(p.track_id)+'&select=*&limit=1',{headers:communityHeaders(false)});if(r.ok)t=(await r.json())[0]}catch(e){}}if(t)html+=`<div class="akc-player-card"><img src="${esc(t.cover_url||t.cover||'')}" alt=""><div><b>${esc(t.title)}</b><span>${esc(t.artist||'AMKINA')}</span></div><button type="button" onclick="event.stopPropagation();akcPlayTrack('${esc(t.id)}')">▶</button></div>`}html+=`<div class="akc-detail-actions"><button type="button" class="akc-like-btn ${state.myLikes.has(String(id))?'liked':''}" onclick="akcTogglePostLike('${esc(id)}')">♥ 공감 ${state.likes[String(id)]||0}</button>${p.feedback_tag?`<span class="akc-like-btn"># ${esc(p.feedback_tag)}</span>`:''}</div>`;root.querySelector('.community-detail-content')?.insertAdjacentHTML('afterend',html)};
 window.akcPlayTrack=function(id){const i=(typeof tracks!=='undefined'?tracks:[]).findIndex(t=>String(t.id)===String(id));if(i>=0&&typeof playTrack==='function')playTrack(i)};
 window.akcTogglePostLike=async function(id){const s=sess();if(!s?.user?.id){alert('공감은 로그인이 필요합니다.');document.getElementById('auth-modal').style.display='flex';return}const liked=state.myLikes.has(String(id)),url=SUPABASE_URL+'/rest/v1/community_post_likes?post_id=eq.'+encodeURIComponent(id)+'&user_id=eq.'+encodeURIComponent(s.user.id);try{const r=await fetch(liked?url:SUPABASE_URL+'/rest/v1/community_post_likes',{method:liked?'DELETE':'POST',headers:{...communityHeaders(true),...(liked?{}:{'Prefer':'return=minimal'})},body:liked?undefined:JSON.stringify({post_id:String(id),user_id:s.user.id})});if(!r.ok)throw new Error(await r.text());await social();renderCommunityPosts();await openCommunityDetail(id)}catch(e){console.error(e);alert('공감 기능을 사용하려면 COMMUNITY HUB SQL을 먼저 실행해주세요.')}};
 const cc=window.communityCategory;window.communityCategory=function(v){if(v==='collab')return 'COLLAB';return cc?cc(v):v};
 document.addEventListener('DOMContentLoaded',ensureUI);setTimeout(ensureUI,100);
})();

/* ===== AMKINA SCRIPT BLOCK 31 | id="amkina-artists-nav-safety" ===== */
(function(){
 ["showHomePage","showMusicPage","showCommunityPage","openChart100","showMyPage"].forEach(n=>{
   const old=window[n]; if(typeof old!=="function"||old.__artistWrapped)return;
   const fn=function(){const p=document.getElementById("artists-page");if(p){p.style.setProperty("display","none","important");p.classList.remove("active")}return old.apply(this,arguments)};
   fn.__artistWrapped=true;window[n]=fn;
 });
})();

/* ===== AMKINA SCRIPT BLOCK 32 | id="amkina-pwa-service-worker" ===== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("./sw.js")
      .then(function () { console.log("AMKINA MUSIC PWA ready"); })
      .catch(function (error) { console.error("PWA error:", error); });
  });
}

/* ===== AMKINA SCRIPT BLOCK 33 | id="amkina-mobile-nav-script-v1" ===== */
(function(){
  const drawer=document.getElementById("amkina-mobile-drawer");
  const shade=document.getElementById("amkina-mobile-drawer-backdrop");
  const openBtn=document.getElementById("amkina-mobile-menu-open");
  const closeBtn=drawer&&drawer.querySelector(".amkina-drawer-close");
  function openDrawer(){drawer?.classList.add("open");shade?.classList.add("open");}
  function closeDrawer(){drawer?.classList.remove("open");shade?.classList.remove("open");}
  openBtn?.addEventListener("click",openDrawer);
  closeBtn?.addEventListener("click",closeDrawer);
  shade?.addEventListener("click",closeDrawer);

  const routes={
    home:["showHomePage","showHome"],
    music:["showMusicPage","showMusic"],
    chart:["openChart100","showChart100","showChartPage"],
    community:["showCommunityPage","showCommunity"],
    mypage:["showMyPage","showMypage"],
    artists:["showArtistsPage","showArtistPage","showArtists"],
    notifications:["showNotificationPage","showNotificationsPage","showNotificationCenter"],
    studio:["showStudioPage","showStudio"],
    library:["showLibraryPage","showLibrary"],
    album:["showAmkinaAlbumPage","showAlbumPage"],
    radio:["showRadioPage","showRadio"],
    event:["showEventPage","showEventsPage"],
    about:["showAboutPage","showAbout"]
  };

  function invoke(route){
    const names=routes[route]||[];
    for(const n of names){
      if(typeof window[n]==="function"){ window[n](); return true; }
    }
    /* Fallback: click matching existing desktop sidebar item */
    const labels={
      home:"홈",music:"음악",chart:"CHART 100",community:"커뮤니티",mypage:"마이페이지",
      artists:"아티스트",notifications:"알림센터",studio:"스튜디오",library:"라이브러리",
      album:"AMKINA 앨범",radio:"RADIO",event:"이벤트",about:"ABOUT"
    };
    const wanted=labels[route];
    if(wanted){
      const candidates=[...document.querySelectorAll("a,button,[role='button']")];
      const el=candidates.find(x=>x.closest("#amkina-mobile-bottom,#amkina-mobile-drawer")==null &&
        (x.textContent||"").trim().includes(wanted));
      if(el){el.click();return true;}
    }
    return false;
  }

  document.querySelectorAll("[data-go]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const route=btn.dataset.go;
      invoke(route);
      if(btn.classList.contains("amkina-mnav")){
        document.querySelectorAll(".amkina-mnav").forEach(x=>x.classList.remove("active"));
        btn.classList.add("active");
      }
      closeDrawer();
    });
  });
})();

/* ===== AMKINA SCRIPT BLOCK 34 | id="amkina-home-flow-exact-v2-script" ===== */
(function(){
  const esc=s=>(s??"").toString().replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

  function sourceTracks(){
    try{
      if(typeof tracks!=="undefined" && Array.isArray(tracks) && tracks.length) return tracks;
    }catch(e){}
    if(Array.isArray(window.tracks)&&window.tracks.length)return window.tracks;
    if(Array.isArray(window.musicData)&&window.musicData.length)return window.musicData;
    return [];
  }
  function mix(a){
    a=[...a];
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }
  function image(t){return t.cover_url||t.cover||t.image_url||"./icon-512.png"}
  function html(t){
    return `<article class="akflow-card" data-ak-id="${esc(t.id)}">
      <div class="akflow-coverbox">
        <img class="akflow-cover" src="${esc(image(t))}" alt="${esc(t.title||"음원 커버")}">
        <span class="akflow-play">▶</span>
      </div>
      <div class="akflow-name">${esc(t.title||"Untitled")}</div>
      <div class="akflow-artist">${esc(t.artist||"AMKINA MUSIC")}</div>
    </article>`;
  }
  function play(t){
    const list=sourceTracks();
    const i=list.findIndex(x=>String(x.id)===String(t.id));
    if(i>=0 && typeof window.playTrack==="function"){window.playTrack(i);return}
    if(i>=0 && typeof window.selectTrack==="function"){window.selectTrack(i);return}
    if(typeof window.selectTrackForFullPage==="function"){window.selectTrackForFullPage(t.id)}
  }
  function render(){
    const list=sourceTracks();
    if(list.length<2)return false;

    const count=Math.min(16,Math.max(8,list.length));
    const a=mix(list).slice(0,count);
    let b=mix(list).slice(0,count);
    if(list.length>count) b=mix(list.filter(t=>!a.some(x=>String(x.id)===String(t.id)))).slice(0,count);

    // Duplicate each exact row once so the CSS 50% animation loops seamlessly.
    document.getElementById("akflow-top").innerHTML=[...a,...a].map(html).join("");
    document.getElementById("akflow-bottom").innerHTML=[...b,...b].map(html).join("");

    document.querySelectorAll("#amkina-home-flow .akflow-card").forEach(card=>{
      card.onclick=()=>{
        const t=list.find(x=>String(x.id)===String(card.dataset.akId));
        if(t)play(t);
      };
    });
    return true;
  }

  function setFlow(show){
    const el=document.getElementById("amkina-home-flow");
    if(el)el.style.setProperty("display",show?"block":"none","important");
  }

  // Keep this section on HOME only.
  function wrap(name,show){
    const old=window[name];
    if(typeof old!=="function" || old.__akflowWrapped)return;
    const fn=function(){const r=old.apply(this,arguments);setFlow(show);return r};
    fn.__akflowWrapped=true;
    window[name]=fn;
  }
  setTimeout(()=>{
    wrap("showHomePage",true);
    ["showMusicPage","showStudioPage","showCommunityPage","openChart100","showMyPage",
     "showArtistsPage","showLibraryPage","showRadioPage","showEventPage"].forEach(n=>wrap(n,false));
  },0);

  let tries=0;
  const timer=setInterval(()=>{tries++;if(render()||tries>40)clearInterval(timer)},400);
  window.addEventListener("load",()=>setTimeout(render,600));
})();

/* ===== AMKINA SCRIPT BLOCK 35 | id="amkina-karaoke-v1-script" ===== */
(function(){
 let syncTrack=null,syncLines=[],syncIndex=0,syncHistory=[];
 const audioEl=()=>document.getElementById("audio");
 const fmt=s=>{s=Math.max(0,Number(s)||0);return String(Math.floor(s/60)).padStart(2,"0")+":"+String(Math.floor(s%60)).padStart(2,"0")+"."+Math.floor((s%1)*10)};
 function currentTrack(){try{return (typeof currentIndex==="number"&&currentIndex>=0&&tracks[currentIndex])?tracks[currentIndex]:null}catch(e){return null}}
 function parseSync(t){
   let v=t?.karaoke_lyrics;
   if(!v)return [];
   if(typeof v==="string"){try{v=JSON.parse(v)}catch(e){return []}}
   return Array.isArray(v)?v.filter(x=>x&&typeof x.text==="string").map(x=>({time:Number(x.time)||0,text:x.text})).sort((a,b)=>a.time-b.time):[];
 }
 function ensureKaraokeNodes(){
   const wrap=document.getElementById("compact-lyrics-preview");if(!wrap)return;
   if(!document.getElementById("ak-karaoke-current")){
     const c=document.createElement("div");c.id="ak-karaoke-current";
     const n=document.createElement("div");n.id="ak-karaoke-next";
     wrap.append(c,n);
   }
 }
 function renderKaraoke(){
   ensureKaraokeNodes();
   const c=document.getElementById("ak-karaoke-current"),n=document.getElementById("ak-karaoke-next");
   if(!c||!n)return;
   const t=currentTrack(),a=audioEl(),sync=parseSync(t);
   if(!t){c.textContent="곡을 선택해주세요.";n.textContent="";return}
   if(!sync.length){c.textContent=(t.lyrics?"노래방 싱크가 아직 없습니다.":"등록된 가사가 없습니다.");n.textContent=t.lyrics?"업로더가 가사 싱크를 등록하면 여기에 표시됩니다.":"";return}
   const now=a?.currentTime||0;
   let i=0;for(let k=0;k<sync.length;k++){if(sync[k].time<=now)i=k;else break}
   const start=sync[i].time,end=(sync[i+1]?.time ?? (a?.duration||start+5)),pct=Math.max(0,Math.min(100,((now-start)/Math.max(.1,end-start))*100));
   c.innerHTML="";
   const span=document.createElement("span");span.className="ak-karaoke-fill";span.dataset.text=sync[i].text;span.textContent=sync[i].text;span.style.setProperty("--ak-progress",pct+"%");c.appendChild(span);
   n.textContent=sync[i+1]?.text||"";
 }
 window.renderCompactLyrics=renderKaraoke;
 ensureKaraokeNodes();
 const a=audioEl();if(a){a.addEventListener("timeupdate",renderKaraoke);a.addEventListener("loadedmetadata",renderKaraoke);a.addEventListener("play",renderKaraoke)}
 setInterval(()=>{const p=document.getElementById("compact-lyrics-panel");if(p?.classList.contains("open"))renderKaraoke()},120);

 window.openKaraokeSyncEditor=function(){
   const editId=(typeof editingTrackId!=="undefined"?editingTrackId:null);
   let t=null;try{t=tracks.find(x=>String(x.id)===String(editId))}catch(e){}
   if(!t)t=currentTrack();
   if(!t){alert("곡을 먼저 선택해주세요.");return}
   const raw=String(document.getElementById("track-edit-lyrics")?.value||t.lyrics||"").replace(/\r/g,"");
   const lines=raw.split("\n").map(x=>x.trim()).filter(Boolean);
   if(!lines.length){alert("먼저 일반 가사를 등록해주세요.");return}
   syncTrack=t;
   const old=parseSync(t);
   syncLines=lines.map((text,i)=>({text,time:old.find(x=>x.text===text)?.time ?? null}));syncHistory=[];
   syncIndex=Math.max(0,syncLines.findIndex(x=>x.time==null));if(syncIndex<0)syncIndex=0;
   const modal=document.getElementById("ak-sync-modal");modal.classList.add("open");modal.setAttribute("aria-hidden","false");
   if(typeof closeTrackEdit==="function")closeTrackEdit();
   renderEditor();
   const au=audioEl();if(au){
     const idx=tracks.findIndex(x=>String(x.id)===String(t.id));
     if(idx>=0&&typeof window.playTrack==="function"&&currentTrack()?.id!=t.id)window.playTrack(idx);
   }
 };
 window.closeKaraokeSyncEditor=function(){document.getElementById("ak-sync-modal")?.classList.remove("open")};
 function renderEditor(){
   const box=document.getElementById("ak-sync-list");if(!box)return;
   box.innerHTML=syncLines.map((x,i)=>`<div class="ak-sync-row ${i===syncIndex?"active":""}" data-i="${i}"><span class="ak-sync-stamp">${x.time==null?"--:--.-":fmt(x.time)}</span><span class="ak-sync-line"></span><button class="ak-sync-hit" type="button">시간 찍기</button></div>`).join("");
   box.querySelectorAll(".ak-sync-row").forEach((r,i)=>{r.querySelector(".ak-sync-line").textContent=syncLines[i].text;r.querySelector(".ak-sync-hit").onclick=()=>stamp(i);r.onclick=e=>{if(!e.target.closest("button")){syncIndex=i;renderEditor()}}});
   box.querySelector(".active")?.scrollIntoView({block:"nearest"});
 }
 function stamp(i){const a=audioEl();if(!a)return;syncHistory.push({i,old:syncLines[i].time});syncLines[i].time=Number(a.currentTime.toFixed(2));syncIndex=Math.min(i+1,syncLines.length-1);renderEditor()}
 window.autoKaraokeDraft=function(){
   const a=audioEl();if(!a||!syncLines.length)return;
   const apply=()=>{
     const dur=Number(a.duration);
     if(!Number.isFinite(dur)||dur<=0){alert("음원 길이를 불러온 뒤 다시 눌러주세요.");return}
     if(syncLines.some(x=>x.time!=null)&&!confirm("현재 찍어둔 싱크를 자동 초안으로 다시 배치할까요?"))return;
     const n=syncLines.length;
     const weights=syncLines.map(x=>{
       const s=String(x.text||"").trim();
       const words=s.split(/\s+/).filter(Boolean).length;
       const chars=s.replace(/\s+/g,"").length;
       return Math.max(1.6, Math.min(6.5, 1.15 + words*0.34 + chars*0.035));
     });
     const total=weights.reduce((x,y)=>x+y,0);
     const lead=Math.min(8,Math.max(1.5,dur*0.025));
     const tail=Math.min(10,Math.max(3,dur*0.035));
     const usable=Math.max(5,dur-lead-tail);
     let acc=0;
     syncHistory=[];
     syncLines.forEach((x,i)=>{
       x.time=Number((lead + usable*(acc/total)).toFixed(2));
       acc+=weights[i];
     });
     syncIndex=0;
     a.currentTime=Math.max(0,syncLines[0].time-1);
     renderEditor();
     alert("자동 싱크 초안을 만들었습니다. 실제 보컬을 분석한 AI 싱크가 아니라 곡 길이와 가사 길이를 기준으로 한 초안입니다. 틀린 줄만 시간 찍기/0.5초 이동으로 보정해주세요.");
   };
   if(Number.isFinite(a.duration)&&a.duration>0)apply();
   else{a.addEventListener("loadedmetadata",apply,{once:true});a.load()}
 };
 window.karaokeSeek=function(sec){const a=audioEl();if(!a)return;const max=Number.isFinite(a.duration)?a.duration:Infinity;a.currentTime=Math.max(0,Math.min(max,a.currentTime+Number(sec||0)))};
 window.karaokeGoPrevious=function(){const a=audioEl();if(!a)return;syncIndex=Math.max(0,syncIndex-1);const t=syncLines[syncIndex]?.time;if(t!=null)a.currentTime=Math.max(0,t-2);renderEditor()};
 window.undoKaraokeStamp=function(){const a=audioEl();if(!a)return;const h=syncHistory.pop();if(h){const back=h.old!=null?h.old:(syncLines[Math.max(0,h.i-1)]?.time??a.currentTime);syncLines[h.i].time=h.old;syncIndex=h.i;a.currentTime=Math.max(0,back-2)}else{const i=Math.max(0,syncIndex-1);if(syncLines[i]?.time!=null){const t=syncLines[i].time;syncLines[i].time=null;syncIndex=i;a.currentTime=Math.max(0,t-2)}}renderEditor()};
 window.resetKaraokeSync=function(){syncLines.forEach(x=>x.time=null);syncIndex=0;syncHistory=[];renderEditor()};
 document.getElementById("ak-sync-play")?.addEventListener("click",()=>{const a=audioEl();if(!a)return;a.paused?a.play():a.pause()});
 audioEl()?.addEventListener("timeupdate",()=>{const el=document.getElementById("ak-sync-time");if(el)el.textContent=fmt(audioEl().currentTime)});
 document.addEventListener("keydown",e=>{if(!document.getElementById("ak-sync-modal")?.classList.contains("open"))return;const tag=(e.target?.tagName||"").toLowerCase();if(["input","textarea","select"].includes(tag))return;if(e.code==="Space"){e.preventDefault();const a=audioEl();a.paused?a.play():a.pause();return}if(e.key==="Enter"){e.preventDefault();stamp(syncIndex);return}if(e.key==="Backspace"){e.preventDefault();undoKaraokeStamp();return}if(e.key==="ArrowLeft"){e.preventDefault();karaokeSeek(e.shiftKey?-0.5:-3);return}if(e.key==="ArrowRight"){e.preventDefault();karaokeSeek(e.shiftKey?0.5:3);return}if(e.key==="ArrowUp"){e.preventDefault();karaokeGoPrevious();return}});

 window.saveKaraokeSync=async function(){
   if(!syncTrack)return;
   if(syncLines.some(x=>x.time==null)){if(!confirm("시간을 찍지 않은 가사가 있습니다. 찍힌 부분만 저장할까요?"))return}
   const data=syncLines.filter(x=>x.time!=null).sort((a,b)=>a.time-b.time).map(x=>({time:x.time,text:x.text}));
   try{
     const s=(typeof amkinaGetSession==="function")?amkinaGetSession():null;
     if(!s?.access_token||!s?.user?.id)throw new Error("LOGIN_REQUIRED");
     const isAdmin=String(s.user.email||"").toLowerCase()==="psy88all@naver.com";
     const mine=!!(syncTrack.uploader_id && String(syncTrack.uploader_id)===String(s.user.id));
     if(!isAdmin && !mine)throw new Error("NO_PERMISSION");
     const editFilter=isAdmin
       ? `id=eq.${encodeURIComponent(syncTrack.id)}`
       : `id=eq.${encodeURIComponent(syncTrack.id)}&uploader_id=eq.${encodeURIComponent(s.user.id)}`;
     const res=await fetch(`${SUPABASE_URL}/rest/v1/tracks?${editFilter}`,{
       method:"PATCH",
       headers:{...amkinaTrackHeaders(true),"Prefer":"return=representation"},
       body:JSON.stringify({karaoke_lyrics:data})
     });
     if(!res.ok)throw new Error(await res.text());
     const changed=await res.json();
     if(!changed.length)throw new Error("NO_PERMISSION_OR_TRACK");
     syncTrack.karaoke_lyrics=data;
     alert("노래방 가사 싱크를 저장했습니다.");
     closeKaraokeSyncEditor();renderKaraoke();
   }catch(e){
     console.error("Karaoke sync save error:",e);
     if(String(e?.message)==="LOGIN_REQUIRED") alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
     else if(String(e?.message).includes("NO_PERMISSION")) alert("본인이 업로드한 곡만 노래방 싱크를 수정할 수 있습니다.");
     else alert("노래방 싱크 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
   }
 };
})();

/* ===== AMKINA SCRIPT BLOCK 36 | id="amkina-mobile-track-edit-runtime-fix" ===== */
(function(){
  function fix(){
    if(!matchMedia("(max-width:768px)").matches)return;
    const modal=document.getElementById("track-edit-modal")||document.querySelector(".track-edit-modal");
    if(!modal)return;
    modal.style.overflowY="auto";
    const ta=document.getElementById("track-edit-lyrics");
    if(ta){ta.style.height="190px";ta.style.minHeight="190px";ta.style.maxHeight="190px";ta.style.overflowY="auto"}
  }
  window.addEventListener("resize",fix);
  document.addEventListener("click",e=>{
    if(e.target.closest(".track-menu-item,.track-edit-btn,[onclick*='openTrackEdit']"))setTimeout(fix,100);
  });
  window.addEventListener("load",fix);
})();

/* ===== AMKINA SCRIPT BLOCK 37 | id="amkina-user-guide-v1-script" ===== */
(function(){
 window.openAmkinaGuide=function(){document.getElementById("ak-guide-modal")?.classList.add("open")};
 window.closeAmkinaGuide=function(){document.getElementById("ak-guide-modal")?.classList.remove("open")};
 window.closeAmkinaWelcome=function(){document.getElementById("ak-welcome")?.classList.remove("open");localStorage.setItem("amkina_welcome_seen_v1","1")};
 window.openGuideFromWelcome=function(){closeAmkinaWelcome();openAmkinaGuide()};
 window.akGuideGo=function(where){
   closeAmkinaGuide();
   if(where==="studio"){
     if(typeof window.showStudioPage==="function")return window.showStudioPage();
     const el=[...document.querySelectorAll("a,button")].find(x=>(x.textContent||"").trim().toLowerCase()==="studio"||(x.textContent||"").trim()==="스튜디오");if(el)el.click();
   }
   if(where==="chart"){
     if(typeof window.openChart100==="function")return window.openChart100();
     const el=[...document.querySelectorAll("a,button")].find(x=>(x.textContent||"").toUpperCase().includes("CHART 100"));if(el)el.click();
   }
 };
 function addSidebarGuide(){
   if(document.getElementById("ak-sidebar-guide"))return;
   const about=[...document.querySelectorAll("a,button,[role=button],div")].find(x=>(x.textContent||"").trim()==="ABOUT"&&x.offsetParent!==null&&!x.closest("#ak-guide-modal"));
   if(!about)return;
   const b=document.createElement("button");b.id="ak-sidebar-guide";b.type="button";b.innerHTML="❓&nbsp;&nbsp;이용가이드";
   b.style.cssText="width:100%;height:38px;border:0;background:transparent;text-align:left;padding:0 12px;font:700 10px Arial;color:#222;cursor:pointer;border-radius:8px";
   b.onclick=openAmkinaGuide;
   let anchor=about;while(anchor.parentElement&&anchor.parentElement.children.length===1&&!anchor.parentElement.matches("aside,nav,.sidebar"))anchor=anchor.parentElement;
   anchor.insertAdjacentElement("beforebegin",b);
 }
 let tries=0,t=setInterval(()=>{tries++;addSidebarGuide();if(document.getElementById("ak-sidebar-guide")||tries>30)clearInterval(t)},400);
 window.addEventListener("load",()=>{
   setTimeout(addSidebarGuide,500);
   // Show once per browser after a logged-in session exists.
   setTimeout(()=>{
     let logged=false;try{logged=!!(typeof amkinaGetSession==="function"&&amkinaGetSession()?.user)}catch(e){}
     if(logged&&!localStorage.getItem("amkina_welcome_seen_v1"))document.getElementById("ak-welcome")?.classList.add("open");
   },900);
 });
})();

/* ===== AMKINA SCRIPT BLOCK 38 | id="amkina-content-advisory-play-v1" ===== */
(function(){
 function warningText(t){
   if(t?.is_adult)return "이 곡은 19+ 성인 주제로 표시되었습니다.";
   const w=Array.isArray(t?.content_warnings)?t.content_warnings:[];
   const names={explicit:"강한 표현",violence:"폭력·공포",disturbing:"민감한 내용"};
   return w.length?"청취주의: "+w.map(x=>names[x]||x).join(" · "):"";
 }
 // First play of a flagged track in this browser session gets a lightweight notice.
 const old=window.playTrack;
 if(typeof old==="function"&&!old.__akAdvisory){
   const wrapped=function(index){
     const t=(typeof tracks!=="undefined")?tracks[index]:null;
     const msg=warningText(t);
     if(msg && !sessionStorage.getItem("ak_warning_"+t.id)){
       if(!confirm(msg+"\\n\\n계속 재생하시겠습니까?"))return;
       sessionStorage.setItem("ak_warning_"+t.id,"1");
     }
     return old.apply(this,arguments);
   };
   wrapped.__akAdvisory=true;window.playTrack=wrapped;
 }
})();

/* ===== AMKINA SCRIPT BLOCK 39 | id="amkina-player-comment-clean-v2" ===== */
window.openCurrentPlayerComments=function(){
  let t=null;
  try{if(typeof currentIndex==="number"&&currentIndex>=0&&Array.isArray(tracks))t=tracks[currentIndex]||null}catch(e){}
  try{if(!t&&typeof currentTrack!=="undefined"&&currentTrack)t=currentTrack}catch(e){}
  if(!t){alert("곡을 먼저 선택해주세요.");return}
  if(typeof openTrackComments==="function")openTrackComments(t.id);
  else alert("댓글 기능을 불러오지 못했습니다.");
};

/* ===== AMKINA SCRIPT BLOCK 40 | id="amkina-player-social-instagram-script" ===== */
(function(){
 function cur(){
   try{return (typeof currentIndex==="number"&&currentIndex>=0&&Array.isArray(tracks))?tracks[currentIndex]:null}catch(e){return null}
 }
 window.openCurrentPlayerComments=function(){
   const t=cur();if(!t){alert("곡을 먼저 선택해주세요.");return}
   if(typeof openTrackComments==="function")openTrackComments(t.id);
 };
 window.shareCurrentPlayerTrack=async function(){
    const t=cur();if(!t){alert("곡을 먼저 선택해주세요.");return}
    if(typeof window.amkinaShareTrack==="function") return window.amkinaShareTrack(t);
    const u="https://bbtzasddvodrprpnbeos.supabase.co/functions/v1/track-share?id="+encodeURIComponent(t.id);
    try{
      if(navigator.share){await navigator.share({title:(t.title||"AMKINA MUSIC"),text:(t.artist||"")+" · AMKINA MUSIC",url:u});}
      else{await navigator.clipboard.writeText(u);alert("앨범 표지가 표시되는 공유 링크를 복사했습니다.");}
    }catch(e){}
  };
 function paint(){
   const b=document.getElementById("player-like-btn"),t=cur();if(!b)return;
   const liked=!!(t&&typeof amkinaTrackLikes!=="undefined"&&amkinaTrackLikes?.has(String(t.id)));
   b.classList.toggle("is-liked",liked);
   if(!b.querySelector("svg"))b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3 4.2 13A5.2 5.2 0 0 1 11.5 5.6L12 6.1l.5-.5A5.2 5.2 0 0 1 19.8 13z"/></svg>';
 }
 document.addEventListener("click",()=>setTimeout(paint,100));
 if(typeof audio!=="undefined"&&audio){audio.addEventListener("play",paint);audio.addEventListener("loadedmetadata",paint)}
 setTimeout(paint,100);
})();

/* ===== AMKINA SCRIPT BLOCK 41 | id="amkina-player-social-static-sync" ===== */
(function(){
  function updateStaticLike(){
    const b=document.getElementById("player-like-btn");
    if(!b)return;
    let t=null;
    try{
      if(typeof currentIndex==="number"&&currentIndex>=0&&Array.isArray(tracks))t=tracks[currentIndex]||null;
    }catch(e){}
    const liked=!!(t&&typeof amkinaTrackLikes!=="undefined"&&amkinaTrackLikes?.has(String(t.id)));
    b.classList.toggle("is-liked",liked);
  }
  document.addEventListener("click",function(e){
    if(e.target.closest("#player-like-btn") || e.target.closest(".track-like-btn") || e.target.closest("[onclick*='Like']")){
      setTimeout(updateStaticLike,250);
    }
  });
  if(typeof audio!=="undefined"&&audio){
    audio.addEventListener("loadedmetadata",updateStaticLike);
  }
  window.addEventListener("load",()=>setTimeout(updateStaticLike,200));
})();

/* ===== AMKINA SCRIPT BLOCK 42 | id="amkina-player-like-click-fix" ===== */
(function(){
  function currentTrack(){
    try{
      if(typeof currentIndex==="number" && currentIndex>=0 && Array.isArray(tracks)){
        return tracks[currentIndex] || null;
      }
    }catch(e){}
    return null;
  }

  function paint(){
    const btn=document.getElementById("player-like-btn");
    const t=currentTrack();
    if(!btn)return;
    const liked=!!(t && typeof amkinaTrackLikes!=="undefined" &&
      amkinaTrackLikes && amkinaTrackLikes.has(String(t.id)));
    btn.classList.toggle("is-liked",liked);
    btn.title=liked?"좋아요 취소":"좋아요";
  }

  window.amkinaPlayerLikeClick=async function(e){
    if(e){e.preventDefault();e.stopPropagation();}
    const t=currentTrack();
    if(!t){alert("곡을 먼저 선택해주세요.");return;}

    if(typeof toggleTrackLike!=="function"){
      alert("좋아요 기능을 불러오지 못했습니다.");
      return;
    }

    const btn=document.getElementById("player-like-btn");
    if(btn)btn.disabled=true;
    try{
      await toggleTrackLike(t.id);
      paint();
    }catch(err){
      console.error("player like:",err);
    }finally{
      if(btn)btn.disabled=false;
    }
  };

  /* No interval / no animation. Update only when track or like state changes. */
  if(typeof audio!=="undefined" && audio){
    audio.addEventListener("loadedmetadata",paint);
    audio.addEventListener("play",paint);
  }
  document.addEventListener("click",function(e){
    if(e.target.closest(".track-like-btn,[onclick*='actionMenuLike'],[onclick*='tfLike']")){
      setTimeout(paint,300);
    }
  });
  window.addEventListener("load",()=>setTimeout(paint,200));
})();

/* ===== AMKINA SCRIPT BLOCK 43 | id="amkina-i18n-safe-v2" ===== */
(function(){
const L={ko:0,en:1,id:2,ja:3};
const T={
"홈":["홈","Home","Beranda","ホーム"],
"음악":["음악","Music","Musik","音楽"],
"아티스트":["아티스트","Artists","Artis","アーティスト"],
"커뮤니티":["커뮤니티","Community","Komunitas","コミュニティ"],
"마이페이지":["마이페이지","My Page","Halaman Saya","マイページ"],
"알림센터":["알림센터","Notifications","Notifikasi","通知"],
"스튜디오":["스튜디오","Studio","Studio","スタジオ"],
"라이브러리":["라이브러리","Library","Koleksi","ライブラリ"],
"이벤트":["이벤트","Events","Acara","イベント"],
"공지사항":["공지사항","Notices","Pengumuman","お知らせ"],
"전체보기":["전체보기","View all","Lihat semua","すべて見る"],
"전체":["전체","All","Semua","すべて"],
"인기":["인기","Popular","Populer","人気"],
"모든 장르":["모든 장르","All genres","Semua genre","すべてのジャンル"],
"모든 아티스트":["모든 아티스트","All artists","Semua artis","すべてのアーティスト"],
"최신순":["최신순","Newest","Terbaru","新着順"],
"곡명 또는 아티스트 검색":["곡명 또는 아티스트 검색","Search tracks or artists","Cari lagu atau artis","曲名またはアーティストを検索"],
"가사":["가사","Lyrics","Lirik","歌詞"],
"좋아요":["좋아요","Like","Suka","いいね"],
"댓글":["댓글","Comments","Komentar","コメント"],
"공유":["공유","Share","Bagikan","共有"],
"재생":["재생","Play","Putar","再生"],
"취소":["취소","Cancel","Batal","キャンセル"],
"저장":["저장","Save","Simpan","保存"],
"수정":["수정","Edit","Edit","編集"],
"삭제":["삭제","Delete","Hapus","削除"],
"닫기":["닫기","Close","Tutup","閉じる"],
"로그인":["로그인","Log in","Masuk","ログイン"],
"회원가입":["회원가입","Sign up","Daftar","新規登録"],
"비밀번호 찾기":["비밀번호 찾기","Forgot password","Lupa kata sandi","パスワードを忘れた場合"],
"이메일":["이메일","Email","Email","メール"],
"비밀번호":["비밀번호","Password","Kata sandi","パスワード"],
"공지 작성":["공지 작성","Write notice","Tulis pengumuman","お知らせ作成"],
"게시하기":["게시하기","Publish","Terbitkan","投稿"],
"제목":["제목","Title","Judul","タイトル"],
"내용":["내용","Content","Isi","内容"],
"상단 고정":["상단 고정","Pin to top","Sematkan di atas","上部に固定"],
"곡 정보 수정":["곡 정보 수정","Edit track info","Edit info lagu","曲情報を編集"],
"곡 제목":["곡 제목","Track title","Judul lagu","曲名"],
"장르":["장르","Genre","Genre","ジャンル"],
"커버 이미지":["커버 이미지","Cover image","Gambar sampul","カバー画像"],
"처음이신가요?":["처음이신가요?","New here?","Baru di sini?","初めてですか？"],
"필요한 기능만 골라서 빠르게 확인하세요.":["필요한 기능만 골라서 빠르게 확인하세요.","Quickly check the features you need.","Pelajari fitur yang Anda perlukan dengan cepat.","必要な機能だけをすぐ確認できます。"],
"AMKINA MUSIC 시작하기":["AMKINA MUSIC 시작하기","Getting started with AMKINA MUSIC","Mulai menggunakan AMKINA MUSIC","AMKINA MUSICを始める"],
"내 음악 올리기":["내 음악 올리기","Upload my music","Unggah musik saya","自分の音楽をアップロード"],
"직접 만든 음악은 Studio에서 등록합니다.":["직접 만든 음악은 Studio에서 등록합니다.","Upload music you created through Studio.","Unggah musik buatan Anda melalui Studio.","自作した音楽はStudioから登録できます。"],
"노래방 가사 싱크":["노래방 가사 싱크","Karaoke lyric sync","Sinkronisasi lirik karaoke","カラオケ歌詞同期"],
"내가 올린 곡의 가사에 직접 시간을 지정할 수 있습니다.":["내가 올린 곡의 가사에 직접 시간을 지정할 수 있습니다.","Set the timing for each lyric line on tracks you uploaded.","Atur waktu setiap baris lirik pada lagu yang Anda unggah.","アップロードした曲の歌詞に時間を設定できます。"],
"등록한 곡 수정하기":["등록한 곡 수정하기","Edit an uploaded track","Edit lagu yang diunggah","登録した曲を編集"],
"자주 묻는 질문":["자주 묻는 질문","Frequently asked questions","Pertanyaan yang sering diajukan","よくある質問"],
"다른 사람의 곡을 수정할 수 있나요?":["다른 사람의 곡을 수정할 수 있나요?","Can I edit someone else's track?","Bisakah saya mengedit lagu orang lain?","他の人の曲を編集できますか？"],
"아니요. 본인이 올린 곡만 수정할 수 있습니다.":["아니요. 본인이 올린 곡만 수정할 수 있습니다.","No. You can only edit tracks you uploaded.","Tidak. Anda hanya dapat mengedit lagu yang Anda unggah.","いいえ。自分がアップロードした曲のみ編集できます。"],
"노래방 싱크를 다시 맞출 수 있나요?":["노래방 싱크를 다시 맞출 수 있나요?","Can I redo the karaoke sync?","Bisakah sinkronisasi karaoke diatur ulang?","カラオケ同期をやり直せますか？"],
"일반 가사가 없으면?":["일반 가사가 없으면?","What if there are no lyrics?","Bagaimana jika belum ada lirik?","通常の歌詞がない場合は？"],
"CHART 100 보기":["CHART 100 보기","View CHART 100","Lihat CHART 100","CHART 100を見る"],
"이용가이드":["이용가이드","Guide","Panduan","利用ガイド"],
"로그인이 필요합니다.":["로그인이 필요합니다.","Login required.","Anda harus masuk terlebih dahulu.","ログインが必要です。"],
"곡을 먼저 선택해주세요.":["곡을 먼저 선택해주세요.","Please select a track first.","Silakan pilih lagu terlebih dahulu.","先に曲を選択してください。"],
"저장 중...":["저장 중...","Saving...","Menyimpan...","保存中..."],
"업로드 중...":["업로드 중...","Uploading...","Mengunggah...","アップロード中..."],
"음악 업로드 완료!":["음악 업로드 완료!","Music uploaded successfully!","Musik berhasil diunggah!","音楽のアップロードが完了しました！"],
"댓글을 입력해주세요.":["댓글을 입력해주세요.","Please enter a comment.","Silakan masukkan komentar.","コメントを入力してください。"],
"아직 댓글이 없습니다. 첫 댓글을 남겨보세요.":["아직 댓글이 없습니다. 첫 댓글을 남겨보세요.","No comments yet. Be the first to comment.","Belum ada komentar. Jadilah yang pertama berkomentar.","まだコメントはありません。最初のコメントをどうぞ。"],
"링크가 복사되었습니다.":["링크가 복사되었습니다.","Link copied.","Tautan telah disalin.","リンクをコピーしました。"],
"청취주의":["청취주의","Content warning","Peringatan konten","視聴注意"],
"폭력·공포":["폭력·공포","Violence · Horror","Kekerasan · Horor","暴力・恐怖"],
"민감한 내용":["민감한 내용","Sensitive content","Konten sensitif","センシティブな内容"],
"19+ 성인 주제":["19+ 성인 주제","19+ Adult themes","19+ Tema dewasa","19+ 成人向けテーマ"]
};
const reverse={};
Object.entries(T).forEach(([k,a])=>a.forEach(v=>reverse[v]=k));

function lang(){return localStorage.getItem("amkina_language")||"ko"}
function exact(v,l){
  const k=T[v]?v:reverse[v];
  return k ? T[k][L[l]??0] : v;
}

/* Content written by users/admin stays exactly as stored. */
function protectedContent(el){
  return !!el.closest(
   '#noticeModal,#noticeDetailModal,.notice-modal,.notice-detail,'+
   '#commentsModal,.comments-modal,.comment-list,.comments-list,'+
   '.lyrics,.lyrics-content,.karaoke-display,.karaoke-lyrics,'+
   '.track-title,.track-artist,.track-card-title,.track-card-artist,'+
   '.community-post,.post-content,.comment-content'
  );
}
function one(el,l){
  if(!el || el.closest("#amkina-language-menu") || protectedContent(el)) return;
  if(el.children.length===0){
    const raw=(el.textContent||"").trim();
    const out=exact(raw,l);
    if(raw && out!==raw) el.textContent=(el.textContent||"").replace(raw,out);
  }
  ["placeholder","title","aria-label"].forEach(a=>{
    const raw=el.getAttribute?.(a); if(!raw)return;
    const out=exact(raw,l); if(out!==raw)el.setAttribute(a,out);
  });
}
function tree(root,l){
  if(root.nodeType===1)one(root,l);
  if(!root.querySelectorAll)return;
  root.querySelectorAll("a,button,label,h1,h2,h3,h4,h5,p,span,option,input,textarea").forEach(e=>one(e,l));
}
function apply(l){
  if(!(l in L))l="ko";
  localStorage.setItem("amkina_language",l);
  document.documentElement.lang=l;
  tree(document.body,l);
  const q=document.getElementById("amkina-language-select");if(q)q.value=l;
}
window.akApplyLanguage=apply;

function init(){
 const q=document.getElementById("amkina-language-select");
 if(q)q.onchange=e=>apply(e.target.value);
 apply(lang());
 const mo=new MutationObserver(ms=>{
   const l=lang();
   ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1)tree(n,l)}));
 });
 mo.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();

/* ===== AMKINA SCRIPT BLOCK 44 | id="amkina-active-menu-route-sync-v1" ===== */
(function(){
  const clean = v => (v || "").replace(/\s+/g," ").trim().toLowerCase();

  const rules = [
    {keys:["home","홈"], texts:["홈"]},
    {keys:["music","음악"], texts:["음악"]},
    {keys:["chart","chart100","chart 100"], texts:["chart 100"]},
    {keys:["artist","artists","아티스트"], texts:["아티스트"]},
    {keys:["community","커뮤니티"], texts:["커뮤니티"]},
    {keys:["mypage","my-page","마이페이지"], texts:["마이페이지"]},
    {keys:["notification","notifications","알림센터"], texts:["알림센터"]},
    {keys:["studio","스튜디오"], texts:["스튜디오"]},
    {keys:["library","라이브러리"], texts:["라이브러리"]},
    {keys:["album","amkina-album","amkina 앨범"], texts:["amkina 앨범"]},
    {keys:["radio"], texts:["radio"]},
    {keys:["event","events","이벤트"], texts:["이벤트"]},
    {keys:["about"], texts:["about"]}
  ];

  function navLinks(){
    return [...document.querySelectorAll("body > header nav a")];
  }

  function visiblePageKey(){
    // 1. Current visible page/section IDs and data-page attributes
    const candidates = [...document.querySelectorAll(
      'main [id], main [data-page], .page[id], .page[data-page], section[id], section[data-page], [class*="page"][id]'
    )].filter(el => {
      const st = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return st.display !== "none" && st.visibility !== "hidden" && r.width > 0 && r.height > 0;
    });

    const hay = candidates.map(el => clean(
      (el.id||"")+" "+(el.dataset?.page||"")+" "+(el.className||"")
    )).join(" ");

    for(const rule of rules){
      if(rule.keys.some(k => hay.includes(clean(k)))) return rule;
    }

    // 2. Strong page headings shown in the content area
    const headings = [...document.querySelectorAll("main h1, main h2, .content h1, .content h2, h1")]
      .filter(el => {
        const st=getComputedStyle(el), r=el.getBoundingClientRect();
        return st.display!=="none" && st.visibility!=="hidden" && r.width>0 && r.height>0;
      })
      .map(el=>clean(el.textContent));

    for(const rule of rules){
      if(rule.texts.some(t => headings.some(h => h===clean(t) || h.includes(clean(t))))) return rule;
    }

    // 3. URL/hash fallback
    const route = clean(location.hash+" "+location.pathname+" "+location.search);
    for(const rule of rules){
      if(rule.keys.some(k => route.includes(clean(k)))) return rule;
    }
    return null;
  }

  function syncActiveMenu(){
    const links = navLinks();
    if(!links.length) return;

    const rule = visiblePageKey();
    if(!rule) return;

    let target = links.find(a => {
      const txt=clean(a.textContent);
      return rule.texts.some(t => txt===clean(t));
    });
    if(!target) return;

    links.forEach(a=>{
      a.classList.remove("menu-active");
      a.removeAttribute("aria-current");
    });
    target.classList.add("menu-active");
    target.setAttribute("aria-current","page");
  }

  // Run after the site's own click handlers so our state wins.
  document.addEventListener("click", function(e){
    if(e.target.closest("body > header nav a")){
      setTimeout(syncActiveMenu, 0);
      setTimeout(syncActiveMenu, 80);
      setTimeout(syncActiveMenu, 250);
    }
  }, true);

  window.addEventListener("hashchange", ()=>setTimeout(syncActiveMenu,0));
  window.addEventListener("popstate", ()=>setTimeout(syncActiveMenu,0));
  document.addEventListener("DOMContentLoaded", ()=>setTimeout(syncActiveMenu,150));

  // SPA pages change without URL changes, so observe page visibility/content changes.
  let queued=false;
  const mo=new MutationObserver(()=>{
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      syncActiveMenu();
    });
  });
  mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["class","style","hidden"]});

  setTimeout(syncActiveMenu,400);
})();

/* ===== AMKINA SCRIPT BLOCK 45 | id="amkina-home-community-latest-v1-script" ===== */
(function(){
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const cat=v=>({music:"음악 이야기",feedback:"피드백",free:"자유"})[v]||"자유";
const dt=v=>v?new Date(v).toLocaleString("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}):"";
function goCommunity(){if(typeof showCommunityPage==="function")showCommunityPage();else document.getElementById("community-nav")?.click()}
async function openPost(id){goCommunity();setTimeout(async()=>{if(typeof loadCommunityPosts==="function")await loadCommunityPosts();if(typeof openCommunityDetail==="function")openCommunityDetail(String(id))},150)}
function findNotice(){return document.getElementById("amkina-notice-section")||document.getElementById("amkina-home-notice")||document.querySelector(".amkina-notice-section")||[...document.querySelectorAll("section,div")].find(el=>/공지사항/.test((el.textContent||"").trim())&&el.querySelector("button,a"))}
async function load(){const list=document.getElementById("akhc-list");if(!list)return;try{const h=typeof communityHeaders==="function"?communityHeaders(false):{"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY};const r=await fetch(SUPABASE_URL+"/rest/v1/community_posts?select=id,category,title,author_name,created_at&order=created_at.desc&limit=5",{headers:h});if(!r.ok)throw new Error("HTTP "+r.status);const rows=await r.json();list.innerHTML=rows.length?rows.map(p=>`<article class="akhc-row" data-id="${esc(p.id)}"><div class="akhc-cat">${esc(cat(p.category))}</div><div class="akhc-title">${esc(p.title)}</div><div class="akhc-author">${esc(p.author_name||"AMKINA USER")}</div><div class="akhc-date">${esc(dt(p.created_at))}</div></article>`).join(""):'<div class="akhc-empty">아직 커뮤니티 글이 없습니다.</div>';list.querySelectorAll(".akhc-row").forEach(x=>x.onclick=()=>openPost(x.dataset.id))}catch(e){console.error(e);list.innerHTML='<div class="akhc-empty">커뮤니티 글을 불러오지 못했습니다.</div>'}}
function mount(){if(document.getElementById("amkina-home-community-latest"))return;const n=findNotice();if(!n)return;const b=document.createElement("section");b.id="amkina-home-community-latest";b.innerHTML='<div class="akhc-head"><div><h2>최신 커뮤니티 글</h2><p>AMKINA MUSIC에서 지금 나누고 있는 이야기</p></div><button class="akhc-more" type="button">더보기 →</button></div><div id="akhc-list" class="akhc-list"><div class="akhc-empty">게시글을 불러오는 중...</div></div>';n.insertAdjacentElement("afterend",b);const nr=n.getBoundingClientRect();if(nr.width){b.style.width=nr.width+"px";b.style.maxWidth=nr.width+"px";b.style.marginLeft="0px"}b.querySelector(".akhc-more").onclick=goCommunity;load()}
document.addEventListener("DOMContentLoaded",()=>{setTimeout(mount,600);setTimeout(mount,1400)});window.addEventListener("focus",()=>document.getElementById("akhc-list")&&load());
})();

/* ===== AMKINA SCRIPT BLOCK 46 | id="amkina-mypage-delete-v1-script" ===== */
(function(){
 const ADMIN_EMAIL="psy88all@naver.com";
 function session(){try{return JSON.parse(localStorage.getItem("amkina_session")||"null")}catch(e){return null}}
 function isAdmin(){return String(session()?.user?.email||"").toLowerCase()===ADMIN_EMAIL}
 function esc(v=""){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
 function cover(t){return t?.cover_url||mpDefaultAvatar}

 // 관리자에게만 전체 음원 관리 탭 추가
 function ensureAdminTab(){
   const tabs=document.querySelector("#mypage .mp-tabs"); if(!tabs)return;
   let b=document.getElementById("mp-admin-tracks-tab");
   if(isAdmin()){
     if(!b){
       b=document.createElement("button");
       b.id="mp-admin-tracks-tab"; b.className="mp-tab"; b.dataset.mptab="admintracks";
       b.textContent="전체 음원 관리";
       tabs.appendChild(b);
       b.addEventListener("click",async()=>{
         document.querySelectorAll(".mp-tab").forEach(x=>x.classList.remove("active"));
         b.classList.add("active"); mpTab="admintracks";
         await loadAdminTracks(); renderDeleteAwareTab();
       });
     }
   }else if(b)b.remove();
 }

 async function loadAdminTracks(){
   if(!isAdmin())return;
   try{
     const r=await fetch(SUPABASE_URL+"/rest/v1/tracks?select=*&order=id.desc",{headers:mpHeaders(false)});
     mpData.adminTracks=r.ok?await r.json():[];
   }catch(e){console.error(e);mpData.adminTracks=[]}
 }

 function card(t,adminMode=false){
   const owner=adminMode?`<div class="mp-admin-track-owner">업로더 · ${esc(t.artist||"AMKINA")} ${t.uploader_id?("· "+esc(t.uploader_id).slice(0,8)+"…"):"· 소유자 미지정"}</div>`:"";
   return `<article class="mp-card" onclick="mpPlay('${esc(t.id)}')">
     <button class="mp-delete-track" type="button" title="음원 삭제" aria-label="음원 삭제"
       onclick="event.stopPropagation();deleteMyTrack('${esc(t.id)}',${adminMode?"true":"false"})">🗑</button>
     <img src="${esc(cover(t))}">
     <div class="mp-card-body">
       <div class="mp-card-title">${esc(t.title||"Untitled")}</div>
       <div class="mp-card-sub">${esc(t.artist||"AMKINA")} · ${esc(t.genre||"ORIGINAL")}</div>
       ${owner}
       <div class="mp-card-stat">▷ ${Number(t.play_count||0).toLocaleString()}</div>
     </div>
   </article>`;
 }

 function renderDeleteAwareTab(){
   const el=document.getElementById("mp-content");if(!el)return false;
   if(mpTab==="music"){
     const rows=mpData.mine||[];
     el.innerHTML=rows.length?'<div class="mp-grid">'+rows.map(t=>card(t,false)).join("")+"</div>":'<div class="mp-empty">아직 업로드한 음악이 없습니다.</div>';
     return true;
   }
   if(mpTab==="admintracks" && isAdmin()){
     const rows=mpData.adminTracks||[];
     el.innerHTML='<div class="mp-admin-note"><b>관리자 음원 관리</b> · 전체 회원의 업로드 음원입니다. 중복·오등록 음원을 삭제할 수 있습니다.</div>'+
       (rows.length?'<div class="mp-grid">'+rows.map(t=>card(t,true)).join("")+"</div>":'<div class="mp-empty">등록된 음원이 없습니다.</div>');
     return true;
   }
   return false;
 }

 // 기존 렌더러는 나머지 탭을 그대로 사용
 const oldRender=renderMyPageTab;
 renderMyPageTab=function(){
   ensureAdminTab();
   if(renderDeleteAwareTab())return;
   return oldRender();
 };

 const oldLoad=loadMyPage;
 loadMyPage=async function(){
   await oldLoad();
   ensureAdminTab();
   if(isAdmin())await loadAdminTracks();
   renderMyPageTab();
 };

 window.deleteMyTrack=async function(trackId,adminMode=false){
   const s=session();
   if(!s?.access_token||!s?.user?.id){alert("다시 로그인해주세요.");return}
   const source=adminMode?(mpData.adminTracks||[]):(mpData.mine||[]);
   const t=source.find(x=>String(x.id)===String(trackId)) || (mpData.mine||[]).find(x=>String(x.id)===String(trackId));
   if(!t)return alert("음원 정보를 찾지 못했습니다.");
   if(!isAdmin() && String(t.uploader_id||"")!==String(s.user.id))return alert("본인이 업로드한 음원만 삭제할 수 있습니다.");

   const ok=confirm(`"${t.title||"이 음원"}"\n\n정말 삭제하시겠습니까?\n삭제한 음원은 복구할 수 없습니다.`);
   if(!ok)return;

   try{
     const r=await fetch(SUPABASE_URL+"/rest/v1/rpc/delete_track_secure",{
       method:"POST",
       headers:{...mpHeaders(true),"Prefer":"return=representation"},
       body:JSON.stringify({p_track_id:Number(trackId)})
     });
     if(!r.ok)throw new Error(await r.text());

     mpData.mine=(mpData.mine||[]).filter(x=>String(x.id)!==String(trackId));
     mpData.likes=(mpData.likes||[]).filter(x=>String(x.id)!==String(trackId));
     mpData.featured=(mpData.featured||[]).filter(x=>String(x.id)!==String(trackId));
     mpData.adminTracks=(mpData.adminTracks||[]).filter(x=>String(x.id)!==String(trackId));
     try{
       if(typeof tracks!=="undefined"&&Array.isArray(tracks)){
         const i=tracks.findIndex(x=>String(x.id)===String(trackId)); if(i>=0)tracks.splice(i,1);
       }
     }catch(e){}
     document.getElementById("mp-upload-count").textContent=(mpData.mine||[]).length.toLocaleString();
     renderMyPageTab();
     if(typeof loadMusic==="function")loadMusic();
     alert("음원이 삭제되었습니다.");
   }catch(e){
     console.error("음원 삭제:",e);
     alert("삭제하지 못했습니다. 먼저 제공된 음원 삭제 SQL을 Supabase에서 실행해주세요.");
   }
 };
})();

/* ===== AMKINA SCRIPT BLOCK 47 | id="amkina-unified-page-router-v1" ===== */
/* ===== AMKINA MUSIC: 사이드 메뉴 전체 단일 화면 전환 ===== */
(function(){
  const PAGE_IDS = [
    "music",
    "studio",
    "community",
    "artists-page",
    "chart100-page",
    "mypage",
    "library-page",
    "amkina-faq-page",
    "track-full-page"
  ];

  const HOME_ONLY = [
    "#amkina-home-flow",
    "#amkina-home-community-latest",
    "#amkina-home-notices",
    ".amkina-home-notice"
  ];

  function el(id){ return document.getElementById(id); }

  function hideNode(node){
    if(!node) return;
    node.style.setProperty("display","none","important");
    node.classList.remove("active");
  }

  function showNode(node, display){
    if(!node) return;
    node.style.setProperty("display",display || "block","important");
    node.style.setProperty("visibility","visible","important");
    node.style.setProperty("opacity","1","important");
    node.classList.add("active");
  }

  function hideAllPages(){
    PAGE_IDS.forEach(id => hideNode(el(id)));
    document.querySelectorAll(".hero,.hero-slider").forEach(h => {
      h.style.setProperty("display","none","important");
    });
    HOME_ONLY.forEach(sel => {
      document.querySelectorAll(sel).forEach(hideNode);
    });
  }

  function setActiveById(navId){
    document.querySelectorAll("body > header nav a").forEach(a => {
      a.classList.remove("menu-active");
      a.removeAttribute("aria-current");
    });
    const nav = navId ? el(navId) : null;
    if(nav){
      nav.classList.add("menu-active");
      nav.setAttribute("aria-current","page");
    }
  }

  function closeMenus(){
    document.querySelector("body > header nav")?.classList.remove("mobile-open");
    document.getElementById("amkina-mobile-drawer")?.classList.remove("open");
    document.getElementById("amkina-mobile-drawer-backdrop")?.classList.remove("open");
  }

  function finish(){
    closeMenus();
    window.scrollTo(0,0);
  }

  window.amkinaHideAllPages = hideAllPages;

  /* 기존 페이지 함수가 무엇을 남겨두든 마지막에 선택 화면 하나만 남긴다. */
  function wrap(name, targetId, navId, after){
    const old = window[name];
    if(typeof old !== "function" || old.__amkinaUnifiedRouter) return;

    const fn = async function(){
      hideAllPages();

      let result;
      try{
        result = old.apply(this, arguments);
        if(result && typeof result.then === "function") result = await result;
      }catch(err){
        console.error("AMKINA page switch:", name, err);
      }

      /* 기존 함수가 다른 페이지를 다시 열었을 가능성이 있어 한 번 더 정리 */
      PAGE_IDS.forEach(id => {
        if(id !== targetId) hideNode(el(id));
      });

      if(targetId) showNode(el(targetId), "block");
      if(typeof after === "function") after();
      if(navId) setActiveById(navId);
      finish();
      return result === undefined ? false : result;
    };

    fn.__amkinaUnifiedRouter = true;
    window[name] = fn;
  }

  /* HOME은 music 컨테이너를 사용하지만 홈 전용 블록도 다시 표시 */
  wrap("showHomePage","music",null,function(){
    document.querySelectorAll(".hero,.hero-slider").forEach(h => {
      /* 기존 디자인에서 hero-slider가 CSS로 숨겨져 있으면 CSS 상태를 존중 */
      if(h.classList.contains("hero")) h.style.setProperty("display","flex","important");
    });
    HOME_ONLY.forEach(sel => {
      document.querySelectorAll(sel).forEach(n => n.style.setProperty("display","block","important"));
    });
    const homeNav=[...document.querySelectorAll("body > header nav a")]
      .find(a => (a.querySelector(".nav-text")?.textContent || a.textContent || "").trim()==="홈");
    if(homeNav){
      document.querySelectorAll("body > header nav a").forEach(a=>a.classList.remove("menu-active"));
      homeNav.classList.add("menu-active");
      homeNav.setAttribute("aria-current","page");
    }
  });

  wrap("showMusicPage","music",null,function(){
    const nav=[...document.querySelectorAll("body > header nav a")]
      .find(a => (a.querySelector(".nav-text")?.textContent || a.textContent || "").trim()==="음악");
    if(nav){
      document.querySelectorAll("body > header nav a").forEach(a=>a.classList.remove("menu-active"));
      nav.classList.add("menu-active");
    }
  });

  wrap("showStudioPage","studio",null,function(){
    const nav=[...document.querySelectorAll("body > header nav a")]
      .find(a => (a.querySelector(".nav-text")?.textContent || a.textContent || "").trim()==="스튜디오");
    if(nav){document.querySelectorAll("body > header nav a").forEach(a=>a.classList.remove("menu-active"));nav.classList.add("menu-active");}
  });

  wrap("showCommunityPage","community","community-nav");
  wrap("showArtistsPage","artists-page","artists-nav");
  wrap("openChart100","chart100-page","chart100-nav");
  wrap("showMyPage","mypage","mypage-nav");
  wrap("showLibraryPage","library-page","library-nav");

  /* FAQ는 기존 임시 전환 대신 통합 전환기로 교체 */
  window.showFaqPage = function(event){
    if(event && event.preventDefault) event.preventDefault();
    hideAllPages();
    showNode(el("amkina-faq-page"),"block");
    setActiveById("faq-nav");
    finish();
    return false;
  };
  window.hideFaqPage = function(){ hideNode(el("amkina-faq-page")); };

  /* 데스크톱 메뉴: 준비중 메뉴를 제외한 실제 메뉴는 항상 단일 페이지 전환 */
  document.addEventListener("click",function(e){
    const a=e.target.closest("body > header nav a");
    if(!a || a.classList.contains("coming-link") || a.id==="login-btn" || a.id==="logout-btn") return;

    const label=(a.querySelector(".nav-text")?.textContent || a.textContent || "").trim();
    if(label==="FAQ"){
      e.preventDefault();
      e.stopPropagation();
      window.showFaqPage(e);
    }
  },true);

  /* 모바일 FAQ도 같은 화면 전환 사용 */
  document.querySelectorAll('[data-go="faq"]').forEach(btn=>{
    btn.onclick=function(e){ e.preventDefault(); window.showFaqPage(e); };
  });

  /* 브라우저 뒤로/해시 직접 접근 시 FAQ */
  if(location.hash.toLowerCase()==="#faq"){
    setTimeout(()=>window.showFaqPage(),0);
  }
})();

/* ===== AMKINA SCRIPT BLOCK 48 | id="amkina-modern-sidebar-icons-script" ===== */
(function(){
const I={
"홈":'<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/></svg>',
"음악":'<svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
"CHART 100":'<svg viewBox="0 0 24 24"><path d="M4 20V11M10 20V5M16 20v-8M22 20V8"/></svg>',
"아티스트":'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-5 3.3-7 8-7s7.3 2 8 7"/></svg>',
"커뮤니티":'<svg viewBox="0 0 24 24"><path d="M21 14a6 6 0 0 1-6 6H9l-5 2v-6a8 8 0 1 1 17-2Z"/></svg>',
"마이페이지":'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 21c.5-4.5 2.8-6.5 7-6.5s6.5 2 7 6.5"/></svg>',
"FAQ":'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.5 2.1c-.9.5-1.3 1-1.3 2M12 17h.01"/></svg>',
"스튜디오":'<svg viewBox="0 0 24 24"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="14" cy="18" r="2"/></svg>',
"라이브러리":'<svg viewBox="0 0 24 24"><path d="M5 4v16M10 4v16m5-15 4-1 2 15-4 1Z"/></svg>',
"AMKINA 앨범":'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/></svg>',
"RADIO":'<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="m6 7 10-4"/><circle cx="15.5" cy="13.5" r="3"/><path d="M6 12h4M6 16h4"/></svg>',
"이벤트":'<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/></svg>',
"ABOUT":'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 10v7M12 7h.01"/></svg>'
};
function apply(){
 document.querySelectorAll("body > header nav a").forEach(a=>{
  const label=(a.querySelector(".nav-text")?.textContent||a.textContent||"").replace(/\s+/g," ").trim();
  if(!I[label])return;
  let n=a.querySelector(".nav-icon");
  if(!n){n=document.createElement("span");n.className="nav-icon";a.prepend(n)}
  if(n.dataset.modern!==label){n.innerHTML=I[label];n.dataset.modern=label}
 });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",apply);else apply();
new MutationObserver(apply).observe(document.documentElement,{subtree:true,childList:true});
})();

/* ===== AMKINA SCRIPT BLOCK 49 | id="amkina-highlights-clean-final-script" ===== */
(function(){
 const S={rows:[],view:[],mode:"for-you",card:null,start:0,end:25,clip:false,io:null,advancing:false};

 function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
 function session(){try{return JSON.parse(localStorage.getItem("amkina_session")||"null")}catch(e){return null}}
 function headers(json=false){const ss=session(),h={"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+(ss?.access_token||SUPABASE_ANON_KEY)};if(json)h["Content-Type"]="application/json";return h}
 function tindex(id){try{return Array.isArray(tracks)?tracks.findIndex(t=>String(t.id)===String(id)):-1}catch(e){return -1}}
 function fullTrack(id){const i=tindex(id);try{return i>=0?tracks[i]:null}catch(e){return null}}

 function layout(){
   const side=document.querySelector("body > header"),p=document.getElementById("player");
   document.documentElement.style.setProperty("--akh-sidebar-w",(innerWidth>768&&side?Math.round(side.getBoundingClientRect().width):0)+"px");
   document.documentElement.style.setProperty("--akh-player-h",Math.max(70,Math.round(p?.getBoundingClientRect().height||92))+"px");
 }
 function ensureMenu(){
   const nav=document.querySelector("body > header nav");if(!nav||document.getElementById("highlights-nav"))return;
   const radio=[...nav.querySelectorAll("a")].find(a=>(a.querySelector(".nav-text")?.textContent||a.textContent||"").trim()==="RADIO");
   const a=document.createElement("a");a.id="highlights-nav";a.href="#highlights";a.innerHTML='<span class="nav-icon">▶</span><span class="nav-text">HIGHLIGHTS</span>';
   if(radio)radio.insertAdjacentElement("afterend",a);else nav.appendChild(a);
 }
 function setMeta(t){
   if(!t)return;let i=tindex(t.id);if(i<0&&Array.isArray(tracks)){tracks.push(t);i=tracks.length-1;}if(i>=0)currentIndex=i;
   const c=document.getElementById("now-cover");if(c&&t.cover_url)c.src=t.cover_url;
   const ti=document.getElementById("now-title");if(ti)ti.textContent=t.title||"Untitled";
   const ar=document.getElementById("now-artist");if(ar)ar.textContent=t.artist||"AMKINA";
 }
 async function load(){
   const feed=document.getElementById("akh-feed");feed.innerHTML='<div class="akh-empty">HIGHLIGHTS를 불러오는 중...</div>';
   try{
     const u=SUPABASE_URL+"/rest/v1/tracks?select=id,title,artist,genre,cover_url,audio_url,highlight_enabled,highlight_start,highlight_end&highlight_enabled=eq.true&order=id.desc&limit=100";
     const r=await fetch(u,{headers:headers()});if(!r.ok)throw new Error(await r.text());
     S.rows=await r.json();render();
   }catch(e){console.error("HIGHLIGHTS",e);feed.innerHTML='<div class="akh-empty">HIGHLIGHTS를 불러오지 못했습니다.</div>'}
 }
 function render(){
   S.view=S.mode==="for-you"?[...S.rows].sort(()=>Math.random()-.5):[...S.rows];
   const feed=document.getElementById("akh-feed");
   if(!S.view.length){feed.innerHTML='<div class="akh-empty">등록된 하이라이트가 없습니다.</div>';return}
   feed.innerHTML=S.view.map((t,i)=>{const st=Math.max(0,+t.highlight_start||0),en=Math.max(st+5,+t.highlight_end||25);return `<article class="akh-card" data-i="${i}" data-start="${st}" data-end="${en}">
    <div class="akh-bg" style="background-image:url('${esc(t.cover_url||"")}')"></div><div class="akh-coverbox"><img class="akh-cover" src="${esc(t.cover_url||"")}"></div><div class="akh-shade"></div>
    <button class="akh-sound">${audio.muted?"🔇":"🔊"} SOUND</button>
    <div class="akh-info"><div class="akh-kicker">AMKINA HIGHLIGHT</div><div class="akh-title">${esc(t.title||"Untitled")}</div><div class="akh-artist">${esc(t.artist||"AMKINA")}</div><div class="akh-genre">${esc(t.genre||"ORIGINAL")}</div><div class="akh-progress"><i></i></div><button class="akh-full">▶ 전체 곡 듣기</button></div>
    <div class="akh-actions"><button class="akh-action akh-like"><span class="ico">♡</span><small>LIKE</small></button><button class="akh-action akh-comment"><span class="ico">◯</span><small>COMMENT</small></button><button class="akh-action akh-share"><span class="ico">↗</span><small>SHARE</small></button></div>
   </article>`}).join("");
   feed.querySelectorAll(".akh-card").forEach(card=>bindCard(card,S.view[+card.dataset.i]));observe();
 }
 function bindCard(card,t){
   card.querySelector(".akh-cover").onclick=()=>audio.paused?playClip(card,t):audio.pause();
   card.querySelector(".akh-sound").onclick=()=>{audio.muted=!audio.muted;document.querySelectorAll(".akh-sound").forEach(b=>b.textContent=(audio.muted?"🔇":"🔊")+" SOUND")};
   card.querySelector(".akh-full").onclick=()=>playFull(t.id);
   card.querySelector(".akh-comment").onclick=()=>{audio.pause();try{openTrackComments(t.id)}catch(e){}};
   card.querySelector(".akh-share").onclick=async()=>{
      if(typeof window.amkinaShareTrack==="function") return window.amkinaShareTrack(t);
      const u="https://bbtzasddvodrprpnbeos.supabase.co/functions/v1/track-share?id="+encodeURIComponent(t.id);
      try{
        if(navigator.share) await navigator.share({title:t.title||"AMKINA MUSIC",text:(t.artist||"")+" · AMKINA MUSIC",url:u});
        else{await navigator.clipboard.writeText(u);alert("앨범 표지가 표시되는 공유 링크를 복사했습니다.");}
      }catch(e){}
    };
   const lb=card.querySelector(".akh-like");paintLike(lb,t.id);lb.onclick=()=>toggleLike(lb,t.id);
 }
 async function paintLike(b,id){const ss=session();if(!ss?.user?.id)return;try{const r=await fetch(SUPABASE_URL+"/rest/v1/track_likes?select=track_id&track_id=eq."+id+"&user_id=eq."+ss.user.id,{headers:headers()});const liked=r.ok&&(await r.json()).length>0;b.classList.toggle("liked",liked);b.querySelector(".ico").textContent=liked?"♥":"♡"}catch(e){}}
 async function toggleLike(b,id){
   b.disabled=true;try{await toggleTrackLike(id);await paintLike(b,id);const liked=typeof amkinaTrackLikes!=="undefined"&&amkinaTrackLikes.has(String(id));const btn=document.getElementById("player-like-btn");btn?.classList.toggle("is-liked",!!liked);btn?.setAttribute("aria-pressed",String(!!liked));}finally{b.disabled=false}
 }
 document.getElementById("player-like-btn")?.addEventListener("click",()=>{
   const sync=()=>{if(S.card){const t=S.view[+S.card.dataset.i];if(t)paintLike(S.card.querySelector(".akh-like"),t.id)}};
   const btn=document.getElementById("player-like-btn");
   if(btn.disabled){const observer=new MutationObserver(()=>{if(!btn.disabled){observer.disconnect();sync()}});observer.observe(btn,{attributes:true,attributeFilter:["disabled"]})}else sync();
 });

 function playClip(card,t){if(!t?.audio_url)return;S.card=card;S.clip=true;S.start=+card.dataset.start;S.end=+card.dataset.end;window.amkinaClipRange={start:S.start,end:S.end};setMeta(fullTrack(t.id)||t);const target=new URL(t.audio_url,location.href).href,same=audio.src===target;if(!same)audio.src=t.audio_url;const go=()=>{if(!S.clip||S.card!==card||audio.src!==target)return;if(!same||audio.currentTime<S.start||audio.currentTime>=S.end)audio.currentTime=S.start;audio.play().catch(()=>{})};audio.readyState>=1?go():audio.addEventListener("loadedmetadata",go,{once:true})}
 function playFull(id){S.clip=false;S.card=null;window.amkinaClipRange=null;const i=tindex(id);if(i>=0&&typeof playTrack==="function")playTrack(i)}
 window.amkinaEndClip=function(){S.clip=false;S.card=null;window.amkinaClipRange=null;};
 window.amkinaHighlightStep=function(delta){
   if(!S.clip||!document.body.classList.contains("akh-active"))return false;
   const cards=[...document.querySelectorAll(".akh-card")];if(!cards.length)return false;
   const i=cards.indexOf(S.card),card=cards[(i+delta+cards.length)%cards.length];
   card.scrollIntoView({behavior:"instant",block:"start"});playClip(card,S.view[+card.dataset.i]);return true;
 };
 audio.addEventListener("loadstart",()=>{if(S.clip&&S.card){const t=S.view[+S.card.dataset.i];if(t&&audio.src!==new URL(t.audio_url,location.href).href){S.clip=false;S.card=null;window.amkinaClipRange=null;}}});
 function observe(){S.io?.disconnect();const feed=document.getElementById("akh-feed");S.io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&e.intersectionRatio>.72){const c=e.target,t=S.view[+c.dataset.i];if(document.body.classList.contains("akh-active")&&c!==S.card)playClip(c,t)}}),{root:feed,threshold:[.72]});feed.querySelectorAll(".akh-card").forEach(c=>S.io.observe(c))}
 function nextCard(){if(S.advancing)return;S.advancing=true;const cards=[...document.querySelectorAll(".akh-card")],i=cards.indexOf(S.card),n=cards[(i+1)%cards.length];if(n){n.scrollIntoView({behavior:"instant",block:"start"});playClip(n,S.view[+n.dataset.i]);}setTimeout(()=>S.advancing=false,800)}
 audio.addEventListener("timeupdate",()=>{if(!S.clip||!S.card||!document.body.classList.contains("akh-active"))return;const p=Math.max(0,Math.min(1,(audio.currentTime-S.start)/(S.end-S.start)));S.card.querySelector(".akh-progress i").style.width=(p*100)+"%";if(audio.currentTime>=S.end-.12)nextCard()});

 async function openHighlights(e){e?.preventDefault?.();e?.stopPropagation?.();document.getElementById("highlights-page")?.style.removeProperty("display");document.body.classList.add("akh-active");layout();document.querySelectorAll("body > header nav a").forEach(a=>a.classList.remove("menu-active"));document.getElementById("highlights-nav")?.classList.add("menu-active");document.querySelector("body > header nav")?.classList.remove("mobile-open");await load()}
 function closeHighlights(){if(!document.body.classList.contains("akh-active"))return;document.body.classList.remove("akh-active");document.getElementById("highlights-nav")?.classList.remove("menu-active");if(S.clip){audio.pause();S.clip=false;S.card=null;window.amkinaClipRange=null}}

 /* 단 하나의 메뉴 라우팅 처리기 */
 document.addEventListener("click",e=>{
   const nav=e.target.closest("body > header nav a");if(!nav)return;
   if(nav.id==="highlights-nav"){e.preventDefault();e.stopImmediatePropagation();openHighlights(e);return}
   closeHighlights();
 },true);

 document.addEventListener("click",e=>{const b=e.target.closest("#highlights-page .akh-tab");if(!b)return;document.querySelectorAll(".akh-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");S.mode=b.dataset.mode;render()});
 document.addEventListener("DOMContentLoaded",()=>{ensureMenu();layout()});
 window.addEventListener("load",()=>{ensureMenu();layout()});window.addEventListener("resize",layout);
 new MutationObserver(ensureMenu).observe(document.documentElement,{childList:true,subtree:true});
})();

/* ===== AMKINA SCRIPT BLOCK 50 | id="amkina-highlights-close-v1-script" ===== */
(function(){
 function ensureClose(){
   const page=document.getElementById("highlights-page");
   if(!page||document.getElementById("akh-close-btn"))return;
   const b=document.createElement("button");
   b.id="akh-close-btn";
   b.className="akh-close";
   b.type="button";
   b.setAttribute("aria-label","HIGHLIGHTS 닫기");
   b.innerHTML="×";
   page.appendChild(b);
   b.addEventListener("click",function(e){
     e.preventDefault();e.stopPropagation();
     window.amkinaEndClip?.();try{if(typeof audio!=="undefined"&&!audio.paused)audio.pause()}catch(_){}
     document.body.classList.remove("akh-active");
     page.style.setProperty("display","none","important");
     document.getElementById("highlights-nav")?.classList.remove("menu-active");

     /* 기존 사이트의 홈 메뉴를 실제 클릭시켜 초기 홈 화면으로 복귀 */
     const links=[...document.querySelectorAll("body > header nav a")];
     const home=links.find(a=>{
       const txt=(a.querySelector(".nav-text")?.textContent||a.textContent||"").trim();
       const href=a.getAttribute("href")||"";
       return txt==="홈" || txt.toUpperCase()==="HOME" || href==="#home";
     });
     if(home){
       home.click();
     }else{
       /* 홈 링크를 못 찾는 경우 안전하게 첫 화면 상태로 복귀 */
       try{history.replaceState(null,"",location.pathname+location.search)}catch(_){}
       location.hash="";
       window.scrollTo({top:0,behavior:"smooth"});
     }
   });
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ensureClose);else ensureClose();
 window.addEventListener("load",ensureClose);
 new MutationObserver(ensureClose).observe(document.documentElement,{subtree:true,childList:true});
})();

/* ===== AMKINA SCRIPT BLOCK 51 | id="amkina-home-highlights-v4-playerhandoff-script" ===== */
(function(){
 const ID="amkina-home-highlights";
 let previewRows=[];

 function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
 function headers(){try{const ss=JSON.parse(localStorage.getItem("amkina_session")||"null");return {"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+(ss?.access_token||SUPABASE_ANON_KEY)}}catch(e){return {"apikey":SUPABASE_ANON_KEY,"Authorization":"Bearer "+SUPABASE_ANON_KEY}}}
 function exactHeading(text){return [...document.querySelectorAll("h1,h2,h3,h4,h5,strong,div")].find(el=>!el.closest("#"+ID)&&(el.textContent||"").trim()===text)||null}
 function sectionOf(h){let n=h;for(let i=0;i<6&&n?.parentElement;i++){const p=n.parentElement,txt=(p.textContent||"");if(txt.includes((h.textContent||"").trim())&&(p.querySelector("table")||p.querySelectorAll("tr").length>=2||p.children.length>=2)){n=p;break}n=p}return n}

 function mount(){
   let box=document.getElementById(ID),latest=exactHeading("Latest Releases");if(!latest)return box;
   const latestSection=sectionOf(latest);
   if(!box){
     box=document.createElement("section");box.id=ID;
     box.innerHTML='<div class="amh3-head"><div class="amh3-left"><div class="amh3-title">HIGHLIGHTS</div><div class="amh3-sub">짧게 만나는 새로운 음악</div></div><button class="amh3-more">전체보기 →</button></div><div class="amh3-list"><div style="font-size:10px;color:#999">불러오는 중...</div></div>';
     box.querySelector(".amh3-more").onclick=()=>document.getElementById("highlights-nav")?.click();
   }
   if(box.nextElementSibling!==latestSection)latestSection.parentNode.insertBefore(box,latestSection);
   return box;
 }

 async function fill(){
   const box=mount();if(!box||box.dataset.loaded==="1")return;box.dataset.loaded="1";
   try{
     const r=await fetch(SUPABASE_URL+"/rest/v1/tracks?select=id,title,artist,cover_url,audio_url,highlight_start,highlight_end,highlight_enabled&highlight_enabled=eq.true&order=id.desc&limit=18",{headers:headers()});
     if(!r.ok)throw new Error(await r.text());
     let rows=await r.json();previewRows=[...rows].sort(()=>Math.random()-.5).slice(0,6);
     const list=box.querySelector(".amh3-list");
     if(!previewRows.length){list.innerHTML='<div style="font-size:10px;color:#999">등록된 HIGHLIGHTS가 없습니다.</div>';return}
     list.innerHTML=previewRows.map(t=>`<article class="amh3-item" data-id="${esc(t.id)}"><div class="amh3-cover"><img src="${esc(t.cover_url||"")}" alt=""><button class="amh3-play" aria-label="하이라이트 재생">▶</button></div><div class="amh3-name">${esc(t.title||"Untitled")}</div><div class="amh3-artist">${esc(t.artist||"AMKINA")}</div></article>`).join("");
     list.querySelectorAll(".amh3-item").forEach(card=>card.addEventListener("click",()=>handoff(card.dataset.id)));
   }catch(e){console.error("HOME HIGHLIGHTS",e);box.dataset.loaded="";box.querySelector(".amh3-list").innerHTML='<div style="font-size:10px;color:#999">HIGHLIGHTS를 불러오지 못했습니다.</div>'}
 }

 function handoff(id){
   const t=previewRows.find(x=>String(x.id)===String(id));if(!t)return;
   /*
     핵심 수정:
     일반 음원이 재생 중이어도 별도 audio를 만들지 않고 기존 공통 audio를 그대로 넘겨받는다.
     먼저 현재 일반곡 재생을 중단한 뒤 HIGHLIGHTS 페이지를 열고,
     해당 카드가 렌더된 후 그 카드의 기존 playClip 동작을 실행한다.
   */
   try{if(typeof audio!=="undefined"){audio.pause();}}catch(e){}
   document.getElementById("highlights-nav")?.click();

   let tries=0;
   const seek=setInterval(()=>{
     tries++;
     const cards=[...document.querySelectorAll("#akh-feed .akh-card")];
     const card=cards.find(c=>(c.querySelector(".akh-title")?.textContent||"").trim()===String(t.title||"Untitled").trim() &&
                              (c.querySelector(".akh-artist")?.textContent||"").trim()===String(t.artist||"AMKINA").trim());
     if(card){
       clearInterval(seek);
       card.scrollIntoView({behavior:"auto",block:"start"});
       setTimeout(()=>{
         const cover=card.querySelector(".akh-cover");
         if(cover)cover.click();
       },180);
     }else if(tries>20)clearInterval(seek);
   },100);
 }

 function boot(){mount();fill()}
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
 window.addEventListener("load",boot);setTimeout(boot,500);setTimeout(boot,1500);
 new MutationObserver(()=>{if(!document.getElementById(ID))boot();else mount()}).observe(document.body,{childList:true,subtree:true});
})();

/* ===== AMKINA SCRIPT BLOCK 52 | id="amkina-album-v1-script" ===== */
(function(){
 let albumRows=[], selected=null, albumSocial={};
 const $=q=>document.querySelector(q);
 function session(){try{return JSON.parse(localStorage.getItem("amkina_session")||"null")}catch(e){return null}}
 function token(){return session()?.access_token||SUPABASE_ANON_KEY}
 function userId(){return session()?.user?.id||null}
 function userName(){const s=session();return s?.user?.user_metadata?.display_name||s?.user?.user_metadata?.name||s?.user?.email?.split("@")[0]||"AMKINA USER"}
 function h(json=false){const x={apikey:SUPABASE_ANON_KEY,Authorization:"Bearer "+token()};if(json)x["Content-Type"]="application/json";return x}
 function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
 function dateText(v){try{return new Date(v).toLocaleString("ko-KR",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch(e){return ""}}
 function sid(v){return encodeURIComponent(String(v??""))}

 window.showAmkinaAlbum=function(e){
   if(e){e.preventDefault();e.stopPropagation()}
   document.querySelectorAll("body > header nav a").forEach(a=>a.classList.remove("menu-active"));
   $("#album-nav")?.classList.add("menu-active");
   $("#amkina-album-page").style.display="block";
   document.body.classList.remove("akh-active");
   const hp=$("#highlights-page"); if(hp)hp.style.setProperty("display","none","important");
   if(typeof closeMobileMenu==="function")closeMobileMenu();
   loadAlbum(); $("#amkina-album-page").scrollTop=0;
 };
 function hideAlbum(){const p=$("#amkina-album-page");if(p)p.style.display="none"}
 ["showHomePage","showMusicPage","showStudioPage","showCommunityPage","showMyPage","showLibraryPage","showArtistsPage"].forEach(n=>{
   const old=window[n];if(typeof old==="function")window[n]=function(){hideAlbum();return old.apply(this,arguments)}
 });

 async function loadSocialCounts(){
   albumSocial={};
   try{
     const [lr,cr]=await Promise.all([
       fetch(SUPABASE_URL+"/rest/v1/album_likes?select=post_id,user_id",{headers:h()}),
       fetch(SUPABASE_URL+"/rest/v1/album_comments?select=post_id,id",{headers:h()})
     ]);
     if(lr.ok){
       (await lr.json()).forEach(x=>{
         const k=String(x.post_id); albumSocial[k]??={likes:0,comments:0,liked:false};
         albumSocial[k].likes++; if(userId()&&x.user_id===userId())albumSocial[k].liked=true;
       });
     }
     if(cr.ok){
       (await cr.json()).forEach(x=>{
         const k=String(x.post_id); albumSocial[k]??={likes:0,comments:0,liked:false};
         albumSocial[k].comments++;
       });
     }
   }catch(e){console.warn("앨범 소셜 카운트 로드 실패",e)}
 }

 async function loadAlbum(){
   const grid=$("#aa-grid"); if(!grid)return;
   grid.innerHTML='<div class="aa-empty">사진을 불러오는 중...</div>';
   try{
     const r=await fetch(SUPABASE_URL+"/rest/v1/album_posts?select=*&order=created_at.desc&limit=100",{headers:h()});
     if(!r.ok)throw new Error(await r.text());
     albumRows=await r.json();
     await loadSocialCounts();
     if(!albumRows.length){grid.innerHTML='<div class="aa-empty">아직 등록된 사진이 없습니다.<br>첫 번째 사진을 올려보세요.</div>';return}
     grid.innerHTML=albumRows.map(x=>{
       const s=albumSocial[String(x.id)]||{likes:0,comments:0,liked:false};
       return `<article class="aa-card" data-id="${x.id}">
         <div class="aa-photo"><img loading="lazy" src="${esc(x.image_url)}" alt=""></div>
         <div class="aa-meta">
           <div class="aa-name">${esc(x.title||"Untitled")}</div>
           <div class="aa-author">${esc(x.author_name||"AMKINA USER")}</div>
           <div class="aa-social"><span>${s.liked?"♥":"♡"} ${s.likes}</span><span>💬 ${s.comments}</span></div>
         </div>
       </article>`;
     }).join("");
     grid.querySelectorAll(".aa-card").forEach(c=>c.onclick=()=>openView(c.dataset.id));
   }catch(err){console.error(err);grid.innerHTML='<div class="aa-empty">앨범을 불러오지 못했습니다.<br>Supabase 앨범 설정을 먼저 적용해주세요.</div>'}
 }

 async function openView(id){
   selected=albumRows.find(x=>String(x.id)===String(id));if(!selected)return;
   $("#aa-view-img").src=selected.image_url;$("#aa-view-title").textContent=selected.title||"";
   $("#aa-view-author").textContent=selected.author_name||"AMKINA USER";$("#aa-view-desc").textContent=selected.description||"";
   $("#aa-delete").style.display=(userId()&&selected.user_id===userId())?"inline-block":"none";
   $("#aa-view-modal").classList.add("open");
   $("#aa-comment-input").value="";
   await loadSelectedSocial();
 }

 async function loadSelectedSocial(){
   if(!selected)return;
   const pid=sid(selected.id);
   try{
     const [lr,cr]=await Promise.all([
       fetch(SUPABASE_URL+"/rest/v1/album_likes?post_id=eq."+pid+"&select=user_id",{headers:h()}),
       fetch(SUPABASE_URL+"/rest/v1/album_comments?post_id=eq."+pid+"&select=*&order=created_at.asc",{headers:h()})
     ]);
     const likes=lr.ok?await lr.json():[];
     const comments=cr.ok?await cr.json():[];
     const liked=!!userId()&&likes.some(x=>x.user_id===userId());
     $("#aa-view-like-count").textContent=likes.length;
     $("#aa-view-comment-count").textContent=comments.length;
     $("#aa-comment-title-count").textContent=comments.length;
     $("#aa-like-btn").classList.toggle("liked",liked);
     $("#aa-like-btn").textContent=liked?"♥ 좋아요 취소":"♡ 좋아요";
     $("#aa-comment-list").innerHTML=comments.length?comments.map(c=>`
       <div class="aa-comment">
         <div class="aa-comment-top"><span class="aa-comment-name">${esc(c.author_name||"AMKINA USER")}</span><span>${esc(dateText(c.created_at))}</span></div>
         <div class="aa-comment-text">${esc(c.content||"")}</div>
       </div>`).join(""):'<div class="aa-comment-empty">첫 댓글을 남겨보세요.</div>';
     albumSocial[String(selected.id)]={likes:likes.length,comments:comments.length,liked};
   }catch(e){console.error(e);$("#aa-comment-list").innerHTML='<div class="aa-comment-empty">댓글을 불러오지 못했습니다.</div>'}
 }

 async function toggleLike(){
   if(!selected)return;
   if(!userId()){alert("좋아요는 로그인 후 사용할 수 있습니다.");return}
   const pid=sid(selected.id), uid=sid(userId());
   const check=await fetch(SUPABASE_URL+"/rest/v1/album_likes?post_id=eq."+pid+"&user_id=eq."+uid+"&select=id",{headers:h()});
   const rows=check.ok?await check.json():[];
   if(rows.length){
     const r=await fetch(SUPABASE_URL+"/rest/v1/album_likes?post_id=eq."+pid+"&user_id=eq."+uid,{method:"DELETE",headers:h()});
     if(!r.ok)throw new Error(await r.text());
   }else{
     const r=await fetch(SUPABASE_URL+"/rest/v1/album_likes",{method:"POST",headers:{...h(true),Prefer:"return=minimal"},body:JSON.stringify({post_id:String(selected.id),user_id:userId()})});
     if(!r.ok)throw new Error(await r.text());
   }
   await loadSelectedSocial(); await loadAlbum();
 }

 async function submitComment(){
   if(!selected)return;
   if(!userId()){alert("댓글은 로그인 후 작성할 수 있습니다.");return}
   const input=$("#aa-comment-input"), content=input.value.trim();
   if(!content)return alert("댓글을 입력해주세요.");
   const btn=$("#aa-comment-submit");btn.disabled=true;btn.textContent="등록 중...";
   try{
     const r=await fetch(SUPABASE_URL+"/rest/v1/album_comments",{method:"POST",headers:{...h(true),Prefer:"return=minimal"},body:JSON.stringify({
       post_id:String(selected.id),user_id:userId(),author_name:userName(),content
     })});
     if(!r.ok)throw new Error(await r.text());
     input.value=""; await loadSelectedSocial(); await loadAlbum();
   }catch(e){console.error(e);alert("댓글을 등록하지 못했습니다.")}
   finally{btn.disabled=false;btn.textContent="등록"}
 }

 function closeModals(){document.querySelectorAll(".aa-modal.open").forEach(m=>m.classList.remove("open"))}
 document.querySelectorAll("[data-aa-close]").forEach(b=>b.onclick=closeModals);
 document.querySelectorAll(".aa-modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModals()}));

 $("#aa-like-btn").onclick=()=>toggleLike().catch(e=>{console.error(e);alert("좋아요 처리에 실패했습니다.")});
 $("#aa-comment-submit").onclick=submitComment;
 $("#aa-comment-input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitComment()}});

 $("#aa-open-upload").onclick=()=>{
   if(!userId()){alert("로그인 후 사진을 올릴 수 있습니다.");return}
   $("#aa-file").value="";$("#aa-title").value="";$("#aa-desc").value="";$("#aa-preview").style.display="none";$("#aa-upload-modal").classList.add("open");
 };
 $("#aa-file").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const p=$("#aa-preview");p.src=URL.createObjectURL(f);p.style.display="block"};

 $("#aa-submit").onclick=async function(){
   const f=$("#aa-file").files?.[0], title=$("#aa-title").value.trim(), desc=$("#aa-desc").value.trim();
   if(!f)return alert("사진을 선택해주세요."); if(!title)return alert("제목을 입력해주세요.");
   if(f.size>10*1024*1024)return alert("사진은 10MB 이하로 올려주세요.");
   this.disabled=true;this.textContent="업로드 중...";
   try{
     const ext=(f.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
     const path=userId()+"/"+Date.now()+"-"+Math.random().toString(36).slice(2)+"."+ext;
     const up=await fetch(SUPABASE_URL+"/storage/v1/object/album-images/"+path,{method:"POST",headers:{apikey:SUPABASE_ANON_KEY,Authorization:"Bearer "+token(),"Content-Type":f.type||"image/jpeg","x-upsert":"false"},body:f});
     if(!up.ok)throw new Error("이미지 업로드 실패: "+await up.text());
     const imageUrl=SUPABASE_URL+"/storage/v1/object/public/album-images/"+path;
     const ins=await fetch(SUPABASE_URL+"/rest/v1/album_posts",{method:"POST",headers:{...h(true),Prefer:"return=representation"},body:JSON.stringify({user_id:userId(),author_name:userName(),title,description:desc,image_url:imageUrl,storage_path:path})});
     if(!ins.ok)throw new Error("게시물 저장 실패: "+await ins.text());
     closeModals();await loadAlbum();
   }catch(err){console.error(err);alert("업로드하지 못했습니다. Supabase 설정을 확인해주세요.")}
   finally{this.disabled=false;this.textContent="게시하기"}
 };

 $("#aa-delete").onclick=async function(){
   if(!selected||selected.user_id!==userId())return;if(!confirm("이 사진을 삭제할까요?"))return;
   try{
     await fetch(SUPABASE_URL+"/rest/v1/album_likes?post_id=eq."+sid(selected.id),{method:"DELETE",headers:h()});
     await fetch(SUPABASE_URL+"/rest/v1/album_comments?post_id=eq."+sid(selected.id),{method:"DELETE",headers:h()});
     const del=await fetch(SUPABASE_URL+"/rest/v1/album_posts?id=eq."+encodeURIComponent(selected.id),{method:"DELETE",headers:h()});
     if(!del.ok)throw new Error(await del.text());
     if(selected.storage_path)await fetch(SUPABASE_URL+"/storage/v1/object/album-images/"+selected.storage_path,{method:"DELETE",headers:h()});
     closeModals();selected=null;await loadAlbum();
   }catch(err){console.error(err);alert("삭제하지 못했습니다.")}
 };
})();

/* ===== AMKINA SCRIPT BLOCK 53 | id="amkina-dynamic-og-share-v2" ===== */
(function(){
 const BASE="https://bbtzasddvodrprpnbeos.supabase.co/functions/v1/track-share";
 function url(t){return t&&t.id!=null?BASE+"?id="+encodeURIComponent(t.id):location.href}
 async function share(t){
   if(!t)return;
   const u=url(t), title=t.title||"AMKINA MUSIC", artist=t.artist||"AMKINA MUSIC";
   try{if(navigator.share){await navigator.share({title,text:title+" - "+artist,url:u});return}}catch(e){if(e?.name==="AbortError")return}
   try{await navigator.clipboard.writeText(u);alert("앨범 표지가 표시되는 공유 링크를 복사했습니다.")}catch(e){prompt("공유 링크를 복사해주세요.",u)}
 }
 window.amkinaShareUrl=url; window.amkinaShareTrack=share;
 document.addEventListener("click",e=>{
   const b=e.target.closest('[data-action="share"],[data-share-track],.share-btn,.track-share-btn,#share-btn,#player-share,#player-share-btn,.akh-share');
   if(!b)return;
   let t=null,id=b.dataset?.trackId||b.closest("[data-track-id]")?.dataset?.trackId;
   if(typeof tracks!=="undefined"&&Array.isArray(tracks)){
     if(id!=null)t=tracks.find(x=>String(x.id)===String(id));
     if(!t&&typeof currentTrackIndex!=="undefined"&&currentTrackIndex>=0)t=tracks[currentTrackIndex];
   }
   if(!t&&typeof currentTrack!=="undefined")t=currentTrack;
   if(!t)return;
   e.preventDefault();e.stopImmediatePropagation();share(t);
 },true);
})();

/* ===== AMKINA SCRIPT BLOCK 54 | id="amkina-chart100-premium-script-v2" ===== */
function amkinaChartPodiumCard(t,rank){
 const plays=amkinaChartDisplayPlays(t).toLocaleString(),likes=amkinaChartLikeCount(t).toLocaleString();
 return `<article class="chart100-podium-card rank${rank}" onclick="amkinaPlayChartTrack('${String(t.id).replace(/'/g,"\\'")}')"><div class="chart100-podium-cover"><img src="${t.cover_url||t.cover||''}" alt=""><span class="chart100-podium-no">${String(rank).padStart(2,'0')}</span><button class="chart100-podium-play" type="button" aria-label="재생">▶</button></div><div class="chart100-podium-info"><b>${escapeHtmlChart(t.title||'Untitled')}</b><div class="chart100-podium-artist">${escapeHtmlChart(t.artist||'AMKINA')}</div><div class="chart100-podium-bottom"><span class="chart100-podium-move">${amkinaChartPeriod==="all"?amkinaChartMoveHtml(t.id):"―"}</span><span class="chart100-podium-stats"><span>▶ ${plays}</span><span>♡ ${likes}</span></span></div></div></article>`;
}
async function renderChart100(){
 const el=document.getElementById('chart100-list'); if(!el)return;
 const likeCounts={};
 try{const r=await fetch(SUPABASE_URL+'/rest/v1/track_likes?select=track_id',{headers:{apikey:SUPABASE_ANON_KEY,Authorization:'Bearer '+SUPABASE_ANON_KEY}});if(r.ok)(await r.json()).forEach(x=>{const id=String(x.track_id);likeCounts[id]=(likeCounts[id]||0)+1})}catch(e){console.warn('CHART 100 좋아요 집계 실패',e)}
 await amkinaLoadPeriodPlays(amkinaChartPeriod);
 if(amkinaChartPeriod==="all") await amkinaLoadChartSnapshots(); amkinaStartChartCountdown();
 const source=(typeof tracks!=='undefined'&&Array.isArray(tracks)?tracks:[]);source.forEach(t=>t._live_like_count=likeCounts[String(t.id)]||0);
 let list=source.slice(),lm=amkinaChartPeriod==="all"?(amkinaChartSnapshotMeta.latestMap||{}):{};
 if(amkinaChartPeriod!=="all") list=list.filter(t=>amkinaChartDisplayPlays(t)>0).sort((a,b)=>amkinaChartDisplayPlays(b)-amkinaChartDisplayPlays(a)||amkinaTrackPlays(b)-amkinaTrackPlays(a)).slice(0,100);
 else if(amkinaChartSnapshotMeta.latest&&Object.keys(lm).length)list=list.filter(t=>lm[String(t.id)]!=null).sort((a,b)=>lm[String(a.id)]-lm[String(b.id)]).slice(0,100);else list=list.sort((a,b)=>amkinaTrackPlays(b)-amkinaTrackPlays(a)).slice(0,100);
 if(!list.length){el.innerHTML='<div class="chart100-empty">등록된 음원이 없습니다.</div>';return}
 const top=list.slice(0,3); const ordered=top.length>=3?[top[1],top[0],top[2]]:top;
 const podium=`<div class="chart100-podium">${ordered.map(t=>amkinaChartPodiumCard(t,amkinaChartPeriod==="all"?(lm[String(t.id)]||list.indexOf(t)+1):(list.indexOf(t)+1))).join('')}</div>`;
 const head=`<div class="chart100-list-head"><span>RANK</span><span>MOVE</span><span></span><span>TRACK</span><span>PLAYS</span><span>LIKES</span><span></span></div>`;
 const rows=list.map((t,i)=>{const rank=amkinaChartPeriod==="all"?(lm[String(t.id)]||i+1):(i+1),topClass=rank<=3?' top'+rank:'';return `<div class="chart100-row${topClass}" onclick="amkinaPlayChartTrack('${String(t.id).replace(/'/g,"\\'")}')"><div class="chart100-rank">${String(rank).padStart(2,'0')}</div><div class="chart100-move">${amkinaChartPeriod==="all"?amkinaChartMoveHtml(t.id):"―"}</div><img class="chart100-cover" src="${t.cover_url||t.cover||''}" alt=""><div class="chart100-song"><b>${escapeHtmlChart(t.title||'Untitled')}</b><span>${escapeHtmlChart(t.artist||'AMKINA')}</span></div><div class="chart100-stat">${amkinaChartDisplayPlays(t).toLocaleString()}</div><div class="chart100-stat chart100-like">${amkinaChartLikeCount(t).toLocaleString()}</div><div class="chart100-play-mini">▶</div></div>`}).join('');
 el.innerHTML=podium+head+rows;
}

/* ===== AMKINA SCRIPT BLOCK 55 | id="amkina-library-premium-v2-script" ===== */
(function(){
 const esc=v=>typeof libEsc==='function'?libEsc(v):String(v||'');
 function ensureOverview(){
  const page=document.getElementById('library-page'), smart=page?.querySelector('.lib-smart'); if(!page||!smart||document.getElementById('lib-premium-overview'))return;
  const box=document.createElement('div');box.id='lib-premium-overview';box.className='lib-premium-overview';
  box.innerHTML='<section class="lib-premium-panel"><div class="lib-premium-panel-head"><h2>최근 재생</h2><span>RECENTLY PLAYED</span></div><div id="lib-premium-recent" class="lib-recent-covers"></div></section><section class="lib-premium-panel"><div class="lib-premium-panel-head"><h2>My Library</h2><span>OVERVIEW</span></div><div class="lib-stat-stack"><div class="lib-stat"><span>좋아요</span><strong id="lib-premium-like-stat">0</strong></div><div class="lib-stat"><span>최근 감상</span><strong id="lib-premium-recent-stat">0</strong></div><div class="lib-stat lib-stat-wide"><span>AMKINA COLLECTION</span><strong id="lib-premium-playlist-stat">0 PLAYLISTS</strong></div></div></section>';
  smart.after(box);
 }
 async function refreshOverview(){
  ensureOverview(); const host=document.getElementById('lib-premium-recent');if(!host)return;
  let recent=[],likes=[],pls=[];
  if(typeof libraryNeedLogin==='function'&&!libSession()?.user?.id){host.innerHTML='<div style="grid-column:1/-1;color:#999;font-size:12px;padding:20px 0">로그인하면 최근 감상 음악이 여기에 표시됩니다.</div>';return}
  try{const [rr,lr,pr]=await Promise.all([libFetch('listening_history?select=track_id,played_at&order=played_at.desc&limit=30'),libFetch('track_likes?select=track_id'),libFetch('playlists?select=id')]);recent=await rr.json();likes=await lr.json();pls=await pr.json()}catch(e){console.warn(e)}
  const seen=new Set(),ts=[];for(const r of recent){if(!seen.has(String(r.track_id))){seen.add(String(r.track_id));const t=libTrack(r.track_id);if(t)ts.push(t)}if(ts.length>=5)break}
  host.innerHTML=ts.length?ts.map(t=>{const c=libCover(t);return '<div class="lib-recent-tile" onclick="libraryPlayTrack(\''+t.id+'\')">'+(c?'<img src="'+esc(c)+'">':'<div class="lib-recent-placeholder"></div>')+'<b>'+esc(t.title)+'</b><small>'+esc(t.artist)+'</small></div>'}).join(''):'<div style="grid-column:1/-1;color:#999;font-size:12px;padding:20px 0">아직 재생 기록이 없습니다. 음악을 들어보세요.</div>';
  const a=document.getElementById('lib-premium-like-stat'),b=document.getElementById('lib-premium-recent-stat'),c=document.getElementById('lib-premium-playlist-stat');if(a)a.textContent=likes.length;if(b)b.textContent=seen.size;if(c)c.textContent=pls.length+' PLAYLISTS';
 }
 const oldShow=window.showLibraryPage; if(typeof oldShow==='function')window.showLibraryPage=async function(e){const r=await oldShow(e);ensureOverview();await refreshOverview();decorateSections();return r};
 const oldPlaylists=window.renderLibraryPlaylists;if(typeof oldPlaylists==='function')window.renderLibraryPlaylists=async function(){await oldPlaylists();const grid=document.getElementById('library-playlist-grid');if(grid&&!grid.previousElementSibling?.classList.contains('lib-section-title'))grid.insertAdjacentHTML('beforebegin','<div class="lib-section-title"><h2>내 플레이리스트</h2><span>COLLECTION</span></div>');const n=grid?.querySelectorAll('.lib-card').length||0;const s=document.getElementById('lib-premium-playlist-stat');if(s)s.textContent=n+' PLAYLISTS';};
 window.renderLibrarySongs=function(el,arr,removable=false){
  if(!el)return;if(!arr?.length){el.innerHTML='<div class="lib-empty"><b>아직 음악이 없습니다.</b><br>마음에 드는 음악을 저장하면 이곳에 모입니다.</div>';return}
  const sort=document.getElementById('library-sort')?.value||'recent';arr=[...arr];if(sort==='name')arr.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'ko'));if(sort==='plays')arr.sort((a,b)=>Number(b.play_count||0)-Number(a.play_count||0));
  el.innerHTML=arr.map((t,i)=>{const c=libCover(t);return '<div class="lib-song" data-title="'+esc(t.title)+'" data-artist="'+esc(t.artist)+'"><div class="lib-song-index">'+String(i+1).padStart(2,'0')+'</div><div class="lib-song-cover">'+(c?'<img src="'+esc(c)+'" style="width:100%;height:100%;object-fit:cover">':'♪')+'</div><div onclick="libraryPlayTrack(\''+t.id+'\')" style="cursor:pointer;min-width:0"><div class="lib-song-title">'+esc(t.title)+'</div><div class="lib-song-artist">'+esc(t.artist)+'</div></div><div class="lib-song-plays">▶ '+Number(t.play_count||0).toLocaleString()+'</div><div class="lib-song-actions">'+(removable?'<button title="삭제" onclick="removeTrackFromLibraryPlaylist(\''+t.id+'\')">×</button>':'<button title="플레이리스트에 추가" onclick="openLibraryAddModal(\''+t.id+'\')">＋</button>')+'</div></div>'}).join('');
 };
 window.renameCurrentLibraryPlaylist=async function(){if(!libraryCurrentPlaylist)return;const name=prompt('새 플레이리스트 이름',libraryCurrentPlaylist.name||'');if(!name||!name.trim())return;try{await libFetch('playlists?id=eq.'+encodeURIComponent(libraryCurrentPlaylist.id),{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({name:name.trim()})});await openLibraryPlaylist(libraryCurrentPlaylist.id)}catch(e){alert('이름 변경에 실패했습니다.')}};
 function decorateSections(){
  const liked=document.getElementById('library-liked-list'),recent=document.getElementById('library-recent-list');
  if(liked&&!liked.previousElementSibling?.classList.contains('lib-section-title'))liked.insertAdjacentHTML('beforebegin','<div class="lib-section-title"><h2>좋아요한 곡</h2><span>LIKED TRACKS</span></div>');
  if(recent&&!recent.previousElementSibling?.classList.contains('lib-section-title'))recent.insertAdjacentHTML('beforebegin','<div class="lib-section-title"><h2>최근 들은 곡</h2><span>LISTENING HISTORY</span></div>');
  const actions=document.querySelector('#library-detail .lib-detail-actions');if(actions&&!actions.querySelector('.lib-rename')){const b=document.createElement('button');b.className='lib-rename';b.textContent='이름 변경';b.onclick=renameCurrentLibraryPlaylist;actions.insertBefore(b,actions.lastElementChild)}
 }
 const oldSwitch=window.switchLibraryTab;if(typeof oldSwitch==='function')window.switchLibraryTab=function(tab,btn){const r=oldSwitch(tab,btn);setTimeout(decorateSections,0);return r};
 const oldSearch=window.libraryApplySearch;window.libraryApplySearch=function(){if(typeof oldSearch==='function')oldSearch();const q=(document.getElementById('library-search')?.value||'').trim().toLowerCase();document.querySelectorAll('#library-page .lib-song').forEach(row=>row.style.display=!q||row.textContent.toLowerCase().includes(q)?'grid':'none');};
 document.addEventListener('DOMContentLoaded',()=>{ensureOverview();decorateSections()});
})();

/* ===== AMKINA SCRIPT BLOCK 56 | id="amkina-mypage-creator-hub-v3-script" ===== */
(function(){
 const esc=v=>typeof mpEsc==='function'?mpEsc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const cover=t=>typeof mpCover==='function'?mpCover(t):(t?.cover_url||t?.image_url||'');
 function data(){return window.mpData||{mine:[],featured:[],comments:[],totalPlays:0,receivedLikes:0}}
 function ensure(){
  const wrap=document.querySelector('#mypage .mp-wrap'),stats=document.querySelector('#mypage .mp-stats'),tabs=document.querySelector('#mypage .mp-tabs');if(!wrap||!stats||!tabs)return;
  if(!document.getElementById('mp-avg-stat')){const d=document.createElement('div');d.className='mp-stat mp-premium-extra-stat';d.innerHTML='<span>곡당 평균 재생</span><b id="mp-avg-stat">0</b>';stats.appendChild(d)}
  if(!document.getElementById('mp-creator-actions')){const a=document.createElement('div');a.id='mp-creator-actions';a.className='mp-creator-actions';a.innerHTML='<button class="primary" onclick="mpGoFeatured()">대표곡 관리</button><button onclick="mpGoStats()">Creator Analytics</button><button onclick="mpShareProfile()">프로필 공유</button><button onclick="openMyProfileEdit()">프로필 편집</button>';stats.after(a)}
  if(!document.getElementById('mp-showcase')){const x=document.createElement('section');x.id='mp-showcase';x.className='mp-showcase';x.innerHTML='<div class="mp-section-head"><h2>Featured Tracks</h2><span>CREATOR SHOWCASE</span></div><div id="mp-showcase-grid" class="mp-showcase-grid"></div>';document.getElementById('mp-creator-actions').after(x)}
  if(!document.getElementById('mp-achievements')){const x=document.createElement('section');x.id='mp-achievements';x.className='mp-achievements';x.innerHTML='<div class="mp-section-head"><h2>Achievements</h2><span>CREATOR BADGES</span></div><div id="mp-badge-row" class="mp-badge-row"></div>';document.getElementById('mp-showcase').after(x)}
  if(!document.getElementById('mp-toolbar-v3')){const x=document.createElement('div');x.id='mp-toolbar-v3';x.className='mp-toolbar-v3';x.innerHTML='<input id="mp-search-v3" placeholder="내 음악 검색"><select id="mp-sort-v3"><option value="recent">최근 업로드</option><option value="plays">재생수 높은 순</option><option value="name">이름순</option></select>';tabs.after(x);x.querySelector('input').addEventListener('input',filterCards);x.querySelector('select').addEventListener('change',()=>{if(window.mpTab==='music')renderPremiumMusic()})}
  if(!document.getElementById('mp-activity')){const x=document.createElement('section');x.id='mp-activity';x.className='mp-activity';x.innerHTML='<div class="mp-section-head"><h2>Activity</h2><span>RECENT ACTIVITY</span></div><div id="mp-activity-list" class="mp-activity-list"></div>';document.getElementById('mp-content').after(x)}
 }
 function paint(){ensure();const d=data(),mine=d.mine||[],featured=d.featured||[];const avg=mine.length?Math.round(Number(d.totalPlays||0)/mine.length):0;const av=document.getElementById('mp-avg-stat');if(av)av.textContent=avg.toLocaleString();
  const profile=document.querySelector('#mypage .mp-profile'),bg=cover(featured[0]||mine[0]);if(profile&&bg)profile.style.setProperty('--mp-banner',`url("${String(bg).replace(/"/g,'%22')}")`);
  const g=document.getElementById('mp-showcase-grid');if(g)g.innerHTML=featured.length?featured.slice(0,3).map((t,i)=>`<article class="mp-showcase-card" onclick="mpPlay('${t.id}')"><img src="${esc(cover(t))}"><div class="sc-info"><span class="sc-no">FEATURED 0${i+1}</span><b>${esc(t.title)}</b><small>${esc(t.artist||'AMKINA')} · ▶ ${Number(t.play_count||0).toLocaleString()}</small></div></article>`).join(''):'<div class="mp-showcase-empty">대표곡을 지정하면 이곳이 나만의 아티스트 쇼케이스가 됩니다.</div>';
  const plays=Number(d.totalPlays||0),likes=Number(d.receivedLikes||0);const badges=[['✦','FIRST TRACK','첫 음원 업로드',mine.length>=1],['10','10 TRACKS','10곡 업로드',mine.length>=10],['▶','100 PLAYS','누적 100회 재생',plays>=100],['▶','1K PLAYS','누적 1,000회 재생',plays>=1000],['♥','10 LIKES','좋아요 10개',likes>=10],['★','SHOWCASE','대표곡 3곡 설정',featured.length>=3]];const br=document.getElementById('mp-badge-row');if(br)br.innerHTML=badges.map(b=>`<div class="mp-badge ${b[3]?'unlocked':''}"><span class="bi">${b[0]}</span><b>${b[1]}</b><small>${b[3]?'달성 완료':b[2]}</small></div>`).join('');
  const acts=[];[...mine].slice(-3).reverse().forEach(t=>acts.push(['♫',`${esc(t.title)} 음원을 등록했습니다.`,'UPLOAD']));(d.comments||[]).slice(0,2).forEach(c=>acts.push(['□','음원에 댓글을 작성했습니다.','COMMENT']));const al=document.getElementById('mp-activity-list');if(al)al.innerHTML=acts.length?acts.slice(0,5).map(a=>`<div class="mp-activity-item"><span class="mp-activity-icon">${a[0]}</span><b>${a[1]}</b><small>${a[2]}</small></div>`).join(''):'<div style="padding:18px;color:#999;font-size:11px">아직 표시할 활동이 없습니다.</div>';
 }
 function filterCards(){const q=(document.getElementById('mp-search-v3')?.value||'').toLowerCase();document.querySelectorAll('#mp-content .mp-card').forEach(c=>c.style.display=!q||c.textContent.toLowerCase().includes(q)?'':'none')}
 function renderPremiumMusic(){if(window.mpTab!=='music')return;const el=document.getElementById('mp-content');if(!el)return;let rows=[...(data().mine||[])],sort=document.getElementById('mp-sort-v3')?.value||'recent';if(sort==='plays')rows.sort((a,b)=>Number(b.play_count||0)-Number(a.play_count||0));if(sort==='name')rows.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'ko'));if(sort==='recent')rows.reverse();if(typeof window.renderMyPageManagedTab==='function'){/* existing manager owns deletion; leave original render */return} }
 function enhanceStats(){if(window.mpTab!=='stats')return;const el=document.getElementById('mp-content');if(!el||el.querySelector('.mp-analytics-v3'))return;const d=data(),mine=d.mine||[],plays=Number(d.totalPlays||0),max=Math.max(1,...mine.map(t=>Number(t.play_count||0)));const bars=mine.slice().sort((a,b)=>Number(b.play_count||0)-Number(a.play_count||0)).slice(0,8);el.insertAdjacentHTML('afterbegin',`<div class="mp-analytics-v3"><section class="mp-analytics-panel dark"><div class="mp-analytics-kicker">CREATOR PERFORMANCE · CUMULATIVE</div><div class="mp-analytics-big">${plays.toLocaleString()}</div><div class="mp-analytics-sub">총 재생수 · 현재 저장된 누적 데이터 기준</div><div class="mp-bars">${bars.length?bars.map(t=>`<i title="${esc(t.title)} ${Number(t.play_count||0)}회" style="height:${Math.max(8,Math.round(Number(t.play_count||0)/max*100))}%"></i>`).join(''):'<i style="height:8%"></i>'}</div></section><section class="mp-analytics-panel"><div class="mp-analytics-kicker">PERFORMANCE SNAPSHOT</div><div class="mp-analytics-big">${Number(d.receivedLikes||0).toLocaleString()}</div><div class="mp-analytics-sub">받은 좋아요</div><div style="margin-top:22px;font-size:11px;line-height:2;color:#666">업로드 <b style="color:#111">${mine.length}</b>곡<br>평균 재생 <b style="color:#111">${mine.length?Math.round(plays/mine.length):0}</b>회<br>대표곡 <b style="color:#111">${(d.featured||[]).length}/3</b></div></section></div>`)}
 window.mpGoFeatured=function(){const b=document.querySelector('.mp-tab[data-mptab="featured"]');b?.click()};window.mpGoStats=function(){const b=document.querySelector('.mp-tab[data-mptab="stats"]');b?.click()};window.mpShareProfile=async function(){const name=document.getElementById('mp-name')?.textContent||'AMKINA Creator',url=location.href.split('#')[0]+'#mypage';try{if(navigator.share){await navigator.share({title:name+' · AMKINA MUSIC',text:'AMKINA MUSIC Creator Profile',url});return}await navigator.clipboard.writeText(url);alert('프로필 링크를 복사했습니다.')}catch(e){}};
 const oldLoad=window.loadMyPage;if(typeof oldLoad==='function')window.loadMyPage=async function(){const r=await oldLoad.apply(this,arguments);setTimeout(()=>{paint();enhanceStats()},0);return r};
 document.addEventListener('click',e=>{if(e.target.closest('.mp-tab'))setTimeout(()=>{paint();enhanceStats();filterCards()},30)});
 document.addEventListener('DOMContentLoaded',()=>{setTimeout(paint,200)});
})();

/* ===== AMKINA SCRIPT BLOCK 57 | id="amkina-player-eq-v1-script" ===== */
(function(){
 const STORE='amkina_player_eq_v1';
 const bands=[{f:60,type:'lowshelf',label:'60Hz'},{f:250,type:'peaking',label:'250Hz'},{f:1000,type:'peaking',label:'1kHz'},{f:4000,type:'peaking',label:'4kHz'},{f:12000,type:'highshelf',label:'12kHz'}];
 const presets={Flat:[0,0,0,0,0],'Bass Boost':[6,3,0,-1,-1],Vocal:[-2,-1,3,4,2],Bright:[-2,-1,0,3,6],Night:[3,2,0,-2,-4]};
 let state={on:false,preset:'Flat',gains:[0,0,0,0,0]};
 let ctx=null,source=null,filters=[],ready=false;
 const audio=document.getElementById('audio'); if(!audio)return;
 try{const x=JSON.parse(localStorage.getItem(STORE)||'null');if(x&&Array.isArray(x.gains)&&x.gains.length===5)state={on:!!x.on,preset:x.preset||'Custom',gains:x.gains.map(v=>Math.max(-12,Math.min(12,Number(v)||0)))}}catch(e){}
 audio.crossOrigin='anonymous';
 function save(){try{localStorage.setItem(STORE,JSON.stringify(state))}catch(e){}}
 function initAudio(){
   if(ready)return true;
   try{
     const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
     ctx=new AC();source=ctx.createMediaElementSource(audio);let prev=source;
     filters=bands.map((b,i)=>{const f=ctx.createBiquadFilter();f.type=b.type;f.frequency.value=b.f;if(b.type==='peaking')f.Q.value=1;f.gain.value=state.on?state.gains[i]:0;prev.connect(f);prev=f;return f});
     prev.connect(ctx.destination);ready=true;return true;
   }catch(e){console.warn('AMKINA EQ init failed',e);return false}
 }
 async function wake(){if(!initAudio())return false;try{if(ctx.state==='suspended')await ctx.resume()}catch(e){}return true}
 function apply(){if(ready)filters.forEach((f,i)=>f.gain.setTargetAtTime(state.on?state.gains[i]:0,ctx.currentTime,.015));paint();save()}
 function paint(){
   const btn=document.getElementById('ak-eq-btn'),power=document.getElementById('ak-eq-power');
   btn?.classList.toggle('on',state.on);power?.classList.toggle('on',state.on);if(power)power.textContent=state.on?'EQ ON':'EQ OFF';
   document.querySelectorAll('.ak-eq-range').forEach((r,i)=>{r.value=state.gains[i];const v=document.querySelector('[data-eq-value="'+i+'"]');if(v)v.textContent=(state.gains[i]>0?'+':'')+state.gains[i].toFixed(1)+' dB'});
   document.querySelectorAll('.ak-eq-preset').forEach(b=>b.classList.toggle('active',b.dataset.preset===state.preset));
 }
 function build(){
   const buttons=document.querySelector('.player .buttons, .bottom-player .buttons, #player .buttons');if(!buttons||document.getElementById('ak-eq-btn'))return;
   const eq=document.createElement('button');eq.id='ak-eq-btn';eq.type='button';eq.textContent='EQ';eq.title='이퀄라이저';eq.setAttribute('aria-label','이퀄라이저 열기');const lyric=document.getElementById('lyrics-player-btn');buttons.insertBefore(eq,lyric||null);
   const panel=document.createElement('section');panel.id='ak-eq-panel';panel.setAttribute('aria-label','5밴드 이퀄라이저');
   panel.innerHTML='<div class="ak-eq-head"><div class="ak-eq-title"><b>Equalizer</b><span>5-BAND AUDIO CONTROL</span></div><div class="ak-eq-head-actions"><button type="button" class="ak-eq-mini" id="ak-eq-reset">RESET</button><button type="button" class="ak-eq-mini ak-eq-power" id="ak-eq-power">EQ OFF</button></div></div><div class="ak-eq-presets">'+Object.keys(presets).map(n=>'<button type="button" class="ak-eq-preset" data-preset="'+n+'">'+n+'</button>').join('')+'</div><div class="ak-eq-bands">'+bands.map((b,i)=>'<label class="ak-eq-band"><span class="ak-eq-value" data-eq-value="'+i+'">0.0 dB</span><span class="ak-eq-slider-wrap"><input class="ak-eq-range" data-i="'+i+'" type="range" min="-12" max="12" step="0.5" value="0" aria-label="'+b.label+' 조절"></span><span class="ak-eq-freq">'+b.label+'</span></label>').join('')+'</div><div class="ak-eq-foot"><span><strong>-12 ~ +12 dB</strong> · 설정은 이 브라우저에 저장됩니다.</span><span>FLAT · BASS · VOCAL · BRIGHT · NIGHT</span></div>';
   document.body.appendChild(panel);
   eq.addEventListener('click',async e=>{e.stopPropagation();panel.classList.toggle('open');eq.classList.toggle('active',panel.classList.contains('open'));if(panel.classList.contains('open'))await wake()});
   document.getElementById('ak-eq-power').addEventListener('click',async()=>{await wake();state.on=!state.on;apply()});
   document.getElementById('ak-eq-reset').addEventListener('click',async()=>{await wake();state.on=false;state.preset='Flat';state.gains=[0,0,0,0,0];apply()});
   panel.querySelectorAll('.ak-eq-preset').forEach(b=>b.addEventListener('click',async()=>{await wake();state.on=true;state.preset=b.dataset.preset;state.gains=[...presets[state.preset]];apply()}));
   panel.querySelectorAll('.ak-eq-range').forEach(r=>r.addEventListener('input',async()=>{await wake();state.on=true;state.preset='Custom';state.gains[Number(r.dataset.i)]=Number(r.value);apply()}));
   document.addEventListener('click',e=>{if(panel.classList.contains('open')&&!panel.contains(e.target)&&e.target!==eq){panel.classList.remove('open');eq.classList.remove('active')}});
   paint();
 }
 audio.addEventListener('play',()=>wake());
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
 window.amkinaEQ={open(){document.getElementById('ak-eq-panel')?.classList.add('open')},reset(){state={on:false,preset:'Flat',gains:[0,0,0,0,0]};apply()}};
})();

/* ===== AMKINA SCRIPT BLOCK 58 | id="amkina-mobile-layout-audit-script" ===== */
(function(){
 function init(){
  const p=document.getElementById('player');if(!p)return;
  const more=document.createElement('button');more.id='ak-player-more';more.type='button';more.textContent='⋯';more.setAttribute('aria-label','플레이어 추가 기능');more.setAttribute('aria-expanded','false');
  more.onclick=()=>{const open=p.classList.toggle('ak-tools-open');more.setAttribute('aria-expanded',String(open));};
  p.querySelector('.buttons').appendChild(more);
  p.querySelector('[onclick="previousTrack()"]')?.setAttribute('aria-label','이전 곡');
  p.querySelector('[onclick="nextTrack()"]')?.setAttribute('aria-label','다음 곡');
  document.getElementById('main-play')?.setAttribute('aria-label','재생 또는 일시정지');
  document.getElementById('progress')?.setAttribute('aria-label','재생 위치');
  // Keep the footer after pages added by earlier scripts.
  const footer=document.querySelector('body>footer');if(footer)document.body.appendChild(footer);
  const guide=document.getElementById('ak-guide-float');if(guide&&footer)footer.prepend(guide);
  let frame=0;
  function measure(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const bottom=document.getElementById('amkina-mobile-bottom');
   const navHeight=bottom&&getComputedStyle(bottom).display!=='none'?bottom.getBoundingClientRect().height:0;
   const height=Math.ceil(p.getBoundingClientRect().height);
   const root=document.documentElement;
   root.style.setProperty('--ak-player-height',height+'px');
   root.style.setProperty('--ak-bottom-nav',navHeight+'px');
   root.style.setProperty('--akh-player-h',(height+navHeight)+'px');
  });}
  new ResizeObserver(measure).observe(p);
  window.addEventListener('resize',measure,{passive:true});window.visualViewport?.addEventListener('resize',measure,{passive:true});measure();
  const nav=document.querySelector('body>header nav'),button=document.querySelector('.mobile-menu-btn');
  function syncMenuButton(){
   if(!nav||!button)return;
   const open=nav.classList.contains('mobile-open');
   button.textContent=open?'×':'☰';
   button.setAttribute('aria-expanded',String(open));
   button.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');
  }
  if(nav)new MutationObserver(syncMenuButton).observe(nav,{attributes:true,attributeFilter:['class']});
  syncMenuButton();
  function close(){if(typeof closeMobileMenu==='function')closeMobileMenu();syncMenuButton();}
  document.addEventListener('click',e=>{
   if(e.target.closest('.mobile-menu-btn')&&innerWidth<=768){e.preventDefault();e.stopImmediatePropagation();const open=!nav.classList.contains('mobile-open');nav.classList.toggle('mobile-open',open);nav.style.removeProperty('display');button.textContent=open?'×':'☰';button.setAttribute('aria-expanded',String(open));return;}
   if(innerWidth<=768&&nav?.classList.contains('mobile-open')&&!nav.contains(e.target))close();
  },true);
  nav?.addEventListener('click',e=>{if(e.target.closest('a'))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

/* ===== AMKINA SCRIPT BLOCK 59 | id="amkina-mp3-selection-guard" ===== */
document.addEventListener('change',async function(e){
 const input=e.target;
 if(!input.matches('#studio-audio,#music-file'))return;
 const file=input.files?.[0];if(!file)return;
 const message=await amkinaValidateMp3(file);
 if(input.files?.[0]!==file)return;
 if(message){input.value='';alert(message);}
},true);

/* ===== AMKINA SCRIPT BLOCK 60 | id="amkina-ios-background-v6" ===== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const audio = document.getElementById("audio") || document.querySelector("audio");
    if (!audio) return;

    /*
      iOS / Safari:
      Keep the native HTMLAudioElement as the playback owner.
      This patch does NOT replace audio.play(), src handling, Supabase,
      EQ nodes, track rendering, or existing next/prev handlers.
    */
    try {
      if ("audioSession" in navigator) {
        navigator.audioSession.type = "playback";
      }
    } catch (e) {
      console.warn("AMKINA: audioSession playback hint unavailable", e);
    }

    if (!("mediaSession" in navigator)) return;

    function txt(selectors) {
      for (const s of selectors) {
        const el = document.querySelector(s);
        const value = el && (el.textContent || el.getAttribute("content") || "").trim();
        if (value) return value;
      }
      return "";
    }

    function imageUrl() {
      const selectors = [
        ".player-cover img", ".now-playing-cover img", ".player img",
        "#player-cover", ".track-cover img", ".cover img"
      ];
      for (const s of selectors) {
        const el = document.querySelector(s);
        if (!el) continue;
        const u = el.currentSrc || el.src || el.getAttribute("src");
        if (u) {
          try { return new URL(u, location.href).href; } catch (_) { return u; }
        }
      }
      return "";
    }

    function updateMetadata() {
      try {
        const title = txt([
          ".player-title", ".now-playing-title", "#player-title",
          ".track-title", "[data-now-title]"
        ]) || document.title || "AMKINA MUSIC";

        const artist = txt([
          ".player-artist", ".now-playing-artist", "#player-artist",
          ".track-artist", "[data-now-artist]"
        ]) || "AMKINA MUSIC";

        const cover = imageUrl();
        const data = { title, artist, album: "AMKINA MUSIC" };
        if (cover) {
          data.artwork = [
            { src: cover, sizes: "96x96" },
            { src: cover, sizes: "256x256" },
            { src: cover, sizes: "512x512" }
          ];
        }
        navigator.mediaSession.metadata = new MediaMetadata(data);
      } catch (e) {
        console.warn("AMKINA: Media Session metadata unavailable", e);
      }
    }

    // Only universal actions are bound directly.
    // Previous/next are deliberately left to the existing player unless
    // a matching existing control is found.
    const safeAction = (name, fn) => {
      try { navigator.mediaSession.setActionHandler(name, fn); } catch (_) {}
    };

    safeAction("play", async () => {
      try { await audio.play(); } catch (_) {}
    });

    safeAction("pause", () => {
      try { audio.pause(); } catch (_) {}
    });

    safeAction("seekbackward", (d) => {
      try {
        const step = d.seekOffset || 10;
        audio.currentTime = Math.max(0, audio.currentTime - step);
      } catch (_) {}
    });

    safeAction("seekforward", (d) => {
      try {
        const step = d.seekOffset || 10;
        audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + step);
      } catch (_) {}
    });

    safeAction("seekto", (d) => {
      try {
        if (typeof d.seekTime === "number") audio.currentTime = d.seekTime;
      } catch (_) {}
    });

    const prev = document.querySelector(
      "#prev-btn, .prev-btn, [data-action='prev'], [aria-label*='이전'], [aria-label*='Previous']"
    );
    const next = document.querySelector(
      "#next-btn, .next-btn, [data-action='next'], [aria-label*='다음'], [aria-label*='Next']"
    );
    if (prev) safeAction("previoustrack", () => prev.click());
    if (next) safeAction("nexttrack", () => next.click());

    audio.addEventListener("play", function () {
      try {
        if ("audioSession" in navigator) navigator.audioSession.type = "playback";
        navigator.mediaSession.playbackState = "playing";
      } catch (_) {}
      updateMetadata();
    });

    audio.addEventListener("pause", function () {
      try { navigator.mediaSession.playbackState = "paused"; } catch (_) {}
    });

    audio.addEventListener("loadedmetadata", updateMetadata);
    audio.addEventListener("durationchange", updateMetadata);

    // Metadata refresh only on explicit player interaction; no observer,
    // no timer, and therefore no mutation/render loop.
    document.addEventListener("click", function (e) {
      if (e.target.closest(".track-card, .music-card, .play-btn, [data-track-id]")) {
        setTimeout(updateMetadata, 150);
      }
    }, { passive: true });

    updateMetadata();
  });
})();

/* ===== AMKINA SCRIPT BLOCK 61 | id="amkina-google-oauth-v1" ===== */
(function(){
  const GOOGLE_REDIRECT_URL = "https://amkinamusic.com/";

  function startGoogleLogin(){
    try{
      localStorage.setItem("amkina_oauth_pending", "google");
    }catch(e){}

    const url =
      SUPABASE_URL +
      "/auth/v1/authorize?provider=google&redirect_to=" +
      encodeURIComponent(GOOGLE_REDIRECT_URL);

    window.location.assign(url);
  }

  async function finishGoogleLogin(){
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token") || "";
    const type = hash.get("type") || "";
    const error = hash.get("error_description") || hash.get("error");

    // 비밀번호 재설정 링크는 기존 AMKINA recovery 코드가 처리하도록 둔다.
    if(type === "recovery") return;

    let pending = false;
    try{
      pending = localStorage.getItem("amkina_oauth_pending") === "google";
    }catch(e){}

    if(error && pending){
      try{ localStorage.removeItem("amkina_oauth_pending"); }catch(e){}
      history.replaceState(null, "", location.pathname + location.search);
      alert("Google 로그인에 실패했습니다.\n" + decodeURIComponent(error));
      return;
    }

    if(!accessToken) return;

    let user = null;
    try{
      const response = await fetch(SUPABASE_URL + "/auth/v1/user", {
        headers:{
          apikey: SUPABASE_ANON_KEY,
          Authorization: "Bearer " + accessToken
        }
      });
      if(response.ok) user = await response.json();
    }catch(e){
      console.error("Google 사용자 정보 확인 실패:", e);
    }

    const expiresIn = Number(hash.get("expires_in") || 3600);
    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: hash.get("token_type") || "bearer",
      expires_in: expiresIn,
      expires_at: Math.floor(Date.now()/1000) + expiresIn,
      user: user
    };

    if(typeof amkinaAuthSaveSession === "function"){
      amkinaAuthSaveSession(session);
    }else{
      localStorage.setItem("amkina_session", JSON.stringify(session));
    }

    try{ localStorage.removeItem("amkina_oauth_pending"); }catch(e){}
    history.replaceState(null, "", location.pathname + location.search);

    if(typeof amkinaAuthUpdateUI === "function") amkinaAuthUpdateUI();

    const modal = document.getElementById("auth-modal");
    if(modal) modal.style.display = "none";
  }

  document.addEventListener("DOMContentLoaded", function(){
    const googleButton = document.getElementById("auth-google");
    if(googleButton){
      googleButton.addEventListener("click", startGoogleLogin);
    }
    finishGoogleLogin();
  });
})();

/* ===== AMKINA SCRIPT BLOCK 62 | id="amkina-manual-google-link-v1" ===== */
(function(){
  let linkClient = null;

  function getStoredSession(){
    try { return JSON.parse(localStorage.getItem("amkina_session") || "null"); }
    catch(e){ return null; }
  }

  function getLinkClient(){
    if(linkClient) return linkClient;
    if(!window.supabase || !window.supabase.createClient) return null;

    linkClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth:{
        persistSession:false,
        autoRefreshToken:false,
        detectSessionInUrl:false
      }
    });
    return linkClient;
  }

  async function syncClientToAmkinaSession(){
    const s = getStoredSession();
    const client = getLinkClient();
    if(!client || !s?.access_token || !s?.refresh_token) return false;

    const result = await client.auth.setSession({
      access_token:s.access_token,
      refresh_token:s.refresh_token
    });
    if(result.error) throw result.error;
    return true;
  }

  function currentUser(){
    return getStoredSession()?.user || null;
  }

  async function refreshLinkUI(){
    const panel = document.getElementById("ak-account-link-panel");
    const email = document.getElementById("ak-link-current-email");
    const btn = document.getElementById("ak-link-google-btn");
    const status = document.getElementById("ak-link-google-status");
    if(!panel || !btn) return;

    const user = currentUser();
    if(!user?.id){
      panel.style.display = "none";
      return;
    }

    panel.style.display = "block";
    if(email) email.textContent = user.email || "로그인된 AMKINA 계정";

    try{
      await syncClientToAmkinaSession();
      const client = getLinkClient();
      const result = await client.auth.getUserIdentities();
      if(result.error) throw result.error;

      const identities = result.data?.identities || [];
      const googleLinked = identities.some(x => x.provider === "google");

      if(googleLinked){
        btn.disabled = true;
        btn.innerHTML = '<span class="ak-link-google-g">G</span> Google 연결됨';
        btn.style.opacity = ".7";
        if(status){
          status.style.display = "block";
          status.textContent = "기존 AMKINA 회원 ID에 Google 로그인이 연결되어 있습니다.";
        }
      }else{
        btn.disabled = false;
        btn.innerHTML = '<span class="ak-link-google-g">G</span> Google 계정 연결';
        btn.style.opacity = "1";
        if(status){
          status.style.display = "block";
          status.textContent = "기존 음악·프로필·좋아요를 유지한 채 Google 로그인을 추가합니다.";
        }
      }
    }catch(e){
      console.warn("Google 연결 상태 확인 실패:", e);
      if(status){
        status.style.display = "block";
        status.textContent = "Google 연결 상태를 확인하지 못했습니다.";
      }
    }
  }

  async function linkGoogleIdentity(){
    const s = getStoredSession();
    if(!s?.access_token || !s?.user?.id){
      alert("먼저 기존 AMKINA 계정으로 로그인해주세요.");
      return;
    }

    const ok = confirm(
      "현재 로그인된 AMKINA 계정에 Google 계정을 연결합니다.\n\n" +
      "기존 음악, 프로필, 좋아요 등의 회원 ID는 그대로 유지됩니다.\n" +
      "계속할까요?"
    );
    if(!ok) return;

    const btn = document.getElementById("ak-link-google-btn");
    const old = btn ? btn.innerHTML : "";
    if(btn){
      btn.disabled = true;
      btn.textContent = "Google 연결 중...";
    }

    try{
      await syncClientToAmkinaSession();
      const client = getLinkClient();

      // Supabase 공식 Manual Identity Linking.
      // Dashboard에서 Enable Manual Linking이 켜져 있어야 한다.
      const { data, error } = await client.auth.linkIdentity({
        provider:"google",
        options:{
          redirectTo:"https://amkinamusic.com/"
        }
      });

      if(error) throw error;

      // 일반적으로 OAuth 페이지로 이동한다.
      if(data?.url) window.location.assign(data.url);
    }catch(e){
      console.error("Google 계정 연결 실패:", e);
      if(btn){
        btn.disabled = false;
        btn.innerHTML = old;
      }
      alert(
        "Google 계정 연결을 시작하지 못했습니다.\n\n" +
        (e?.message || "Supabase 설정을 확인해주세요.") +
        "\n\nSupabase에서 Manual Identity Linking이 활성화되어 있는지도 확인해주세요."
      );
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    const btn = document.getElementById("ak-link-google-btn");
    if(btn) btn.addEventListener("click", linkGoogleIdentity);

    setTimeout(refreshLinkUI, 500);

    // 기존 로그인/로그아웃 후 UI 갱신
    const loginBtn = document.getElementById("login-btn");
    if(loginBtn) loginBtn.addEventListener("click", () => setTimeout(refreshLinkUI, 700));

    window.addEventListener("storage", refreshLinkUI);
    window.addEventListener("focus", () => setTimeout(refreshLinkUI, 300));
  });

  window.amkinaRefreshGoogleLinkUI = refreshLinkUI;
})();

/* ===== AMKINA SCRIPT BLOCK 63 | id="amkina-kakao-share-final-fix" ===== */
(function () {
  "use strict";

  const SHARE_BASE = "https://bbtzasddvodrprpnbeos.supabase.co/functions/v1/track-share";

  function getShareUrl(track) {
    if (!track || track.id == null) return null;
    return SHARE_BASE + "?id=" + encodeURIComponent(String(track.id));
  }

  async function shareTrack(track) {
    if (!track || track.id == null) {
      alert("공유할 곡을 찾을 수 없습니다.");
      return;
    }

    const shareUrl = getShareUrl(track);
    const title = (track.title || "AMKINA MUSIC") + " - " + (track.artist || "AMKINA MUSIC");

    try {
      if (navigator.share) {
        await navigator.share({ title: title, url: shareUrl });
        return;
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
      console.warn("AMKINA share fallback", err);
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("앨범 표지가 표시되는 AMKINA 공유 링크를 복사했습니다.");
    } catch (err) {
      prompt("아래 공유 링크를 복사해주세요.", shareUrl);
    }
  }

  window.amkinaShareUrl = getShareUrl;
  window.amkinaShareTrack = shareTrack;

  window.shareCurrentPlayerTrack = async function () {
    let track = null;
    try {
      if (typeof tracks !== "undefined" && Array.isArray(tracks)) {
        if (typeof currentIndex === "number" && currentIndex >= 0) track = tracks[currentIndex];
        if (!track && typeof currentTrackIndex === "number" && currentTrackIndex >= 0) track = tracks[currentTrackIndex];
      }
      if (!track && typeof currentTrack !== "undefined") track = currentTrack;
    } catch (e) {}

    if (!track) {
      alert("곡을 먼저 선택해주세요.");
      return;
    }
    return shareTrack(track);
  };
})();

/* ===== AMKINA SCRIPT BLOCK 64 | id="amkina-share-master-fix-v3" ===== */
(function(){
 "use strict";
 const BASE="https://bbtzasddvodrprpnbeos.supabase.co/functions/v1/track-share";
 const make=id=>BASE+"?id="+encodeURIComponent(String(id));

 window.amkinaShareUrl=function(t){return t&&t.id!=null?make(t.id):location.href};
 window.amkinaShareTrack=async function(t){
   if(!t||t.id==null)return alert("공유할 곡을 찾을 수 없습니다.");
   const u=make(t.id);
   try{
     if(navigator.share){await navigator.share({title:(t.title||"AMKINA MUSIC")+" - "+(t.artist||"AMKINA MUSIC"),url:u});return;}
   }catch(e){if(e&&e.name==="AbortError")return;}
   try{await navigator.clipboard.writeText(u);alert("앨범 표지가 표시되는 공유 링크를 복사했습니다.");}
   catch(e){prompt("공유 링크를 복사해주세요.",u)}
 };

 // 카드 ⋮ 메뉴의 '링크 복사'
 window.copyTrackShareLink=async function(){
   const id=window.amkinaActionTrackId;
   const t=(typeof actionMenuTrack==="function")?actionMenuTrack(id):null;
   if(typeof closeTrackActionMenu==="function")closeTrackActionMenu();
   if(id==null)return;
   const u=make(id);
   try{await navigator.clipboard.writeText(u)}catch(e){prompt("공유 링크를 복사해주세요.",u)}
   const toast=document.getElementById("track-link-toast");
   if(toast){toast.textContent="🔗 "+(t?.title||"음원")+" 앨범커버 공유 링크가 복사되었습니다.";toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1800)}
 };

 // 곡 상세 페이지 '링크 복사'
 window.tfCopy=async function(){
   const t=(typeof tfCurrent==="function")?tfCurrent():null;
   if(!t||t.id==null)return;
   const u=make(t.id);
   try{await navigator.clipboard.writeText(u)}catch(e){prompt("공유 링크를 복사해주세요.",u)}
   const toast=document.getElementById("track-link-toast");
   if(toast){toast.textContent="🔗 "+(t.title||"음원")+" 앨범커버 공유 링크가 복사되었습니다.";toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1800)}
 };
})();

/* ===== AMKINA SCRIPT BLOCK 65 | id="amkina-text-link-copy-hard-fix-v4" ===== */
(function(){
  "use strict";
  const BASE="https://bbtzasddvodrprpnbeos.supabase.co/functions/v1/track-share";
  const makeUrl=id=>BASE+"?id="+encodeURIComponent(String(id));

  function copyPlainText(text){
    return new Promise((resolve,reject)=>{
      const ta=document.createElement("textarea");
      ta.value=text;
      ta.setAttribute("readonly","");
      ta.style.position="fixed";
      ta.style.left="-99999px";
      ta.style.top="0";
      ta.style.opacity="0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0,ta.value.length);
      let ok=false;
      try{ ok=document.execCommand("copy"); }catch(e){}
      ta.remove();
      if(ok) return resolve(true);

      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(()=>resolve(true)).catch(reject);
      } else reject(new Error("clipboard unavailable"));
    });
  }

  function toast(msg){
    const el=document.getElementById("track-link-toast");
    if(el){
      el.textContent=msg;
      el.classList.add("show");
      setTimeout(()=>el.classList.remove("show"),2200);
    } else alert(msg);
  }

  window.copyTrackShareLink=async function(){
    const id=window.amkinaActionTrackId;
    let t=null;
    try{ if(typeof actionMenuTrack==="function") t=actionMenuTrack(id); }catch(e){}
    try{ if(typeof closeTrackActionMenu==="function") closeTrackActionMenu(); }catch(e){}
    if(id==null) return alert("공유할 곡을 찾을 수 없습니다.");
    const url=makeUrl(id);
    try{
      await copyPlainText(url);
      toast("🔗 "+(t?.title||"음원")+" 링크가 텍스트로 복사되었습니다.");
    }catch(e){
      prompt("아래 링크를 Ctrl+C로 복사해주세요.",url);
    }
  };

  window.tfCopy=async function(){
    let t=null;
    try{ if(typeof tfCurrent==="function") t=tfCurrent(); }catch(e){}
    if(!t||t.id==null) return alert("공유할 곡을 찾을 수 없습니다.");
    const url=makeUrl(t.id);
    try{
      await copyPlainText(url);
      toast("🔗 "+(t.title||"음원")+" 링크가 텍스트로 복사되었습니다.");
    }catch(e){
      prompt("아래 링크를 Ctrl+C로 복사해주세요.",url);
    }
  };

  window.amkinaShareTrack=async function(t){
    if(!t||t.id==null) return alert("공유할 곡을 찾을 수 없습니다.");
    const url=makeUrl(t.id);
    try{
      if(navigator.share){
        await navigator.share({title:(t.title||"AMKINA MUSIC")+" - "+(t.artist||"AMKINA MUSIC"),url:url});
        return;
      }
    }catch(e){ if(e && e.name==="AbortError") return; }
    try{
      await copyPlainText(url);
      toast("🔗 공유 링크가 텍스트로 복사되었습니다.");
    }catch(e){
      prompt("아래 링크를 Ctrl+C로 복사해주세요.",url);
    }
  };
  window.amkinaShareUrl=t=>t&&t.id!=null?makeUrl(t.id):location.href;
})();

/* ===== AMKINA SCRIPT BLOCK 66 | id="amkina-track-action-menu-id-preserve-fix-v5" ===== */
(function(){
  "use strict";

  // 기존 closeTrackActionMenu()가 곡 ID를 null로 지우기 전에 ID를 보존한다.
  function closeMenuOnly(){
    const m=document.getElementById("track-action-menu");
    if(m)m.style.display="none";
  }

  window.actionMenuPlay=function(){
    const id=amkinaActionTrackId;
    closeMenuOnly();
    const list=(typeof tracks!=="undefined"&&Array.isArray(tracks))?tracks:[];
    const idx=list.findIndex(x=>String(x.id)===String(id));
    amkinaActionTrackId=null;
    if(idx>=0&&typeof playTrack==="function")playTrack(idx);
  };

  window.actionMenuLike=async function(){
    const id=amkinaActionTrackId;
    closeMenuOnly();
    amkinaActionTrackId=null;
    if(id!=null&&typeof toggleTrackLike==="function")await toggleTrackLike(id);
  };

  window.actionMenuComment=function(){
    const id=amkinaActionTrackId;
    closeMenuOnly();
    amkinaActionTrackId=null;
    if(id!=null&&typeof openTrackComments==="function")openTrackComments(id);
  };

  window.actionMenuPlaylist=function(){
    const id=amkinaActionTrackId;
    closeMenuOnly();
    amkinaActionTrackId=null;
    if(id!=null&&typeof openLibraryAddModal==="function")openLibraryAddModal(id);
  };

  window.actionMenuOpenPage=function(){
    const id=amkinaActionTrackId;
    closeMenuOnly();
    amkinaActionTrackId=null;
    if(id!=null&&typeof openTrackFullPage==="function")openTrackFullPage(id);
  };

  window.actionMenuEdit=function(){
    const id=amkinaActionTrackId;
    closeMenuOnly();
    amkinaActionTrackId=null;
    if(id!=null&&typeof openTrackEdit==="function")openTrackEdit(id);
  };

  // 링크 복사도 같은 문제를 피하고, 현재는 사이트 내부 곡 링크를 복사한다.
  window.copyTrackShareLink=async function(){
    const id=amkinaActionTrackId;
    let t=null;
    try{if(typeof actionMenuTrack==="function")t=actionMenuTrack(id)}catch(e){}
    closeMenuOnly();
    amkinaActionTrackId=null;
    if(id==null)return alert("공유할 곡을 찾을 수 없습니다.");

    const url="https://amkinamusic.com/?track="+encodeURIComponent(String(id));
    try{
      const ta=document.createElement("textarea");
      ta.value=url;
      ta.setAttribute("readonly","");
      ta.style.position="fixed";
      ta.style.left="-99999px";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0,ta.value.length);
      const ok=document.execCommand("copy");
      ta.remove();
      if(!ok&&navigator.clipboard?.writeText)await navigator.clipboard.writeText(url);

      const toast=document.getElementById("track-link-toast");
      if(toast){
        toast.textContent="🔗 "+(t?.title||"음원")+" 링크가 복사되었습니다.";
        toast.classList.add("show");
        setTimeout(()=>toast.classList.remove("show"),1800);
      }
    }catch(e){
      prompt("공유 링크를 복사해주세요.",url);
    }
  };
})();

/* ===== AMKINA SCRIPT BLOCK 67 | id="amkina-track-story-v1-script" ===== */
function amkinaCurrentStoryTrack(){
  try{
    if(typeof currentIndex==="number" && currentIndex>=0 && Array.isArray(tracks) && tracks[currentIndex]) return tracks[currentIndex];
  }catch(e){}
  return null;
}
function refreshTrackStoryButton(){
  const btn=document.getElementById("track-story-player-btn");
  if(!btn)return;
  const t=amkinaCurrentStoryTrack();
  const has=!!String(t?.description||"").trim();
  btn.classList.toggle("has-story",has);
  btn.title=has?"곡 이야기 보기":"등록된 곡 이야기 없음";
}
function openTrackStory(){
  const modal=document.getElementById("track-story-modal");
  const title=document.getElementById("track-story-title");
  const meta=document.getElementById("track-story-meta");
  const body=document.getElementById("track-story-body");
  const t=amkinaCurrentStoryTrack();
  if(!t){
    title.textContent="곡 이야기";
    meta.textContent="AMKINA MUSIC";
    body.textContent="곡을 먼저 선택해주세요.";
    body.classList.add("empty");
  }else{
    title.textContent=t.title||"Untitled";
    meta.textContent=(t.artist||"AMKINA")+" · 곡 이야기";
    const story=String(t.description||"").trim();
    body.textContent=story||"등록된 곡 이야기가 없습니다.";
    body.classList.toggle("empty",!story);
  }
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
}
function closeTrackStory(){
  const modal=document.getElementById("track-story-modal");
  if(!modal)return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
}
document.addEventListener("DOMContentLoaded",()=>{
  const lyricsBtn=document.getElementById("lyrics-player-btn");
  if(lyricsBtn && !document.getElementById("track-story-player-btn")){
    const btn=document.createElement("button");
    btn.id="track-story-player-btn";
    btn.type="button";
    btn.textContent="곡 이야기";
    btn.setAttribute("aria-label","곡 이야기 보기");
    btn.onclick=openTrackStory;
    lyricsBtn.insertAdjacentElement("afterend",btn);
  }
  refreshTrackStoryButton();
});
document.addEventListener("click",e=>{
  const modal=document.getElementById("track-story-modal");
  if(e.target===modal)closeTrackStory();
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeTrackStory()});

/* ===== AMKINA SCRIPT BLOCK 68 | id="amkina-branded-share-url-final-v5" ===== */
(function(){
  "use strict";

  const SITE = "https://amkinamusic.com";

  function makeUrl(id){
    return SITE + "/?track=" + encodeURIComponent(String(id));
  }

  function currentTrackSafe(){
    try{
      if(typeof tracks!=="undefined" && Array.isArray(tracks)){
        if(typeof currentIndex==="number" && currentIndex>=0 && tracks[currentIndex]) return tracks[currentIndex];
        if(typeof currentTrackIndex==="number" && currentTrackIndex>=0 && tracks[currentTrackIndex]) return tracks[currentTrackIndex];
      }
      if(typeof currentTrack!=="undefined" && currentTrack) return currentTrack;
    }catch(e){}
    return null;
  }

  async function copyText(v){
    if(navigator.clipboard && navigator.clipboard.writeText){
      try{ await navigator.clipboard.writeText(v); return true; }catch(e){}
    }
    const ta=document.createElement("textarea");
    ta.value=v; ta.setAttribute("readonly","");
    ta.style.position="fixed"; ta.style.left="-99999px"; ta.style.opacity="0";
    document.body.appendChild(ta); ta.focus(); ta.select(); ta.setSelectionRange(0,v.length);
    let ok=false; try{ok=document.execCommand("copy")}catch(e){}
    ta.remove(); return ok;
  }

  function toast(msg){
    const el=document.getElementById("track-link-toast");
    if(el){
      el.textContent=msg; el.classList.add("show");
      setTimeout(()=>el.classList.remove("show"),2000);
    }else alert(msg);
  }

  window.amkinaShareUrl=function(t){
    return t && t.id!=null ? makeUrl(t.id) : SITE;
  };

  window.amkinaShareTrack=async function(t){
    if(!t || t.id==null) return alert("공유할 곡을 찾을 수 없습니다.");
    const url=makeUrl(t.id);
    const title=(t.title||"AMKINA MUSIC")+" - "+(t.artist||"AMKINA MUSIC");
    try{
      if(navigator.share){
        await navigator.share({title:title,text:"AMKINA MUSIC",url:url});
        return;
      }
    }catch(e){
      if(e && e.name==="AbortError") return;
    }
    if(await copyText(url)) toast("🔗 AMKINA 공유 링크가 복사되었습니다.");
    else prompt("아래 링크를 복사해주세요.",url);
  };

  window.shareCurrentPlayerTrack=async function(){
    const t=currentTrackSafe();
    if(!t) return alert("곡을 먼저 선택해주세요.");
    return window.amkinaShareTrack(t);
  };

  window.copyTrackShareLink=async function(){
    const id=window.amkinaActionTrackId;
    let t=null;
    try{if(typeof actionMenuTrack==="function")t=actionMenuTrack(id)}catch(e){}
    try{if(typeof closeTrackActionMenu==="function")closeTrackActionMenu()}catch(e){}
    if(id==null)return alert("공유할 곡을 찾을 수 없습니다.");
    const url=makeUrl(id);
    if(await copyText(url))toast("🔗 "+(t?.title||"음원")+" AMKINA 링크가 복사되었습니다.");
    else prompt("아래 링크를 복사해주세요.",url);
  };

  window.tfCopy=async function(){
    let t=null;
    try{if(typeof tfCurrent==="function")t=tfCurrent()}catch(e){}
    if(!t)t=currentTrackSafe();
    if(!t||t.id==null)return alert("공유할 곡을 찾을 수 없습니다.");
    const url=makeUrl(t.id);
    if(await copyText(url))toast("🔗 "+(t.title||"음원")+" AMKINA 링크가 복사되었습니다.");
    else prompt("아래 링크를 복사해주세요.",url);
  };
})();

/* ===== AMKINA SCRIPT BLOCK 69 | id="amkina-track-detail-link-copy-absolute-fix-v6" ===== */
(function(){
  "use strict";
  const SITE="https://amkinamusic.com";

  function detailTrack(){
    try{
      if(typeof tfCurrent==="function"){
        const t=tfCurrent();
        if(t && t.id!=null) return t;
      }
      if(typeof tfTrackId!=="undefined" && typeof tracks!=="undefined" && Array.isArray(tracks)){
        const t=tracks.find(x=>String(x.id)===String(tfTrackId));
        if(t) return t;
      }
      if(typeof currentIndex==="number" && currentIndex>=0 && typeof tracks!=="undefined" && tracks[currentIndex]){
        return tracks[currentIndex];
      }
    }catch(e){}
    const id=new URL(location.href).searchParams.get("track");
    return id!=null ? {id:id,title:"음원"} : null;
  }

  function brandedUrl(id){
    return SITE+"/?track="+encodeURIComponent(String(id));
  }

  async function copyPlain(v){
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(v);
        return true;
      }
    }catch(e){}
    const ta=document.createElement("textarea");
    ta.value=v; ta.setAttribute("readonly","");
    ta.style.position="fixed";ta.style.left="-99999px";ta.style.top="0";ta.style.opacity="0";
    document.body.appendChild(ta);ta.focus();ta.select();ta.setSelectionRange(0,v.length);
    let ok=false;try{ok=document.execCommand("copy")}catch(e){}
    ta.remove();return ok;
  }

  function showDone(t){
    const toast=document.getElementById("track-link-toast");
    const msg="🔗 "+(t?.title||"음원")+" AMKINA 링크가 복사되었습니다.";
    if(toast){
      toast.textContent=msg;toast.classList.add("show");
      setTimeout(()=>toast.classList.remove("show"),1800);
    }else{
      alert("AMKINA 링크가 복사되었습니다.");
    }
  }

  async function copyDetailLink(){
    const t=detailTrack();
    if(!t || t.id==null) return alert("공유할 곡을 찾을 수 없습니다.");
    const url=brandedUrl(t.id);
    if(await copyPlain(url)) showDone(t);
    else prompt("아래 AMKINA 링크를 복사해주세요.",url);
  }

  // 기존 상세페이지 함수 자체를 최종 교체
  window.tfCopy=copyDetailLink;
  window.amkinaCopyDetailTrackLink=copyDetailLink;

  // 상세페이지 안의 '링크 복사' 클릭을 캡처 단계에서 먼저 잡음.
  // 예전 onclick=tfCopy(), Supabase용 이벤트 리스너가 뒤에 있어도 실행되지 않게 함.
  document.addEventListener("click",function(e){
    const page=e.target.closest("#track-full-page");
    if(!page)return;

    const btn=e.target.closest("button,a");
    if(!btn)return;

    const txt=(btn.textContent||"").replace(/\s+/g," ").trim();
    const onclick=btn.getAttribute("onclick")||"";
    const isDetailCopy=
      /링크\s*복사/i.test(txt) ||
      /\btfCopy\s*\(/.test(onclick) ||
      btn.id==="tf-copy" ||
      btn.dataset?.action==="copy-link";

    if(!isDetailCopy)return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    copyDetailLink();
  },true);
})();

/* ===== AMKINA SCRIPT BLOCK 70 | id="amkina-album-editorial-v2-script" ===== */
(function(){
 "use strict";

 function page(){
   return document.getElementById("album-page");
 }
 function grid(root){
   return root?.querySelector("#album-grid,.album-grid,#album-posts,.album-posts");
 }
 function cards(root){
   const g=grid(root);
   return g ? [...g.children].filter(x=>x.nodeType===1) : [];
 }
 function addIntro(){
   const root=page(); if(!root || root.querySelector(".ak-album-editorial-intro"))return;
   const header=root.querySelector(".album-head,.album-header");
   const g=grid(root);
   if(!g)return;

   const intro=document.createElement("section");
   intro.className="ak-album-editorial-intro";
   intro.innerHTML=`
    <div>
      <div class="eyebrow">MUSIC · MOMENTS · PEOPLE</div>
      <h2>음악과 함께한 순간을<br>하나의 장면으로.</h2>
      <p>AMKINA 멤버들의 음악, 작업실, 커버 아트와 일상을 기록하는 커뮤니티 아카이브.</p>
    </div>
    <div class="ak-album-stats">
      <div class="ak-album-stat"><b id="ak-album-photo-count">0</b><span>PHOTOS</span></div>
      <div class="ak-album-stat"><b>AMKINA</b><span>COMMUNITY</span></div>
    </div>`;
   if(header)header.insertAdjacentElement("afterend",intro);
   else g.parentElement.insertBefore(intro,g);

   const toolbar=document.createElement("div");
   toolbar.className="ak-album-toolbar";
   toolbar.innerHTML=`
    <div class="ak-album-tabs">
      <button type="button" class="ak-album-tab active" data-sort="latest">LATEST</button>
      <button type="button" class="ak-album-tab" data-sort="popular">POPULAR</button>
    </div>
    <div class="ak-album-note">AMKINA COMMUNITY ARCHIVE</div>`;
   intro.insertAdjacentElement("afterend",toolbar);

   toolbar.addEventListener("click",e=>{
     const b=e.target.closest(".ak-album-tab"); if(!b)return;
     toolbar.querySelectorAll(".ak-album-tab").forEach(x=>x.classList.toggle("active",x===b));
     sortCards(b.dataset.sort);
   });
   updateCount();
 }
 function numberFromCard(c){
   const txt=(c.textContent||"");
   const m=txt.match(/[♥♡]\s*(\d+)/);
   return m?Number(m[1]):0;
 }
 function sortCards(mode){
   const root=page(),g=grid(root); if(!g)return;
   const arr=cards(root);
   if(mode==="popular"){
     arr.sort((a,b)=>numberFromCard(b)-numberFromCard(a));
   }else{
     // Restore DOM/data order as closely as possible using ids; if absent,
     // existing render order is preserved by stable sort.
     arr.sort((a,b)=>{
       const ai=Number(a.dataset?.albumId||a.dataset?.id||0);
       const bi=Number(b.dataset?.albumId||b.dataset?.id||0);
       return (bi||0)-(ai||0);
     });
   }
   arr.forEach(c=>g.appendChild(c));
 }
 function updateCount(){
   const n=document.getElementById("ak-album-photo-count");
   if(n)n.textContent=String(cards(page()).length);
 }
 function enhance(){
   addIntro(); updateCount();
 }
 document.addEventListener("DOMContentLoaded",()=>{
   enhance();
   const root=page();
   if(root){
     new MutationObserver(()=>{updateCount()}).observe(root,{childList:true,subtree:true});
   }
 });
 window.amkinaEnhanceAlbum=enhance;
})();

/* ===== AMKINA SCRIPT BLOCK 71 | id="amkina-track-story-data-final-v2" ===== */
(function(){
 "use strict";

 function currentStoryTrack(){
   try{
     if(typeof currentIndex==="number" && currentIndex>=0 && Array.isArray(tracks) && tracks[currentIndex]) return tracks[currentIndex];
     if(typeof currentTrackIndex==="number" && currentTrackIndex>=0 && Array.isArray(tracks) && tracks[currentTrackIndex]) return tracks[currentTrackIndex];
     if(typeof currentTrack!=="undefined" && currentTrack) return currentTrack;
   }catch(e){}
   return null;
 }

 async function ensureDescription(t){
   if(!t || t.id==null) return "";
   let story=String(t.description||"").trim();
   if(story) return story;
   try{
     const r=await fetch(
       SUPABASE_URL+"/rest/v1/tracks?id=eq."+encodeURIComponent(t.id)+"&select=description&limit=1",
       {headers:{"apikey":SUPABASE_ANON_KEY}}
     );
     if(r.ok){
       const rows=await r.json();
       story=String(rows?.[0]?.description||"").trim();
       if(story)t.description=story;
     }
   }catch(e){console.warn("곡 이야기 불러오기 실패",e)}
   return story;
 }

 window.refreshTrackStoryButton=function(){
   const btn=document.getElementById("track-story-player-btn");
   if(!btn)return;
   btn.textContent="곡 이야기";
   btn.title="곡 이야기 보기";
   btn.setAttribute("aria-label","곡 이야기 보기");
   const t=currentStoryTrack();
   btn.classList.toggle("has-story",!!String(t?.description||"").trim());
 };

 window.openTrackStory=async function(){
   const modal=document.getElementById("track-story-modal");
   const title=document.getElementById("track-story-title");
   const meta=document.getElementById("track-story-meta");
   const body=document.getElementById("track-story-body");
   const t=currentStoryTrack();

   if(!modal||!title||!meta||!body)return;
   if(!t){
     title.textContent="곡 이야기";
     meta.textContent="AMKINA MUSIC";
     body.textContent="곡을 먼저 선택해주세요.";
     body.classList.add("empty");
   }else{
     title.textContent=t.title||"Untitled";
     meta.textContent=(t.artist||"AMKINA")+" · 곡 이야기";
     body.textContent="곡 이야기를 불러오는 중...";
     body.classList.add("empty");
     modal.classList.add("open");
     modal.setAttribute("aria-hidden","false");

     const story=await ensureDescription(t);
     body.textContent=story||"등록된 곡 이야기가 없습니다.";
     body.classList.toggle("empty",!story);
     const btn=document.getElementById("track-story-player-btn");
     if(btn)btn.classList.toggle("has-story",!!story);
     return;
   }
   modal.classList.add("open");
   modal.setAttribute("aria-hidden","false");
 };

 /* 재생곡이 바뀔 때 버튼 상태도 갱신 */
 if(typeof audio!=="undefined" && audio){
   audio.addEventListener("loadedmetadata",()=>setTimeout(window.refreshTrackStoryButton,0));
   audio.addEventListener("play",()=>setTimeout(window.refreshTrackStoryButton,0));
 }
 document.addEventListener("DOMContentLoaded",()=>setTimeout(window.refreshTrackStoryButton,300));
})();

/* ===== AMKINA SCRIPT BLOCK 72 | id="amkina-mobile-story-safe-restore-v5-script" ===== */
(function(){
  "use strict";
  /*
    SAFE RESTORE:
    - 기존 모바일 ⋯ 메뉴 클릭 이벤트를 건드리지 않음
    - 기존 EQ 및 기존 메뉴 항목을 삭제/교체하지 않음
    - 모바일에서는 플레이어의 곡 이야기 직접 버튼만 숨김
    곡 이야기를 기존 ⋯ 메뉴에 넣는 작업은 메뉴 구조를 정확히 확인한 뒤 별도로 한다.
  */
})();

