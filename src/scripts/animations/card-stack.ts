import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scopedContext } from './cleanup'

gsap.registerPlugin(ScrollTrigger)

;(() => {
  const section = document.getElementById('analog')
  if (!section) return

  const mm = gsap.matchMedia()

  // Desktop: Tactile Pinned 3D Card Stack Timeline
  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    scopedContext(section, () => {
      const cards = Array.from(section.querySelectorAll<HTMLElement>('.card-stack-item'))
      if (cards.length < 3) return
      const [c0, c1, c2] = cards
      if (!c0 || !c1 || !c2) return

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 20%',
          end: '+=130%',
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      })

      // Base rotations for tactile physical deck look
      const rotations = [-2.5, 2, -1.2]
      const offsets = [0, 8, 16]

      // Initial card is positioned
      gsap.set(c0, {
        rotateZ: rotations[0],
        y: offsets[0],
        scale: 0.95,
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      })

      // Card 2 slides in over Card 1
      tl.fromTo(
        c1,
        {
          yPercent: 120,
          rotateZ: 8,
          opacity: 0,
          scale: 0.92,
        },
        {
          yPercent: 0,
          y: offsets[1],
          rotateZ: rotations[1],
          opacity: 1,
          scale: 0.98,
          ease: 'power2.out',
          duration: 1,
        },
        0.2
      )

      // Card 3 slides in on top of Card 2
      tl.fromTo(
        c2,
        {
          yPercent: 130,
          rotateZ: -9,
          opacity: 0,
          scale: 0.95,
        },
        {
          yPercent: 0,
          y: offsets[2],
          rotateZ: rotations[2],
          opacity: 1,
          scale: 1.0,
          ease: 'power2.out',
          duration: 1,
        },
        0.8
      )
    })
  })

  // Mobile: Smooth stagger entrance
  mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
    scopedContext(section, () => {
      const cards = section.querySelectorAll<HTMLElement>('.card-stack-item')
      cards.forEach((card, index) => {
        gsap.fromTo(
          card,
          {
            y: 35,
            opacity: 0.5,
            rotateZ: index % 2 === 0 ? -1.5 : 1.5,
          },
          {
            y: 0,
            opacity: 1,
            rotateZ: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      })
    })
  })
})()
