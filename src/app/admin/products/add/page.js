"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { 
  FiArrowLeft, 
  FiUploadCloud, 
  FiTrash2, 
  FiPlus, 
  FiCheck, 
  FiImage, 
  FiDollarSign, 
  FiLayers, 
  FiSliders, 
  FiInfo, 
  FiGrid 
} from "react-icons/fi";

// Imports from project services and utils
import { createProduct, getCollections, uploadProductImage } from "@/services/products";
import { slugify } from "@/utils/slugify";
import { formatPrice } from "@/utils/formatPrice";

// Predefined luxury categories
const CATEGORIES = [
  "Dresses & Kaftans",
  "Tops & Bralettes",
  "Skirts & Cover-ups",
  "Swimwear & Bikinis",
  "Bags & Clutches",
  "Hat & Hair Accessories",
  "Home Crochet Art"
];

// Visual colors matching CHBIKA brand palette + essentials
const COLOR_SWATCHES = [
  { name: "Warm White", hex: "#FAF8F3", textDark: true },
  { name: "Mediterranean Blue", hex: "#1D5FA7", textDark: false },
  { name: "Turquoise Sea", hex: "#48C7C7", textDark: true },
  { name: "Lemon Yellow", hex: "#F4C542", textDark: true },
  { name: "Bougainvillea Pink", hex: "#E85D8E", textDark: false },
  { name: "Olive Green", hex: "#6A8D57", textDark: false },
  { name: "Luxury Champagne", hex: "#D9C5A0", textDark: true },
  { name: "Terracotta Sunset", hex: "#D96B43", textDark: false },
  { name: "Corallo Coral", hex: "#F07167", textDark: false },
  { name: "Nero Black", hex: "#1E1E1E", textDark: false }
];

// Predefined crochet sizes
const STANDARD_SIZES = [
  { code: "XS", label: "Extra Small" },
  { code: "S", label: "Small" },
  { code: "M", label: "Medium" },
  { code: "L", label: "Large" },
  { code: "XL", label: "Extra Large" },
  { code: "Custom", label: "Made to Measure" }
];

