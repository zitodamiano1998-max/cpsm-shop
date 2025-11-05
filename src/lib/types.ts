export type StockView = {
  id: number;
  sku: string | null;
  name: string;
  category_id: number | null;
  stock_qty: number;
  reorder_level: number;
  price_cents: number;
  cost_cents: number;
  active: boolean;
};

export type StaffRole = 'admin' | 'desk';

export type ProductLite = {
  id: number;
  name: string;
};