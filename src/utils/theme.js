const THEME_KEY = 'blog_theme'
const THEME_ORDER = ['default', 'dark']
const defalutTheme = "fa-solid fa-sun"
const darkTheme = "fa-solid fa-moon"
const themeIcons = [defalutTheme, darkTheme]

function applyTheme(name) {
  if (name && name !== 'default') {
    document.documentElement.setAttribute('data-theme', name)
    
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export function setTheme(name) {
  try {
    applyTheme(name)
    localStorage.setItem(THEME_KEY, name)
    try {
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: name } }))
    } catch (e) {
      // ignore if window not available
    }
  } catch (e) {
    // ignore
  }
}

export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || 'default'
  } catch (e) {
    return 'default'
  }
}

export function cycleTheme() {
  const cur = getTheme()
  const idx = THEME_ORDER.indexOf(cur)
  const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length]
  setTheme(next)
  return next
}

export function initTheme() {
  setTheme(getTheme())
}
