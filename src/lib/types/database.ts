// ============================================================================
// Hand-written types mirroring supabase/migrations/*.sql.
//
// Once you've linked a real Supabase project you can replace this file with
// the generated equivalent for a guaranteed exact match:
//   npx supabase gen types typescript --project-id <ref> > src/lib/types/database.ts
// ============================================================================

export type PharmacyRole = "owner" | "manager" | "cashier" | "inventory_manager";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "other";
export type SaleStatus = "completed" | "refunded" | "partially_refunded";
export type MedicineStatusFlag = "active" | "inactive";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type ExpiryStatus = "none" | "ok" | "expiring_soon" | "expired";
export type InventoryTxType = "purchase" | "sale" | "adjustment" | "return" | "initial";
export type NotificationType =
  | "low_stock"
  | "out_of_stock"
  | "expiring_soon"
  | "expired"
  | "new_sale"
  | "purchase_recorded";

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pharmacy {
  id: string;
  owner_id: string;
  name: string;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  tax_number: string | null;
  currency: string;
  invoice_prefix: string;
  invoice_footer: string;
  tax_rate: number;
  expiry_alert_days: number;
  next_invoice_seq: number;
  created_at: string;
  updated_at: string;
}

export interface PharmacyUser {
  id: string;
  pharmacy_id: string;
  user_id: string;
  role: PharmacyRole;
  status: "active" | "suspended";
  created_at: string;
  profiles?: Pick<Profile, "id" | "full_name" | "avatar_url">;
}

