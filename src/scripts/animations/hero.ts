import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scopedContext } from './cleanup'

gsap.registerPlugin(ScrollTrigger)

;(() => {
  const section = document.getElementById('hero')
  if (!section) return

  const mm = gsap.matchMedia()

  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    scopedContext(section, () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=140%',
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      })

      // Smooth coordinated motion without jitter
      tl.to('.hero-logo-img', { scale: 1.18, y: -20, ease: 'power1.out', duration: 1 }, 0)
      tl.to('.hero-logo-glow', { scale: 1.8, opacity: 0.6, ease: 'power1.out', duration: 0.8 }, 0)
      tl.fromTo('.hero-line-1', { xPercent: 0 }, { xPercent: -15, ease: 'power2.inOut', duration: 1 }, 0.15)
      tl.fromTo('.hero-line-2', { xPercent: 0 }, { xPercent: 15, ease: 'power2.inOut', duration: 1 }, 0.15)
      tl.to('.hero-bg', { filter: 'saturate(0.45) brightness(0.72)', scale: 1.08, ease: 'none', duration: 1 }, 0.2)
      tl.to('.hero-topo', { opacity: 1, ease: 'none', duration: 1 }, 0.5)
      tl.to('.hero-content', { opacity: 0, y: -30, ease: 'power2.in', duration: 0.5 }, 0.8)
      tl.to('.hero-scrollhint', { opacity: 0, ease: 'none', duration: 0.3 }, 0.3)
    })
  })

  mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
    scopedContext(section, () => {
      gsap.to('.hero-bg', {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
        },
      })
    })
  })
})()
