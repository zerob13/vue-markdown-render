<script setup lang="ts">
import Render from 'vue-markdown-render-test'
</script>

<template>
  <main font-sans p="x-4 y-10" text="center gray-700 dark:gray-200">
    <router-view />
    <Render />
    <Footer />
  </main>
</template>
