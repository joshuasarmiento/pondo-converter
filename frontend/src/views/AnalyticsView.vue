<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  TrendingUp,
  Building2,
  UserCheck,
  Wheat,
  School,
  BookOpen,
  Heart,
  Briefcase,
  Coins,
  Layers
} from 'lucide-vue-next';

interface LeaderboardItem {
  name: string;
  total_amount_php: number;
}

interface NationalEquivalent {
  metric_name: string;
  quantity_equivalent: number;
  icon_slug: string;
}

interface AnalyticsData {
  total_contract_amount_php: number;
  total_anomalies_count: number;
  agency_leaderboard: LeaderboardItem[];
  contractor_leaderboard: LeaderboardItem[];
  national_equivalents: NationalEquivalent[];
}

const API_URL = 'http://localhost:3001/api';
const API_KEY = 'COqDemyg9y4sCN3VYhuxJyGkhnMDcwLpavcSAWRnGL99ZfToaHpWOoBcNVqmgdyT';

const analytics = ref<AnalyticsData | null>(null);
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

onMounted(async () => {
  await fetchAnalytics();
});

const fetchAnalytics = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await fetch(`${API_URL}/analytics`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    if (!res.ok) throw new Error('Failed to retrieve analytics data.');
    analytics.value = await res.json();
  } catch (err: any) {
    error.value = err.message || 'Could not connect to the analytics server.';
  } finally {
    loading.value = false;
  }
};

const formatPHP = (val: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(val);
};

