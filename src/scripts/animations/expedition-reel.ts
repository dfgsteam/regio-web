import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scopedContext } from './cleanup'

gsap.registerPlugin(ScrollTrigger)

;(() => {
  const section = document.getElementById('expedition-reel')
  const track = section?.querySelector<HTMLElement>('.reel-track')
  if (!section || !track) return

  const mm = gsap.matchMedia()

  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    scopedContext(section, () => {
      const viewport = section.querySelector<HTMLElement>('.reel-viewport')
      const progress = section.querySelector<HTMLElement>('.reel-progress > div')
      if (!viewport) return

      const travel = () => track.scrollWidth - viewport.clientWidth

      const tween = gsap.to(track, {
        x: () => -travel(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${travel()}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      if (progress) {
        gsap.fromTo(
          progress,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: () => `+=${travel()}`,
              scrub: 1,
            },
          },
        )
      }

      gsap.fromTo(
        '.reel-frame',
        { y: 90, opacity: 0.4 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: {
            trigger: track,
            start: 'top 90%',
            end: 'top 40%',
            scrub: 0.8,
          },
        },
      )

      return () => tween.kill()
    })
  })
})()
