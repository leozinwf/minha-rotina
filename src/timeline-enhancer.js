const STEP_MINUTES = 5
const TOTAL_MINUTES = 24 * 60

function formatMinute(total) {
  const hour = Math.floor(total / 60) % 24
  const minute = total % 60
  return `${String(hour).padStart(2, '0')}h${String(minute).padStart(2, '0')}`
}

function enhanceTimeline(timeline) {
  if (!timeline || timeline.dataset.fiveMinuteScale === 'true') return
  timeline.dataset.fiveMinuteScale = 'true'

  const scale = document.createElement('div')
  scale.className = 'v5-five-minute-scale'
  scale.setAttribute('aria-hidden', 'true')

  for (let minute = 0; minute <= TOTAL_MINUTES; minute += STEP_MINUTES) {
    const mark = document.createElement('div')
    mark.className = 'v5-five-minute-mark'
    mark.style.top = `${(minute / TOTAL_MINUTES) * 100}%`

    const label = document.createElement('span')
    label.textContent = formatMinute(minute === TOTAL_MINUTES ? 0 : minute)

    const line = document.createElement('i')
    if (minute % 60 === 0) mark.classList.add('hour')
    else if (minute % 15 === 0) mark.classList.add('quarter')

    mark.append(label, line)
    scale.appendChild(mark)
  }

  timeline.prepend(scale)
}

function scan() {
  document.querySelectorAll('.v5-day24').forEach(enhanceTimeline)
}

const observer = new MutationObserver(scan)

function start() {
  scan()
  observer.observe(document.body, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
  start()
}
