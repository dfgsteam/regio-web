import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initSubtleEffects(): void {
  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // 1. Dynamic Physical Stamp In & Out Effect for Field Notes, Stickers & Stamps
    const stampElements = document.querySelectorAll<HTMLElement>(
      '.stamp-element, .field-note, .sticker, [data-stamp], #expect .sticker, figure.field-note'
    )

    stampElements.forEach((el, index) => {
      const rawRotate = el.dataset.rotate || el.style.transform || '-2deg'
      const targetRotate = parseFloat(rawRotate.replace(/[^0-9.-]/g, '')) || (index % 2 === 0 ? -2.5 : 2.5)

      // Reset inline transform to avoid style conflict
      el.style.transform = ''

      gsap.fromTo(
        el,
        {
          scale: 1.28,
          opacity: 0.2,
          rotate: targetRotate + (index % 2 === 0 ? -12 : 12),
          y: -28,
        },
        {
          scale: 1,
          opacity: 1,
          rotate: targetRotate,
          y: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 95%',
            end: 'top 65%',
            scrub: 0.5,
          },
        }
      )
    })

    // 2. Kinetic Text Highlighting for Faith Words & Analog Items
    const kineticWords = document.querySelectorAll<HTMLElement>('.faith-word, .analog-item-glow')
    if (kineticWords.length > 0) {
      kineticWords.forEach((word) => {
        gsap.fromTo(
          word,
          {
            color: 'rgba(241, 235, 221, 0.35)',
            x: -12,
            opacity: 0.4,
          },
          {
            color: '#F1EBDD',
            x: 0,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: word,
              start: 'top 85%',
              end: 'top 45%',
              scrub: 0.6,
            },
          }
        )
      })
    }

    // 3. Topographic Background Drift Parallax
    const topos = document.querySelectorAll<HTMLElement>('.texture-topo')
    topos.forEach((topo) => {
      const parent = topo.parentElement
      if (!parent) return
      gsap.fromTo(
        topo,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: parent,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.4,
          },
        }
      )
    })

    // 4. Clean Subtle Image Reveal Unclipping
    const revealImages = document.querySelectorAll<HTMLElement>('.reveal-image, figure.reveal img')
    revealImages.forEach((img) => {
      gsap.fromTo(
        img,
        { scale: 1.06, filter: 'contrast(1.08) brightness(0.9)' },
        {
          scale: 1,
          filter: 'contrast(1) brightness(1)',
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: img,
            start: 'top 88%',
            toggleActions: 'play reverse play reverse',
          },
        }
      )
    })
  })
}

// Auto-run on load & Astro page-load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubtleEffects)
  } else {
    initSubtleEffects()
  }
  document.addEventListener('astro:page-load', initSubtleEffects)
}
