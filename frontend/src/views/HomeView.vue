<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import html2canvas from 'html2canvas-pro';
import {
  ExternalLink,
  FileText,
  Layers,
  ShieldCheck,
  AlertCircle,
  Calculator,
  Wheat,
  Briefcase,
  School,
  BookOpen,
  Heart,
  Coins,
  Search,
  CheckCircle2,
  Share2,
  Minus,
  Plus,
  RotateCcw,
  Sliders,
  Shuffle,
  Camera,
  Users
} from 'lucide-vue-next';
import { usePondo } from '../composables/usePondo';

const copied = ref(false);
const activeTab = ref<'receipt' | 'allocator'>('receipt');

const {
  anomalies,
  selectedAnomalyId,
  selectedAnomalyData,
  searchQuery,
  isCustomMode,
  customAmount,
  commoditiesList,
  selectedRegion,
  loading,
  error,
  fetchAnomalies,
  fetchCommodities,
  fetchConversion
} = usePondo();

// Allocation dictionary: name -> quantity
const allocations = ref<Record<string, number>>({});

// Community Consensus data state
const communityAverages = ref<Record<string, number>>({});
const communitySubmissionsCount = ref(0);
const loadingCommunityConsensus = ref(false);
const publishedSuccess = ref(false);

const fetchCommunityConsensus = async () => {
  if (isCustomMode.value || !selectedAnomalyId.value) return;
  loadingCommunityConsensus.value = true;
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const API_KEY = import.meta.env.VITE_API_KEY || 'COqDemyg9y4sCN3VYhuxJyGkhnMDcwLpavcSAWRnGL99ZfToaHpWOoBcNVqmgdyT';
    const res = await fetch(`${API_URL}/reallocations/${selectedAnomalyId.value}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch consensus');
    const data = await res.json();
    communitySubmissionsCount.value = data.totalSubmissions;
    communityAverages.value = data.averages;
  } catch (e) {
    console.error('Failed to load community consensus:', e);
  } finally {
    loadingCommunityConsensus.value = false;
  }
};

const publishReallocation = async () => {
  if (isCustomMode.value || !selectedAnomalyId.value) return;
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const API_KEY = import.meta.env.VITE_API_KEY || 'COqDemyg9y4sCN3VYhuxJyGkhnMDcwLpavcSAWRnGL99ZfToaHpWOoBcNVqmgdyT';

    // Calculate percentage allocations for each item
    const totalAllocated = totalAllocatedCost.value;
    const allocationPercentages: Record<string, number> = {};
    commoditiesList.value.forEach(item => {
      const qty = allocations.value[item.name] || 0;
      const cost = qty * item.base_price_php * item.base_unit_multiplier;
      const pct = totalAllocated > 0 ? (cost / totalAllocated) * 100 : 0;
      allocationPercentages[item.name] = pct;
    });

    const res = await fetch(`${API_URL}/reallocations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        anomalyId: selectedAnomalyId.value,
        allocations: allocationPercentages
      })
    });
    if (res.ok) {
      publishedSuccess.value = true;
      await fetchCommunityConsensus();
      setTimeout(() => {
        publishedSuccess.value = false;
      }, 3000);
    }
  } catch (e) {
    console.error('Failed to publish reallocation:', e);
  }
};

const receiptContainer = ref<HTMLElement | null>(null);
const exportingImage = ref(false);

