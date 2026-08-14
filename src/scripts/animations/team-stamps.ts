import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initTeamStampsAnimation() {
  const container = document.getElementById('team-members-container')
  if (!container) return () => {}

  const ctx = gsap.context(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isReduced) return

    const cards = gsap.utils.toArray<HTMLElement>('.team-member-card')

    cards.forEach((card) => {
      const stamp = card.querySelector<HTMLElement>('.team-stamp')
      const img = card.querySelector<HTMLElement>('img')

      // Card reveals smoothly with scroll position
      gsap.fromTo(
        card,
        {
          opacity: 0.2,
          y: 40,
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
            end: 'top 60%',
            scrub: 0.5,
          },
        }
      )

      if (img) {
        gsap.fromTo(
          img,
          { scale: 1.15 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              start: 'top 92%',
              end: 'top 55%',
              scrub: 0.5,
            },
          }
        )
      }

      // Stamp stamps down onto the card and lifts back up when scrolling in reverse
      if (stamp) {
        gsap.fromTo(
          stamp,
          {
            opacity: 0,
            scale: 2.4,
            rotation: -28,
            y: -20,
          },
          {
            opacity: 1,
            scale: 1,
            rotation: -3,
            y: 0,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: card,
              start: 'top 75%',
              end: 'top 45%',
              scrub: 0.4,
            },
          }
        )
      }
    })
  }, container)

  return () => ctx.revert()
}

// Auto init
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initTeamStampsAnimation())
  } else {
    initTeamStampsAnimation()
  }
}
