import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scopedContext } from './cleanup'

gsap.registerPlugin(ScrollTrigger)

;(() => {
  const section = document.getElementById('camp-teaser')
  if (!section) return

  const mm = gsap.matchMedia()

  // Desktop: Pinned 3D Paper/Poster Unfold
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    scopedContext(section, () => {
      const unfoldWrap = section.querySelector('.unfold-wrapper')
      const panelTop = section.querySelector('.fold-panel-top')
      const panelMiddle = section.querySelector('.fold-panel-middle')
      const panelBottom = section.querySelector('.fold-panel-bottom')
      const creaseShadows = section.querySelectorAll('.crease-shadow')
      const infoBox = section.querySelector('.camp-info-col')

      if (!unfoldWrap || !panelTop || !panelMiddle || !panelBottom) return

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 60%',
          end: 'top 10%',
          scrub: 0.8,
        },
      })

      // Unfold top and bottom panels with 3D rotation and perspective
      tl.fromTo(
        unfoldWrap,
        { rotateZ: -3, scale: 0.9, filter: 'drop-shadow(0 25px 25px rgba(0,0,0,0.6))' },
        { rotateZ: 0, scale: 1, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))', ease: 'power2.out', duration: 1 },
        0
      )

      tl.fromTo(
        panelTop,
        { rotateX: -65, transformOrigin: 'bottom center', opacity: 0.85 },
        { rotateX: 0, opacity: 1, ease: 'power2.inOut', duration: 1 },
        0
      )

      tl.fromTo(
        panelBottom,
        { rotateX: 65, transformOrigin: 'top center', opacity: 0.85 },
        { rotateX: 0, opacity: 1, ease: 'power2.inOut', duration: 1 },
        0
      )

      tl.to(
        creaseShadows,
        { opacity: 0, ease: 'power2.inOut', duration: 0.8 },
        0.2
      )

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
      const poster = section.querySelector('.unfold-wrapper')
      if (poster) {
        gsap.fromTo(
          poster,
          { scale: 0.92, y: 40, opacity: 0.6 },
          {
            scale: 1,
            y: 0,
            opacity: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: poster,
              start: 'top 85%',
              end: 'top 40%',
              scrub: 0.6,
            },
          }
        )
      }
    })
  })
})()
