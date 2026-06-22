-- ==============================================
-- CafeOS - Phase 2 (Sprint 1) Schema Updates
-- ==============================================

-- 1. Add Upsell / Pairing rules to menu_items
ALTER TABLE public.menu_items
ADD COLUMN upsell_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL;

-- 2. Add default billing mode to settings
ALTER TABLE public.settings
ADD COLUMN default_billing_mode TEXT DEFAULT 'Pay After Service';

-- 3. Sprint 3: Inventory & Actionable Analytics Tables
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    unit TEXT NOT NULL, -- e.g., 'kg', 'L', 'pcs'
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
    status TEXT DEFAULT 'Ordered', -- Ordered, Received
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

CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL, -- e.g., 'qr_scan', 'menu_view', 'cart_add', 'order_submit', 'bill_paid'
    session_id TEXT, -- e.g. mobile number or table code
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
