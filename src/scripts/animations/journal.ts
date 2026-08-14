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
          { y: 80, opacity: 0, scale: 0.97 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              onEnter: () => {
                if (prev) prev.style.transform = 'translateY(-16px) scale(0.985)'
              },
            },
          },
        )
      })
    })
  })
})()
