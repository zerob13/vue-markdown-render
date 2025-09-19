import katexMainBoldUrl from 'katex/dist/fonts/KaTeX_Main-Bold.woff2?url'
// Preload KaTeX fonts used by the library to avoid slow network fallback while developing
import katexMainRegularUrl from 'katex/dist/fonts/KaTeX_Main-Regular.woff2?url'
import katexMathItalicUrl from 'katex/dist/fonts/KaTeX_Math-Italic.woff2?url'
import { createPinia } from 'pinia'
import routes from 'virtual:generated-pages'
import { createApp } from 'vue'
// import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
// import { VueRendererMarkdown } from '../../src/exports'
import App from './App.vue'
// import JsLocalIcon from './assets/javascript.svg?raw'
import '@unocss/reset/tailwind.css'
import './styles/main.css'

const app = createApp(App)
app.use(createPinia())

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
app.use(router)

// Demo: override icons via plugin options (preferred)
// const SHELL_ICON_URL = 'https://raw.githubusercontent.com/catppuccin/vscode-icons/refs/heads/main/icons/mocha/bash.svg'
// app.use(VueRendererMarkdown, {
//   getLanguageIcon(lang: string) {
//     const l = (lang || '').toLowerCase()
//     if (l === 'shellscript' || l === 'sh' || l === 'bash')
//       return `<img src="${SHELL_ICON_URL}" alt="${l}" />`
//     if (l === 'javascript' || l === 'js')
//       return JsLocalIcon
//     return undefined
//   },
// })

app.mount('#app')

function preloadFont(href: string, type = 'font/woff2') {
  try {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = type
    link.crossOrigin = 'anonymous'
    link.href = href
    document.head.appendChild(link)
  }
  catch (e) {
    console.warn('[preloadFont] failed to inject preload', e)
  }
}

preloadFont(katexMainRegularUrl)
preloadFont(katexMainBoldUrl)
preloadFont(katexMathItalicUrl)
