import React from "react";
import { ChevronRight, ChevronDown, Folder } from "lucide-react";
import { Order, OrderCategory, isOrder } from "./types";

interface OrderItemCategoryProps {
  category: OrderCategory;
  parentPath: string;
  level: number;
  expandedCategories: Set<string>;
  toggleCategory: (categoryPath: string) => void;
  renderOrderItem: (item: Order) => React.ReactNode;
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

  return (
    <div className="mb-1">
      <div
        className={`flex items-center p-${
          level * 0.5 + 2
        } hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-md transition-colors cursor-pointer`}
        onClick={() => toggleCategory(categoryPath)}
      >
        <div className="mr-1 text-slate-400">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
        <Folder className="h-4 w-4 mr-2 text-slate-500" />
        <span className="font-medium text-sm flex-grow">
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
        <div className={`ml-${level * 2 + 4}`}>
          {category.content.map((subItem, index) => (
            <React.Fragment key={`${categoryPath}-${index}`}>
              {isOrder(subItem)
                ? renderOrderItem(subItem)
                : renderCategory(subItem, categoryPath, level + 1)}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}