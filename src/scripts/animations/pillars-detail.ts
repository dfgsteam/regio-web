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

      // Parallax watermark behind each pillar
      if (watermark) {
        gsap.to(watermark, {
          y: -40,
          ease: 'none',
          scrollTrigger: {
            trigger: article,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        })
      }

      // Staggered reveal of title & content
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: article,
          start: 'top 80%',
          once: true,
        },
      })

      if (number) {
        tl.fromTo(number, { opacity: 0, scale: 0.8, x: -20 }, { opacity: 1, scale: 1, x: 0, duration: 0.5, ease: 'back.out(1.7)' })
      }
      if (title) {
        tl.fromTo(title, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.3')
      }
      if (message) {
        tl.fromTo(message, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      }
      if (cards.length > 0) {
        tl.fromTo(cards, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out' }, '-=0.2')
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
