export interface OrderItem {
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

export interface Order {
  customerId: string;
  commission: string;
  type: string;
  shippingConditionId: string;
  items: OrderItem[];
}

export interface MarkdownData {
  content: string;
  wordCount: number;
  characterCount: number;
}
