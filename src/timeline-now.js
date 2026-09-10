function updateMarker(timeline) {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60

  let marker = timeline.querySelector('.v6-current-time')
  if (!marker) {
    marker = document.createElement('div')
    marker.className = 'v6-current-time'
    marker.innerHTML = '<span></span><i></i>'
    timeline.appendChild(marker)
  }

  marker.style.top = `${(minutes / 1440) * 100}%`
  const label = marker.querySelector('span')
  const text = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  if (label && label.textContent !== text) label.textContent = text
}

export function scrollTimelineToCurrentTime(root = document) {
  const scroll = root.querySelector('.v6-timeline-scroll')
  const timeline = scroll?.querySelector('.v6-day24')
  if (!scroll || !timeline) return false

  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  const y = (minutes / 1440) * timeline.scrollHeight
  scroll.scrollTop = Math.max(0, y - scroll.clientHeight * 0.32)
  updateMarker(timeline)
  return true
}

export function enableTimelineCurrentTime() {
  let lastTimeline = null

  const update = () => {
    const scroll = document.querySelector('.v6-timeline-scroll')
    const timeline = scroll?.querySelector('.v6-day24')
    if (!timeline) {
      lastTimeline = null
      return
    }

    if (timeline !== lastTimeline) {
      lastTimeline = timeline
      requestAnimationFrame(() => scrollTimelineToCurrentTime())
      return
    }

    updateMarker(timeline)
  }

  // Não observar o DOM inteiro: isso pode gerar um loop de mutações durante a troca de telas.
  update()
  const timer = window.setInterval(update, 15000)
  return () => window.clearInterval(timer)
}
