export interface Order {
  sku: string;
  name: string;
  text: string;
  quantity: string;
  quantityUnit: string;
  price: string;
  priceUnit: string;
  commission: string;
  purchasePrice?: string;
  relevant?: boolean;
  unsure?: boolean;
}

export interface OrderCategory {
  name: string;
  content: OrderItemUnion[];
}

// Type to determine if an item is an Order or OrderCategory
export type OrderItemUnion = Order | OrderCategory;

// Helper function to check if an item is an Order or OrderCategory
export function isOrder(item: OrderItemUnion): item is Order {
  return "sku" in item;
}

// Summary related types
export interface SummaryItem {
  sku: string;
  name: string;
  count: number;
}

export interface SummaryCategory {
  name: string;
  items: SummaryItem[];
}

export interface OrderSummary {
  [key: string]: {
    count: number;
    item: string;
  };
}