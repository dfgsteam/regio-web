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

    // Staggered reveal of event cards with subtle tilt and glow
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 40,
          scale: 0.98,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            once: true,
          },
        }
      )
    }

    // Scroll progress track line filling down
    if (track) {
      gsap.fromTo(
        track,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            end: 'bottom 85%',
            scrub: 0.5,
          },
        }
      )
    }
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
