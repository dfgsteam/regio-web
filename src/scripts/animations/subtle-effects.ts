import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initSubtleEffects(): void {
  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // 1. Physical Stamp In Effect for Stickers & Field Notes
    const stampElements = document.querySelectorAll<HTMLElement>(
      '.sticker, .field-note, [data-stamp], #expect .sticker'
    )
    stampElements.forEach((el, index) => {
      const initialRotation = el.style.transform.match(/rotate\(([-0-9.]+deg)\)/)?.[1] || '-2deg'
      const numRotation = parseFloat(initialRotation) || (index % 2 === 0 ? -2.5 : 2.5)

      gsap.fromTo(
        el,
        {
          scale: 1.32,
          opacity: 0,
          rotate: numRotation - (index % 2 === 0 ? 8 : -8),
          y: -12,
        },
        {
          scale: 1,
          opacity: 1,
          rotate: numRotation,
          y: 0,
          duration: 0.5,
          delay: (index % 3) * 0.08,
          ease: 'back.out(2.2)',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
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
            color: 'rgba(241, 235, 221, 0.4)',
            x: -12,
            opacity: 0.5,
          },
          {
            color: '#F1EBDD',
            x: 0,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: word,
              start: 'top 82%',
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

    // 4. Subtle Image Reveal Unclipping
    const revealImages = document.querySelectorAll<HTMLElement>('.reveal-image, figure.reveal img')
    revealImages.forEach((img) => {
      gsap.fromTo(
        img,
        { scale: 1.08, filter: 'contrast(1.1) brightness(0.85)' },
        {
          scale: 1,
          filter: 'contrast(1) brightness(1)',
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: img,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      )
    })
  })
}

// Auto-run on load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSubtleEffects)
  } else {
    initSubtleEffects()
  }
}