const formatNumber = (val: number) => {
  return new Intl.NumberFormat('en-PH').format(val);
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
    <!-- Header -->
    <div class="mb-6 md:mb-8 text-center md:text-left">
      <h1 class="text-2xl md:text-3xl font-extrabold text-blue-900 tracking-tight">Civic Transparency Analytics</h1>
      <p class="text-slate-500 mt-2 max-w-xl text-sm md:text-base">
        A bird's-eye view of tracked government procurement contracts and their collective opportunity costs.
      </p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-5 text-sm text-red-700">
      <h3 class="font-bold text-red-900">Failed to Load Dashboard</h3>
      <p class="mt-1">{{ error }}</p>
      <button @click="fetchAnalytics()"
        class="mt-3 px-4 py-1.5 bg-red-700 text-white rounded-md text-xs font-bold hover:bg-red-800 transition">
        Retry Ingestion
      </button>
    </div>

    <!-- Loading Skeletons -->
    <div v-else-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="n in 3" :key="n" class="skeleton-card rounded-2xl h-36"></div>
      <div class="md:col-span-2 skeleton-card rounded-2xl h-96"></div>
      <div class="skeleton-card rounded-2xl h-96"></div>
    </div>

    <!-- Main Dashboard Content -->
    <div v-else-if="analytics" class="flex flex-col gap-8">
      <!-- High-Level Stats Grid -->
      <section class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <!-- Card 1: Total Pondo -->
        <div class="bg-gradient-to-br from-blue-900 to-slate-900 text-white border border-blue-950 rounded-2xl p-6 shadow-sm hover:scale-[1.01] transition-transform duration-300">
          <div class="flex items-center justify-between text-blue-200">
            <span class="text-xs font-bold uppercase tracking-wider">Total Contract Value</span>
            <TrendingUp class="w-5 h-5" />
          </div>
          <div class="mt-4">
            <span class="text-3xl font-black tracking-tight block">
              {{ formatPHP(analytics.total_contract_amount_php) }}
            </span>
            <span class="text-[11px] text-slate-300 mt-2 block font-medium">
              Sum of all contract amounts analyzed in our database.
            </span>
          </div>
        </div>

        <!-- Card 2: Total Projects -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:scale-[1.01] transition-transform duration-300">
          <div class="flex items-center justify-between text-slate-500">
            <span class="text-xs font-bold uppercase tracking-wider">Tracked Contracts</span>
            <Building2 class="w-5 h-5 text-blue-900" />
          </div>
          <div class="mt-4">
            <span class="text-4xl font-extrabold text-slate-900 block">
              {{ formatNumber(analytics.total_anomalies_count) }}
            </span>
            <span class="text-[11px] text-slate-500 mt-2 block font-medium">
              Verified public procurements from the PhilGEPS system.
            </span>
          </div>
        </div>

        <!-- Card 3: Top Opportunity Cost Metric -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:scale-[1.01] transition-transform duration-300">
          <div class="flex items-center justify-between text-slate-500">
            <span class="text-xs font-bold uppercase tracking-wider">Classroom Equivalents</span>
            <School class="w-5 h-5 text-blue-900" />
          </div>
          <div class="mt-4">
            <span class="text-4xl font-extrabold text-blue-900 block" v-if="analytics.national_equivalents.find(i => i.icon_slug === 'classroom')">
              {{ formatNumber(analytics.national_equivalents.find(i => i.icon_slug === 'classroom')?.quantity_equivalent || 0) }}
            </span>
            <span class="text-[11px] text-slate-500 mt-2 block font-medium">
              Classrooms that could have been funded using these budgets.
            </span>
          </div>
        </div>
      </section>

      <!-- Main Dash Content Block (Leaderboards & National Opportunity Cost Receipt) -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left: National Opportunity Cost Receipt Card -->
        <div class="lg:col-span-1 bg-amber-50/20 rounded-2xl border border-slate-200/60 p-6 md:p-8 font-mono shadow-xs flex flex-col gap-6">
          <div class="text-center pb-4 border-b border-dashed border-slate-300">
            <h3 class="font-bold text-xs uppercase tracking-widest text-slate-500">National Opportunity Receipt</h3>
            <p class="text-[9px] text-slate-400 mt-1">Civic Tech PH — Pondo Converter</p>
            <p class="text-[9px] text-slate-400 mt-0.5">Summary of All Tracked Public Funds</p>
          </div>

          <div class="space-y-4 flex-1">
            <div v-for="item in analytics.national_equivalents" :key="item.metric_name" class="flex items-start justify-between gap-4 text-xs">
              <div class="flex items-start gap-2.5">
                <component :is="getIcon(item.icon_slug)" class="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span class="font-bold text-slate-800">{{ item.metric_name }}</span>
              </div>
              <span class="font-black text-slate-900 shrink-0">{{ formatNumber(item.quantity_equivalent) }}</span>
            </div>
          </div>

          <div class="border-t border-dashed border-slate-300 pt-5 flex flex-col items-center justify-center gap-1.5 opacity-75">
            <div class="flex items-center gap-[1px] h-8 w-44 overflow-hidden bg-white px-2 py-1 border border-slate-200">
              <div v-for="n in 25" :key="n" :class="['h-full bg-slate-800', n % 3 === 0 ? 'w-[3px]' : n % 2 === 0 ? 'w-[1px]' : 'w-[2px]']"></div>
            </div>
            <span class="text-[8px] text-slate-500 tracking-widest uppercase">CONSOLIDATED PUBLIC FUNDS</span>
          </div>
        </div>

        <!-- Right: Leaderboards (Agencies & Contractors) -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          <!-- Agency Leaderboard -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 class="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-6">
              <Building2 class="w-5 h-5 text-blue-900" />
              Top Agencies by Procurement Volume
            </h3>
            
            <div class="flex flex-col gap-4">
              <div v-for="(item, index) in analytics.agency_leaderboard" :key="item.name" class="flex flex-col gap-1 text-xs">
                <div class="flex justify-between items-center font-bold text-slate-700">
                  <span class="truncate max-w-[70%]">{{ index + 1 }}. {{ item.name }}</span>
                  <span class="text-blue-900">{{ formatPHP(item.total_amount_php) }}</span>
                </div>
                <!-- Custom styling bar chart -->
                <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div class="bg-blue-900 h-full rounded-full transition-all duration-300" 
                    :style="{ width: (item.total_amount_php / analytics.agency_leaderboard[0].total_amount_php * 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contractor Leaderboard -->
          <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 class="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-6">
              <UserCheck class="w-5 h-5 text-blue-900" />
              Top Winning Contractors
            </h3>
            
            <div class="flex flex-col gap-4">
              <div v-for="(item, index) in analytics.contractor_leaderboard" :key="item.name" class="flex flex-col gap-1 text-xs">
                <div class="flex justify-between items-center font-bold text-slate-700">
                  <span class="truncate max-w-[70%]">{{ index + 1 }}. {{ item.name }}</span>
                  <span class="text-blue-900">{{ formatPHP(item.total_amount_php) }}</span>
                </div>
                <!-- Custom styling bar chart -->
                <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div class="bg-slate-700 h-full rounded-full transition-all duration-300" 
                    :style="{ width: (item.total_amount_php / analytics.contractor_leaderboard[0].total_amount_php * 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position: 600px 0; }
}

.skeleton-card {
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
