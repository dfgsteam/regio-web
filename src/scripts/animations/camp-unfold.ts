import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scopedContext } from './cleanup'

gsap.registerPlugin(ScrollTrigger)

;(() => {
  const section = document.getElementById('camp-teaser')
  if (!section) return

  const mm = gsap.matchMedia()

  // Desktop: Smooth 3D entrance and subtle tilt
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    scopedContext(section, () => {
      const artwork = section.querySelector('.camp-artwork-card')
      const infoBox = section.querySelector('.camp-info-col')

      if (!artwork && !infoBox) return

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 70%',
          end: 'top 20%',
          scrub: 0.8,
        },
      })

      if (artwork) {
        tl.fromTo(
          artwork,
          { rotateY: 8, rotateZ: -2, scale: 0.94, opacity: 0.8 },
          { rotateY: 0, rotateZ: 0, scale: 1, opacity: 1, ease: 'power2.out', duration: 1 },
          0
        )
      }

      if (infoBox) {
        tl.fromTo(
          infoBox,
          { x: -30, opacity: 0.6 },
          { x: 0, opacity: 1, ease: 'power2.out', duration: 0.9 },
          0.1
        )
      }
    })
  })

  // Mobile: Smooth 2D Scale and Spring Reveal
  mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
    scopedContext(section, () => {
      const artwork = section.querySelector('.camp-artwork-card')
      if (artwork) {
        gsap.fromTo(
          artwork,
          { scale: 0.92, y: 30, opacity: 0.7 },
          {
            scale: 1,
            y: 0,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: artwork,
              start: 'top 85%',
              end: 'top 45%',
              scrub: 0.6,
            },
          }
        )
      }
    })
  })
})()
