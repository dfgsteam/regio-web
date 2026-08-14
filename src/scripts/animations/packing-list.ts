import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initPackingListAnimation() {
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (isReduced) return () => {}

  const ctx = gsap.context(() => {
    // 1. Packing list checkmark stagger pop
    const packingContainer = document.getElementById('packing-list-container')
    if (packingContainer) {
      const items = packingContainer.querySelectorAll<HTMLElement>('.packing-item')
      if (items.length > 0) {
        gsap.fromTo(
          items,
          { opacity: 0, x: -15, scale: 0.95 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.45,
            stagger: 0.08,
            ease: 'back.out(1.5)',
            scrollTrigger: {
              trigger: packingContainer,
              start: 'top 85%',
              once: true,
            },
          }
        )
      }
    }

    // 2. Highlights stagger reveal
    const highlightsContainer = document.getElementById('highlights-container')
    if (highlightsContainer) {
      const cards = highlightsContainer.querySelectorAll<HTMLElement>('.highlight-card')
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: highlightsContainer,
              start: 'top 85%',
              once: true,
            },
          }
        )
      }
    }
  })

  return () => ctx.revert()
}

// Auto init
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initPackingListAnimation())
  } else {
    initPackingListAnimation()
  }
}
