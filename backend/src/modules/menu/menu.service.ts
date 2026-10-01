import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, asc } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service';
import { categories, menuItems } from '../../database/schema/menu.schema';
import { parseModifierGroups } from '../admin/menu-modifier.utils';

@Injectable()
export class MenuService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * GET /api/menu
   * Public endpoint for the QR web app.
   * Returns all active categories with their available menu items and modifiers.
   */
  async getMenu() {
    const restaurant = {
      name: this.configService.get<string>('RESTAURANT_NAME', 'Chaska & Chai Cafe'),
      tagline: 'Authentic Pakistani Street Burgers, Shawarma & Karak Chai',
      currencyCode: this.configService.get<string>('CURRENCY_CODE', 'PKR'),
      currencySymbol: this.configService.get<string>('CURRENCY_SYMBOL', 'Rs. '),
      serviceChargePercent: this.configService.get<number>('SERVICE_CHARGE_PERCENT', 5),
      taxPercent: this.configService.get<number>('TAX_PERCENT', 5),
    };

    // Query active categories with their available menu items ("86" filter) and modifiers
    const activeCategories = await this.databaseService.db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: [asc(categories.sortOrder)],
      with: {
        menuItems: {
          where: eq(menuItems.isAvailable, true),
          orderBy: [asc(menuItems.sortOrder)],
          with: {
            modifiers: true,
          },
        },
      },
    });

    const flatItems = activeCategories.flatMap((cat) =>
      cat.menuItems.map((item) => ({
        id: item.id,
        categoryId: item.categoryId,
        categoryName: cat.name,
        name: item.name,
        description: item.description,
        basePrice: item.basePrice,
        price: item.basePrice,
        imageUrl: item.imageUrl,
        image: item.imageUrl,
        isAvailable: item.isAvailable,
        isVegetarian: item.isVegetarian ?? false,
        isBestseller: item.isBestseller ?? false,
        isChefSpecial: item.isChefSpecial ?? false,
        spicyLevel: item.spicyLevel ?? 0,
        preparationTime: item.preparationTime || '10-15 mins',
        modifiers: item.modifiers.map((m) => ({
          id: m.id,
          name: m.name,
          priceExtra: m.priceExtra,
          price: m.priceExtra,
        })),
        modifierGroups: parseModifierGroups(item.modifiers).map((g) => ({
          id: g.id,
          name: g.name,
          minSelect: g.required ? 1 : 0,
          maxSelect: g.rule === 'radio' ? 1 : g.options.length,
          required: g.required,
          options: g.options.map((opt) => ({
            id: opt.id || opt.name,
            name: opt.name,
            price: opt.priceExtra,
          })),
        })),
      })),
    );

    return {
      restaurant,
      categories: activeCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
        icon: cat.icon,
        badge: cat.badge,
        itemsCount: cat.menuItems.length,
        items: cat.menuItems.map((item) => ({
          id: item.id,
          categoryId: item.categoryId,
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          price: item.basePrice,
          imageUrl: item.imageUrl,
          image: item.imageUrl,
          isAvailable: item.isAvailable,
          isVegetarian: item.isVegetarian ?? false,
          isBestseller: item.isBestseller ?? false,
          isChefSpecial: item.isChefSpecial ?? false,
          spicyLevel: item.spicyLevel ?? 0,
          preparationTime: item.preparationTime || '10-15 mins',
          modifiers: item.modifiers.map((m) => ({
            id: m.id,
            name: m.name,
            priceExtra: m.priceExtra,
          })),
          modifierGroups: parseModifierGroups(item.modifiers).map((g) => ({
            id: g.id,
            name: g.name,
            minSelect: g.required ? 1 : 0,
            maxSelect: g.rule === 'radio' ? 1 : g.options.length,
            required: g.required,
            options: g.options.map((opt) => ({
              id: opt.id || opt.name,
              name: opt.name,
              price: opt.priceExtra,
            })),
          })),
        })),
      })),
      items: flatItems,
    };
  }
}

