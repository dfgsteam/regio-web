import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initPackingListAnimation() {
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (isReduced) return () => {}

  const ctx = gsap.context(() => {
    // 1. Highlights scrub assembly / disassembly
    const highlightsContainer = document.getElementById('highlights-container')
    if (highlightsContainer) {
      const cards = highlightsContainer.querySelectorAll<HTMLElement>('.highlight-card')
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          {
            opacity: 0.2,
            y: 35,
            scale: 0.96,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 92%',
              end: 'top 65%',
              scrub: 0.5,
            },
          }
        )
      })
    }

    // 2. Packing list checkmark scrub assembly / disassembly
    const packingContainer = document.getElementById('packing-list-container')
    if (packingContainer) {
      const items = packingContainer.querySelectorAll<HTMLElement>('.packing-item')
      items.forEach((item) => {
        const checkIcon = item.querySelector<HTMLElement>('svg')
        gsap.fromTo(
          item,
          {
            opacity: 0.2,
            x: -20,
          },
          {
            opacity: 1,
            x: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 92%',
              end: 'top 70%',
              scrub: 0.4,
            },
          }
        )

        if (checkIcon) {
          gsap.fromTo(
            checkIcon,
            { scale: 0.4, opacity: 0.2 },
            {
              scale: 1,
              opacity: 1,
              ease: 'back.out(2)',
              scrollTrigger: {
                trigger: item,
                start: 'top 90%',
                end: 'top 65%',
                scrub: 0.4,
              },
            }
          )
        }
      })
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
