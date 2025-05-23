import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import routes from 'virtual:generated-pages'
import { createPinia } from 'pinia'
import App from './App.vue'

import '@unocss/reset/tailwind.css'
import './styles/main.css'
import 'uno.css'
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  globalInjection: true,
  locale: 'zh-CN',
  messages: {
  },
  legacy: false
});
const app = createApp(App)
app.use(createPinia())
app.use(i18n)
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
app.use(router)
app.mount('#app')
