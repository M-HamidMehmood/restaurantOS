'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { z } from 'zod';
import {
  AdminMenuItem,
  AdminCategory,
  AdminModifierGroup,
} from '@/types/admin';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Flame,
  Sparkles,
  Leaf,
  Layers,
  Utensils,
  DollarSign,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

// Zod Schema for Client-side Form Validation
const itemFormSchema = z.object({
  name: z.string().min(2, 'Item name must be at least 2 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
  basePrice: z.number().int().positive('Base price must be greater than 0'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isVegetarian: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  isChefSpecial: z.boolean().default(false),
  spicyLevel: z.number().int().min(0).max(3).default(0),
  preparationTime: z.string().default('10-15 mins'),
  isAvailable: z.boolean().default(true),
  modifierGroups: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'Group title is required'),
      rule: z.enum(['radio', 'checkbox']),
      required: z.boolean(),
      options: z.array(
        z.object({
          id: z.string().optional(),
          name: z.string().min(1, 'Option name cannot be empty'),
          priceExtra: z.number().min(0, 'Price delta cannot be negative'),
        })
      ),
    })
  ).default([]),
});

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: AdminMenuItem | null;
  categories: AdminCategory[];
  onSave: (data: any, id?: string) => Promise<any>;
}

export function MenuItemModal({
  isOpen,
  onClose,
  item,
  categories,
  onSave,
}: MenuItemModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'modifiers'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState<number | string>(350);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isChefSpecial, setIsChefSpecial] = useState(false);
  const [spicyLevel, setSpicyLevel] = useState<number>(0);
  const [preparationTime, setPreparationTime] = useState('10-15 mins');
  const [isAvailable, setIsAvailable] = useState(true);

  // Modifier Groups State
  const [modifierGroups, setModifierGroups] = useState<AdminModifierGroup[]>([]);

  // Synchronize when modal opens or item changes
  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategoryId(item.categoryId);
      setBasePrice(item.basePrice);
      setDescription(item.description || '');
      setImageUrl(item.imageUrl || item.image || '');
      setIsVegetarian(item.isVegetarian || false);
      setIsBestseller(item.isBestseller || false);
      setIsChefSpecial(item.isChefSpecial || false);
      setSpicyLevel(item.spicyLevel || 0);
      setPreparationTime(item.preparationTime || '10-15 mins');
      setIsAvailable(item.isAvailable !== undefined ? item.isAvailable : true);
      setModifierGroups(
        item.modifierGroups && item.modifierGroups.length > 0
          ? JSON.parse(JSON.stringify(item.modifierGroups))
          : []
      );
    } else {
      // Default empty form
      setName('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setBasePrice(350);
      setDescription('');
      setImageUrl('');
      setIsVegetarian(false);
      setIsBestseller(false);
      setIsChefSpecial(false);
      setSpicyLevel(0);
      setPreparationTime('10-15 mins');
      setIsAvailable(true);
      setModifierGroups([]);
    }
    setValidationErrors({});
    setActiveTab('details');
  }, [item, categories, isOpen]);

  if (!isOpen) return null;

  // Direct File Upload to Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size exceeds 2MB limit. Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        setImageUrl(dataUrl);
        toast.success('Image loaded successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  // Modifier Group Builders
  const handleAddGroup = () => {
    const newGroup: AdminModifierGroup = {
      id: `grp-${Date.now().toString(36)}`,
      name: 'Choice of Options',
      rule: 'checkbox',
      required: false,
      options: [
        { id: `opt-${Date.now().toString(36)}-1`, name: 'Option 1', priceExtra: 0 },
      ],
    };
    setModifierGroups([...modifierGroups, newGroup]);
  };

  const handleRemoveGroup = (groupId: string) => {
    setModifierGroups(modifierGroups.filter((g) => g.id !== groupId));
  };

  const handleUpdateGroup = (groupId: string, field: string, value: any) => {
    setModifierGroups(
      modifierGroups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          [field]: value,
          // When rule changes to radio, required often defaults to true
          ...(field === 'rule' && value === 'radio' ? { required: true } : {}),
        };
      })
    );
  };

  const handleAddOption = (groupId: string) => {
    setModifierGroups(
      modifierGroups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: [
            ...g.options,
            {
              id: `opt-${Date.now().toString(36)}-${g.options.length + 1}`,
              name: '',
              priceExtra: 0,
            },
          ],
        };
      })
    );
  };

  const handleRemoveOption = (groupId: string, optionIndex: number) => {
    setModifierGroups(
      modifierGroups.map((g) => {
        if (g.id !== groupId) return g;
        const newOptions = [...g.options];
        newOptions.splice(optionIndex, 1);
        return { ...g, options: newOptions };
      })
    );
  };

  const handleUpdateOption = (
    groupId: string,
    optionIndex: number,
    field: string,
    value: any
  ) => {
    setModifierGroups(
      modifierGroups.map((g) => {
        if (g.id !== groupId) return g;
        const newOptions = [...g.options];
        newOptions[optionIndex] = {
          ...newOptions[optionIndex],
          [field]: field === 'priceExtra' ? Number(value) || 0 : value,
        };
        return { ...g, options: newOptions };
      })
    );
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const formDishName = ((formData.get('name') as string) || name).trim();
    const formCatId = ((formData.get('categoryId') as string) || categoryId).trim();
    const formPrice = Number(formData.get('basePrice')) || Number(basePrice) || 0;
    const formDesc = ((formData.get('description') as string) ?? description).trim();
    const formImgUrl = ((formData.get('imageUrl') as string) ?? imageUrl).trim();

    const payload = {
      name: formDishName,
      categoryId: formCatId,
      basePrice: formPrice,
      description: formDesc,
      imageUrl: formImgUrl,
      isVegetarian,
      isBestseller,
      isChefSpecial,
      spicyLevel,
      preparationTime,
      isAvailable,
      modifierGroups: modifierGroups.map((g) => ({
        ...g,
        options: g.options.filter((opt) => opt.name.trim().length > 0),
      })),
    };

    // Validate with Zod
    const validation = itemFormSchema.safeParse(payload);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const path = err.path.join('.');
        errMap[path] = err.message;
      });
      setValidationErrors(errMap);
      const firstMsg = validation.error.errors[0]?.message || 'Please check form fields';
      toast.error(firstMsg);
      if (validation.error.errors.some((e) => e.path[0] === 'modifierGroups')) {
        setActiveTab('modifiers');
      }
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);
    try {
      await onSave(payload, item?.id);
      onClose();
    } catch (err) {
      // Error handled by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {item ? `Edit Dish: ${item.name}` : 'Add New Dish to Catalog'}
              </h2>
              <p className="text-xs text-stone-500">
                Configure dish pricing, image, tags, and customizable modifier groups
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 px-6 bg-white gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            Dish Details & Pricing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('modifiers')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'modifiers'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Modifier Groups ({modifierGroups.length})
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'details' ? (
            <div className="space-y-5">
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Dish Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Smash Double Cheeseburger"
                    className={`w-full px-3.5 py-2 text-xs bg-stone-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 ${
                      validationErrors.name ? 'border-red-500 bg-red-50/20' : 'border-stone-200'
                    }`}
                  />
                  {validationErrors.name && (
                    <p className="text-[10px] text-red-500 mt-1">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="categoryId"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Prep Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Base Price (PKR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                      Rs.
                    </span>
                    <input
                      name="basePrice"
                      type="number"
                      min="1"
                      required
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="e.g. 450"
                      className="w-full pl-10 pr-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Preparation Time
                  </label>
                  <input
                    name="preparationTime"
                    type="text"
                    value={preparationTime}
                    onChange={(e) => setPreparationTime(e.target.value)}
                    placeholder="e.g. 10-15 mins"
                    className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ingredients, cooking style, and appetizing description for diners..."
                  className="w-full px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
              </div>

              {/* Image Input & Preview */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Dish Image
                </label>
                <div className="flex gap-4 items-center">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt="Dish Preview"
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-400">
                        <ImageIcon className="w-6 h-6 stroke-1 mb-1" />
                        <span className="text-[9px] font-bold">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      name="imageUrl"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Paste Image URL (https://...)"
                      className="w-full px-3.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-stone-400">
                        PNG, JPG, or WebP up to 2MB
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dietary Flags & Attributes */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                <span className="text-xs font-bold text-stone-800 block">
                  Dietary Badges & Highlighting
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Vegetarian */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isVegetarian}
                      onChange={(e) => setIsVegetarian(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                      Vegetarian
                    </span>
                  </label>

                  {/* Bestseller */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isBestseller}
                      onChange={(e) => setIsBestseller(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      Bestseller
                    </span>
                  </label>

                  {/* Chef Special */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isChefSpecial}
                      onChange={(e) => setIsChefSpecial(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Chef Special
                    </span>
                  </label>
                </div>

                {/* Spicy Level */}
                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-700">Spiciness Level</span>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSpicyLevel(lvl)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          spicyLevel === lvl
                            ? 'bg-red-600 text-white'
                            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        {lvl === 0 ? 'None' : `${'🌶️'.repeat(lvl)}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Modifier / Variant Builder Tab */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-stone-900">Customization Groups</h3>
                  <p className="text-[11px] text-stone-500">
                    Add single-choice radios (e.g. Bun choice) or multi-choice checkboxes (e.g. Extra Toppings)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Group
                </button>
              </div>

              {modifierGroups.length === 0 ? (
                <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 space-y-2">
                  <Layers className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs font-medium">No modifier groups configured for this dish.</p>
                  <p className="text-[10px] text-stone-400">
                    Click "+ Add Group" to configure options like "Choice of Patty" or "Add-on Sauces".
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modifierGroups.map((group, gIdx) => (
                    <div
                      key={group.id}
                      className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200 space-y-4"
                    >
                      {/* Group Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                            Group Name
                          </label>
                          <input
                            type="text"
                            required
                            value={group.name}
                            onChange={(e) => handleUpdateGroup(group.id, 'name', e.target.value)}
                            placeholder="e.g. Choice of Patty, Add-on Sauces"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>

                        {/* Selection Rule & Required */}
                        <div className="flex items-center gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                              Selection Rule
                            </label>
                            <select
                              value={group.rule}
                              onChange={(e) => handleUpdateGroup(group.id, 'rule', e.target.value)}
                              className="px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-xl font-medium"
                            >
                              <option value="radio">Radio (Single Choice)</option>
                              <option value="checkbox">Checkbox (Multi Choice)</option>
                            </select>
                          </div>

                          <div className="pt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveGroup(group.id)}
                              title="Delete Group"
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="space-y-2 pt-2 border-t border-stone-200/60">
                        <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                          <span>Options & Price Delta (+Rs.)</span>
                          <button
                            type="button"
                            onClick={() => handleAddOption(group.id)}
                            className="text-amber-700 hover:text-amber-900 text-xs font-bold flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Option
                          </button>
                        </div>

                        {group.options.map((opt, oIdx) => (
                          <div key={opt.id || oIdx} className="flex items-center gap-2">
                            <input
                              type="text"
                              required
                              value={opt.name}
                              onChange={(e) =>
                                handleUpdateOption(group.id, oIdx, 'name', e.target.value)
                              }
                              placeholder="e.g. Extra Cheddar Slice"
                              className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <div className="relative w-28 shrink-0">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-stone-400 font-bold">
                                +Rs.
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={opt.priceExtra}
                                onChange={(e) =>
                                  handleUpdateOption(group.id, oIdx, 'priceExtra', e.target.value)
                                }
                                placeholder="0"
                                className="w-full pl-9 pr-2 py-1.5 text-xs bg-white border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(group.id, oIdx)}
                              className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="p-4 border-t border-stone-100 flex items-center justify-between bg-stone-50/50 -mx-6 -mb-6 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : item ? 'Save Changes' : 'Create Dish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
