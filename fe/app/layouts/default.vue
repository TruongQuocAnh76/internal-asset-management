<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { navigateTo } from '#app'
import { useAuth } from '#imports'

const route = useRoute()

const { user, signout } = useAuth()

const isAdmin = computed(() =>
  user.value?.user_roles?.some((ur: any) => ur.role?.name === 'Admin') ?? false
)

const handleLogout = async () => {
  await signout()
  navigateTo('/signin')
}

const sidebarCollapsed = ref(false)

const navItems = [
  {
    label: 'Dashboard',
    route: '/home',
    icon: 'dashboard',
  },
  {
    label: 'Assets',
    route: '/assets',
    icon: 'assets',
    adminOnly: true,
  },
  {
    label: 'Categories',
    route: '/categories',
    icon: 'categories',
  },
  {
    label: 'Kits',
    route: '/kits',
    icon: 'kits',
    adminOnly: true,
  },
  {
    label: 'Requests',
    route: '/requests',
    icon: 'requests',
  },
  {
    label: 'Purchases',
    route: '/purchase-requests',
    icon: 'purchases',
    adminOnly: true,
  },
  {
    label: 'Maintenance',
    route: '/assets/maintenance',
    icon: 'maintenance',
    adminOnly: true,
  },
  {
    label: 'Users',
    route: '/users',
    icon: 'users',
    adminOnly: true,
  },
  {
    label: 'Audit Logs',
    route: '/audit-logs',
    icon: 'audit',
    adminOnly: true,
  },
]

const isActive = (path: string) => {
  if (path === '/home') return route.path === '/home'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen bg-secondary-50 flex">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-secondary-200 transition-all duration-300',
        sidebarCollapsed ? 'w-[68px]' : 'w-60',
      ]"
    >
      <!-- Logo -->
      <div
        :class="[
          'flex items-center h-16 border-b border-secondary-100 shrink-0 overflow-hidden',
          sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4',
        ]"
      >
        <template v-if="!sidebarCollapsed">
          <div class="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span class="text-lg font-bold text-secondary-900 whitespace-nowrap flex-1">Asset Manager</span>
        </template>
        <button
          @click="sidebarCollapsed = !sidebarCollapsed"
          class="p-1.5 rounded-lg text-secondary-400 hover:bg-secondary-100 hover:text-secondary-700 transition-colors shrink-0"
          :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems.filter(i => !i.adminOnly || isAdmin)"
          :key="item.route"
          :to="item.route"
          :class="[
            'flex items-center rounded-lg text-sm font-medium transition-colors group',
            sidebarCollapsed ? 'justify-center px-2 py-2.5 gap-0' : 'gap-3 px-3 py-2.5',
            isActive(item.route)
              ? 'bg-primary-50 text-primary-700'
              : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900',
          ]"
          :title="sidebarCollapsed ? item.label : undefined"
        >
          <!-- Dashboard -->
          <svg v-if="item.icon === 'dashboard'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <!-- Assets -->
          <svg v-else-if="item.icon === 'assets'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <!-- Categories -->
          <svg v-else-if="item.icon === 'categories'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <!-- Kits -->
          <svg v-else-if="item.icon === 'kits'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <!-- Requests -->
          <svg v-else-if="item.icon === 'requests'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <!-- Purchases -->
          <svg v-else-if="item.icon === 'purchases'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <!-- Users -->
          <svg v-else-if="item.icon === 'users'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <!-- Audit -->
          <svg v-else-if="item.icon === 'audit'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <!-- Maintenance -->
          <svg v-else-if="item.icon === 'maintenance'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>

          <span v-if="!sidebarCollapsed" class="whitespace-nowrap">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Bottom section -->
      <div class="border-t border-secondary-100 p-3 shrink-0">
        <!-- User & Logout -->
        <div :class="['flex items-center px-3 py-2.5', sidebarCollapsed ? 'justify-center gap-0' : 'gap-3']">
          <div v-if="!sidebarCollapsed" class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div v-if="!sidebarCollapsed" class="flex-1 min-w-0">
            <p class="text-sm font-medium text-secondary-900 truncate">
              {{ user?.first_name || user?.username || 'User' }}
            </p>
          </div>
          <button
            @click="handleLogout"
            :title="sidebarCollapsed ? 'Logout' : undefined"
            class="p-1.5 rounded-lg text-secondary-400 hover:text-danger-600 hover:bg-danger-50 transition-colors shrink-0"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div
      :class="[
        'flex-1 transition-all duration-300',
        sidebarCollapsed ? 'ml-[68px]' : 'ml-60',
      ]"
    >
      <slot />
    </div>
  </div>
</template>
