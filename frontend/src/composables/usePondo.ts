import { ref, watch } from 'vue';
import type { Anomaly, Commodity, ConversionData } from '../types';

const API_URL = 'http://localhost:3001/api';
const API_KEY = 'COqDemyg9y4sCN3VYhuxJyGkhnMDcwLpavcSAWRnGL99ZfToaHpWOoBcNVqmgdyT';

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
      commoditiesList.value = [
        {
          id: '1',
          name: "Well-Milled Rice",
          category: "Agriculture/Food",
          base_price_php: 52.0,
          unit_of_measurement: "kg",
          base_unit_multiplier: 50.0,
          display_unit_name: "50kg Sack of Well-Milled Rice",
          icon_slug: "rice-sack",
          effective_date: "2026-05-01",
          source_url: "https://www.da.gov.ph"
        },
        {
          id: '2',
          name: "Canned Sardines",
          category: "Food & Groceries",
          base_price_php: 22.0,
          unit_of_measurement: "can",
          base_unit_multiplier: 1.0,
          display_unit_name: "Can of Sardines (155g)",
          icon_slug: "sardines-can",
          effective_date: "2026-05-01",
          source_url: "https://www.dti.gov.ph"
        },
        {
          id: '3',
          name: "Instant Noodles",
          category: "Food & Groceries",
          base_price_php: 9.50,
          unit_of_measurement: "pack",
          base_unit_multiplier: 1.0,
          display_unit_name: "Instant Noodle Packet",
          icon_slug: "noodles-pack",
          effective_date: "2026-05-01",
          source_url: "https://www.dti.gov.ph"
        },
        {
          id: '4',
          name: "Daily Minimum Wage (NCR)",
          category: "Labor",
          base_price_php: 610.0,
          unit_of_measurement: "day",
          base_unit_multiplier: 1.0,
          display_unit_name: "Days of Minimum Wage (NCR)",
          icon_slug: "daily-wage",
          effective_date: "2026-05-01",
          source_url: "https://www.dole.gov.ph"
        },
        {
          id: '5',
          name: "Classroom Construction",
          category: "Infrastructure/Education",
          base_price_php: 2500000.0,
          unit_of_measurement: "classroom",
          base_unit_multiplier: 1.0,
          display_unit_name: "Standard Public School Classrooms",
          icon_slug: "classroom",
          effective_date: "2026-05-01",
          source_url: "https://www.deped.gov.ph"
        },
        {
          id: '6',
          name: "DepEd Textbook",
          category: "Education",
          base_price_php: 150.0,
          unit_of_measurement: "book",
          base_unit_multiplier: 1.0,
          display_unit_name: "Public School Textbooks",
          icon_slug: "textbook",
          effective_date: "2026-05-01",
          source_url: "https://www.deped.gov.ph"
        },
        {
          id: '7',
          name: "PhilHealth Monthly Premium",
          category: "Healthcare",
          base_price_php: 500.0,
          unit_of_measurement: "month",
          base_unit_multiplier: 1.0,
          display_unit_name: "Months of PhilHealth Coverage",
          icon_slug: "healthcare",
          effective_date: "2026-05-01",
          source_url: "https://www.philhealth.gov.ph"
        }
      ];
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
      const res = await fetch(`${API_URL}/convert/${anomalyId}`, {
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

  return {
    anomalies,
    selectedAnomalyId,
    selectedAnomalyData,
    searchQuery,
    isCustomMode,
    customAmount,
    commoditiesList,
    loading,
    error,
    fetchAnomalies,
    fetchCommodities,
    fetchConversion
  };
}
