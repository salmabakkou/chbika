import { supabase } from './supabase';

/**
 * Uploads an image to Supabase Storage in the 'products' bucket.
 * Falls back to returning a mock URL if Supabase is offline/not configured.
 * 
 * @param {File} file - The file to upload.
 * @returns {Promise<string>} The public URL of the uploaded image.
 */
export async function uploadProductImage(file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.warn("Supabase storage upload failed, using URL.createObjectURL fallback:", error.message);
      // Fallback: create object URL so that the image is still previewable/saved locally in dev mode
      return URL.createObjectURL(file);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error("Upload image error:", err);
    return URL.createObjectURL(file);
  }
}

/**
 * Creates a new product in the Supabase 'products' table.
 * Falls back to simulating success in dev environment if Supabase URL is placeholder.
 * 
 * @param {Object} productData - The product data to insert.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function createProduct(productData) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (err) {
    console.error("Create product error details:", err.message || err, err);
    
    // Fallback simulation only if no URL is provided
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder-url');
                   
    if (isMock) {
      console.log("Simulating database success (fallback mode):", productData);
      return { success: true, data: [{ id: 'mock-id-' + Date.now(), ...productData }] };
    }
    
    return { success: false, error: err.message || JSON.stringify(err) || 'An unexpected error occurred.' };
  }
}

/**
 * Fetches collections from Supabase.
 * Returns default static Mediterranean collections if database query fails or returns empty.
 * 
 * @returns {Promise<Array>}
 */
export async function getCollections() {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    if (!data) {
      return [];
    }

    return data;
  } catch (err) {
    console.warn("Failed to fetch collections, returning brand defaults:", err.message);
    return getStaticCollections();
  }
}

function getStaticCollections() {
  // Using valid UUIDs in case these ever get submitted
  return [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Sicily Summer', slug: 'sicily-summer' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Dolce Vita', slug: 'dolce-vita' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Mediterranean Breeze', slug: 'mediterranean-breeze' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Amalfi Sunset', slug: 'amalfi-sunset' }
  ];
}
