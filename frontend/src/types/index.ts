export interface User {
  id: number;
  email: string;
  role: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at?: string;
}

export interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  images: string; // JSON array of string URLs
  created_at?: string;
  average_rating?: number;
  reviews_count?: number;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  product_name: string;
  product_price: number;
  product_images: string; // JSON array string
  product_stock: number;
  created_at?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  product_price: number;
  quantity: number;
}

export interface Order {
  id: number;
  user_id: number | null;
  order_number: string;
  total_amount: number;
  status: string; // 'pending', 'shipped', 'delivered'
  shipping_address: string;
  payment_status: string;
  created_at?: string;
  items?: OrderItem[];
}

export interface Review {
  id: number;
  user_id: number;
  user_email?: string;
  product_id: number;
  rating: number; // 1-5
  comment: string;
  created_at?: string;
}
