import "server-only";

import { createClient } from "@supabase/supabase-js";

export const PRODUCT_IMAGES_BUCKET = "product-images";

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY не налаштовані");
  }
  return createClient(url, key);
}
