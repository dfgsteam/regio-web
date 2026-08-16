/**
 * PhotoViewer - Interactive fullscreen lightbox for SMJ Regio Wegweiser
 * Supports galleries, single photos, zoom, swipe gestures, and keyboard navigation.
 */

export interface PhotoItem {
  src: string
  alt: string
  caption?: string
  date?: string
  tags?: string[]
  linkUrl?: string
  linkText?: string
  group?: string
}

class PhotoViewerManager {
  private modal: HTMLElement | null = null
  private imgElement: HTMLImageElement | null = null
  private captionElement: HTMLElement | null = null
  private counterElement: HTMLElement | null = null
  private dateElement: HTMLElement | null = null
  private linkElement: HTMLAnchorElement | null = null
  private prevBtn: HTMLButtonElement | null = null
  private nextBtn: HTMLButtonElement | null = null
  private zoomBtn: HTMLButtonElement | null = null

  private items: PhotoItem[] = []
  private currentIndex: number = 0
  private isOpen: boolean = false
  private isZoomed: boolean = false

  // Touch swipe handling
  private touchStartX: number = 0
  private touchStartY: number = 0

  init() {
    this.createDom()
    this.bindEvents()
    this.discoverImages()

    // Re-discover on view transitions / content updates
    document.addEventListener('astro:page-load', () => {
      this.discoverImages()
    })
  }

  private createDom() {
    if (document.getElementById('smj-photo-viewer-modal')) {
      this.modal = document.getElementById('smj-photo-viewer-modal')
      this.cacheElements()
      return
    }

    const overlay = document.createElement('div')
    overlay.id = 'smj-photo-viewer-modal'
    overlay.className =
      'fixed inset-0 z-[9999] hidden flex-col justify-between bg-forest-950/95 backdrop-blur-md opacity-0 transition-opacity duration-300 select-none'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', 'Foto Viewer')

    overlay.innerHTML = `
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
    `

    document.body.appendChild(overlay)
    this.modal = overlay
    this.cacheElements()
  }

  private cacheElements() {
    if (!this.modal) return
    this.imgElement = this.modal.querySelector('#pv-img')
    this.captionElement = this.modal.querySelector('#pv-caption')
    this.counterElement = this.modal.querySelector('#pv-counter')
    this.dateElement = this.modal.querySelector('#pv-date')
    this.linkElement = this.modal.querySelector('#pv-link')
    this.prevBtn = this.modal.querySelector('#pv-prev-btn')
    this.nextBtn = this.modal.querySelector('#pv-next-btn')
    this.zoomBtn = this.modal.querySelector('#pv-zoom-btn')
  }

