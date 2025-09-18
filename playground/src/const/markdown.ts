export // 模拟流式传输
const streamContent = `I'll create a simple Electron + Vue chat application demo. Here's the structure:

::: warning
这是一个警告块。
:::

::: tip 提示标题
这是带标题的提示。
:::

::: admonition 自定义块
任意内容。
:::

\`\`\`html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>vitesse-template</title>
  </head>
  <body>
    <div id="app"></div>
    hello
  </body>
</html>
\`\`\`

مرحبا بكم في عالم اللغة العربية!
1. First, let's set up the project:

\`\`\`shellscript
# Create Vue project
npm create vue@latest electron-vue-chat

# Navigate to project
cd electron-vue-chat

# Install dependencies
npm install
npm install electron electron-builder vue-router

# Install dev dependencies
npm install -D electron-dev-server concurrently wait-on
\`\`\`

2. Create the main Electron file:

\`\`\`javascript:electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const url = isDev
    ? 'http://localhost:5173'
    : \`file://\${path.join(__dirname, '../dist/index.html')}\`;

  mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
\`\`\`

3. Update package.json:

\`\`\`json:package.json
{
  "name": "electron-vue-chat",
  "version": "0.1.0",
  "private": true,
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "electron:dev": "concurrently \\"npm run dev\\" \\"wait-on http://localhost:5173 && electron .\\"",
    "electron:build": "vite build && electron-builder"
  },
  "dependencies": {
    "vue": "^3.3.4",
    "vue-router": "^4.2.4",
    "electron": "^25.3.1",
    "electron-builder": "^24.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.3",
    "concurrently": "^8.2.0",
    "electron-dev-server": "^1.0.0",
    "vite": "^4.4.6",
    "wait-on": "^7.0.1"
  }
}
\`\`\`

4. Create chat components (diversified languages):

\`\`\`python:src/server/app.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Message(BaseModel):
    sender: str
    text: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/echo")
def echo(msg: Message):
    return {"reply": f"Echo: {msg.text}"}
\`\`\`

\`\`\`tsx:src/components/ChatWindow.tsx
import React, { useEffect, useRef, useState } from 'react';

type Message = { sender: 'me' | 'other'; text: string; time: string };

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'other', text: 'Hi there!', time: '10:00' },
  ]);
  const [input, setInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0');
    setMessages((m) => [...m, { sender: 'me', text, time }]);
    setInput('');
    setTimeout(() => {
      setMessages((m) => [...m, { sender: 'other', text: 'Auto-reply', time }]);
    }, 800);
  };

  return (
    <div className="chat-window">
      <div className="messages" ref={containerRef}>
        {messages.map((m, i) => (
          <div key={i} className={'msg ' + m.sender}>
            {m.text}
            <span className="time">{m.time}</span>
          </div>
        ))}
      </div>
      <div className="input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key==='Enter' && send()}
          placeholder="Type..."
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
\`\`\`

5. Create a native module example (C++):

\`\`\`cpp:src/native/compute.cpp
#include <bits/stdc++.h>
using namespace std;

int fibonacci(int n){
  if(n<=1) return n;
  int a=0,b=1;
  for(int i=2;i<=n;++i){ int c=a+b; a=b; b=c; }
  return b;
}

int main(){
  ios::sync_with_stdio(false);
  cin.tie(nullptr);
  cout << "fib(10)=" << fibonacci(10) << "\n";
  return 0;
}
\`\`\`

6. Update the main App.vue:

\`\`\`vue:src/App.vue
<template>
  <router-view />
<\/template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
}
</style>
\`\`\`

7. Set up the router:

\`\`\`javascript:src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import ChatView from '../views/ChatView.vue';

const routes = [
  {
    path: '/',
    name: 'chat',
    component: ChatView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
\`\`\`

8. Update main.js:

\`\`\`javascript:src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

createApp(App).use(router).mount('#app');
\`\`\`

To run the application:

\`\`\`bash
npm run electron:dev
\`\`\`

This creates a simple chat application with a contacts sidebar and a chat window. Users can select contacts and send messages, with auto-replies simulated.


9. 付费转化率计算验证:
1. **公式**
   \[
   \text{付费转化率} = \\left( \\frac{\text{付费用户数}}{\text{月活用户数}} \\right) \times 100\%
   \]

2. **代入数据**
   \[
   \\frac{363}{15,\!135} \times 100\% = 2.398\%
   \]

3. **计算工具验证**
   通过数学计算工具确认结果：
   \`363 ÷ 15,135 × 100 = 2.39841427...\`

4. **差异说明**
   $$E=mc^2$$

10. Mermaid graphic:

\`\`\`mermaid
graph TD
    Kira_Yamato[基拉·大和]
    Lacus_Clyne[拉克丝·克莱因]
    Athrun_Zala[阿斯兰·萨拉]
    Cagalli_Yula_Athha[卡嘉莉·尤拉·阿斯哈]
    Shinn_Asuka[真·飞鸟]
    Lunamaria_Hawke[露娜玛丽亚·霍克]
    COMPASS[世界和平监视组织COMPASS]
    Foundation[芬德申王国]
    Orphee_Lam_Tao[奥尔菲·拉姆·陶]
    %% 节点定义结束，开始定义边
    Kira_Yamato ---|恋人| Lacus_Clyne
    Kira_Yamato ---|挚友| Athrun_Zala
    Kira_Yamato -->|隶属| COMPASS
    Kira_Yamato -->|前辈| Shinn_Asuka
    Lacus_Clyne -->|初代总裁| COMPASS
    Athrun_Zala ---|恋人| Cagalli_Yula_Athha
    Athrun_Zala -.->|协力| COMPASS
    Shinn_Asuka ---|恋人| Lunamaria_Hawke
    Shinn_Asuka -->|隶属| COMPASS
    Lunamaria_Hawke -->|隶属| COMPASS
    COMPASS -->|对立| Foundation
    Orphee_Lam_Tao -->|隶属| Foundation
    Orphee_Lam_Tao -.->|追求| Lacus_Clyne
\`\`\`

`
