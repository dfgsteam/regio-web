import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scopedContext } from './cleanup'

gsap.registerPlugin(ScrollTrigger)

;(() => {
  const desktop = document.getElementById('pillars-desktop')
  const mobile = document.getElementById('pillars')

  const mm = gsap.matchMedia()

  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    if (!desktop) return
    scopedContext(desktop, () => {
      const items = gsap.utils.toArray<HTMLElement>('.pillar-item')
      const images = gsap.utils.toArray<HTMLElement>('.pillar-image')

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: desktop,
          start: 'top top',
          end: '+=500%',
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      })

      items.forEach((item, index) => {
        if (index === 0) return
        tl.fromTo(item, { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: 'power2.inOut', duration: 0.5 })
        if (index < items.length - 1) {
          tl.to({}, { duration: 0.5 })
          tl.to(item, { opacity: 0, y: -60, ease: 'power2.in', duration: 0.5 })
        }
      })

      images.forEach((image, index) => {
        if (index === 0) return
        tl.fromTo(
          image,
          { opacity: 0, scale: 1.15 },
          { opacity: 1, scale: 1, ease: 'power2.inOut', duration: 0.5 },
        )
        if (index < images.length - 1) {
          tl.to(image, { opacity: 0, ease: 'power2.in', duration: 0.5 })
        }
      })

      gsap.fromTo(
        '.pillars-sticky',
        { scale: 0.96 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: desktop, start: 'top bottom', end: 'top top', scrub: 0.5 },
        },
      )
    })
  })

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    if (!mobile) return
    scopedContext(mobile, () => {
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          },
        )
      })
    })
  })
})()
