// Header compact state: transparent over the hero, solid once scrolled.
// Plain class toggling via rAF — no GSAP needed for a scroll class.

const header = document.querySelector<HTMLElement>('#site-header')

const apply = () => {
  const scrolled = window.scrollY > 24
  document.documentElement.classList.toggle('is-at-top', !scrolled)
  header?.classList.toggle('is-compact', scrolled)
}

let ticking = false
window.addEventListener(
  'scroll',
  () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      apply()
      ticking = false
    })
  },
  { passive: true },
)

apply()
