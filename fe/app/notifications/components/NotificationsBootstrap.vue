<script setup lang="ts">
const { initRealtime } = useNotifications()

onMounted(() => {
  initRealtime()
})
</script>

<template>
  <NotificationToastStack />
</template>
