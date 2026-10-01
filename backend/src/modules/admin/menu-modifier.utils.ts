export interface ParsedModifierOption {
  id?: string;
  name: string;
  priceExtra: number;
}

export interface ParsedModifierGroup {
  id: string;
  name: string;
  rule: 'radio' | 'checkbox';
  required: boolean;
  options: ParsedModifierOption[];
}

const MODIFIER_GROUP_REGEX = /^\[(.*?)\s*\|\s*(radio|checkbox)\s*\|\s*(req|opt)\]\s*(.*)$/i;

/**
 * Parses a flat list of itemModifiers rows into structured ModifierGroup objects.
 */
export function parseModifierGroups(
  modifiers: Array<{ id: string; name: string; priceExtra: number }>,
): ParsedModifierGroup[] {
  const groupsMap = new Map<string, ParsedModifierGroup>();

  modifiers.forEach((mod, idx) => {
    const match = mod.name.match(MODIFIER_GROUP_REGEX);
    let groupName = 'Add-ons & Extras';
    let rule: 'radio' | 'checkbox' = 'checkbox';
    let required = false;
    let optionName = mod.name.trim();

    if (match) {
      groupName = match[1].trim();
      rule = match[2].toLowerCase() === 'radio' ? 'radio' : 'checkbox';
      required = match[3].toLowerCase() === 'req';
      optionName = match[4].trim();
    }

    const groupKey = `${groupName}__${rule}__${required}`;
    let group = groupsMap.get(groupKey);

    if (!group) {
      group = {
        id: `grp-${groupsMap.size + 1}`,
        name: groupName,
        rule,
        required,
        options: [],
      };
      groupsMap.set(groupKey, group);
    }

    group.options.push({
      id: mod.id,
      name: optionName,
      priceExtra: mod.priceExtra ?? 0,
    });
  });

  return Array.from(groupsMap.values());
}

/**
 * Serializes structured ModifierGroup objects into individual item_modifier rows
 */
export function serializeModifierGroups(
  modifierGroups: Array<{
    name: string;
    rule: 'radio' | 'checkbox';
    required: boolean;
    options: Array<{ name: string; priceExtra: number }>;
  }>,
  menuItemId: string,
): Array<{ id: string; menuItemId: string; name: string; priceExtra: number }> {
  const rows: Array<{ id: string; menuItemId: string; name: string; priceExtra: number }> = [];

  modifierGroups.forEach((group, gIdx) => {
    const cleanGroupName = (group.name || `Group ${gIdx + 1}`).trim();
    const rule = group.rule === 'radio' ? 'radio' : 'checkbox';
    const reqStr = group.required ? 'req' : 'opt';

    (group.options || []).forEach((opt, oIdx) => {
      const cleanOptName = (opt.name || `Option ${oIdx + 1}`).trim();
      const serializedName = `[${cleanGroupName} | ${rule} | ${reqStr}] ${cleanOptName}`;
      const uniqueId = crypto.randomUUID();

      rows.push({
        id: uniqueId,
        menuItemId,
        name: serializedName,
        priceExtra: Number(opt.priceExtra) || 0,
      });
    });
  });

  return rows;
}
