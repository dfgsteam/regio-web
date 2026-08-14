import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scopedContext } from './cleanup'

gsap.registerPlugin(ScrollTrigger)

;(() => {
  const section = document.getElementById('shadow-map-section')
  if (!section) return

  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    scopedContext(section, () => {
      const torchGrad = section.querySelector<SVGRadialGradientElement>('#torch-gradient')
      const torchGlow = section.querySelector<SVGCircleElement>('#torch-glow-circle')
      const torchCenter = section.querySelector<SVGCircleElement>('#torch-center-beam')
      const svg = section.querySelector<SVGSVGElement>('svg')

      if (!torchGrad || !svg) return

      // Trail coordinates of the 5 mystery waypoints
      const waypoints = [
        { name: '01 · Basislager Wiesenthal', x: 130, y: 310 },
        { name: '02 · Schattenforst', x: 320, y: 220 },
        { name: '03 · Glutschlucht', x: 520, y: 280 },
        { name: '04 · Hohe Wacht', x: 680, y: 130 },
        { name: '05 · Das Bundesfeuer', x: 800, y: 200 },
      ]

      const startWp = waypoints[0]
      if (!startWp) return

      // Scroll-driven torch beam along the trail
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 50%',
          end: 'bottom 50%',
          scrub: 0.6,
        },
      })

      // Animate torch position along path
      const proxy = { x: startWp.x, y: startWp.y }

      function updateTorch(x: number, y: number) {
        torchGrad?.setAttribute('cx', String(x))
        torchGrad?.setAttribute('cy', String(y))
        if (torchGlow) {
          torchGlow.setAttribute('cx', String(x))
          torchGlow.setAttribute('cy', String(y))
        }
        if (torchCenter) {
          torchCenter.setAttribute('cx', String(x))
          torchCenter.setAttribute('cy', String(y))
        }
      }

      waypoints.forEach((wp, i) => {
        if (i === 0) return
        scrollTl.to(proxy, {
          x: wp.x,
          y: wp.y,
          ease: 'power1.inOut',
          duration: 1,
          onUpdate: () => {
            updateTorch(proxy.x, proxy.y)
          },
        })
      })

      // Organic torchlight flicker
      gsap.to('#torch-gradient stop[offset="0%"]', {
        stopOpacity: 0.95,
        repeat: -1,
        yoyo: true,
        duration: 0.15,
        ease: 'rough({template: none.out, strength: 1, points: 20, taper: "none", randomize: true, clamp: false})',
      })

      // Interactive mouse torchlight exploration on hover
      let isHovering = false

      svg.addEventListener('pointerenter', () => {
        isHovering = true
      })

      svg.addEventListener('pointerleave', () => {
        isHovering = false
        // Return to scroll proxy position
        gsap.to(proxy, {
          duration: 0.5,
          onUpdate: () => updateTorch(proxy.x, proxy.y),
        })
      })

      svg.addEventListener('pointermove', (e: PointerEvent) => {
        if (!isHovering) return
        const rect = svg.getBoundingClientRect()
        // Convert screen pixel to SVG viewBox coordinate (0..920 x 0..440)
        const scaleX = 920 / rect.width
        const scaleY = 440 / rect.height
        const targetX = (e.clientX - rect.left) * scaleX
        const targetY = (e.clientY - rect.top) * scaleY

        gsap.to(proxy, {
          x: targetX,
          y: targetY,
          duration: 0.25,
          ease: 'power2.out',
          onUpdate: () => updateTorch(proxy.x, proxy.y),
        })
      })
    })
  })
})()