  private bindEvents() {
    if (!this.modal) return

    // Close on Close-Button or click outside stage image
    this.modal.querySelector('#pv-close-btn')?.addEventListener('click', () => this.close())
    this.modal.querySelector('#pv-stage')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).id === 'pv-img-wrap') {
        this.close()
      }
    })

    // Navigation buttons
    this.prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.prev()
    })
    this.nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.next()
    })

    // Zoom toggle
    this.zoomBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleZoom()
    })
    this.imgElement?.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleZoom()
    })

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      if (!this.isOpen) return
      if (e.key === 'Escape') {
        this.close()
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.prev()
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.next()
      } else if (e.key === '+' || e.key === '=') {
        this.setZoom(true)
      } else if (e.key === '-' || e.key === '0') {
        this.setZoom(false)
      }
    })

    // Touch Swipe Gestures
    this.modal.addEventListener(
      'touchstart',
      (e) => {
        if (!this.isOpen || this.isZoomed || !e.changedTouches[0]) return
        this.touchStartX = e.changedTouches[0].screenX
        this.touchStartY = e.changedTouches[0].screenY
      },
      { passive: true }
    )

    this.modal.addEventListener(
      'touchend',
      (e) => {
        if (!this.isOpen || this.isZoomed || !e.changedTouches[0]) return
        const endX = e.changedTouches[0].screenX
        const endY = e.changedTouches[0].screenY
        const diffX = endX - this.touchStartX
        const diffY = endY - this.touchStartY

        if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX < 0) {
            this.next()
          } else {
            this.prev()
          }
        }
      },
      { passive: true }
    )
  }

  discoverImages() {
    this.createDom()

    // 1. Find all images inside articles, gallery grids, and explicit photo-viewer links
    const targetImages = document.querySelectorAll<HTMLImageElement>(
      'article.prose-rough img, .gallery-grid img, [data-photo-viewer], .journal-card img, .camp-gallery img'
    )

    targetImages.forEach((img) => {
      if (img.dataset.pvBound === 'true') return
      img.dataset.pvBound = 'true'
      img.classList.add('cursor-zoom-in')

      img.addEventListener('click', (e) => {
        e.preventDefault()
        this.openFromElement(img)
      })
    })
  }

  openFromElement(targetImg: HTMLImageElement) {
    // Find all sibling images in the same section/article/gallery
    const container =
      targetImg.closest('article.prose-rough') ||
      targetImg.closest('.gallery-grid') ||
      targetImg.closest('main') ||
      document.body

    const groupImgs = Array.from(container.querySelectorAll<HTMLImageElement>('img')).filter(
      (img) => !img.src.includes('avatar') && !img.src.includes('logo') && !img.src.includes('icon')
    )

    this.items = groupImgs.map((img) => {
      const figure = img.closest('figure')
      const caption =
        img.getAttribute('data-caption') ||
        figure?.querySelector('figcaption')?.textContent?.trim() ||
        img.alt ||
        ''
      const date = img.getAttribute('data-date') || ''
      const linkUrl = img.getAttribute('data-link-url') || ''

      return {
        src: img.currentSrc || img.src,
        alt: img.alt || 'Foto SMJ Regio Wegweiser',
        caption,
        date,
        linkUrl,
      }
    })

    const foundIndex = groupImgs.indexOf(targetImg)
    this.currentIndex = foundIndex >= 0 ? foundIndex : 0

    this.open(this.currentIndex)
  }

  open(index: number) {
    if (this.items.length === 0) return
    this.currentIndex = Math.max(0, Math.min(index, this.items.length - 1))
    this.isOpen = true
    this.setZoom(false)

    if (this.modal) {
      this.modal.classList.remove('hidden')
      this.modal.classList.add('flex')
      // Trigger smooth opacity transition
      requestAnimationFrame(() => {
        this.modal?.classList.remove('opacity-0')
        this.modal?.classList.add('opacity-100')
      })
    }

    document.body.style.overflow = 'hidden'
    this.renderCurrent()
  }

  close() {
    this.isOpen = false
    this.setZoom(false)

    if (this.modal) {
      this.modal.classList.remove('opacity-100')
      this.modal.classList.add('opacity-0')
      setTimeout(() => {
        this.modal?.classList.remove('flex')
        this.modal?.classList.add('hidden')
      }, 300)
    }

    document.body.style.overflow = ''
  }

  next() {
    if (this.items.length <= 1) return
    this.currentIndex = (this.currentIndex + 1) % this.items.length
    this.setZoom(false)
    this.renderCurrent()
  }

  prev() {
    if (this.items.length <= 1) return
    this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length
    this.setZoom(false)
    this.renderCurrent()
  }

  private toggleZoom() {
    this.setZoom(!this.isZoomed)
  }

  private setZoom(zoomed: boolean) {
    this.isZoomed = zoomed
    if (!this.imgElement) return

    if (this.isZoomed) {
      this.imgElement.style.transform = 'scale(1.75)'
      this.imgElement.style.cursor = 'zoom-out'
    } else {
      this.imgElement.style.transform = 'scale(1)'
      this.imgElement.style.cursor = 'zoom-in'
    }
  }

  private renderCurrent() {
    const item = this.items[this.currentIndex]
    if (!item || !this.imgElement) return

    // Fade animation on image change
    this.imgElement.style.opacity = '0.4'
    this.imgElement.src = item.src
    this.imgElement.alt = item.alt

    this.imgElement.onload = () => {
      if (this.imgElement) this.imgElement.style.opacity = '1'
    }

    // Update Counter
    if (this.counterElement) {
      const current = String(this.currentIndex + 1).padStart(2, '0')
      const total = String(this.items.length).padStart(2, '0')
      this.counterElement.textContent = `BILD ${current} / ${total}`
    }

    // Update Caption
    if (this.captionElement) {
      this.captionElement.textContent = item.caption || item.alt || ''
    }

    // Update Date
    if (this.dateElement) {
      this.dateElement.textContent = item.date ? `AUFNAHME / VERÖFFENTLICHUNG · ${item.date}` : ''
    }

    // Update Instagram Link
    if (this.linkElement) {
      if (item.linkUrl) {
        this.linkElement.href = item.linkUrl
        this.linkElement.classList.remove('hidden')
        this.linkElement.classList.add('inline-flex')
      } else {
        this.linkElement.classList.remove('inline-flex')
        this.linkElement.classList.add('hidden')
      }
    }

    // Update Nav Buttons visibility
    if (this.prevBtn && this.nextBtn) {
      if (this.items.length <= 1) {
        this.prevBtn.style.display = 'none'
        this.nextBtn.style.display = 'none'
      } else {
        this.prevBtn.style.display = 'flex'
        this.nextBtn.style.display = 'flex'
      }
    }
  }
}

export const photoViewer = new PhotoViewerManager()

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => photoViewer.init())
  } else {
    photoViewer.init()
  }
}
