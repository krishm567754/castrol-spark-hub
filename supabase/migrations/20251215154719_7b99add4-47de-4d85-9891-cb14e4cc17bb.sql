-- Create user_roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- Create sales executives master list
CREATE TABLE public.sales_executives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user sales executive access (which execs each user can see)
CREATE TABLE public.user_sales_exec_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sales_exec_id UUID REFERENCES public.sales_executives(id) ON DELETE CASCADE,
  has_all_access BOOLEAN DEFAULT false NOT NULL,
  UNIQUE(user_id, sales_exec_id)
);

-- Create invoices table (current + historical combined)
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  customer_code TEXT,
  customer_name TEXT NOT NULL,
  sales_exec_name TEXT,
  master_brand_name TEXT,
  product_brand_name TEXT,
  product_name TEXT,
  product_volume NUMERIC,
  total_value NUMERIC,
  state_name TEXT,
  district_name TEXT,
  is_current_year BOOLEAN DEFAULT true,
  fiscal_year TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  sales_executive TEXT,
  city TEXT,
  address TEXT,
  phone TEXT,
  gst TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create stock table
CREATE TABLE public.stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  pack_size TEXT,
  brand TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create open orders table
CREATE TABLE public.open_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL,
  order_date DATE NOT NULL,
  customer_code TEXT,
  customer_name TEXT,
  sales_exec_name TEXT,
  product_name TEXT,
  quantity NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create KPI configurations table (for admin-defined KPIs)
CREATE TABLE public.kpi_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_key TEXT NOT NULL UNIQUE,
  kpi_type TEXT NOT NULL, -- 'card' or 'report'
  icon_name TEXT,
  field_name TEXT NOT NULL,
  operator TEXT NOT NULL, -- 'equals', 'contains', 'starts_with', 'ends_with'
  field_value TEXT NOT NULL,
  aggregation_type TEXT NOT NULL, -- 'count_customers', 'count_invoices', 'sum_volume', 'sum_value'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_executives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sales_exec_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_configs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- Assign 'user' role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles (admins can manage, users can view own)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for sales_executives (admins manage, all can read)
CREATE POLICY "All users can view sales executives"
  ON public.sales_executives FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert sales executives"
  ON public.sales_executives FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sales executives"
  ON public.sales_executives FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sales executives"
  ON public.sales_executives FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_sales_exec_access
CREATE POLICY "Users can view own sales exec access"
  ON public.user_sales_exec_access FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sales exec access"
  ON public.user_sales_exec_access FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sales exec access"
  ON public.user_sales_exec_access FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sales exec access"
  ON public.user_sales_exec_access FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sales exec access"
  ON public.user_sales_exec_access FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for invoices (all authenticated users can read, admin can write)
CREATE POLICY "Authenticated users can view invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete invoices"
  ON public.invoices FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for customers (all authenticated users can read, admin can write)
CREATE POLICY "Authenticated users can view customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert customers"
  ON public.customers FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update customers"
  ON public.customers FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete customers"
  ON public.customers FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for stock (all authenticated users can read, admin can write)
CREATE POLICY "Authenticated users can view stock"
  ON public.stock FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert stock"
  ON public.stock FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update stock"
  ON public.stock FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete stock"
  ON public.stock FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for open_orders (all authenticated users can read, admin can write)
CREATE POLICY "Authenticated users can view open orders"
  ON public.open_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert open orders"
  ON public.open_orders FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete open orders"
  ON public.open_orders FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for kpi_configs (all authenticated users can read, admin can write)
CREATE POLICY "Authenticated users can view KPI configs"
  ON public.kpi_configs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert KPI configs"
  ON public.kpi_configs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update KPI configs"
  ON public.kpi_configs FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete KPI configs"
  ON public.kpi_configs FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for performance
CREATE INDEX idx_invoices_date ON public.invoices(invoice_date);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_code);
CREATE INDEX idx_invoices_sales_exec ON public.invoices(sales_exec_name);
CREATE INDEX idx_invoices_current_year ON public.invoices(is_current_year);
CREATE INDEX idx_open_orders_date ON public.open_orders(order_date);
CREATE INDEX idx_customers_code ON public.customers(customer_code);
CREATE INDEX idx_stock_code ON public.stock(product_code);