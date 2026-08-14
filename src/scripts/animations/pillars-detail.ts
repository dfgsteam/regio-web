import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initPillarsDetailAnimation() {
  const container = document.getElementById('pillars-detail-container')
  if (!container) return () => {}

  const ctx = gsap.context(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isReduced) return

    const articles = gsap.utils.toArray<HTMLElement>('.pillar-detail-article')

    articles.forEach((article) => {
      const number = article.querySelector<HTMLElement>('.pillar-number')
      const title = article.querySelector<HTMLElement>('.pillar-title')
      const message = article.querySelector<HTMLElement>('.pillar-message')
      const cards = article.querySelectorAll<HTMLElement>('.pillar-card')
      const watermark = article.querySelector<HTMLElement>('.pillar-watermark')

      // Parallax watermark scrub
      if (watermark) {
        gsap.fromTo(
          watermark,
          { y: 50, opacity: 0.01 },
          {
            y: -50,
            opacity: 0.05,
            ease: 'none',
            scrollTrigger: {
              trigger: article,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.8,
            },
          }
        )
      }

      // Scrub number & title smoothly with scroll
      if (number) {
        gsap.fromTo(
          number,
          { opacity: 0.2, scale: 0.6, x: -30 },
          {
            opacity: 1,
            scale: 1,
            x: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: article,
              start: 'top 90%',
              end: 'top 60%',
              scrub: 0.5,
            },
          }
        )
      }

      if (title) {
        gsap.fromTo(
          title,
          { opacity: 0.2, y: 30 },
          {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: article,
              start: 'top 88%',
              end: 'top 58%',
              scrub: 0.5,
            },
          }
        )
      }

      if (message) {
        gsap.fromTo(
          message,
          { opacity: 0.2, y: 25 },
          {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: article,
              start: 'top 86%',
              end: 'top 56%',
              scrub: 0.5,
            },
          }
        )
      }

      if (cards.length > 0) {
        cards.forEach((card, idx) => {
          gsap.fromTo(
            card,
            {
              opacity: 0.15,
              y: 40 + idx * 10,
              scale: 0.96,
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: article,
                start: 'top 82%',
                end: 'top 50%',
                scrub: 0.6,
              },
            }
          )
        })
      }
    })
  }, container)

  return () => ctx.revert()
}

// Auto init
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initPillarsDetailAnimation())
  } else {
    initPillarsDetailAnimation()
  }
}
