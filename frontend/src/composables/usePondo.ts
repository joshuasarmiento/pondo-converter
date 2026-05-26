import { ref, watch } from 'vue';
import type { Anomaly, Commodity, ConversionData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'https://pondo-converter-yvw8.vercel.app/api';
const API_KEY = import.meta.env.VITE_API_KEY || 'COqDemyg9y4sCN3VYhuxJyGkhnMDcwLpavcSAWRnGL99ZfToaHpWOoBcNVqmgdyT';

export function usePondo() {
  const anomalies = ref<Anomaly[]>([]);
  const selectedAnomalyId = ref<string>('');
  const selectedAnomalyData = ref<ConversionData | null>(null);
  const searchQuery = ref<string>('');
  let searchTimeout: any = null;

  // Custom calculation mode state
  const isCustomMode = ref<boolean>(false);
  const customAmount = ref<number>(10000000); // Default: 10 Million PHP
  const commoditiesList = ref<Commodity[]>([]);
  const selectedRegion = ref<string>('NCR');

  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Fetch all anomalies with search filtering
  const fetchAnomalies = async (search: string = '') => {
    loading.value = true;
    error.value = null;
    try {
      const url = search
        ? `${API_URL}/anomalies?search=${encodeURIComponent(search)}`
        : `${API_URL}/anomalies`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch anomalies list.');
      anomalies.value = await res.json();

      // Auto-select first anomaly from the search result if current selected is not in the list anymore
      if (anomalies.value.length > 0) {
        const exists = anomalies.value.some(a => a.id === selectedAnomalyId.value);
        if (!exists) {
          selectedAnomalyId.value = anomalies.value[0].id;
          await fetchConversion(selectedAnomalyId.value);
        }
      }
    } catch (err: any) {
      error.value = err.message || 'An error occurred while connecting to the server.';
    } finally {
      loading.value = false;
    }
  };

  // Fetch commodities for the custom calculator
  const fetchCommodities = async () => {
    try {
      const res = await fetch(`${API_URL}/commodities?region=${selectedRegion.value}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch commodities list.');
      commoditiesList.value = await res.json();
    } catch (err) {
      console.error('Failed to prepare commodities list.', err);
    }
  };

  // Fetch conversions for selected anomaly
  const fetchConversion = async (anomalyId: string) => {
    if (!anomalyId) return;
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_URL}/convert/${anomalyId}?region=${selectedRegion.value}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch conversion results.');
      selectedAnomalyData.value = await res.json();
    } catch (err: any) {
      error.value = err.message || 'Failed to process conversion calculation.';
    } finally {
      loading.value = false;
    }
  };

  // Watch search query and search with debounce
  watch(searchQuery, (newVal) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      await fetchAnomalies(newVal);
    }, 300);
  });

  // Listen to anomaly dropdown changes
  watch(selectedAnomalyId, async (newVal) => {
    if (newVal && !isCustomMode.value) {
      await fetchConversion(newVal);
    }
  });

  // Listen to region changes to refetch details
  watch(selectedRegion, async () => {
    if (selectedAnomalyId.value && !isCustomMode.value) {
      await fetchConversion(selectedAnomalyId.value);
    }
    await fetchCommodities();
  });

  return {
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
  };
}