export default function AddProductPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  // Database collections
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("10");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  // Selected Attributes
  const [selectedSizes, setSelectedSizes] = useState(["S", "M", "L"]);
  const [selectedColors, setSelectedColors] = useState(["Warm White", "Luxury Champagne"]);
  const [customColor, setCustomColor] = useState("");
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);

  // Images state
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch collections from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCollections();
        setCollections(data);
      } catch (err) {
        toast.error("Failed to load collections");
      } finally {
        setLoadingCollections(false);
      }
    }
    loadData();
  }, []);

  // Handle Drag & Drop
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      addImages(files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      addImages(files);
    }
  };

  const addImages = (files) => {
    // Filter only images
    const validImages = files.filter(file => file.type.startsWith("image/"));
    if (validImages.length === 0) {
      toast.warning("Please upload image files only");
      return;
    }

    setImageFiles(prev => [...prev, ...validImages]);

    // Create previews
    const newPreviews = validImages.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
    
    toast.success(`Added ${validImages.length} image(s) to gallery`);
  };

  const removeImage = (index) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle Size
  const toggleSize = (sizeCode) => {
    setSelectedSizes(prev => 
      prev.includes(sizeCode) 
        ? prev.filter(s => s !== sizeCode) 
        : [...prev, sizeCode]
    );
  };

  // Toggle Color
  const toggleColor = (colorName) => {
    setSelectedColors(prev => 
      prev.includes(colorName) 
        ? prev.filter(c => c !== colorName) 
        : [...prev, colorName]
    );
  };

  // Add Custom Color
  const handleAddCustomColor = (e) => {
    e.preventDefault();
    if (!customColor.trim()) return;
    
    if (!selectedColors.includes(customColor.trim())) {
      setSelectedColors(prev => [...prev, customColor.trim()]);
      toast.success(`Added custom color: ${customColor.trim()}`);
    }
    setCustomColor("");
    setShowCustomColorInput(false);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error("Please enter a product name");
      return;
    }
    if (!category) {
      toast.error("Please select a product category");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (salePrice && parseFloat(salePrice) >= parseFloat(price)) {
      toast.error("Sale price must be lower than standard price");
      return;
    }
    if (!description.trim()) {
      toast.error("Please provide a romantic editorial description");
      return;
    }
    if (imageFiles.length === 0) {
      toast.error("Please upload at least one beautiful image");
      return;
    }

    setIsSubmitting(true);
    setIsUploading(true);

    try {
      // 1. Upload Images to Supabase Storage
      toast.loading("Uploading Mediterranean visuals...", { id: "upload" });
      const uploadedUrls = [];
      for (const file of imageFiles) {
        const url = await uploadProductImage(file);
        uploadedUrls.push(url);
      }
      toast.dismiss("upload");

      // 2. Prepare Product Object
      const productPayload = {
        name: name.trim(),
        slug: slugify(name),
        description: description.trim(),
        details: details.trim(),
        price: parseFloat(price),
        sale_price: salePrice ? parseFloat(salePrice) : null,
        category,
        collection_id: collectionId || null,
        stock: parseInt(stock) || 0,
        sizes: selectedSizes,
        colors: selectedColors,
        images: uploadedUrls,
        is_featured: isFeatured,
        is_active: isActive,
        created_at: new Date().toISOString()
      };

      // 3. Save to Supabase DB
      toast.loading("Weaving product into database...", { id: "save" });
      const response = await createProduct(productPayload);
      toast.dismiss("save");

      if (response.success) {
        toast.success(`"Masterpiece '${name}' successfully listed"`, {
          duration: 4000,
        });
        
        // Soft redirect to dashboard
        setTimeout(() => {
          router.push("/admin/products");
        }, 1500);
      } else {
        toast.error(`Failed to publish: ${response.error}`);
      }
    } catch (err) {
      toast.error("An unexpected error occurred during creation");
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F3] px-4 py-8 md:px-12 md:py-12 lg:px-24">
      <Toaster position="top-right" richColors />
      
      {/* Navigation & Header */}
      <div className="mb-10 max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button 
            onClick={() => router.push("/admin/products")}
            className="flex items-center gap-2 text-sm uppercase tracking-widest text-[#1D5FA7] hover:text-[#48C7C7] transition-colors duration-300 font-sans mb-3 group"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" /> Back to Products
          </button>
          <span className="text-xs uppercase tracking-widest text-[#6A8D57] font-semibold">Morocco & Sicily Collection</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl text-[#1A1A1A] font-serif-luxury mt-1 font-light italic">
            Aggiungi Prodotto <span className="font-sans font-normal not-italic text-sm text-zinc-400">/ Add Masterpiece</span>
          </h1>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/admin/products")}
            className="px-6 py-3 border border-zinc-200 text-[#1A1A1A] hover:bg-zinc-50 rounded-xl transition-all duration-300 text-sm tracking-wide font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-[#1D5FA7] hover:bg-[#1D5FA7]/90 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 text-sm tracking-wider font-semibold flex items-center gap-2 cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Weaving...
              </>
            ) : (
              "Publish Masterpiece"
            )}
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Product Information (8 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Section 1: Basic Information */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-[#D9C5A0]/25 rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_rgba(217,197,160,0.06)]"
          >
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 mb-6">
              <FiInfo className="text-[#1D5FA7] text-lg" />
              <h2 className="text-xl font-serif text-[#1A1A1A] font-medium">1. Editorial Details</h2>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">Product Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sicily Bougainvillea Halter Dress"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#1D5FA7] focus:bg-white transition-all duration-300 text-zinc-800"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#1D5FA7] focus:bg-white transition-all duration-300 text-zinc-800 appearance-none cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">Collection</label>
                  <select 
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#1D5FA7] focus:bg-white transition-all duration-300 text-zinc-800 appearance-none cursor-pointer"
                    disabled={loadingCollections}
                  >
                    <option value="">No Collection</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">
                  Editorial Story (Description)
                </label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the Dolce Vita story of this piece. Describe the Sicilian summer breeze, Mediterranean colors, and hours of artisanal Moroccan crochet required to weave it..."
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#1D5FA7] focus:bg-white transition-all duration-300 text-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">
                  Care & Materials (Details)
                </label>
                <textarea 
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="e.g. 100% Organic Mediterranean Cotton. Hand-crocheted over 18 hours. Hand wash in cold water with delicate soap, dry flat."
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#1D5FA7] focus:bg-white transition-all duration-300 text-zinc-800"
                />
              </div>
            </div>
          </motion.div>

          {/* Section 2: Attributes */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white border border-[#D9C5A0]/25 rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_rgba(217,197,160,0.06)]"
          >
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 mb-6">
              <FiSliders className="text-[#48C7C7] text-lg" />
              <h2 className="text-xl font-serif text-[#1A1A1A] font-medium">2. Size & Color Palette</h2>
            </div>

            <div className="flex flex-col gap-6">
              {/* Sizes Selection */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-3">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {STANDARD_SIZES.map((sz) => {
                    const isSelected = selectedSizes.includes(sz.code);
                    return (
                      <button
                        key={sz.code}
                        type="button"
                        onClick={() => toggleSize(sz.code)}
                        className={`px-4 py-2 rounded-xl text-sm border transition-all duration-300 font-medium cursor-pointer ${
                          isSelected 
                            ? "bg-[#1D5FA7] border-[#1D5FA7] text-white shadow-sm" 
                            : "bg-[#FAF8F3] border-zinc-200 text-zinc-700 hover:border-[#1D5FA7]/40"
                        }`}
                        title={sz.label}
                      >
                        {sz.code}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colors Selection */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold">
                    Select Color Palette
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setShowCustomColorInput(!showCustomColorInput)}
                    className="text-xs text-[#1D5FA7] hover:text-[#48C7C7] font-semibold flex items-center gap-1 transition-colors duration-200"
                  >
                    <FiPlus /> Add Custom Color
                  </button>
                </div>

                {/* Custom Color Input */}
                <AnimatePresence>
                  {showCustomColorInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="flex gap-2 p-2 bg-[#FAF8F3] border border-[#D9C5A0]/30 rounded-xl">
                        <input
                          type="text"
                          value={customColor}
                          onChange={(e) => setCustomColor(e.target.value)}
                          placeholder="e.g. Sicilian Tangerine"
                          className="flex-1 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#1D5FA7]"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomColor}
                          className="bg-[#1D5FA7] text-white text-xs px-4 py-1.5 rounded-lg font-semibold hover:bg-[#1D5FA7]/90 transition-all cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Swatches Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {COLOR_SWATCHES.map((swatch) => {
                    const isSelected = selectedColors.includes(swatch.name);
                    return (
                      <button
                        key={swatch.name}
                        type="button"
                        onClick={() => toggleColor(swatch.name)}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all duration-300 text-left text-xs font-medium cursor-pointer ${
                          isSelected 
                            ? "border-[#1D5FA7] bg-[#1D5FA7]/5 shadow-sm" 
                            : "border-zinc-100 hover:border-zinc-300 bg-white"
                        }`}
                      >
                        <span 
                          className="w-5 h-5 rounded-full border border-zinc-200/50 flex-shrink-0 flex items-center justify-center" 
                          style={{ backgroundColor: swatch.hex }}
                        >
                          {isSelected && (
                            <FiCheck className={`text-[10px] ${swatch.textDark ? "text-zinc-900" : "text-white"}`} />
                          )}
                        </span>
                        <span className="truncate text-zinc-700">{swatch.name}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Custom Colors Tags */}
                {selectedColors.filter(c => !COLOR_SWATCHES.some(s => s.name === c)).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-zinc-100">
                    <span className="block text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-2">Custom Colors Selected:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedColors
                        .filter(c => !COLOR_SWATCHES.some(s => s.name === c))
                        .map(color => (
                          <span 
                            key={color} 
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-800 rounded-full text-xs font-semibold"
                          >
                            {color}
                            <button 
                              type="button" 
                              onClick={() => toggleColor(color)}
                              className="text-zinc-400 hover:text-red-500 font-bold"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Images, Pricing, Stock (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Section 3: Pricing & Inventory */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white border border-[#D9C5A0]/25 rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_rgba(217,197,160,0.06)]"
          >
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 mb-6">
              <FiDollarSign className="text-[#FAF8F3] bg-[#E85D8E] rounded-full p-0.5 text-lg" />
              <h2 className="text-xl font-serif text-[#1A1A1A] font-medium">3. Value & Stock</h2>
            </div>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">Price (DH)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="1200"
                      className="w-full pl-8 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#1D5FA7] focus:bg-white transition-all duration-300 text-zinc-800"
                    />
                    <span className="absolute left-3 top-3.5 text-xs text-zinc-400 font-semibold">DH</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">Sale Price (DH)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      placeholder="Optional"
                      className="w-full pl-8 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#1D5FA7] focus:bg-white transition-all duration-300 text-zinc-800"
                    />
                    <span className="absolute left-3 top-3.5 text-xs text-zinc-400 font-semibold">DH</span>
                  </div>
                </div>
              </div>

              {price && (
                <div className="p-3 bg-[#FAF8F3] border border-[#D9C5A0]/20 rounded-xl flex items-center justify-between text-xs font-medium text-zinc-600">
                  <span>Standard Price Displayed:</span>
                  <span className="font-semibold text-[#1A1A1A] text-sm">{formatPrice(price, 'MAD')}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2">Stock Pieces</label>
                  <input 
                    type="number" 
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-[#1D5FA7] focus:bg-white transition-all duration-300 text-zinc-800"
                  />
                </div>

                <div className="flex flex-col justify-end pb-1.5">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center cursor-pointer relative">
                      <input 
                        type="checkbox" 
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="sr-only peer"
                      />
                      <span className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6A8D57]"></span>
                      <span className="ml-3 text-xs uppercase tracking-wider text-zinc-500 font-bold select-none">Featured</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-1 pt-3 border-t border-zinc-100">
                <label className="flex items-center cursor-pointer relative">
                  <input 
                    type="checkbox" 
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D5FA7]"></span>
                  <span className="ml-3 text-xs uppercase tracking-wider text-zinc-500 font-bold select-none">Active / Visible in Shop</span>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Section 4: Media Gallery */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white border border-[#D9C5A0]/25 rounded-2xl p-6 md:p-8 shadow-[0_4px_20px_rgba(217,197,160,0.06)] flex-1"
          >
            <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 mb-6">
              <FiImage className="text-[#FAF8F3] bg-[#1D5FA7] rounded-full p-0.5 text-lg" />
              <h2 className="text-xl font-serif text-[#1A1A1A] font-medium">4. Editorial Gallery</h2>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center group bg-[#FAF8F3]/50 ${
                isDragOver 
                  ? "border-[#1D5FA7] bg-[#1D5FA7]/5" 
                  : "border-[#D9C5A0]/40 hover:border-[#1D5FA7] hover:bg-white"
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple 
                accept="image/*" 
                className="hidden" 
              />
              
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#D9C5A0]/20 mb-3 group-hover:scale-110 transition-transform duration-300">
                <FiUploadCloud className="text-[#1D5FA7] text-xl" />
              </div>
              
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">
                Upload Editorial Images
              </h3>
              <p className="text-xs text-zinc-400 max-w-[200px] leading-relaxed">
                Drag and drop your files here, or click to browse. Supports JPG, PNG, WebP.
              </p>
            </div>

            {/* Image Previews Grid */}
            {imagePreviews.length > 0 && (
              <div className="mt-6">
                <span className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-3">Gallery Preview ({imagePreviews.length})</span>
                <div className="grid grid-cols-2 gap-3">
                  <AnimatePresence>
                    {imagePreviews.map((preview, index) => (
                      <motion.div 
                        key={preview}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="group relative aspect-square bg-zinc-50 border border-zinc-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        <img 
                          src={preview} 
                          alt={`Product Preview ${index + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-[#6A8D57] text-white text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md shadow-sm">
                            Cover
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage(index);
                          }}
                          className="absolute top-2 right-2 bg-white/95 hover:bg-red-500 hover:text-white p-2 rounded-lg text-zinc-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
                          title="Remove Image"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        </div>

      </form>
    </div>
  );
}
