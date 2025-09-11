import { createPinia } from 'pinia'
import routes from 'virtual:generated-pages'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'
import 'vue-renderer-markdown/index.css'
import 'vue-renderer-markdown/index.tailwind.css'

const i18n = createI18n({
  globalInjection: true,
  locale: 'zh-CN',
  messages: {
    'zh-CN': {
      common: {
        copy: '复制',
        copied: '已复制',
      },
    },
    'en': {
      common: {
        copy: 'Copy',
        copied: 'Copied',
      },
    },
  },
  legacy: false,
})
const app = createApp(App)
app.use(createPinia())
app.use(i18n)
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
app.use(router)
app.mount('#app')
