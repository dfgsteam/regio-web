import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initHistoryTrailAnimation() {
  const section = document.getElementById('history-chapters-section')
  if (!section) return () => {}

  const ctx = gsap.context(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isReduced) return

    const articles = gsap.utils.toArray<HTMLElement>('.history-chapter-article')
    const trailLine = section.querySelector<HTMLElement>('.history-trail-progress')

    if (trailLine) {
      gsap.fromTo(
        trailLine,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            end: 'bottom 85%',
            scrub: 0.5,
          },
        }
      )
    }

    articles.forEach((article) => {
      const marker = article.querySelector<HTMLElement>('.history-marker')
      const title = article.querySelector<HTMLElement>('.history-title')
      const text = article.querySelector<HTMLElement>('.history-text')

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: article,
          start: 'top 80%',
          once: true,
        },
      })

      if (marker) {
        tl.fromTo(marker, { opacity: 0, scale: 0.5, rotation: -45 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(1.8)' })
      }
      if (title) {
        tl.fromTo(title, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      }
      if (text) {
        tl.fromTo(text, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2')
      }
    })
  }, section)

  return () => ctx.revert()
}

// Auto init
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initHistoryTrailAnimation())
  } else {
    initHistoryTrailAnimation()
  }
}
