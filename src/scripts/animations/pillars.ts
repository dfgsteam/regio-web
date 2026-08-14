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
      const items = gsap.utils.toArray<HTMLElement>('.pillar-item', desktop)
      const images = gsap.utils.toArray<HTMLElement>('.pillar-image', desktop)

      if (items.length === 0 || images.length === 0) return

      const firstItem = items[0]
      const firstImage = images[0]
      if (!firstItem || !firstImage) return

      // Explicitly initialize all items and images
      gsap.set(items, { opacity: 0, y: 40, pointerEvents: 'none' })
      gsap.set(images, { opacity: 0, scale: 1.06, pointerEvents: 'none' })
      gsap.set(firstItem, { opacity: 1, y: 0, pointerEvents: 'auto' })
      gsap.set(firstImage, { opacity: 1, scale: 1, pointerEvents: 'auto' })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: desktop,
          start: 'top top',
          end: () => `+=${(items.length - 1) * 130}%`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      // Hold pillar 01 initially before starting transition
      tl.to({}, { duration: 0.4 })

      for (let i = 0; i < items.length - 1; i++) {
        const currentItem = items[i]
        const nextItem = items[i + 1]
        const currentImage = images[i]
        const nextImage = images[i + 1]

        if (!currentItem || !nextItem || !currentImage || !nextImage) continue

        const label = `step_${i}`
        tl.addLabel(label)

        // Fade & move out previous pillar and image
        tl.to(
          currentItem,
          { opacity: 0, y: -40, ease: 'power2.in', duration: 0.5, pointerEvents: 'none' },
          label,
        )
        tl.to(
          currentImage,
          { opacity: 0, scale: 0.95, ease: 'power2.in', duration: 0.5, pointerEvents: 'none' },
          label,
        )

        // Fade & move in next pillar and image with slight overlap
        tl.fromTo(
          nextItem,
          { opacity: 0, y: 40, pointerEvents: 'none' },
          { opacity: 1, y: 0, ease: 'power2.out', duration: 0.5, pointerEvents: 'auto' },
          `${label}+=0.15`,
        )
        tl.fromTo(
          nextImage,
          { opacity: 0, scale: 1.06, pointerEvents: 'none' },
          { opacity: 1, scale: 1, ease: 'power2.out', duration: 0.5, pointerEvents: 'auto' },
          `${label}+=0.15`,
        )

        // Hold active state
        if (i < items.length - 2) {
          tl.to({}, { duration: 0.7 })
        } else {
          tl.to({}, { duration: 0.5 })
        }
      }

      gsap.fromTo(
        '.pillars-sticky',
        { scale: 0.97 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: desktop, start: 'top bottom', end: 'top top', scrub: 0.5 },
        },
      )
    })
  })

  mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
    if (!mobile) return
    scopedContext(mobile, () => {
      gsap.utils.toArray<HTMLElement>('.reveal', mobile).forEach((el) => {
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

