export function scrollTimelineToCurrentTime(root = document) {
  const scroll = root.querySelector('.v6-timeline-scroll')
  const timeline = scroll?.querySelector('.v6-day24')
  if (!scroll || !timeline) return

  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  const y = (minutes / 1440) * timeline.scrollHeight
  const target = Math.max(0, y - scroll.clientHeight * 0.32)
  scroll.scrollTop = target

  let marker = timeline.querySelector('.v6-current-time')
  if (!marker) {
    marker = document.createElement('div')
    marker.className = 'v6-current-time'
    marker.innerHTML = '<span></span><i></i>'
    timeline.appendChild(marker)
  }
  marker.style.top = `${(minutes / 1440) * 100}%`
  const label = marker.querySelector('span')
  if (label) label.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
}

export function enableTimelineCurrentTime() {
  let lastTimeline = null
  const update = () => {
    const timeline = document.querySelector('.v6-timeline-scroll .v6-day24')
    if (!timeline) return
    if (timeline !== lastTimeline) {
      lastTimeline = timeline
      requestAnimationFrame(() => scrollTimelineToCurrentTime())
    } else {
      const now = new Date()
      const marker = timeline.querySelector('.v6-current-time')
      if (marker) {
        const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
        marker.style.top = `${(minutes / 1440) * 100}%`
        const label = marker.querySelector('span')
        if (label) label.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
      }
    }
  }
  const observer = new MutationObserver(update)
  observer.observe(document.body, { childList: true, subtree: true })
  update()
  setInterval(update, 30000)
}
