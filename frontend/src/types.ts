export interface Anomaly {
  id: string;
  title: string;
  agency: string;
  contract_amount_php: number;
  date_awarded: string | null;
  contractor_name: string | null;
  philgeps_reference_no: string | null;
  source_url: string;
  status: string;
}

export interface Commodity {
  id: string;
  name: string;
  category: string;
  base_price_php: number;
  unit_of_measurement: string;
  base_unit_multiplier: number;
  display_unit_name: string;
  icon_slug: string;
  effective_date: string;
  source_url: string | null;
}

export interface ConversionItem {
  metric_name: string;
  quantity_equivalent: number;
  unit_cost: number;
  icon_slug: string;
  source_date: string;
}

export interface ConversionData {
  anomaly: {
    id: string;
    title: string;
    amount_php: number;
    agency: string;
    source: string;
    contractor_name: string | null;
    philgeps_reference_no: string | null;
    status: string;
  };
  conversions: ConversionItem[];
}
