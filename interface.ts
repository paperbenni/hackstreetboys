interface Order {
  customerId?: string;
  sku: string;
  name: string;
  text: string;
  quantity: number;
  quantityUnit: string;
  price?: number;
  priceUnit?: string;
  commission: string;
  supplier?: 
}

interface OrderCategory {
    id: string;
    name: string;
    items?: Item[];
    subcategories?: Category[];
  content: OrderCategory[] | Order[];
}

