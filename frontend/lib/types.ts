export type Product = {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  inventory: number;
  imageUrls: string[];
  sellerId: string;
  reviews: Array<{ rating: number; comment: string; buyerName: string }>;
};

export type ProductPage = {
  items: Product[];
  total: number;
  page: number;
  pages: number;
};
