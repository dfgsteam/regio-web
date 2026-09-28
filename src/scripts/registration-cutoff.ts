// Static pages can remain open across the registration deadline or event start.
// Remove the link at the exact cutoff while the page is open, too.
function scheduleRegistrationCutoff(action: HTMLElement): void {
  if (action.dataset.cutoffScheduled) return
  action.dataset.cutoffScheduled = 'true'

  const closesAt = Date.parse(action.dataset.closesAt ?? '')
  if (Number.isNaN(closesAt)) return

  const close = () => {
    const remaining = closesAt - Date.now()
    if (remaining > 0) {
      window.setTimeout(close, Math.min(remaining, 2_147_483_647))
      return
    }
    action.querySelector('a')?.remove()
    action.querySelector('[data-registration-closed], [data-camp-registration-closed]')?.classList.remove('hidden')
  }

  close()
}

document.querySelectorAll<HTMLElement>('[data-registration-action], [data-camp-registration]')
  .forEach(scheduleRegistrationCutoff)
