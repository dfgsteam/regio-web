import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function cleanupScrollTriggers(section?: Element | null): void {
  ScrollTrigger.getAll().forEach((trigger) => {
    const el = trigger.trigger
    if (!section) {
      trigger.kill()
      return
    }
    if (el && (el === section || section.contains(el))) trigger.kill()
  })
}

// Standard context wrapper: scopes all GSAP calls to the section,
// respects reduced motion via matchMedia and cleans up on revert.
export function scopedContext(section: Element, setup: () => void | (() => void)): () => void {
  const ctx = gsap.context(() => {
    const teardown = setup()
    return () => {
      teardown?.()
      cleanupScrollTriggers(section)
    }
  }, section)
  return () => ctx.revert()
}
