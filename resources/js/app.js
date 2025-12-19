// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/assets/sw.js', { scope: '/' })
  })
}

document.addEventListener('DOMContentLoaded', () => {
  const pronounceBtn = document.getElementById('pronounce-btn')

  if (!pronounceBtn) return

  if (!('speechSynthesis' in window)) {
    pronounceBtn.remove()
    return
  }

  pronounceBtn.addEventListener('click', () => {
    try {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
        return
      }

      const word = pronounceBtn.dataset.word
      if (!word) return

      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = 'en-GB'
      utterance.rate = 0.8

      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Error playing pronunciation:', error)
    }
  })
})
