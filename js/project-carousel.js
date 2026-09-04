/* ============================================================
   B&B Associates — Portfolio photo carousel (service-area pages)
   Non-clickable, auto-scrolling strip of real kitchen & bathroom
   project photos from js/projects-data.js. Mount with:
     <div data-bb-carousel></div>
   Pure CSS marquee; pauses on hover; respects reduced motion.
   ============================================================ */
(function () {
  var ITEMS = [
  {
    "src": "/portfolio/KITCHENS/B&B - Beth Rubin-kitchen/153E1359-5284-48E5-9F68-B497880FF6F7.jpeg",
    "alt": "Stacked White & Gray Kitchen — kitchen remodel by B&B Associates"
  },
  {
    "src": "/portfolio/BATHROOMS/B&B - LaShannon Master bathroom/09DCC4C5-5F51-4A82-9C78-AB97A237A844.jpeg",
    "alt": "Mother of Pearl Luxury Bath — bathroom remodel by B&B Associates"
  },
  {
    "src": "/portfolio/KITCHENS/B&B - McBride Kitchen/03A7198B-DACB-43CA-87B1-1148DB3DEEC8.jpeg",
    "alt": "White Quartzite Glazed Kitchen — kitchen remodel by B&B Associates"
  },
  {
    "src": "/portfolio/BATHROOMS/B&B - Cruz Master/3A187396-30B0-429C-A94A-DFBD89EC9C69.jpeg",
    "alt": "Modern Dark Spa Master Bath — bathroom remodel by B&B Associates"
  },
  {
    "src": "/portfolio/KITCHENS/B&B - Prager-kitchen/0DB0D4AE-8BC9-4CF0-B0BF-A4E71397B8DA.jpeg",
    "alt": "Custom Walnut Island Kitchen — kitchen remodel by B&B Associates"
  },
  {
    "src": "/portfolio/BATHROOMS/B&B - Hershey-bathroom/08477D74-323C-4FFA-95DA-415CA31AAC2C.jpeg",
    "alt": "Statuario Porcelain Master Bath — bathroom remodel by B&B Associates"
  },
  {
    "src": "/portfolio/KITCHENS/B&B - Hess Kitchen /22A33749-9A97-40C9-9583-3D217973E06D.jpeg",
    "alt": "Vanilla Island Open Kitchen — kitchen remodel by B&B Associates"
  },
  {
    "src": "/portfolio/BATHROOMS/B&B - Garvey-bathroom/55A55375-6991-4E1E-B73A-564EB2AB5E42.jpeg",
    "alt": "Hexagon Stone Spa Master Bath — bathroom remodel by B&B Associates"
  },
  {
    "src": "/portfolio/KITCHENS/BB-OLaughlin-kitchen/056F5D4A-01E4-476B-9D9C-06884681B5C9.jpeg",
    "alt": "Open-Concept Shaker Kitchen — kitchen remodel by B&B Associates"
  },
  {
    "src": "/portfolio/BATHROOMS/B&B - Guttridge -bathroom/IMG_6078.jpg",
    "alt": "Spa & Laundry Master Bath — bathroom remodel by B&B Associates"
  },
  {
    "src": "/portfolio/KITCHENS/B&B - Giedrycz Kitchen/021A219C-F9C8-4FB0-B564-36FFF126EDCB.jpeg",
    "alt": "Navy Arch Custom Kitchen — kitchen remodel by B&B Associates"
  },
  {
    "src": "/portfolio/BATHROOMS/B&B - Vartanian-bathroom/10E542CC-6F7C-45E4-B9E2-4ADC289B5031.jpeg",
    "alt": "Boutique Glazed Subway Tile Bath — bathroom remodel by B&B Associates"
  },
  {
    "src": "/portfolio/KITCHENS/B&B - Ferrie-kitchen/6534D687-3AE7-4524-9657-EE34302DB729.jpeg",
    "alt": "Navy & White Champagne Kitchen — kitchen remodel by B&B Associates"
  },
  {
    "src": "/portfolio/BATHROOMS/B&B - Stacey Goldberg bathroom/2434.jpg",
    "alt": "Golden Carrera Champagne Bath — bathroom remodel by B&B Associates"
  }
];
  var CSS = '' +
    '.bb-carousel{background:#ffffff;padding:var(--sp-8,48px) 0;overflow:hidden;border-top:1px solid rgba(0,0,0,0.06);border-bottom:1px solid rgba(0,0,0,0.06)}' +
    '.bb-carousel-head{text-align:center;margin-bottom:var(--sp-6,32px);padding:0 var(--sp-5,24px)}' +
    '.bb-carousel-eyebrow{font-family:var(--font-mono,monospace);font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:var(--color-gold,#b17500);margin-bottom:var(--sp-3,12px)}' +
    '.bb-carousel-title{font-family:var(--font-display,"Cormorant Garamond",serif);font-size:clamp(22px,2.2vw,32px);font-weight:300;font-style:italic;color:#1a1a1a;line-height:1.2;margin:0}' +
    '.bb-carousel-track{display:flex;gap:var(--sp-4,16px);width:max-content;animation:bb-carousel-scroll 70s linear infinite;will-change:transform}' +
    '.bb-carousel:hover .bb-carousel-track{animation-play-state:paused}' +
    '.bb-carousel-item{flex:0 0 auto;width:clamp(200px,22vw,300px);aspect-ratio:3/4;overflow:hidden;background:#f3f1ee;border:1px solid rgba(0,0,0,0.06)}' +
    '.bb-carousel-item img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;user-select:none}' +
    '@keyframes bb-carousel-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
    '@media (prefers-reduced-motion:reduce){.bb-carousel-track{animation:none;flex-wrap:wrap;width:auto;justify-content:center}.bb-carousel-track > :nth-child(n+' + (ITEMS.length + 1) + '){display:none}}';

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');}
  function mount(el){
    if(!document.getElementById('bb-carousel-styles')){var st=document.createElement('style');st.id='bb-carousel-styles';st.textContent=CSS;document.head.appendChild(st);}
    var eyebrow=el.getAttribute('data-eyebrow')||'From Our Portfolio';
    var title=el.getAttribute('data-title')||'Recent Kitchens &amp; Bathrooms';
    var imgs=ITEMS.map(function(i){return '<div class="bb-carousel-item" aria-hidden="false"><img src="'+esc(i.src)+'" alt="'+esc(i.alt)+'" loading="lazy" width="600" height="800"></div>';}).join('');
    el.className=(el.className?el.className+' ':'')+'bb-carousel';
    el.setAttribute('aria-label','Portfolio photo carousel');
    el.innerHTML='<div class="bb-carousel-head"><p class="bb-carousel-eyebrow">'+esc(eyebrow)+'</p><h3 class="bb-carousel-title">'+title+'</h3></div>'+
      '<div class="bb-carousel-track">'+imgs+imgs+'</div>';
  }
  function init(){Array.prototype.forEach.call(document.querySelectorAll('[data-bb-carousel]'),function(el){if(!el.getAttribute('data-bb-carousel-mounted')){el.setAttribute('data-bb-carousel-mounted','1');mount(el);}});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
