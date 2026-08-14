import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initTimelineAnimation() {
  const section = document.getElementById('upcoming-events-section')
  if (!section) return () => {}

  const ctx = gsap.context(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isReduced) return

    const cards = gsap.utils.toArray<HTMLElement>('.timeline-event-card')
    const track = section.querySelector<HTMLElement>('.timeline-progress-line')

    // Scroll progress track line filling down and retracting on scroll up
    if (track) {
      gsap.fromTo(
        track,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'bottom 80%',
            scrub: 0.4,
          },
        }
      )
    }

    // Scrub each card dynamically linked to scroll position (build up on scroll down, dismantle on scroll up)
    cards.forEach((card) => {
      gsap.fromTo(
        card,
        {
          opacity: 0.15,
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
            start: 'top 90%',
            end: 'top 55%',
            scrub: 0.6,
          },
        }
      )
    })
  }, section)

  return () => ctx.revert()
}

// Auto init on DOM load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initTimelineAnimation())
  } else {
    initTimelineAnimation()
  }
}
