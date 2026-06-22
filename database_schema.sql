-- ==============================================
-- CafeOS - Complete Database Schema (Phase 4 Final)
-- ==============================================

-- 1. Core Config
CREATE TABLE public.cafes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    gstin TEXT,
    logo_url TEXT,
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE,
    currency TEXT DEFAULT '₹',
    gst_percentage NUMERIC DEFAULT 5,
    loyalty_earn_rate NUMERIC DEFAULT 5,
    loyalty_redeem_rate NUMERIC DEFAULT 0.1,
    default_billing_mode TEXT DEFAULT 'Pay After Service',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Staff & Shifts
CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    pin TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Active',
    deactivated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.shift_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_name TEXT NOT NULL,
    shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
    shift_end TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_cash NUMERIC NOT NULL DEFAULT 0,
    actual_cash NUMERIC NOT NULL DEFAULT 0,
    variance NUMERIC NOT NULL DEFAULT 0,
    total_upi NUMERIC NOT NULL DEFAULT 0,
    total_card NUMERIC NOT NULL DEFAULT 0,
    total_transactions INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Menu & Layout
CREATE TABLE public.menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    image TEXT,
    status TEXT DEFAULT 'Active',
    upsell_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 2,
    status TEXT DEFAULT 'Available',
    current_session JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inventory & Suppliers
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    current_stock NUMERIC DEFAULT 0,
    low_stock_threshold NUMERIC DEFAULT 0,
    unit_cost NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    qty_required NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Ordered',
    total_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.wastage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    qty_wasted NUMERIC NOT NULL,
    reason TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Orders, Customers & Billing
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mobile TEXT NOT NULL UNIQUE,
    name TEXT,
    visit_count INTEGER DEFAULT 1,
    total_spend NUMERIC DEFAULT 0,
    points INTEGER DEFAULT 0,
    last_visit DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number SERIAL,
    table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
    customer_id TEXT REFERENCES public.customers(mobile) ON DELETE SET NULL,
    status TEXT DEFAULT 'New',
    source TEXT DEFAULT 'Dine-In',
    notes TEXT,
    amount NUMERIC DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    price NUMERIC NOT NULL,
    variant_name TEXT
);

CREATE TABLE public.bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_number SERIAL,
    subtotal NUMERIC NOT NULL,
    tax NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    grand_total NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    mode TEXT NOT NULL,
    collected_by TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Analytics
CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    session_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
