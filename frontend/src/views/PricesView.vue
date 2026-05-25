<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Wheat, Coins, Briefcase, School, BookOpen, Heart, Layers, Calendar, Landmark, Info } from 'lucide-vue-next';
import type { Commodity } from '../types';

const API_URL = 'http://localhost:3001/api';
const API_KEY = 'COqDemyg9y4sCN3VYhuxJyGkhnMDcwLpavcSAWRnGL99ZfToaHpWOoBcNVqmgdyT';

const commodities = ref<Commodity[]>([]);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

onMounted(async () => {
  await fetchCommodityPrices();
});

const fetchCommodityPrices = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`${API_URL}/commodities`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch commodity price directory.');
    commodities.value = await res.json();
  } catch (err: any) {
    error.value = err.message || 'Could not retrieve price baseline data.';
  } finally {
    loading.value = false;
  }
};

const formatPHP = (val: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(val);
};

const getIcon = (slug: string) => {
  switch (slug) {
    case 'rice-sack':
      return Wheat;
    case 'sardines-can':
    case 'noodles-pack':
      return Coins;
    case 'daily-wage':
      return Briefcase;
    case 'classroom':
      return School;
    case 'textbook':
      return BookOpen;
    case 'healthcare':
      return Heart;
    default:
      return Layers;
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto py-6 md:py-8 px-4 md:px-0">
    <div class="mb-6 md:mb-8 text-center md:text-left">
      <h1 class="text-2xl md:text-3xl font-extrabold text-blue-900 tracking-tight">Commodity Prices (Baselines)</h1>
      <p class="text-slate-500 mt-2 max-w-xl text-sm md:text-base">
        Baseline prices of commodities and public services used for conversions.
      </p>
    </div>

    <!-- Info Banner -->
    <div
      class="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-5 mb-6 md:mb-8 flex gap-3 md:gap-4 items-start text-slate-700 text-xs leading-relaxed">
      <Info class="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
      <div>
        <h4 class="font-bold uppercase tracking-wider mb-1.5 flex items-center gap-2">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-emerald-700 text-[11px]">Live Data Active</span>
        </h4>
        Food prices (like rice) are sourced from Department of Agriculture (DA) price updates. Industrial parameters like NCR Minimum Wages and classroom construction costs are based on DOLE and DepEd reports.
      </div>
    </div>

    <!-- Skeleton Loading State -->
    <div v-if="loading">
      <!-- Info banner skeleton -->
      <div class="skeleton-block rounded-2xl h-16 mb-6 md:mb-8"></div>

      <!-- Mobile card skeletons -->
      <div class="grid grid-cols-1 gap-4 md:hidden">
        <div v-for="n in 5" :key="n" class="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="skeleton-block w-10 h-10 rounded-xl"></div>
            <div class="flex-1 space-y-2">
              <div class="skeleton-block h-4 w-3/4 rounded"></div>
              <div class="skeleton-block h-3 w-1/3 rounded-full"></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 border-y border-slate-100 py-3">
            <div class="skeleton-block h-8 rounded"></div>
            <div class="skeleton-block h-8 rounded"></div>
          </div>
          <div class="flex justify-between">
            <div class="skeleton-block h-3 w-24 rounded"></div>
            <div class="skeleton-block h-3 w-20 rounded"></div>
          </div>
        </div>
      </div>

      <!-- Desktop table skeleton -->
      <div class="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <!-- Table header -->
        <div class="bg-slate-50 border-b border-slate-200 px-6 py-4 grid grid-cols-6 gap-4">
          <div v-for="n in 6" :key="n" class="skeleton-block h-3 rounded"></div>
        </div>
        <!-- Table rows -->
        <div v-for="n in 7" :key="n" class="border-b border-slate-100 px-6 py-4 grid grid-cols-6 gap-4 items-center">
          <div class="flex items-center gap-3">
            <div class="skeleton-block w-8 h-8 rounded-lg shrink-0"></div>
            <div class="skeleton-block h-4 flex-1 rounded"></div>
          </div>
          <div class="skeleton-block h-5 w-20 rounded-full"></div>
          <div class="skeleton-block h-4 rounded"></div>
          <div class="skeleton-block h-4 rounded"></div>
          <div class="skeleton-block h-4 w-24 rounded"></div>
          <div class="space-y-1.5">
            <div class="skeleton-block h-3 w-28 rounded"></div>
            <div class="skeleton-block h-3 w-20 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
      <h3 class="font-bold text-red-900">Failed to Load Prices</h3>
      <p class="mt-1">{{ error }}</p>
      <button @click="fetchCommodityPrices()"
        class="mt-3 px-4 py-1.5 bg-red-700 text-white rounded-md text-xs font-bold hover:bg-red-800 transition">
        Retry Ingestion
      </button>
    </div>

    <!-- Live Directory Content -->
    <div v-else>
      <!-- Mobile Cards view (hidden on desktop) -->
      <div class="grid grid-cols-1 gap-4 md:hidden">
        <div v-for="item in commodities" :key="item.id"
          class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <!-- Card Header: Title & Category -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3">
              <div class="p-2.5 bg-slate-100 text-blue-900 rounded-xl">
                <component :is="getIcon(item.icon_slug)" class="w-5 h-5" />
              </div>
              <div>
                <h3 class="font-bold text-slate-900 text-sm leading-snug">{{ item.name }}</h3>
                <span
                  class="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 uppercase tracking-wide">
                  {{ item.category }}
                </span>
              </div>
            </div>
          </div>

          <!-- Card Body: Costs & Units -->
          <div class="grid grid-cols-2 border-y border-slate-100 py-3 text-xs gap-3">
            <div>
              <span class="text-slate-400 font-semibold uppercase tracking-wider block text-[9px]">Base Unit
                Price</span>
              <span class="font-bold text-slate-800 text-sm mt-0.5">
                {{ formatPHP(item.base_price_php) }}
                <span class="text-slate-400 font-normal"> / {{ item.unit_of_measurement }}</span>
              </span>
            </div>
            <div>
              <span class="text-slate-400 font-semibold uppercase tracking-wider block text-[9px]">Total Cost /
                Scale</span>
              <span class="font-black text-blue-900 text-sm mt-0.5">
                {{ formatPHP(item.base_price_php * item.base_unit_multiplier) }}
              </span>
            </div>
          </div>

          <!-- Card Footer: Time & Source -->
          <div class="flex items-center justify-between text-[11px] text-slate-500">
            <span class="flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5 text-slate-400" />
              {{ new Date(item.effective_date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year:
              'numeric' }) }}
            </span>
            <a v-if="item.source_url" :href="item.source_url" target="_blank"
              class="text-blue-900 font-bold hover:underline flex items-center gap-1">
              <Landmark class="w-3.5 h-3.5" />
              Source Agency
            </a>
          </div>
        </div>
      </div>

      <!-- Desktop Tables view (hidden on mobile) -->
      <div class="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr
                class="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th class="py-4 px-6">Commodity Name</th>
                <th class="py-4 px-6">Category</th>
                <th class="py-4 px-6">Base Unit Price</th>
                <th class="py-4 px-6">Conversion Baseline Unit</th>
                <th class="py-4 px-6">Total Unit Cost</th>
                <th class="py-4 px-6">Last Updated</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="item in commodities" :key="item.id" class="hover:bg-slate-50/50 transition">
                <td class="py-4.5 px-6 font-bold text-slate-900">
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-slate-100 text-blue-900 rounded-lg">
                      <component :is="getIcon(item.icon_slug)" class="w-4 h-4" />
                    </div>
                    <span>{{ item.name }}</span>
                  </div>
                </td>
                <td class="py-4.5 px-6">
                  <span class="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {{ item.category }}
                  </span>
                </td>
                <td class="py-4.5 px-6 text-slate-600 font-medium">
                  {{ formatPHP(item.base_price_php) }} <span class="text-xs text-slate-400">/ {{
                    item.unit_of_measurement }}</span>
                </td>
                <td class="py-4.5 px-6 text-slate-500">
                  {{ item.display_unit_name.split(' of ')[0] }}
                </td>
                <td class="py-4.5 px-6 font-extrabold text-blue-900">
                  {{ formatPHP(item.base_price_php * item.base_unit_multiplier) }}
                </td>
                <td class="py-4.5 px-6 text-xs text-slate-500">
                  <div class="flex flex-col gap-1">
                    <span class="flex items-center gap-1">
                      <Calendar class="w-3 h-3 text-slate-400" />
                      {{ new Date(item.effective_date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      year: 'numeric' }) }}
                    </span>
                    <a v-if="item.source_url" :href="item.source_url" target="_blank"
                      class="text-blue-900 hover:underline flex items-center gap-0.5 font-semibold">
                      <Landmark class="w-3 h-3" />
                      Source Agency
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

.skeleton-block {
  background: linear-gradient(
    90deg,
    #e2e8f0 25%,
    #f1f5f9 50%,
    #e2e8f0 75%
  );
  background-size: 600px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
</style>