const downloadReceiptImage = async () => {
  if (!receiptContainer.value) return;
  exportingImage.value = true;
  try {
    const canvas = await html2canvas(receiptContainer.value, {
      backgroundColor: '#fffdf9',
      scale: 2,
      useCORS: true,
      logging: false
    });
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `pondo-receipt-${displayTitle.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to export receipt image:', err);
  } finally {
    exportingImage.value = false;
  }
};

const resetAllocations = () => {
  if (!commoditiesList.value) return;
  commoditiesList.value.forEach(item => {
    allocations.value[item.name] = 0;
  });
};

onMounted(async () => {
  await fetchAnomalies();
  await fetchCommodities();
  resetAllocations();

  if (anomalies.value.length > 0) {
    selectedAnomalyId.value = anomalies.value[0].id;
    await fetchConversion(selectedAnomalyId.value);
    await fetchCommunityConsensus();
  }
});

watch(commoditiesList, () => {
  resetAllocations();
}, { deep: true });

const formatPHP = (val: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(val);
};

const formatNumber = (val: number) => {
  return new Intl.NumberFormat('en-PH').format(val);
};

const customConversions = computed(() => {
  if (!isCustomMode.value || !commoditiesList.value.length) return [];

  return commoditiesList.value.map(item => {
    const unitCost = item.base_price_php * item.base_unit_multiplier;
    const quantity = Math.floor(customAmount.value / unitCost);
    return {
      metric_name: item.display_unit_name,
      quantity_equivalent: quantity,
      unit_cost: unitCost,
      icon_slug: item.icon_slug,
      source_date: item.effective_date
    };
  }).sort((a, b) => b.quantity_equivalent - a.quantity_equivalent);
});

const displayTitle = computed(() => {
  if (isCustomMode.value) {
    return `Custom Amount: ${formatPHP(customAmount.value)}`;
  }
  return selectedAnomalyData.value?.anomaly.title || 'Loading Budget Anomaly...';
});

const displayAgency = computed(() => {
  if (isCustomMode.value) {
    return 'Citizen Simulation';
  }
  return selectedAnomalyData.value?.anomaly.agency || '';
});

const displayAmount = computed(() => {
  if (isCustomMode.value) {
    return customAmount.value;
  }
  return selectedAnomalyData.value?.anomaly.amount_php || 0;
});

const activeConversions = computed(() => {
  if (isCustomMode.value) {
    return customConversions.value;
  }
  return selectedAnomalyData.value?.conversions || [];
});

const sortBy = ref<string>('quantity_desc');
const activeCategory = ref<string>('all');

const filteredAndSortedConversions = computed(() => {
  let list = [...activeConversions.value];

  // 1. Filter by category
  if (activeCategory.value !== 'all') {
    list = list.filter(item => {
      const slug = item.icon_slug;
      if (activeCategory.value === 'food') {
        return slug === 'rice-sack' || slug === 'sardines-can' || slug === 'noodles-pack';
      }
      if (activeCategory.value === 'education') {
        return slug === 'classroom' || slug === 'textbook';
      }
      if (activeCategory.value === 'services') {
        return slug === 'daily-wage' || slug === 'healthcare';
      }
      return true;
    });
  }

  // 2. Sort by selected criteria
  if (sortBy.value === 'quantity_desc') {
    list.sort((a, b) => b.quantity_equivalent - a.quantity_equivalent);
  } else if (sortBy.value === 'quantity_asc') {
    list.sort((a, b) => a.quantity_equivalent - b.quantity_equivalent);
  } else if (sortBy.value === 'price_desc') {
    list.sort((a, b) => b.unit_cost - a.unit_cost);
  } else if (sortBy.value === 'price_asc') {
    list.sort((a, b) => a.unit_cost - b.unit_cost);
  }

  return list;
});

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

const toggleMode = (mode: boolean) => {
  isCustomMode.value = mode;
  resetAllocations();
  if (!mode && selectedAnomalyId.value) {
    fetchConversion(selectedAnomalyId.value);
  }
};

// Reallocator Computeds & Methods
const totalAllocatedCost = computed(() => {
  if (!commoditiesList.value) return 0;
  return commoditiesList.value.reduce((sum, item) => {
    const qty = allocations.value[item.name] || 0;
    const unitCost = item.base_price_php * item.base_unit_multiplier;
    return sum + (qty * unitCost);
  }, 0);
});

const remainingBudget = computed(() => {
  return Math.max(0, displayAmount.value - totalAllocatedCost.value);
});

const percentAllocated = computed(() => {
  if (!displayAmount.value) return 0;
  return Math.min(100, (totalAllocatedCost.value / displayAmount.value) * 100);
});

const getMaxQuantity = (item: any) => {
  const unitCost = item.base_price_php * item.base_unit_multiplier;
  const currentQty = allocations.value[item.name] || 0;
  return currentQty + Math.floor(remainingBudget.value / unitCost);
};

const updateAllocationValue = (itemName: string, val: number) => {
  allocations.value[itemName] = Math.max(0, val);
};

const autoDistributeEvenly = () => {
  resetAllocations();
  const list = commoditiesList.value;
  if (!list || list.length === 0) return;
  const share = displayAmount.value / list.length;
  list.forEach(item => {
    const unitCost = item.base_price_php * item.base_unit_multiplier;
    allocations.value[item.name] = Math.floor(share / unitCost);
  });
};

const autoFocusEducation = () => {
  resetAllocations();
  const classrooms = commoditiesList.value.find(i => i.icon_slug === 'classroom');
  const textbooks = commoditiesList.value.find(i => i.icon_slug === 'textbook');

  if (classrooms) {
    const unitCost = classrooms.base_price_php * classrooms.base_unit_multiplier;
    const amt = displayAmount.value * 0.75;
    allocations.value[classrooms.name] = Math.floor(amt / unitCost);
  }
  if (textbooks) {
    const unitCost = textbooks.base_price_php * textbooks.base_unit_multiplier;
    const currentSpent = (allocations.value[classrooms?.name || ''] || 0) * (classrooms ? classrooms.base_price_php * classrooms.base_unit_multiplier : 0);
    const remaining = displayAmount.value - currentSpent;
    allocations.value[textbooks.name] = Math.floor(remaining / unitCost);
  }
};

const autoFocusFoodWages = () => {
  resetAllocations();
  const targets = commoditiesList.value.filter(i =>
    ['rice-sack', 'sardines-can', 'noodles-pack', 'daily-wage'].includes(i.icon_slug)
  );
  if (targets.length === 0) return;
  const share = displayAmount.value / targets.length;
  targets.forEach(item => {
    const unitCost = item.base_price_php * item.base_unit_multiplier;
    allocations.value[item.name] = Math.floor(share / unitCost);
  });
};

const shareReceipt = async () => {
  const title = displayTitle.value;
  const agency = displayAgency.value;
  const amountStr = formatPHP(displayAmount.value);

  let conversionText = "";
  filteredAndSortedConversions.value.forEach(item => {
    conversionText += `• ${item.metric_name}: ${formatNumber(item.quantity_equivalent)} units equivalent (at ${formatPHP(item.unit_cost)} each)\n`;
  });

  const fullText = `--- CIVIC OPPORTUNITY COST RECEIPT ---\n` +
    `Project/Amount: ${title}\n` +
    `Agency: ${agency}\n` +
    `Total Allocated Budget: ${amountStr}\n\n` +
    `Alternative Essential Equivalents:\n` +
    `${conversionText}\n` +
    `Generated by Pondo Converter (Independent Civic Transparency Platform)\n` +
    `---------------------------------------`;

  try {
    await navigator.clipboard.writeText(fullText);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text:', err);
  }
};

const shareAllocationReceipt = async () => {
  const title = displayTitle.value;
  const agency = displayAgency.value;
  const amountStr = formatPHP(displayAmount.value);

  let allocationText = "";
  commoditiesList.value.forEach(item => {
    const qty = allocations.value[item.name] || 0;
    if (qty > 0) {
      const unitCost = item.base_price_php * item.base_unit_multiplier;
      allocationText += `• ${item.display_unit_name}: ${formatNumber(qty)} units (${formatPHP(qty * unitCost)} allocated)\n`;
    }
  });

  const spentStr = formatPHP(totalAllocatedCost.value);
  const remainingStr = formatPHP(remainingBudget.value);

  const fullText = `--- MY CIVIC BUDGET REALLOCATION ---\n` +
    `Original Project/Amount: ${title}\n` +
    `Agency: ${agency}\n` +
    `Total Budget: ${amountStr}\n\n` +
    `My Reallocated Program Budget:\n` +
    `${allocationText || "No allocations made.\n"}\n` +
    `Total Allocated: ${spentStr} (${formatNumber(percentAllocated.value)}%)\n` +
    `Remaining Balance: ${remainingStr}\n\n` +
    `Generated by Pondo Converter (Independent Civic Tech)\n` +
    `-------------------------------------`;

  try {
    await navigator.clipboard.writeText(fullText);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text:', err);
  }
};
</script>


<template>
  <div>
    <!-- Sub-Navbar for Modes Selection -->
    <div class="bg-blue-950 border-b border-blue-900 text-white px-8 py-3.5 shadow-sm">
      <div
        class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
        <span class="text-xs font-semibold text-blue-200 uppercase tracking-wider">
          Calculator Settings
        </span>
        <div class="flex items-center gap-2 bg-blue-900/60 p-1 rounded-lg border border-blue-800">
          <button @click="toggleMode(false)" :class="[
            'px-3.5 py-1.5 rounded-md text-xs font-semibold transition',
            !isCustomMode
              ? 'bg-blue-800 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-blue-800/40'
          ]">
            Government Anomalies
          </button>
          <button @click="toggleMode(true)" :class="[
            'px-3.5 py-1.5 rounded-md text-xs font-semibold transition',
            isCustomMode
              ? 'bg-blue-800 text-white shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-blue-800/40'
          ]">
            Custom Calculator
          </button>
        </div>
      </div>
    </div>

    <main class="max-w-7xl w-full mx-auto py-6 md:py-8 px-4 md:px-0 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <!-- Error Alert -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4 lg:col-span-3">
        <AlertCircle class="w-6 h-6 text-red-700 shrink-0 mt-0.5" />
        <div>
          <h3 class="font-bold text-red-900">Application Server Offline</h3>
          <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          <button @click="fetchAnomalies()"
            class="mt-3 px-4 py-1.5 bg-red-700 text-white rounded-md text-xs font-bold hover:bg-red-800 transition">
            Retry Connection
          </button>
        </div>
      </div>

      <!-- Left Column: Controls & Context -->
      <section class="flex flex-col gap-6 lg:col-span-1">
        <!-- Region Settings Card -->
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
            <Sliders class="w-4 h-4 text-blue-900" />
            Regional Settings
          </h2>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            Select region to localize conversion values (like daily minimum wages and local food prices).
          </p>
          <div class="mt-4">
            <label for="region-select"
              class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Active Region</label>
            <select id="region-select" v-model="selectedRegion"
              class="w-full border border-slate-300 rounded-xl py-2.5 px-4 text-sm font-semibold focus:border-blue-900 focus:ring-1 focus:ring-blue-900 bg-white">
              <option value="NCR">National Capital Region (NCR)</option>
              <option value="Region VII">Region VII (Central Visayas - Cebu)</option>
              <option value="Region XI">Region XI (Davao Region)</option>
            </select>
          </div>
        </div>

        <!-- Mode 1: Anomaly Selector -->
        <div v-if="!isCustomMode" class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Search class="w-5 h-5 text-blue-900" />
            Public Contract Database
          </h2>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            Search and select a verified public contract from the PhilGEPS procurement system.
          </p>

          <!-- Search Input -->
          <div class="mt-5">
            <label for="anomaly-search"
              class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Search Contracts
            </label>
            <div class="relative">
              <input id="anomaly-search" type="text" v-model="searchQuery"
                placeholder="Search by agency, contractor, or project title..."
                class="w-full border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-blue-900 focus:ring-1 focus:ring-blue-900 bg-white placeholder-slate-400" />
              <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div class="mt-4">
            <label for="anomaly-select"
              class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Select a Project ({{ anomalies.length }} results)
            </label>
            <select id="anomaly-select" v-model="selectedAnomalyId"
              class="w-full border border-slate-300 rounded-xl py-3 px-4 text-sm font-medium focus:border-blue-900 focus:ring-1 focus:ring-blue-900 bg-white">
              <option v-if="anomalies.length === 0" value="">No anomalies loaded</option>
              <option v-for="item in anomalies" :key="item.id" :value="item.id">
                ₱{{ formatNumber(Math.round(item.contract_amount_php / 1000000)) }}M - {{ item.agency.split(' (')[0] }}:
                {{ item.title.substring(0, 30) }}{{ item.title.length > 30 ? '...' : '' }}
              </option>
            </select>
          </div>

          <!-- Selector Metadata Details -->
          <div v-if="selectedAnomalyData" class="mt-6 border-t border-slate-100 pt-6 flex flex-col gap-4 text-sm">
            <div>
              <span class="text-xs font-semibold text-slate-500 uppercase block tracking-wider">Procuring Agency</span>
              <p class="font-bold text-slate-900 mt-0.5">{{ selectedAnomalyData.anomaly.agency }}</p>
            </div>
            <div v-if="selectedAnomalyData.anomaly.contractor_name">
              <span class="text-xs font-semibold text-slate-500 uppercase block tracking-wider">Contractor</span>
              <p class="font-bold text-slate-900 mt-0.5">{{ selectedAnomalyData.anomaly.contractor_name }}</p>
            </div>
            <div>
              <span class="text-xs font-semibold text-slate-500 uppercase block tracking-wider">Contract Amount</span>
              <p class="text-2xl font-bold text-blue-900 mt-0.5">{{ formatPHP(selectedAnomalyData.anomaly.amount_php) }}
              </p>
            </div>
            <div v-if="selectedAnomalyData.anomaly.status" class="flex justify-start items-center gap-2">
              <span class="text-xs font-semibold text-slate-500 uppercase block tracking-wider">Status / Stage</span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold mt-1" :class="[
                selectedAnomalyData.anomaly.status.toLowerCase().includes('fail') || selectedAnomalyData.anomaly.status.toLowerCase().includes('investig') || selectedAnomalyData.anomaly.status.toLowerCase().includes('flag') || selectedAnomalyData.anomaly.status.toLowerCase().includes('audit')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              ]">
                {{ selectedAnomalyData.anomaly.status }}
              </span>
            </div>
            <div v-if="selectedAnomalyData.anomaly.philgeps_reference_no">
              <span class="text-xs font-semibold text-slate-500 uppercase block tracking-wider">PhilGEPS Reference
                No.</span>
              <code class="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 block mt-0.5 w-fit">
                {{ selectedAnomalyData.anomaly.philgeps_reference_no }}
              </code>
            </div>
            <div
              class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed flex items-start gap-2">
              <ShieldCheck class="w-4 h-4 text-blue-900 shrink-0 mt-0.5" />
              <div>
                <span class="font-bold block text-slate-900">Source Link</span>
                <a :href="selectedAnomalyData.anomaly.source" target="_blank"
                  class="text-blue-900 hover:underline flex items-center gap-1 mt-1 font-semibold">
                  View official record
                  <ExternalLink class="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Mode 2: Custom PHP Calculator -->
        <div v-else class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calculator class="w-5 h-5 text-blue-900" />
            Budget Simulator
          </h2>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            Enter any budget amount to simulate its purchasing power.
          </p>

          <div class="mt-5">
            <label for="custom-php-amount"
              class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              PHP Amount (₱)
            </label>
            <input id="custom-php-amount" type="number" v-model.number="customAmount" min="1" step="100000"
              class="w-full border border-slate-300 rounded-xl py-3 px-4 text-sm font-semibold focus:border-blue-900 focus:ring-1 focus:ring-blue-900" />
            <p class="text-xs text-slate-500 mt-2 font-medium">
              Equivalent to: <span class="text-blue-900 font-bold">{{ formatPHP(customAmount) }}</span>
            </p>
          </div>

          <!-- Shortcuts presets -->
          <div class="mt-6 border-t border-slate-100 pt-6">
            <span class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
              Standard Budget Presets
            </span>
            <div class="flex flex-col gap-2">
              <button @click="customAmount = 50000000"
                class="w-full text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 flex justify-between items-center transition">
                <span class="font-medium text-slate-700">Level 1: Barangay Project</span>
                <span class="font-bold text-blue-900">₱50 Million</span>
              </button>
              <button @click="customAmount = 500000000"
                class="w-full text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 flex justify-between items-center transition">
                <span class="font-medium text-slate-700">Level 2: City Infrastructure</span>
                <span class="font-bold text-blue-900">₱500 Million</span>
              </button>
              <button @click="customAmount = 3000000000"
                class="w-full text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 flex justify-between items-center transition">
                <span class="font-medium text-slate-700">Level 3: DepEd/DOH Program</span>
                <span class="font-bold text-blue-900">₱3 Billion</span>
              </button>
            </div>
          </div>
        </div>

        <!-- General Disclaimer Card -->
        <div class="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-xs text-blue-950/80 leading-relaxed">
          <h4 class="font-bold text-blue-900 flex items-center gap-1.5 mb-1.5 uppercase tracking-wider text-[10px]">
            Methodology & Prices
          </h4>
          Calculations are based on the latest market prices from the DA, DTI, and DepEd. Data is regularly updated
          for public transparency.
        </div>
      </section>

      <!-- Right Column: Results Receipt & Interactive Simulator -->
      <section class="flex flex-col gap-6 lg:col-span-2">
        <!-- Results Card Header -->
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 flex flex-col gap-6">
          <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 text-xs font-bold text-blue-900 tracking-wider uppercase mb-1">
                <FileText class="w-4 h-4" />
                Civic Cost Analysis
              </div>
              <h2 class="text-2xl font-bold text-slate-900 mt-2 leading-snug">
                {{ displayTitle }}
              </h2>
              <div class="flex flex-wrap items-center gap-3 mt-3">
                <span class="bg-slate-100 text-slate-800 text-xs font-medium px-2.5 py-1 rounded-md">
                  {{ displayAgency }}
                </span>
                <span class="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md">
                  Public Resource
                </span>
              </div>
            </div>
            <div class="text-left md:text-right shrink-0">
              <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Allocated
                Pondo</span>
              <span class="text-3xl font-extrabold text-blue-900 block mt-1">
                {{ formatPHP(displayAmount) }}
              </span>
            </div>
          </div>

          <!-- Tabs Segmented Control -->
          <div class="flex border-b border-slate-100 bg-slate-50/80 p-1.5 rounded-xl border border-slate-200/50">
            <button @click="activeTab = 'receipt'" :class="[
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer',
              activeTab === 'receipt'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            ]">
              <FileText class="w-4 h-4" />
              Standard Equivalents Receipt
            </button>
            <button @click="activeTab = 'allocator'" :class="[
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition cursor-pointer',
              activeTab === 'allocator'
                ? 'bg-white text-blue-900 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            ]">
              <Sliders class="w-4 h-4" />
              Interactive Allocator Playground
            </button>
          </div>

          <!-- Skeleton Loading State -->
          <div v-if="loading" class="space-y-3">
            <!-- Tab bar skeleton -->
            <div class="flex gap-2 mb-2">
              <div class="skeleton-block flex-1 h-9 rounded-lg"></div>
              <div class="skeleton-block flex-1 h-9 rounded-lg"></div>
            </div>
            <!-- Receipt skeleton -->
            <div class="bg-amber-50/20 border border-slate-200/60 rounded-2xl p-5 md:p-7 space-y-4">
              <!-- Receipt header -->
              <div class="text-center space-y-2 pb-4 border-b border-dashed border-slate-300">
                <div class="skeleton-block h-3 w-36 rounded mx-auto"></div>
                <div class="skeleton-block h-2 w-48 rounded mx-auto"></div>
              </div>
              <!-- Amount block -->
              <div class="text-center py-3 space-y-2">
                <div class="skeleton-block h-8 w-52 rounded mx-auto"></div>
                <div class="skeleton-block h-3 w-64 rounded mx-auto"></div>
              </div>
              <!-- Line items -->
              <div class="border-t border-dashed border-slate-200 pt-4 space-y-3">
                <div v-for="n in 5" :key="n" class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <div class="skeleton-block w-6 h-6 rounded-full shrink-0"></div>
                    <div class="skeleton-block h-3 w-36 rounded"></div>
                  </div>
                  <div class="skeleton-block h-4 w-20 rounded"></div>
                </div>
              </div>
              <!-- Footer barcode area -->
              <div class="border-t border-dashed border-slate-300 pt-4 space-y-2">
                <div class="skeleton-block h-8 w-full rounded"></div>
                <div class="skeleton-block h-2 w-24 rounded mx-auto"></div>
              </div>
            </div>
          </div>

          <div v-else>
            <!-- Tab 1: The Monospace Thermal Receipt Theme -->
            <div v-if="activeTab === 'receipt'" class="flex flex-col gap-4">
              <div ref="receiptContainer"
                class="relative bg-amber-50/20 text-slate-800 font-mono p-5 md:p-7 rounded-2xl border border-slate-200/60 shadow-xs">
                <!-- Thermal paper jagged top simulator -->
                <div class="border-t-4 border-dashed border-slate-300 pt-5">
                  <div class="text-center mb-6">
                    <h3 class="font-bold text-xs uppercase tracking-widest text-slate-500">Official Cost Receipt</h3>
                    <p class="text-[10px] text-slate-400 mt-1">Civic Tech PH — Pondo Converter v1.3</p>
                    <p class="text-[9px] text-slate-400 mt-0.5">Date: {{ new Date().toLocaleDateString('en-PH', {
                      month:
                        'short', day: 'numeric', year: 'numeric'
                    }) }}</p>
                  </div>

                  <div
                    class="border-b border-dashed border-slate-200 pb-3 mb-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                    <span>Opportunity Equivalents</span>
                    <span>Quantity & Valuation</span>
                  </div>

                  <!-- Filter & Sort Toolbar for Receipt -->
                  <div data-html2canvas-ignore
                    class="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-4 font-sans text-xs">
                    <!-- Filter Pills -->
                    <div class="flex flex-wrap items-center gap-1">
                      <button @click="activeCategory = 'all'" :class="['px-2 py-0.5 rounded-md text-[10px] font-bold transition border',
                        activeCategory === 'all'
                          ? 'bg-blue-900 border-blue-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50']">
                        All
                      </button>
                      <button @click="activeCategory = 'food'" :class="['px-2 py-0.5 rounded-md text-[10px] font-bold transition border',
                        activeCategory === 'food'
                          ? 'bg-blue-900 border-blue-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50']">
                        Food
                      </button>
                      <button @click="activeCategory = 'education'" :class="['px-2 py-0.5 rounded-md text-[10px] font-bold transition border',
                        activeCategory === 'education'
                          ? 'bg-blue-900 border-blue-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50']">
                        Edu
                      </button>
                      <button @click="activeCategory = 'services'" :class="['px-2 py-0.5 rounded-md text-[10px] font-bold transition border',
                        activeCategory === 'services'
                          ? 'bg-blue-900 border-blue-900 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50']">
                        Health/Labor
                      </button>
                    </div>

                    <!-- Sort Select -->
                    <div class="flex items-center gap-1">
                      <label for="sort-select-r font-semibold" class="text-[10px]">Sort:</label>
                      <select id="sort-select-r" v-model="sortBy"
                        class="border border-slate-300 rounded text-[10px] py-0.5 px-1 bg-white text-slate-700 font-semibold focus:ring-0">
                        <option value="quantity_desc">Qty (High)</option>
                        <option value="quantity_asc">Qty (Low)</option>
                        <option value="price_desc">Price (High)</option>
                        <option value="price_asc">Price (Low)</option>
                      </select>
                    </div>
                  </div>

                  <!-- Empty State -->
                  <div v-if="filteredAndSortedConversions.length === 0"
                    class="py-8 text-center text-xs text-slate-400 font-sans">
                    No commodities match this category filter.
                  </div>

                  <!-- Receipt Items -->
                  <div class="space-y-4">
                    <div v-for="item in filteredAndSortedConversions" :key="item.metric_name"
                      class="flex items-start justify-between gap-4 text-xs">
                      <div class="flex items-start gap-2.5">
                        <component :is="getIcon(item.icon_slug)" class="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                          <span class="font-bold text-slate-800">{{ item.metric_name }}</span>
                          <span class="block text-[9px] text-slate-400 font-sans mt-0.5">Price: {{
                            formatPHP(item.unit_cost) }} each • As of {{ new
                              Date(item.source_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                            }}</span>
                        </div>
                      </div>
                      <div class="text-right shrink-0">
                        <span class="font-bold text-slate-900">{{ formatNumber(item.quantity_equivalent) }}</span>
                        <span class="block text-[8px] text-slate-400 uppercase tracking-wider">Units</span>
                      </div>
                    </div>
                  </div>

                  <!-- Barcode Simulation -->
                  <div
                    class="mt-8 pt-6 border-t border-dashed border-slate-300 flex flex-col items-center justify-center gap-1.5 opacity-75">
                    <div
                      class="flex items-center gap-[1px] h-8 w-44 overflow-hidden bg-white px-2 py-1 border border-slate-200">
                      <div v-for="n in 25" :key="n"
                        :class="['h-full bg-slate-800', n % 3 === 0 ? 'w-[3px]' : n % 2 === 0 ? 'w-[1px]' : 'w-[2px]']">
                      </div>
                    </div>
                    <span class="text-[8px] text-slate-500 tracking-widest uppercase">PC-#{{
                      displayAmount.toString().substring(0, 6) }}</span>
                  </div>

                  <!-- Share Receipt Actions at the Bottom -->
                  <div data-html2canvas-ignore
                    class="mt-6 pt-4 border-t border-dashed border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                    <button @click="shareReceipt" :class="[
                      'w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer',
                      copied
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 shadow-xs'
                    ]">
                      <Share2 class="w-3.5 h-3.5" />
                      {{ copied ? 'Copied Text! 📋' : 'Copy Text' }}
                    </button>
                    <button @click="downloadReceiptImage" :disabled="exportingImage"
                      class="w-full py-2.5 bg-blue-900 border border-blue-900 text-white hover:bg-blue-800 disabled:opacity-50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
                      <Camera class="w-3.5 h-3.5" />
                      {{ exportingImage ? 'Generating PNG...' : 'Download PNG Receipt' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab 2: The Interactive Budget Allocator Playground -->
            <div v-else class="flex flex-col gap-6">
              <!-- Budget Spent Summary Widget -->
              <div
                class="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 justify-between shadow-xs">
                <div class="flex-1 w-full">
                  <div class="flex justify-between items-center text-xs font-bold text-slate-600 mb-2">
                    <span>BUDGET ALLOCATED SPENT</span>
                    <span :class="remainingBudget === 0 ? 'text-emerald-700' : 'text-blue-900'">
                      {{ formatNumber(percentAllocated) }}%
                    </span>
                  </div>
                  <!-- Custom CSS Progress Bar -->
                  <div class="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden flex">
                    <div class="bg-gradient-to-r from-blue-700 to-indigo-600 h-full transition-all duration-300"
                      :style="{ width: percentAllocated + '%' }"></div>
                  </div>
                  <div class="flex justify-between items-center text-[10px] font-semibold text-slate-400 mt-2">
                    <span>Allocated: {{ formatPHP(totalAllocatedCost) }}</span>
                    <span>Remaining: {{ formatPHP(remainingBudget) }}</span>
                  </div>
                </div>
                <!-- Presets Buttons Panel -->
                <div class="grid grid-cols-2 gap-2 w-full md:w-auto shrink-0">
                  <button @click="autoDistributeEvenly"
                    class="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer">
                    <Shuffle class="w-3.5 h-3.5 text-blue-900" />
                    Split Evenly
                  </button>
                  <button @click="autoFocusEducation"
                    class="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer">
                    <School class="w-3.5 h-3.5 text-blue-900" />
                    Education
                  </button>
                  <button @click="autoFocusFoodWages"
                    class="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer">
                    <Wheat class="w-3.5 h-3.5 text-blue-900" />
                    Food & Wages
                  </button>
                  <button @click="resetAllocations"
                    class="px-2.5 py-1.5 bg-red-50 border border-red-100 hover:border-red-200 rounded-lg text-[10px] font-bold text-red-700 flex items-center justify-center gap-1 shadow-2xs transition cursor-pointer">
                    <RotateCcw class="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
              </div>

              <!-- Allocation Sliders Grid -->
              <div class="flex flex-col gap-4">
                <div v-for="item in commoditiesList" :key="item.id"
                  class="border border-slate-200 rounded-2xl p-4 flex flex-col gap-3.5 bg-white hover:border-slate-300 hover:shadow-2xs transition-all duration-300">
                  <div class="flex justify-between items-start gap-4">
                    <div class="flex items-center gap-3">
                      <div class="p-2 bg-slate-50 text-blue-900 rounded-xl border border-slate-100">
                        <component :is="getIcon(item.icon_slug)" class="w-5 h-5" />
                      </div>
                      <div>
                        <h4 class="font-bold text-slate-900 text-sm leading-snug">{{ item.display_unit_name }}</h4>
                        <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
                          Unit Cost: {{ formatPHP(item.base_price_php * item.base_unit_multiplier) }}
                        </span>
                      </div>
                    </div>
                    <!-- Spent for this item -->
                    <div class="text-right shrink-0">
                      <span class="text-xs font-bold text-slate-500 block">Total Spent</span>
                      <span class="text-sm font-black text-blue-900">
                        {{ formatPHP((allocations[item.name] || 0) * (item.base_price_php * item.base_unit_multiplier))
                        }}
                      </span>
                    </div>
                  </div>

                  <!-- Controls: Slider & Buttons -->
                  <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-1.5">
                    <!-- Slider (Responsive & constrained by remaining budget) -->
                    <div class="flex-1 flex items-center gap-3">
                      <span class="text-[10px] text-slate-400 font-bold w-4">0</span>
                      <input type="range" min="0" :max="getMaxQuantity(item)" :value="allocations[item.name] || 0"
                        @input="e => updateAllocationValue(item.name, parseInt((e.target as HTMLInputElement).value))"
                        class="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-950" />
                      <span class="text-[10px] text-slate-400 font-bold w-12 text-right">Max</span>
                    </div>

                    <!-- Direct quantity adjuster buttons + numeric input -->
                    <div
                      class="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
                      <button @click="updateAllocationValue(item.name, (allocations[item.name] || 0) - 1)"
                        class="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shadow-3xs"
                        :disabled="(allocations[item.name] || 0) <= 0">
                        <Minus class="w-3.5 h-3.5" />
                      </button>

                      <input type="number" :value="allocations[item.name] || 0" @change="e => {
                        const val = parseInt((e.target as HTMLInputElement).value) || 0;
                        const max = getMaxQuantity(item);
                        updateAllocationValue(item.name, Math.min(max, val));
                      }"
                        class="w-16 text-center border-0 bg-transparent text-xs font-black text-slate-900 focus:ring-0" />

                      <button @click="updateAllocationValue(item.name, (allocations[item.name] || 0) + 1)"
                        class="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 flex items-center justify-center transition cursor-pointer shadow-3xs"
                        :disabled="getMaxQuantity(item) <= (allocations[item.name] || 0)">
                        <Plus class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Share & Publish Actions at the Bottom -->
              <div class="mt-6 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                <button @click="shareAllocationReceipt" :class="[
                  'w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer',
                  copied
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 shadow-xs'
                ]">
                  <Share2 class="w-3.5 h-3.5" />
                  {{ copied ? 'Copied to Clipboard! 📋' : 'Share Reallocation' }}
                </button>

                <button v-if="!isCustomMode" @click="publishReallocation" :disabled="publishedSuccess" :class="[
                  'w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer',
                  publishedSuccess
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-blue-900 border-blue-900 text-white hover:bg-blue-800'
                ]">
                  <Users class="w-3.5 h-3.5" />
                  {{ publishedSuccess ? 'Published Successfully! 🗳️' : 'Publish Reallocation' }}
                </button>
              </div>

              <!-- Community Consensus Aggregated Dashboard -->
              <div v-if="!isCustomMode && communitySubmissionsCount > 0"
                class="bg-blue-50 border border-blue-100 rounded-2xl p-5 mt-6 font-sans">
                <h3 class="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2">
                  <Users class="w-4 h-4 text-blue-900" />
                  Community Consensus ({{ communitySubmissionsCount }} submissions)
                </h3>
                <p class="text-xs text-slate-500 leading-relaxed mb-4">
                  Average percentage of budget allocated by other citizens for this contract:
                </p>
                <div class="space-y-3.5">
                  <div v-for="item in commoditiesList" :key="'consensus-' + item.id" class="text-xs">
                    <div class="flex justify-between font-bold text-slate-700 mb-1">
                      <span>{{ item.display_unit_name }}</span>
                      <span>{{ communityAverages[item.name] || 0 }}%</span>
                    </div>
                    <div class="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                      <div class="bg-blue-900 h-full rounded-full transition-all duration-300"
                        :style="{ width: (communityAverages[item.name] || 0) + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else-if="!isCustomMode"
                class="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mt-6 text-center text-xs text-slate-500 font-sans">
                No community allocations published yet. Be the first to submit!
              </div>
            </div>
          </div>
        </div>

        <!-- Comparative Civic Insight Banner -->
        <div
          class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-5 justify-between">
          <div class="flex items-start gap-4">
            <div class="p-3 bg-blue-100 text-blue-900 rounded-xl shrink-0">
              <CheckCircle2 class="w-6 h-6" />
            </div>
            <div>
              <h3 class="font-bold text-slate-900 text-sm">Visualizing the Opportunity Cost</h3>
              <p class="text-xs text-slate-500 mt-1 max-w-xl">
                When public funds are lost to anomalies or overpriced procurement contracts, this tool highlights
                exactly how many public school textbooks, fully functional classrooms, healthcare benefits, or daily
                wages could have otherwise been funded for citizens.
              </p>
            </div>
          </div>
          <button @click="toggleMode(!isCustomMode)"
            class="px-5 py-2.5 bg-blue-900 text-white hover:bg-blue-800 rounded-xl text-xs font-bold transition shadow-sm shrink-0 uppercase tracking-wider">
            {{ isCustomMode ? 'Show Flagged Anomalies' : 'Enter Custom Budget' }}
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: -600px 0;
  }

  100% {
    background-position: 600px 0;
  }
}

.skeleton-block {
  background: linear-gradient(90deg,
      #e2e8f0 25%,
      #f1f5f9 50%,
      #e2e8f0 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
