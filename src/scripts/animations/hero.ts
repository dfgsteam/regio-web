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
          end: '+=180%',
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      })

      // Logo expansion & dynamic tilt
      tl.fromTo(
        '.hero-logo-img',
        { scale: 1, rotationZ: 0, y: 0 },
        { scale: 1.3, rotationZ: -4, y: -25, ease: 'power1.out', duration: 1 },
        0.1,
      )
      // Logo backlight aura pulse
      tl.fromTo(
        '.hero-logo-glow',
        { scale: 1, opacity: 0.25 },
        { scale: 2.2, opacity: 0.7, ease: 'power1.out', duration: 0.8 },
        0.1,
      )

      tl.fromTo('.hero-line-1', { xPercent: 0 }, { xPercent: -18, ease: 'power2.inOut', duration: 1 }, 0.2)
      tl.fromTo('.hero-line-2', { xPercent: 0 }, { xPercent: 18, ease: 'power2.inOut', duration: 1 }, 0.2)
      tl.to('.hero-bg', { filter: 'saturate(0.45) brightness(0.72)', ease: 'none', duration: 1 }, 0.35)
      tl.to('.hero-bg', { scale: 1.08, ease: 'none', duration: 1 }, 0.35)
      tl.to('.hero-topo', { opacity: 1, ease: 'none', duration: 1 }, 0.65)
      tl.to('.hero-content', { opacity: 0, y: -40, ease: 'power2.in', duration: 0.6 }, 0.85)
      tl.to('.hero-scrollhint', { opacity: 0, ease: 'none', duration: 0.3 }, 0.5)
    })
  })

  mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
    scopedContext(section, () => {
      gsap.fromTo(
        '.hero-bg',
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        },
      )

      gsap.fromTo(
        '.hero-logo-img',
        { scale: 1, y: 0 },
        {
          scale: 1.15,
          y: -15,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.6,
          },
        },
      )
    })
  })
})()
