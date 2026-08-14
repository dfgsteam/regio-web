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

    cards.forEach((card, index) => {
      const stamp = card.querySelector<HTMLElement>('.team-stamp')
      const img = card.querySelector<HTMLElement>('img')

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          once: true,
        },
      })

      tl.fromTo(
        card,
        { opacity: 0, y: 35 },
        { opacity: 1, y: 0, duration: 0.6, delay: (index % 2) * 0.12, ease: 'power2.out' }
      )

      if (img) {
        tl.fromTo(img, { scale: 1.1 }, { scale: 1, duration: 0.7, ease: 'power2.out' }, '-=0.4')
      }

      if (stamp) {
        tl.fromTo(
          stamp,
          { opacity: 0, scale: 1.5, rotation: -15 },
          { opacity: 1, scale: 1, rotation: -3, duration: 0.45, ease: 'back.out(2)' },
          '-=0.2'
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
