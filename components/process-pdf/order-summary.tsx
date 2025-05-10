import React, { useState } from "react";
import { SummaryCategory, OrderSummary as OrderSummaryType } from "./types";
import { ChevronDown, ChevronRight, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderSummaryProps {
  summary: OrderSummaryType;
  title?: string;
}

export function OrderSummary({ summary, title = "Summary by Category" }: OrderSummaryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (Object.keys(summary).length === 0) {
    return null;
  }

  // Group items by SKU category
  const groupedItems: {
    [key: string]: SummaryCategory;
  } = {};

  // Define SKU categories
  const skuCategories: { [prefix: string]: string } = {
    "620": "Holztüren, Holzzargen",
    "670": "Stahltüren, Stahlzargen, Rohrrahmentüren",
    "660": "Haustüren",
    "610": "Glastüren",
    // Add more categories as needed
  };

  // Group items by SKU category
  Object.entries(summary).forEach(([sku, { count, item }]) => {
    // Determine the category based on SKU prefix
    const prefix = sku.substring(0, 3); // Adjust as needed for your SKU format
    const categoryName = skuCategories[prefix] || "Other";

    // Initialize the category if it doesn't exist
    if (!groupedItems[categoryName]) {
      groupedItems[categoryName] = {
        name: categoryName,
        items: [],
      };
    }

    // Add the item to the category
    groupedItems[categoryName].items.push({
      sku,
      name: item,
      count,
    });
  });

  // Sort entries by category name
  const sortedGroups = Object.values(groupedItems).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Count total items
  const totalItems = Object.values(summary).reduce((acc, { count }) => acc + count, 0);
  
  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  // Expand or collapse all categories
  const toggleAllCategories = () => {
    if (expandedCategories.size === sortedGroups.length) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(sortedGroups.map(group => group.name)));
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 mt-5 pt-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BarChart2 className="h-4 w-4 mr-2 text-slate-500" />
          <h3 className="text-sm font-medium">{title}</h3>
          <span className="ml-2 text-xs text-slate-500">
            ({totalItems} item{totalItems !== 1 ? 's' : ''} total)
          </span>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs"
            onClick={toggleAllCategories}
          >
            {expandedCategories.size === sortedGroups.length ? 'Collapse All' : 'Expand All'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="space-y-3">
          {sortedGroups.map((category) => {
            const isExpanded = expandedCategories.has(category.name);
            return (
              <div key={category.name} className="mb-3">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-md p-1.5"
                  onClick={() => toggleCategory(category.name)}
                >
                  <div className="flex items-center">
                    {isExpanded ? 
                      <ChevronDown className="h-3.5 w-3.5 mr-1.5 text-slate-400" /> : 
                      <ChevronRight className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                    }
                    <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {category.name}
                    </h4>
                    <span className="ml-2 text-xs text-slate-500">
                      ({category.items.reduce((sum, item) => sum + item.count, 0)} items)
                    </span>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="space-y-1 ml-8 mt-2">
                    {category.items.map((item) => (
                      <div
                        key={item.sku}
                        className="flex justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/30 px-3 py-1.5 rounded-sm"
                      >
                        <div className="flex-grow">
                          <span className="text-slate-500 mr-2">{item.sku}:</span>
                          {item.name}
                        </div>
                        <div className="text-right font-medium">
                          {item.count} {item.count === 1 ? "pc" : "pcs"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}