export interface Category {
  id: string;
  pharmacy_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  pharmacy_id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  pharmacy_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Medicine {
  id: string;
  pharmacy_id: string;
  name: string;
  generic_name: string | null;
  brand: string | null;
  sku: string | null;
  barcode: string | null;
  category_id: string | null;
  manufacturer: string | null;
  supplier_id: string | null;
  batch_number: string | null;
  purchase_price: number;
  selling_price: number;
  quantity: number;
  min_stock_level: number;
  expiry_date: string | null;
  manufacturing_date: string | null;
  unit_type: string;
  tax_rate: number;
  discount_rate: number;
  description: string | null;
  status: MedicineStatusFlag;
  created_at: string;
  updated_at: string;
}

export interface MedicineStatusRow extends Medicine {
  stock_status: StockStatus;
  expiry_status: ExpiryStatus;
}

export interface MedicineWithRelations extends MedicineStatusRow {
  categories?: Pick<Category, "id" | "name"> | null;
  suppliers?: Pick<Supplier, "id" | "name"> | null;
}

export interface InventoryTransaction {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  type: InventoryTxType;
  quantity_change: number;
  quantity_after: number;
  reason: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Purchase {
  id: string;
  pharmacy_id: string;
  supplier_id: string | null;
  purchase_number: string;
  purchase_date: string;
  total_amount: number;
  amount_paid: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  suppliers?: Pick<Supplier, "id" | "name" | "company"> | null;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  medicine_id: string;
  batch_number: string | null;
  quantity: number;
  purchase_price: number;
  expiry_date: string | null;
  total: number;
  medicines?: Pick<Medicine, "id" | "name" | "unit_type"> | null;
}

export interface Sale {
  id: string;
  pharmacy_id: string;
  invoice_number: string;
  customer_id: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  cost_amount: number;
  profit_amount: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  customers?: Pick<Customer, "id" | "name" | "phone" | "email"> | null;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  medicine_id: string | null;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  cost_price: number;
  total: number;
  refunded_quantity: number;
}

export interface Invoice {
  id: string;
  pharmacy_id: string;
  sale_id: string;
  invoice_number: string;
  pharmacy_snapshot: {
    name: string;
    logo_url: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    tax_number: string | null;
    invoice_footer: string | null;
    currency: string;
  };
  customer_snapshot: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
  created_at: string;
}

export interface Expense {
  id: string;
  pharmacy_id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  payment_method: PaymentMethod;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  pharmacy_id: string;
  type: NotificationType;
  title: string;
  message: string;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CreateSaleItemInput {
  medicine_id: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  tax_amount?: number;
}

export interface CreatePurchaseItemInput {
  medicine_id: string;
  quantity: number;
  purchase_price: number;
  batch_number?: string;
  expiry_date?: string;
}

// ----------------------------------------------------------------------------
// Minimal "Database" shape so `createClient<Database>()` gets real type
// inference from supabase-js/postgrest-js. Insert/Update are simplified to
// Partial<Row> rather than spelling out every column's optionality — good
// enough to catch typos and shape mistakes across the app; swap in a real
// `supabase gen types` output for byte-exact generated types.
// ----------------------------------------------------------------------------

// supabase-js's GenericTable/GenericView require a `Relationships` array
// (foreign-key metadata used for nested `.select()` typing) and Row/Insert/
// Update to structurally satisfy `Record<string, unknown>`. A plain
// interface with only known properties does *not* satisfy an index
// signature in a strict `extends` check, so we intersect with
// `Record<string, unknown>` here (invisible to normal usage) rather than
// cluttering every interface above with an explicit index signature.
// An empty tuple `[]` satisfies `Relationships` without claiming any FK info.
type TableDef<Row> = {
  Row: Row & Record<string, unknown>;
  Insert: Partial<Row> & Record<string, unknown>;
  Update: Partial<Row> & Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      pharmacies: TableDef<Pharmacy>;
      pharmacy_users: TableDef<PharmacyUser>;
      categories: TableDef<Category>;
      suppliers: TableDef<Supplier>;
      customers: TableDef<Customer>;
      medicines: TableDef<Medicine>;
      inventory_transactions: TableDef<InventoryTransaction>;
      purchases: TableDef<Purchase>;
      purchase_items: TableDef<PurchaseItem>;
      sales: TableDef<Sale>;
      sale_items: TableDef<SaleItem>;
      invoices: TableDef<Invoice>;
      expenses: TableDef<Expense>;
      notifications: TableDef<AppNotification>;
    };
    Views: {
      medicine_status: { Row: MedicineStatusRow & Record<string, unknown>; Relationships: [] };
    };
    Functions: {
      create_sale: {
        Args: {
          p_pharmacy_id: string;
          p_items: CreateSaleItemInput[];
          p_customer_id?: string | null;
          p_payment_method?: PaymentMethod;
          p_notes?: string | null;
        };
        Returns: Sale;
      };
      refund_sale: { Args: { p_sale_id: string; p_reason?: string | null }; Returns: Sale };
      create_purchase: {
        Args: {
          p_pharmacy_id: string;
          p_items: CreatePurchaseItemInput[];
          p_supplier_id?: string | null;
          p_purchase_date?: string;
          p_notes?: string | null;
          p_amount_paid?: number | null;
        };
        Returns: Purchase;
      };
      record_purchase_payment: { Args: { p_purchase_id: string; p_amount: number }; Returns: Purchase };
      adjust_stock: {
        Args: { p_medicine_id: string; p_quantity_change: number; p_reason?: string };
        Returns: Medicine;
      };
      seed_demo_data: { Args: { p_pharmacy_id: string }; Returns: undefined };
      add_staff_by_email: {
        Args: { p_pharmacy_id: string; p_email: string; p_role: PharmacyRole };
        Returns: PharmacyUser;
      };
      update_staff_role: {
        Args: { p_pharmacy_id: string; p_user_id: string; p_role: PharmacyRole };
        Returns: PharmacyUser;
      };
      is_pharmacy_member: { Args: { p_pharmacy_id: string }; Returns: boolean };
      current_pharmacy_role: { Args: { p_pharmacy_id: string }; Returns: PharmacyRole | null };
    };
    Enums: Record<string, never>;
  };
};
