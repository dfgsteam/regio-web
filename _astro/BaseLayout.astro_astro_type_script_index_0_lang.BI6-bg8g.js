import{n as e,t}from"./ScrollTrigger.Cgjl6ODA.js";e.registerPlugin(t);function n(){e.matchMedia().add(`(prefers-reduced-motion: no-preference)`,()=>{document.querySelectorAll(`.stamp-element, .field-note, .sticker, [data-stamp], #expect .sticker, figure.field-note`).forEach((t,n)=>{let r=t.dataset.rotate||t.style.transform||`-2deg`,i=parseFloat(r.replace(/[^0-9.-]/g,``))||(n%2==0?-2.5:2.5);t.style.transform=``,e.fromTo(t,{scale:1.28,opacity:.2,rotate:i+(n%2==0?-12:12),y:-28},{scale:1,opacity:1,rotate:i,y:0,ease:`power2.out`,scrollTrigger:{trigger:t,start:`top 95%`,end:`top 65%`,scrub:.5}})});let t=document.querySelectorAll(`.faith-word, .analog-item-glow`);t.length>0&&t.forEach(t=>{e.fromTo(t,{color:`rgba(241, 235, 221, 0.35)`,x:-12,opacity:.4},{color:`#F1EBDD`,x:0,opacity:1,ease:`power2.out`,scrollTrigger:{trigger:t,start:`top 85%`,end:`top 45%`,scrub:.6}})}),document.querySelectorAll(`.texture-topo`).forEach(t=>{let n=t.parentElement;n&&e.fromTo(t,{yPercent:-8},{yPercent:8,ease:`none`,scrollTrigger:{trigger:n,start:`top bottom`,end:`bottom top`,scrub:.4}})}),document.querySelectorAll(`.reveal-image, figure.reveal img`).forEach(t=>{e.fromTo(t,{scale:1.06,filter:`contrast(1.08) brightness(0.9)`},{scale:1,filter:`contrast(1) brightness(1)`,duration:.8,ease:`power2.out`,scrollTrigger:{trigger:t,start:`top 88%`,toggleActions:`play reverse play reverse`}})})})}typeof window<`u`&&(document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,n):n(),document.addEventListener(`astro:page-load`,n));var r=new class{modal=null;imgElement=null;captionElement=null;counterElement=null;dateElement=null;linkElement=null;prevBtn=null;nextBtn=null;zoomBtn=null;items=[];currentIndex=0;isOpen=!1;isZoomed=!1;touchStartX=0;touchStartY=0;init(){this.createDom(),this.bindEvents(),this.discoverImages(),document.addEventListener(`astro:page-load`,()=>{this.discoverImages()})}createDom(){if(document.getElementById(`smj-photo-viewer-modal`)){this.modal=document.getElementById(`smj-photo-viewer-modal`),this.cacheElements();return}let e=document.createElement(`div`);e.id=`smj-photo-viewer-modal`,e.className=`fixed inset-0 z-[9999] hidden flex-col justify-between bg-forest-950/95 backdrop-blur-md opacity-0 transition-opacity duration-300 select-none`,e.setAttribute(`role`,`dialog`),e.setAttribute(`aria-modal`,`true`),e.setAttribute(`aria-label`,`Foto Viewer`),e.innerHTML=`
      <!-- Top Control Bar -->
      <div class="relative z-20 flex items-center justify-between border-b border-paper/15 bg-forest-950/80 px-4 py-3 sm:px-8">
        <div class="flex items-center gap-3">
          <span class="inline-block h-2 w-2 rounded-full bg-orange animate-pulse"></span>
          <span class="font-mono text-xs font-bold uppercase tracking-[0.2em] text-orange">// FIELD PHOTO VIEWER</span>
          <span id="pv-counter" class="mono-label text-xs border-l border-paper/15 pl-3 text-paper/70">01 / 01</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            id="pv-zoom-btn"
            type="button"
            class="flex h-9 w-9 items-center justify-center border border-paper/20 bg-forest-900 font-mono text-sm text-paper transition-all hover:border-orange hover:bg-orange hover:text-forest-950 cursor-pointer"
            aria-label="Vergrößern"
            title="Vergrößern / Zoomen"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          
          <button
            id="pv-close-btn"
            type="button"
            class="flex h-9 w-9 items-center justify-center border border-paper/20 bg-forest-900 font-mono text-sm font-bold text-paper transition-all hover:border-orange hover:bg-orange hover:text-forest-950 cursor-pointer"
            aria-label="Schließen (Esc)"
            title="Schließen (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Main Stage -->
      <div class="relative flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-6" id="pv-stage">
        <!-- Navigation Prev Button -->
        <button
          id="pv-prev-btn"
          type="button"
          class="group/btn absolute left-2 sm:left-6 z-20 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center border border-paper/20 bg-forest-900/90 text-paper transition-all hover:border-orange hover:bg-orange hover:text-forest-950 cursor-pointer shadow-2xl"
          aria-label="Vorheriges Bild (Pfeiltaste links)"
        >
          <span class="font-mono text-xl sm:text-2xl font-bold transition-transform group-hover/btn:-translate-x-0.5">‹</span>
        </button>

        <!-- Image Container -->
        <div class="relative flex max-h-[75vh] max-w-[92vw] items-center justify-center overflow-hidden" id="pv-img-wrap">
          <img
            id="pv-img"
            src=""
            alt=""
            class="max-h-[75vh] max-w-[92vw] object-contain transition-transform duration-300 ease-out cursor-zoom-in shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-paper/10"
          />
        </div>

        <!-- Navigation Next Button -->
        <button
          id="pv-next-btn"
          type="button"
          class="group/btn absolute right-2 sm:right-6 z-20 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center border border-paper/20 bg-forest-900/90 text-paper transition-all hover:border-orange hover:bg-orange hover:text-forest-950 cursor-pointer shadow-2xl"
          aria-label="Nächstes Bild (Pfeiltaste rechts)"
        >
          <span class="font-mono text-xl sm:text-2xl font-bold transition-transform group-hover/btn:translate-x-0.5">›</span>
        </button>
      </div>

      <!-- Bottom Info Bar -->
      <div class="relative z-20 flex flex-col justify-between gap-3 border-t border-paper/15 bg-forest-950/90 px-4 py-3 sm:flex-row sm:items-center sm:px-8">
        <div class="max-w-2xl">
          <p id="pv-caption" class="text-xs sm:text-sm leading-relaxed text-paper line-clamp-2 sm:line-clamp-none font-medium"></p>
          <p id="pv-date" class="mono-label mt-1 text-[0.68rem] text-paper/50"></p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <a
            id="pv-link"
            href=""
            target="_blank"
            rel="noopener noreferrer"
            class="hidden items-center gap-2 border border-orange bg-orange/10 px-4 py-2 font-mono text-[0.7rem] font-bold uppercase tracking-wider text-orange transition-colors hover:bg-orange hover:text-forest-950"
          >
            <span>Auf Instagram öffnen</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    `,document.body.appendChild(e),this.modal=e,this.cacheElements()}cacheElements(){this.modal&&(this.imgElement=this.modal.querySelector(`#pv-img`),this.captionElement=this.modal.querySelector(`#pv-caption`),this.counterElement=this.modal.querySelector(`#pv-counter`),this.dateElement=this.modal.querySelector(`#pv-date`),this.linkElement=this.modal.querySelector(`#pv-link`),this.prevBtn=this.modal.querySelector(`#pv-prev-btn`),this.nextBtn=this.modal.querySelector(`#pv-next-btn`),this.zoomBtn=this.modal.querySelector(`#pv-zoom-btn`))}bindEvents(){this.modal&&(this.modal.querySelector(`#pv-close-btn`)?.addEventListener(`click`,()=>this.close()),this.modal.querySelector(`#pv-stage`)?.addEventListener(`click`,e=>{(e.target===e.currentTarget||e.target.id===`pv-img-wrap`)&&this.close()}),this.prevBtn?.addEventListener(`click`,e=>{e.stopPropagation(),this.prev()}),this.nextBtn?.addEventListener(`click`,e=>{e.stopPropagation(),this.next()}),this.zoomBtn?.addEventListener(`click`,e=>{e.stopPropagation(),this.toggleZoom()}),this.imgElement?.addEventListener(`click`,e=>{e.stopPropagation(),this.toggleZoom()}),window.addEventListener(`keydown`,e=>{this.isOpen&&(e.key===`Escape`?this.close():e.key===`ArrowLeft`||e.key===`a`||e.key===`A`?this.prev():e.key===`ArrowRight`||e.key===`d`||e.key===`D`?this.next():e.key===`+`||e.key===`=`?this.setZoom(!0):(e.key===`-`||e.key===`0`)&&this.setZoom(!1))}),this.modal.addEventListener(`touchstart`,e=>{!this.isOpen||this.isZoomed||!e.changedTouches[0]||(this.touchStartX=e.changedTouches[0].screenX,this.touchStartY=e.changedTouches[0].screenY)},{passive:!0}),this.modal.addEventListener(`touchend`,e=>{if(!this.isOpen||this.isZoomed||!e.changedTouches[0])return;let t=e.changedTouches[0].screenX,n=e.changedTouches[0].screenY,r=t-this.touchStartX,i=n-this.touchStartY;Math.abs(r)>50&&Math.abs(r)>Math.abs(i)&&(r<0?this.next():this.prev())},{passive:!0}))}discoverImages(){this.createDom(),document.querySelectorAll(`article.prose-rough img, .gallery-grid img, [data-photo-viewer], .journal-card img, .camp-gallery img`).forEach(e=>{e.dataset.pvBound!==`true`&&(e.dataset.pvBound=`true`,e.classList.add(`cursor-zoom-in`),e.addEventListener(`click`,t=>{t.preventDefault(),this.openFromElement(e)}))})}openFromElement(e){let t=e.closest(`article.prose-rough`)||e.closest(`.gallery-grid`)||e.closest(`main`)||document.body,n=Array.from(t.querySelectorAll(`img`)).filter(e=>!e.src.includes(`avatar`)&&!e.src.includes(`logo`)&&!e.src.includes(`icon`));this.items=n.map(e=>{let t=e.closest(`figure`),n=e.getAttribute(`data-caption`)||t?.querySelector(`figcaption`)?.textContent?.trim()||e.alt||``,r=e.getAttribute(`data-date`)||``,i=e.getAttribute(`data-link-url`)||``;return{src:e.currentSrc||e.src,alt:e.alt||`Foto SMJ Regio Wegweiser`,caption:n,date:r,linkUrl:i}});let r=n.indexOf(e);this.currentIndex=r>=0?r:0,this.open(this.currentIndex)}open(e){this.items.length!==0&&(this.currentIndex=Math.max(0,Math.min(e,this.items.length-1)),this.isOpen=!0,this.setZoom(!1),this.modal&&(this.modal.classList.remove(`hidden`),this.modal.classList.add(`flex`),requestAnimationFrame(()=>{this.modal?.classList.remove(`opacity-0`),this.modal?.classList.add(`opacity-100`)})),document.body.style.overflow=`hidden`,this.renderCurrent())}close(){this.isOpen=!1,this.setZoom(!1),this.modal&&(this.modal.classList.remove(`opacity-100`),this.modal.classList.add(`opacity-0`),setTimeout(()=>{this.modal?.classList.remove(`flex`),this.modal?.classList.add(`hidden`)},300)),document.body.style.overflow=``}next(){this.items.length<=1||(this.currentIndex=(this.currentIndex+1)%this.items.length,this.setZoom(!1),this.renderCurrent())}prev(){this.items.length<=1||(this.currentIndex=(this.currentIndex-1+this.items.length)%this.items.length,this.setZoom(!1),this.renderCurrent())}toggleZoom(){this.setZoom(!this.isZoomed)}setZoom(e){this.isZoomed=e,this.imgElement&&(this.isZoomed?(this.imgElement.style.transform=`scale(1.75)`,this.imgElement.style.cursor=`zoom-out`):(this.imgElement.style.transform=`scale(1)`,this.imgElement.style.cursor=`zoom-in`))}renderCurrent(){let e=this.items[this.currentIndex];if(!(!e||!this.imgElement)){if(this.imgElement.style.opacity=`0.4`,this.imgElement.src=e.src,this.imgElement.alt=e.alt,this.imgElement.onload=()=>{this.imgElement&&(this.imgElement.style.opacity=`1`)},this.counterElement){let e=String(this.currentIndex+1).padStart(2,`0`),t=String(this.items.length).padStart(2,`0`);this.counterElement.textContent=`BILD ${e} / ${t}`}this.captionElement&&(this.captionElement.textContent=e.caption||e.alt||``),this.dateElement&&(this.dateElement.textContent=e.date?`AUFNAHME / VERÖFFENTLICHUNG · ${e.date}`:``),this.linkElement&&(e.linkUrl?(this.linkElement.href=e.linkUrl,this.linkElement.classList.remove(`hidden`),this.linkElement.classList.add(`inline-flex`)):(this.linkElement.classList.remove(`inline-flex`),this.linkElement.classList.add(`hidden`))),this.prevBtn&&this.nextBtn&&(this.items.length<=1?(this.prevBtn.style.display=`none`,this.nextBtn.style.display=`none`):(this.prevBtn.style.display=`flex`,this.nextBtn.style.display=`flex`))}}};typeof window<`u`&&(document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,()=>r.init()):r.init());