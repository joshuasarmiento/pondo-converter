<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const isRouteLoading = ref(false);

const router = useRouter();
router.beforeEach(() => { isRouteLoading.value = true; });
router.afterEach(() => { setTimeout(() => { isRouteLoading.value = false; }, 150); });
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
    <!-- Navbar / Civic Header -->
    <header class="bg-blue-900 border-b border-blue-800 text-white py-6 px-8 shadow-sm">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div class="flex items-center gap-3">
            <span class="bg-blue-800 text-blue-100 text-xs font-bold px-3 py-1 rounded-md tracking-wider uppercase">
              Civic Tech PH
            </span>
            <span class="text-slate-300 text-sm">v1.3</span>
          </div>
          <h1 class="text-3xl font-bold mt-1 tracking-tight">Pondo Converter</h1>
          <p class="text-blue-100/80 text-sm mt-1 max-w-xl">
            See what government contracts could have funded — in rice, classrooms, wages, and more.
          </p>
        </div>

        <!-- Navigation Links -->
        <nav
          class="flex items-center gap-2 bg-blue-950/60 p-1.5 rounded-lg border border-blue-800 self-start md:self-auto font-sans">
          <router-link to="/"
            class="px-4 py-2 rounded-md text-sm font-semibold transition text-slate-300 hover:text-white"
            active-class="bg-blue-900 text-white shadow-sm">
            Converter
          </router-link>
          <router-link to="/analytics"
            class="px-4 py-2 rounded-md text-sm font-semibold transition text-slate-300 hover:text-white"
            active-class="bg-blue-900 text-white shadow-sm">
            Civic Analytics
          </router-link>
          <router-link to="/prices"
            class="px-4 py-2 rounded-md text-sm font-semibold transition text-slate-300 hover:text-white"
            active-class="bg-blue-900 text-white shadow-sm">
            Commodity Prices
          </router-link>
          <router-link to="/about"
            class="px-4 py-2 rounded-md text-sm font-semibold transition text-slate-300 hover:text-white"
            active-class="bg-blue-900 text-white shadow-sm">
            About the Tool
          </router-link>
        </nav>
      </div>
    </header>

    <!-- Route View with Skeleton Transition -->
    <main class="flex-1">
      <!-- Skeleton Loader (shown on route change) -->
      <transition name="skeleton-fade">
        <div v-if="isRouteLoading" class="skeleton-page p-6 max-w-7xl mx-auto w-full">
          <!-- Top bar skeleton -->
          <div class="skeleton-bar w-1/3 h-8 mb-6 rounded-lg"></div>

          <!-- Card grid skeleton -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="skeleton-card rounded-xl p-5 h-28" v-for="n in 3" :key="n"></div>
          </div>

          <!-- Main content block skeleton -->
          <div class="skeleton-card rounded-xl p-6 mb-4">
            <div class="skeleton-bar w-2/5 h-5 mb-4 rounded"></div>
            <div class="skeleton-bar w-full h-3 mb-3 rounded"></div>
            <div class="skeleton-bar w-5/6 h-3 mb-3 rounded"></div>
            <div class="skeleton-bar w-4/6 h-3 mb-6 rounded"></div>
            <div class="grid grid-cols-2 gap-3">
              <div class="skeleton-bar h-10 rounded-lg" v-for="n in 4" :key="n"></div>
            </div>
          </div>

          <!-- List rows skeleton -->
          <div class="skeleton-card rounded-xl p-4 space-y-3">
            <div class="flex items-center gap-3" v-for="n in 5" :key="n">
              <div class="skeleton-bar w-8 h-8 rounded-full shrink-0"></div>
              <div class="flex-1 space-y-2">
                <div class="skeleton-bar w-3/4 h-3 rounded"></div>
                <div class="skeleton-bar w-1/2 h-2 rounded"></div>
              </div>
              <div class="skeleton-bar w-16 h-6 rounded-full shrink-0"></div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Actual Page Content -->
      <router-view v-if="!isRouteLoading" v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-8 px-6 text-center text-xs text-slate-500 mt-auto font-sans">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="text-left">
          <p>© 2026 Pondo Converter. Open Data & Civic Tech Platform.</p>
          <p class="text-[10px] text-slate-400 mt-1 max-w-2xl leading-normal">
            Disclaimer: This is an independent civic tech tool developed for educational and transparency purposes. It
            is not affiliated with, sponsored by, endorsed by, or in any way officially connected to the Commission on
            Audit (COA), PhilGEPS, or any government agency of the Republic of the Philippines.
          </p>
        </div>
        <div class="flex gap-4 shrink-0 font-semibold">
          <a href="https://www.coa.gov.ph" target="_blank" class="hover:underline text-blue-900">Commission on Audit</a>
          <a href="https://www.philgeps.gov.ph" target="_blank" class="hover:underline text-blue-900">PhilGEPS
            Portal</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
/* Global scrollbar and font overrides if any */
body {
  margin: 0;
  padding: 0;
}

/* Skeleton shimmer animation */
@keyframes shimmer {
  0% {
    background-position: -600px 0;
  }

  100% {
    background-position: 600px 0;
  }
}

.skeleton-bar,
.skeleton-card {
  background: linear-gradient(90deg,
      #e2e8f0 25%,
      #f1f5f9 50%,
      #e2e8f0 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.skeleton-page {
  animation: none;
}

/* Skeleton fade transition */
.skeleton-fade-enter-active,
.skeleton-fade-leave-active {
  transition: opacity 0.15s ease;
}

.skeleton-fade-enter-from,
.skeleton-fade-leave-to {
  opacity: 0;
}

/* Page fade-in transition */
.page-fade-enter-active {
  transition: opacity 0.2s ease;
}

.page-fade-enter-from {
  opacity: 0;
}
</style>
