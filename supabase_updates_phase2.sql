-- ==============================================
-- CafeOS - Phase 2 (Sprint 1) Schema Updates
-- ==============================================

-- 1. Add Upsell / Pairing rules to menu_items
ALTER TABLE public.menu_items
ADD COLUMN upsell_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL;

-- (More columns for future sprints will be added here later)
