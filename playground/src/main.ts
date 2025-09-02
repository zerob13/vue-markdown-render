import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

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

// @ts-expect-error monaco global is not defined in this context
globalThis.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new JsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new CssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new HtmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker()
    }
    return new EditorWorker()
  },
}

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
    en: {
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
