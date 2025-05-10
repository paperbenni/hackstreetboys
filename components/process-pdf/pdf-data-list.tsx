"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight,
  ChevronDown,
  Package,
  Folder,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  extractJsonFromMarkdown,
} from "@/lib/utils";
import { OrderItemDialog } from "./order-item-dialog";

// Define interfaces as specified in the schema
interface Order {
  sku: string;
  name: string;
  text: string;
  quantity: string;
  quantityUnit: string;
  price: string;
  priceUnit: string;
  commission: string;
  purchasePrice?: string;
  relevant?: boolean;
  unsure?: boolean;
}

interface OrderCategory {
  name: string;
  content: OrderItem[];
}

// Type to determine if an item is an Order or OrderCategory
type OrderItem = Order | OrderCategory;

// Helper function to check if an item is an Order or OrderCategory
function isOrder(item: OrderItem): item is Order {
  return "sku" in item;
}

interface PDFDataListProps {
  jsonData: string;
  isLoading: boolean;
  error: string | null;
}

export function PDFDataList({
  jsonData,
  isLoading,
  error,
}: PDFDataListProps) {
  const [activeTab, setActiveTab] = useState<"data" | "debug">("data");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [parsedData, setParsedData] = useState<OrderItem[]>([]);
  const [summary, setSummary] = useState<{
    [key: string]: { count: number; item: string };
  }>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Order | null>(null);

  // Extract and parse JSON data from the response
  useEffect(() => {
    if (jsonData) {
      try {
        // Extract JSON from markdown if needed
        const extractedJson = extractJsonFromMarkdown(jsonData);
        let parsedJson;

        try {
          parsedJson = JSON.parse(extractedJson);
        } catch (e) {
          console.error("Failed to parse JSON:", e);
          setJsonError(
            `Invalid JSON format: ${e instanceof Error ? e.message : String(e)}`,
          );
          return;
        }

        // Initialize itemsArray for different possible JSON structures
        let itemsArray: OrderItem[] = [];

        // Handle if the response is directly an array
        if (Array.isArray(parsedJson)) {
          itemsArray = parsedJson;
        }
        // Handle if items are in a nested property
        else if (parsedJson.items && Array.isArray(parsedJson.items)) {
          itemsArray = parsedJson.items;
        }
        // Handle if response has a content property that contains items
        else if (parsedJson.content && Array.isArray(parsedJson.content)) {
          itemsArray = parsedJson.content;
        }
        // Handle if there's a different structure entirely
        else {
          // Try to extract any array found in the JSON
          const arrays = Object.values(parsedJson).filter(
            (value) => Array.isArray(value),
          );
          if (arrays.length > 0) {
            // Use the first array found
            itemsArray = arrays[0] as OrderItem[];
          } else {
            // Wrap the object in an array if no arrays were found
            itemsArray = [parsedJson as OrderItem];
          }
        }

        // Update state with parsed data
        if (itemsArray.length > 0) {
          setParsedData(itemsArray as OrderItem[]);
          setJsonError(null);

          // Generate summary for required Artikel
          generateSummary(itemsArray as OrderItem[]);
        } else {
          setJsonError("No valid data found in the response.");
        }
      } catch (err) {
        console.error("Error processing JSON data:", err);
        setJsonError(
          `Error processing data: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
  }, [jsonData]);

  // Generate a summary of article quantities for the required Artikel
  const generateSummary = (items: OrderItem[]) => {
    const summary: { [key: string]: { count: number; item: string } } = {};

    const processItem = (item: OrderItem, path: string = "") => {
      if (isOrder(item)) {
        const sku = item.sku;
        const quantity = parseInt(item.quantity) || 1;
        const itemName = item.name;
        // We don't need to track the path for orders, but we keep the code commented for future use
        // const fullPath = path ? `${path} / ${itemName}` : itemName;

        // Create a key based on SKU to track quantities
        if (sku) {
          if (!summary[sku]) {
            summary[sku] = { count: 0, item: itemName };
          }
          summary[sku].count += quantity;
        }
      } else if (item.content) {
        const categoryName = item.name;
        const newPath = path ? `${path} / ${categoryName}` : categoryName;

        // Process all items in this category
        item.content.forEach((subItem) => processItem(subItem, newPath));
      }
    };

    // Process all items starting with the root items
    items.forEach((item) => processItem(item));

    // Update state with the generated summary
    setSummary(summary);
  };

  const toggleCategory = (categoryPath: string) => {
    setExpandedCategories((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(categoryPath)) {
        newExpanded.delete(categoryPath);
      } else {
        newExpanded.add(categoryPath);
      }
      return newExpanded;
    });
  };

  const expandAll = () => {
    const newExpanded = new Set<string>();

    const findAllPaths = (items: OrderItem[], path: string = "") => {
      items.forEach((item) => {
        if (!isOrder(item)) {
          const categoryName = item.name;
          const newPath = path ? `${path}-${categoryName}` : categoryName;
          newExpanded.add(newPath);

          if (item.content && Array.isArray(item.content)) {
            findAllPaths(item.content, newPath);
          }
        }
      });
    };

    findAllPaths(parsedData);
    setExpandedCategories(newExpanded);
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Render a category with its content
  const renderCategory = (
    category: OrderCategory,
    parentPath: string,
    level: number,
  ) => {
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
  };

  // Render a single order item
  const renderOrderItem = (item: Order) => {
    return (
      <div className="flex items-start p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/30 text-sm">
        <Package className="h-4 w-4 mr-2 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="font-medium">{item.name || "Unnamed item"}</span>
              {item.relevant === false && (
                <div className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
                  Optional
                </div>
              )}
              {item.unsure && (
                <div className="relative group">
                  <AlertCircle className="h-3.5 w-3.5 ml-2 text-amber-500 flex-shrink-0 cursor-help" />
                  <div className="absolute z-50 invisible group-hover:visible top-full mt-1 left-0 overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-950 shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                    <p>This item has some uncertainty in the data</p>
                  </div>
                </div>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setEditingItem(item);
              }}
            >
              <Pencil className="h-3.5 w-3.5 text-slate-500" />
              <span className="sr-only">Edit item</span>
            </Button>
          </div>

          <div className="text-slate-700 dark:text-slate-300 mt-1">
            {item.text && (
              <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">
                {item.text}
              </p>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
              {item.sku && (
                <div className="text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    SKU:
                  </span>{" "}
                  {item.sku}
                </div>
              )}

              {item.quantity && (
                <div className="text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Quantity:
                  </span>{" "}
                  {item.quantity} {item.quantityUnit || ""}
                </div>
              )}

              {item.price && (
                <div className="text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Price:
                  </span>{" "}
                  {item.price} {item.priceUnit || "€"}
                </div>
              )}

              {item.commission && (
                <div className="text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Commission:
                  </span>{" "}
                  {item.commission}
                </div>
              )}

              {item.purchasePrice && (
                <div className="text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Purchase Price:
                  </span>{" "}
                  {item.purchasePrice}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Handle updating an order item
  const handleUpdateItem = (updatedItem: Order) => {
    const updateItemInTree = (items: OrderItem[]): OrderItem[] => {
      return items.map(item => {
        if (isOrder(item)) {
          if (editingItem && item.sku === editingItem.sku && item.name === editingItem.name) {
            // This is the item we want to update
            return { ...item, ...updatedItem };
          }
          return item;
        } else if (item.content) {
          // Recursively update items in the category
          return {
            ...item,
            content: updateItemInTree(item.content),
          };
        }
        return item;
      });
    };
    
    // Update the parsed data
    setParsedData(prev => updateItemInTree(prev));
    
    // Regenerate summary
    generateSummary(parsedData);
  };

  // Render the summary of required Artikel
  const renderSummary = () => {
    if (Object.keys(summary).length === 0) {
      return null;
    }

    // Group items by SKU category
    const groupedItems: {
      [key: string]: {
        name: string;
        items: { sku: string; name: string; count: number }[];
      };
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
      a.name.localeCompare(b.name),
    );

    return (
      <div className="border-t border-slate-200 dark:border-slate-800 mt-4 pt-4">
        <h3 className="text-sm font-medium mb-2">Summary by Category</h3>
        <div className="space-y-3">
          {sortedGroups.map((category) => (
            <div key={category.name} className="mb-3">
              <h4 className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {category.name}
              </h4>
              <div className="space-y-1">
                {category.items.map((item) => (
                  <div
                    key={item.sku}
                    className="flex justify-between text-xs pb-1"
                  >
                    <div className="flex-grow">
                      <span className="text-slate-500 mr-1">{item.sku}:</span>
                      {item.name}
                    </div>
                    <div className="text-right">
                      {item.count} {item.count === 1 ? "pc" : "pcs"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center mb-4 space-x-2">
        <Button
          variant={activeTab === "data" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("data")}
          className="text-xs px-3"
        >
          Extracted Data
        </Button>
        <Button
          variant={activeTab === "debug" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("debug")}
          className="text-xs px-3"
        >
          Debug View
        </Button>
      </div>

      <Card className="flex-grow overflow-hidden">
        <CardContent className="p-0 h-full">
          {isLoading ? (
                <div className="p-4 animate-pulse">
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ) : error || jsonError ? (
                <div className="p-4 text-red-600 dark:text-red-400">
                  {error || jsonError}
                </div>
              ) : activeTab === "debug" ? (
                <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden">
                  <pre className="p-4 overflow-x-auto text-xs">
                    {jsonData}
                  </pre>
                </div>
              ) : (
                <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden">
              {/* Control buttons */}
              <div className="p-2 flex justify-end space-x-2 sticky top-0 z-10 bg-white dark:bg-slate-950 shadow-sm">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={expandAll}
                  className="text-xs h-7"
                >
                  Expand All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={collapseAll}
                  className="text-xs h-7"
                >
                  Collapse All
                </Button>
              </div>

              {/* Data content */}
              <div className="p-4">
                {parsedData.length > 0 ? (
                  <>
                    <div className="mb-6">
                      {parsedData.map((item, index) => (
                        <React.Fragment key={`root-${index}`}>
                          {isOrder(item)
                            ? renderOrderItem(item)
                            : renderCategory(item, "", 0)}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Summary section */}
                    {renderSummary()}
                  </>
                ) : (
                  <div className="text-slate-500 dark:text-slate-400">
                    No data available to display.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingItem && (
        <OrderItemDialog
          isOpen={Boolean(editingItem)}
          onClose={() => setEditingItem(null)}
          onSave={(updatedItem) => {
            handleUpdateItem(updatedItem);
            setEditingItem(null);
          }}
          item={editingItem}
        />
      )}
    </div>
  );
}