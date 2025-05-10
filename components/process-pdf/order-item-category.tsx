import React from "react";
import { ChevronRight, ChevronDown, Folder } from "lucide-react";
import { Order, OrderCategory, isOrder } from "./types";

interface OrderItemCategoryProps {
  category: OrderCategory;
  parentPath: string;
  level: number;
  expandedCategories: Set<string>;
  toggleCategory: (categoryPath: string) => void;
  renderOrderItem: (item: Order, level?: number) => React.ReactNode;
  renderCategory: (category: OrderCategory, parentPath: string, level: number) => React.ReactNode;
}

export function OrderItemCategory({
  category,
  parentPath,
  level,
  expandedCategories,
  toggleCategory,
  renderOrderItem,
  renderCategory
}: OrderItemCategoryProps) {
  const categoryName = category.name;
  const categoryPath = parentPath
    ? `${parentPath}-${categoryName}`
    : categoryName;
  const isExpanded = expandedCategories.has(categoryPath);
  const hasItems = category.content && category.content.length > 0;
  const orderCount = hasItems
    ? category.content.filter((item) => isOrder(item)).length
    : 0;
  const categoryCount = hasItems
    ? category.content.filter((item) => !isOrder(item)).length
    : 0;

  // Calculate indentation based on level - increase indent for each level
  const paddingLeft = `${(level * 24) + 12}px`;

  return (
    <div className="mb-3">
      <div
        className="flex items-center py-3 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-md transition-all duration-200 cursor-pointer transform hover:translate-x-1"
        style={{ paddingLeft }}
        onClick={() => toggleCategory(categoryPath)}
      >
        <div className="mr-2 text-slate-400">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
        <Folder className="h-5 w-5 mr-2 text-slate-500" />
        <span className="font-medium text-sm flex-grow ml-1">
          {categoryName || "Unnamed Category"}
        </span>
        {hasItems && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {orderCount > 0 && (
              <span className="mr-2">
                {orderCount} item{orderCount !== 1 && "s"}
              </span>
            )}
            {categoryCount > 0 && (
              <span>
                {categoryCount} folder{categoryCount !== 1 && "s"}
              </span>
            )}
          </div>
        )}
      </div>

      {isExpanded && hasItems && (
        <div className="mt-2 space-y-2" style={{ paddingLeft: `${(level * 24) + 36}px` }}>
          {category.content.map((subItem, index) => (
            <React.Fragment key={`${categoryPath}-${index}`}>
              {isOrder(subItem)
                ? renderOrderItem(subItem, level + 1)
                : renderCategory(subItem, categoryPath, level + 1)}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}