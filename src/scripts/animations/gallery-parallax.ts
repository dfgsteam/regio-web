import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initGalleryParallax() {
  const container = document.getElementById('gallery-grid-container')
  if (!container) return () => {}

  const ctx = gsap.context(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isReduced) return

    const cards = gsap.utils.toArray<HTMLElement>('.gallery-card')

    cards.forEach((card, index) => {
      // 1. Dynamic scrub entry & dismantle on scroll
      gsap.fromTo(
        card,
        {
          opacity: 0.2,
          y: 45,
          scale: 0.95,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 92%',
            end: 'top 60%',
            scrub: 0.6,
          },
        }
      )

      // 2. Smooth subtle multi-speed parallax on cards
      const speed = index % 3 === 0 ? -25 : index % 3 === 1 ? 30 : -15
      gsap.to(card, {
        y: speed,
        ease: 'none',
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      })
    })
  }, container)

  return () => ctx.revert()
}

// Auto init
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initGalleryParallax())
  } else {
    initGalleryParallax()
  }
}
