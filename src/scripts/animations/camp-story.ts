import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scopedContext } from './cleanup'

gsap.registerPlugin(ScrollTrigger)

;(() => {
  const desktop = document.getElementById('shadow-story-desktop')
  const mobile = document.getElementById('shadow-story-mobile')

  const mm = gsap.matchMedia()

  mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
    if (!desktop) return
    scopedContext(desktop, () => {
      const chapters = gsap.utils.toArray<HTMLElement>('.story-chapter', desktop)
      const visualFrames = gsap.utils.toArray<HTMLElement>('.story-visual', desktop)
      const progressBar = desktop.querySelector<HTMLElement>('.story-progress-bar')

      if (chapters.length === 0 || visualFrames.length === 0) return

      const firstChapter = chapters[0]
      const firstVisual = visualFrames[0]
      if (!firstChapter || !firstVisual) return

      // Explicit initial states
      gsap.set(chapters, { opacity: 0, y: 40, pointerEvents: 'none' })
      gsap.set(visualFrames, { opacity: 0, scale: 1.08, pointerEvents: 'none' })
      gsap.set(firstChapter, { opacity: 1, y: 0, pointerEvents: 'auto' })
      gsap.set(firstVisual, { opacity: 1, scale: 1, pointerEvents: 'auto' })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: desktop,
          start: 'top top',
          end: () => `+=${(chapters.length - 1) * 140}%`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      // Hold Chapter 01 initially
      tl.to({}, { duration: 0.4 })

      for (let i = 0; i < chapters.length - 1; i++) {
        const currentChapter = chapters[i]
        const nextChapter = chapters[i + 1]
        const currentVisual = visualFrames[i]
        const nextVisual = visualFrames[i + 1]

        if (!currentChapter || !nextChapter || !currentVisual || !nextVisual) continue

        const label = `chapter_${i}`
        tl.addLabel(label)

        // Fade & slide out current
        tl.to(
          currentChapter,
          { opacity: 0, y: -40, ease: 'power2.in', duration: 0.5, pointerEvents: 'none' },
          label,
        )
        tl.to(
          currentVisual,
          { opacity: 0, scale: 0.95, ease: 'power2.in', duration: 0.5, pointerEvents: 'none' },
          label,
        )

        // Fade & slide in next
        tl.fromTo(
          nextChapter,
          { opacity: 0, y: 40, pointerEvents: 'none' },
          { opacity: 1, y: 0, ease: 'power2.out', duration: 0.5, pointerEvents: 'auto' },
          `${label}+=0.15`,
        )
        tl.fromTo(
          nextVisual,
          { opacity: 0, scale: 1.08, pointerEvents: 'none' },
          { opacity: 1, scale: 1, ease: 'power2.out', duration: 0.5, pointerEvents: 'auto' },
          `${label}+=0.15`,
        )

        // Update progress bar
        if (progressBar) {
          const progressVal = (i + 1) / (chapters.length - 1)
          tl.to(progressBar, { scaleY: progressVal, ease: 'none', duration: 0.5 }, label)
        }

        // Hold active chapter
        if (i < chapters.length - 2) {
          tl.to({}, { duration: 0.7 })
        } else {
          tl.to({}, { duration: 0.5 })
        }
      }
    })
  })

  mm.add('(max-width: 1023px) and (prefers-reduced-motion: no-preference)', () => {
    if (!mobile) return
    scopedContext(mobile, () => {
      gsap.utils.toArray<HTMLElement>('.story-mobile-card', mobile).forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            ease: 'power2.out',
            scrollTrigger: { trigger: card, start: 'top 85%' },
          },
        )
      })
    })
  })
})()
