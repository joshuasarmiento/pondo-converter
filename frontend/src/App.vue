<script setup lang="ts">
// Global application layout container
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
            Isinasalin natin ang government budgets at contract allocations sa mga pampublikong bilihin at serbisyo para
            ma-compute ang civic opportunity cost.
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
          <router-link to="/prices"
            class="px-4 py-2 rounded-md text-sm font-semibold transition text-slate-300 hover:text-white"
            active-class="bg-blue-900 text-white shadow-sm">
            Presyo ng Bilihin
          </router-link>
          <router-link to="/about"
            class="px-4 py-2 rounded-md text-sm font-semibold transition text-slate-300 hover:text-white"
            active-class="bg-blue-900 text-white shadow-sm">
            About the Tool
          </router-link>
        </nav>
      </div>
    </header>

    <!-- Route Views Placeholder -->
    <router-view class="flex-1" />

    <!-- Footer -->
    <footer class="bg-white border-t border-slate-200 py-8 px-6 text-center text-xs text-slate-500 mt-auto font-sans">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="text-left">
          <p>© 2026 Pondo Converter. Open Data & Civic Tech Platform.</p>
          <p class="text-[10px] text-slate-400 mt-1 max-w-2xl leading-normal">
            Disclaimer: This is an independent civic tech tool developed for educational and transparency purposes. It is not affiliated with, sponsored by, endorsed by, or in any way officially connected to the Commission on Audit (COA), PhilGEPS, or any government agency of the Republic of the Philippines.
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
</style>
