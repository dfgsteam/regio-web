import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scopedContext } from './cleanup'

gsap.registerPlugin(ScrollTrigger)

;(() => {
  const section = document.getElementById('journal')
  if (!section) return

  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    scopedContext(section, () => {
      const cards = gsap.utils.toArray<HTMLElement>('.journal-card')
      cards.forEach((card, index) => {
        if (index === 0) return
        const prev = cards[index - 1]

        gsap.fromTo(
          card,
          { y: 70, opacity: 0.25, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 92%',
              end: 'top 55%',
              scrub: 0.6,
            },
          },
        )

        if (prev) {
          gsap.to(prev, {
            y: -18,
            scale: 0.98,
            opacity: 0.8,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              end: 'top 50%',
              scrub: 0.6,
            },
          })
        }
      })
    })
  })
})()
