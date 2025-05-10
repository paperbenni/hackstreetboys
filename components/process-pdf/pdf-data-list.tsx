"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { OrderItemCategory } from "./order-item-category";
import { Button } from "@/components/ui/button";
import {
  extractJsonFromMarkdown,
} from "@/lib/utils";
import { OrderItemDialog } from "./order-item-dialog";
import { OrderItemDisplay } from "./order-item-display";
import DebugTab from "@/components/DebugTab";
import { Order, OrderCategory, OrderItemUnion, isOrder } from "./types";
import { OrderSummary } from "./order-summary";

interface PDFDataListProps {
  data: string;
  isLoading: boolean;
  rawMarkdown?: string;
  maxHeight?: string;
  error?: string | null;
  streaming?: boolean;
}

export function PDFDataList({
  data,
  isLoading,
  rawMarkdown = "",
  maxHeight = "70vh",
  error = null,
}: PDFDataListProps) {
  const [activeTab, setActiveTab] = useState<"data" | "debug">("data");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [parsedData, setParsedData] = useState<OrderItemUnion[]>([]);
  const [summary, setSummary] = useState<{
    [key: string]: { count: number; item: string };
  }>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Order | null>(null);

  // No need to reset tab now, since we always show debug tab when there's data
  useEffect(() => {
    if (!data && !rawMarkdown && activeTab === "debug") {
      setActiveTab("data");
    }
  }, [data, rawMarkdown, activeTab]);

  // Extract and parse JSON data from the response
  useEffect(() => {
    if (data) {
      try {
        // Extract JSON from markdown if needed
        const extractedJson = extractJsonFromMarkdown(data);
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
        let itemsArray: OrderItemUnion[] = [];

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
            itemsArray = arrays[0] as OrderItemUnion[];
          } else {
            // Wrap the object in an array if no arrays were found
            itemsArray = [parsedJson as OrderItemUnion];
          }
        }

        // Update state with parsed data
        if (itemsArray.length > 0) {
          setParsedData(itemsArray as OrderItemUnion[]);
          setJsonError(null);

          // Generate summary for required Artikel
          generateSummary(itemsArray as OrderItemUnion[]);
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
  }, [data]);

  // Generate a summary of article quantities for the required Artikel
  const generateSummary = (items: OrderItemUnion[]) => {
    const summary: { [key: string]: { count: number; item: string } } = {};

    const processItem = (item: OrderItemUnion, path: string = "") => {
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

    const findAllPaths = (items: OrderItemUnion[], path: string = "") => {
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
    return (
      <OrderItemCategory
        category={category}
        parentPath={parentPath}
        level={level}
        expandedCategories={expandedCategories}
        toggleCategory={toggleCategory}
        renderOrderItem={renderOrderItem}
        renderCategory={renderCategory}
      />
    );
  };

  // Render a single order item
  const renderOrderItem = (item: Order) => {
    return (
      <OrderItemDisplay 
        item={item} 
        onEdit={setEditingItem} 
      />
    );
  };

  // Handle updating an order item
  const handleUpdateItem = (updatedItem: Order) => {
    const updateItemInTree = (items: OrderItemUnion[]): OrderItemUnion[] => {
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
    return <OrderSummary summary={summary} title="Order Items Summary" />;
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
          Data View
        </Button>
        {(rawMarkdown || data) && (
          <Button
            variant={activeTab === "debug" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("debug")}
            className="text-xs px-3"
          >
            Debug View
          </Button>
        )}
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
                <div className="p-4">
                  <DebugTab 
                    markdown={rawMarkdown || data} 
                    maxHeight={maxHeight}
                    preventTruncation={true}
                  />
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
          item={editingItem as Order}
        />
      )}
    </div>
  );
}