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
            start: 'top 80%',
            end: 'bottom 80%',
            scrub: 0.4,
          },
        }
      )
    }

    articles.forEach((article) => {
      const marker = article.querySelector<HTMLElement>('.history-marker')
      const title = article.querySelector<HTMLElement>('.history-title')
      const text = article.querySelector<HTMLElement>('.history-text')

      if (marker) {
        gsap.fromTo(
          marker,
          {
            opacity: 0.3,
            scale: 0.7,
            rotation: -90,
            borderColor: 'rgba(241, 235, 221, 0.1)',
          },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            borderColor: '#FF5A1F',
            ease: 'power2.out',
            scrollTrigger: {
              trigger: article,
              start: 'top 88%',
              end: 'top 55%',
              scrub: 0.5,
            },
          }
        )
      }

      if (title) {
        gsap.fromTo(
          title,
          {
            opacity: 0.2,
            x: -30,
          },
          {
            opacity: 1,
            x: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: article,
              start: 'top 88%',
              end: 'top 55%',
              scrub: 0.5,
            },
          }
        )
      }

      if (text) {
        gsap.fromTo(
          text,
          {
            opacity: 0.2,
            y: 25,
          },
          {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: article,
              start: 'top 88%',
              end: 'top 55%',
              scrub: 0.5,
            },
          }
        )
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
