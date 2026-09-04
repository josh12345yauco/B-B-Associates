/* ============================================================
   B&B Associates — Reviews block for service-area pages
   Renders real client reviews (same nine that appear on /reviews/)
   four at a time, with a "Show More Reviews" button that reveals the
   next four. Mount with:
     <div data-bb-reviews data-initial="4" data-step="4"></div>
   Inherits the page's .review-card styling; adds a light-theme grid.
   ============================================================ */
(function () {
  var REVIEWS = [
    { author: 'The Williams Family', town: 'Doylestown, PA', source: 'Google', text: 'B&B managed to make our 400-year-old home feel current without losing any of its soul. The attention to the original beams and floors was remarkable. Michael’s team was on-site every single day. The quality of workmanship is unlike anything I’ve seen in 20 years of homeownership.' },
    { author: 'Sarah & Tom R.', town: 'Blue Bell, PA', source: 'Angi', text: 'Our master bath now looks like something out of Architectural Digest. The curbless shower and the lighting design are absolutely stunning. We couldn’t believe it was the same room. Andrei was meticulous about every tile placement.' },
    { author: 'The Peterson Family', town: 'Wayne, PA', source: 'Google', text: 'Michael and his team turned our dated kitchen into something we’re genuinely proud to show guests. Clean, bright, and exactly what we envisioned. The new island changed how we use the space entirely. I cannot recommend them highly enough.' },
    { author: 'The Marino Family', town: 'Newtown, PA', source: 'Angi', text: 'The teal island was our dream and B&B executed it better than we imagined. Every detail — from the backsplash to the brass fixtures — is perfect. Worth every penny. The team showed up on time every single day.' },
    { author: 'M.N.', town: 'Blue Bell, PA', source: 'Google', text: 'The result looks like a 5-star hotel bathroom. I keep walking in just to look at it. Thank you B&B — you exceeded every expectation we had going in. The Carrera tile is breathtaking.' },
    { author: 'Dana & Roy M.', town: 'Wyncote, PA', source: 'Google', text: 'We couldn’t believe our own home after B&B was done. Removing those walls completely changed how we live. Best investment we’ve ever made. Michael’s team was professional, clean, and on-schedule every day. They treated our home like it was their own.' },
    { author: 'Trisha & Mark C.', town: 'Doylestown, PA', source: 'Houzz', text: 'We’ve been telling everyone about B&B. The heated floors alone are worth it for a Pennsylvania winter. The team was professional and kept our house remarkably clean throughout the project. Andrei’s tile work in the shower is a true work of art.' },
    { author: 'The Hartford Family', town: 'Wayne, PA', source: 'Angi', text: 'Andrei was meticulous. Every tile is perfectly aligned, every fixture perfectly level. Our master bath is now the most beautiful room in the house. The frameless glass they installed is absolutely seamless.' },
    { author: 'J.C. Heff', town: 'Huntingdon Valley, PA', source: 'Google', text: 'B&B transformed our entire first floor. From the kitchen to the living area — everything flows and feels like it was designed as one. They stayed on schedule, the crew was respectful, and the result is everything we hoped for and more.' }
  ];

  var CSS = '' +
    '.bb-reviews-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-5,24px);max-width:1040px;margin:0 auto}' +
    '.bb-reviews-grid .review-card{position:relative;padding:var(--sp-6,32px);background:#ffffff;border:1px solid rgba(0,0,0,0.08);display:flex;flex-direction:column}' +
    '.bb-reviews-grid .review-card[hidden]{display:none}' +
    '.bb-reviews-grid .stars{color:var(--color-gold,#b17500);font-size:14px;letter-spacing:2px}' +
    '.bb-reviews-grid .review-card-text{font-family:var(--font-display,"Cormorant Garamond",serif);font-size:clamp(17px,1.5vw,21px);font-style:italic;color:#1a1a1a;line-height:1.5;margin-top:var(--sp-4,16px);flex:1}' +
    '.bb-reviews-grid .review-card-foot{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--sp-3,12px);margin-top:var(--sp-5,24px);padding-top:var(--sp-4,16px);border-top:1px solid rgba(0,0,0,0.08)}' +
    '.bb-reviews-grid .review-avatar{width:36px;height:36px;border-radius:50%;background:#1a1a1a;color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-sans,sans-serif);font-size:12px;font-weight:600;letter-spacing:0.05em;flex-shrink:0}' +
    '.bb-reviews-grid .review-card-author{font-family:var(--font-sans,sans-serif);font-size:14px;font-weight:600;color:#1a1a1a;margin:0}' +
    '.bb-reviews-grid .review-card-town{font-family:var(--font-sans,sans-serif);font-size:12px;color:#4B5563;margin:2px 0 0}' +
    '.bb-reviews-grid .review-card-source{font-family:var(--font-mono,monospace);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#4B5563}' +
    '.bb-reviews-more{text-align:center;margin-top:var(--sp-7,40px)}' +
    '@media (max-width:820px){.bb-reviews-grid{grid-template-columns:1fr}}';

  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function initials(name) {
    var parts = name.replace(/^The\s+/, '').replace(/\s+Family$/, '').replace(/&/g, ' ').split(/\s+/).filter(Boolean);
    return (parts[0] || 'B').charAt(0).toUpperCase() + (parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '');
  }
  function card(r, hidden) {
    return '<div class="review-card"' + (hidden ? ' hidden' : '') + '>' +
      '<div class="stars" aria-label="5 stars">★★★★★</div>' +
      '<p class="review-card-text">“' + esc(r.text) + '”</p>' +
      '<div class="review-card-foot"><div style="display:flex;align-items:center;gap:12px;"><div class="review-avatar">' + esc(initials(r.author)) + '</div><div><p class="review-card-author">' + esc(r.author) + '</p><p class="review-card-town">' + esc(r.town) + '</p></div></div>' +
      '<span class="review-card-source">Verified · ' + esc(r.source) + '</span></div></div>';
  }
  function mount(el) {
    if (!document.getElementById('bb-reviews-styles')) { var st = document.createElement('style'); st.id = 'bb-reviews-styles'; st.textContent = CSS; document.head.appendChild(st); }
    var initial = parseInt(el.getAttribute('data-initial') || '4', 10);
    var step = parseInt(el.getAttribute('data-step') || '4', 10);
    var shown = Math.min(initial, REVIEWS.length);
    el.innerHTML = '<div class="bb-reviews-grid">' + REVIEWS.map(function (r, i) { return card(r, i >= shown); }).join('') + '</div>' +
      (REVIEWS.length > shown ? '<div class="bb-reviews-more"><button type="button" class="phil-btn phil-btn-fill phil-btn-fill-dark"><div class="phil-fill"></div><span class="phil-label">Show More Reviews</span></button></div>' : '');
    var btn = el.querySelector('.bb-reviews-more button');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var cards = el.querySelectorAll('.review-card[hidden]');
      for (var i = 0; i < cards.length && i < step; i++) cards[i].hidden = false;
      if (el.querySelectorAll('.review-card[hidden]').length === 0) btn.parentNode.hidden = true;
    });
  }
  function init() { Array.prototype.forEach.call(document.querySelectorAll('[data-bb-reviews]'), function (el) { if (!el.getAttribute('data-bb-reviews-mounted')) { el.setAttribute('data-bb-reviews-mounted', '1'); mount(el); } }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
