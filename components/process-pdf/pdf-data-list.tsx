"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { OrderItemCategory } from "./order-item-category";
import { Button } from "@/components/ui/button";
import { extractJsonFromMarkdown } from "@/lib/utils";

import { OrderItemDialog } from "./order-item-dialog";
import { OrderItemDisplay } from "./order-item-display";
import DebugTab from "@/components/DebugTab";
import { Order, OrderCategory, OrderItemUnion, isOrder } from "./types";
import { OrderSummary } from "./order-summary";
import { parse } from "js2xmlparser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExportConfig, ExportConfigForm } from "./export-config";

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
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<Order | null>(null);

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
          const arrays = Object.values(parsedJson).filter((value) =>
            Array.isArray(value),
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
  const renderOrderItem = (item: Order, level: number = 0) => {
    return (
      <OrderItemDisplay 
        item={item} 
        onEdit={setEditingItem} 
        onDelete={(item) => setDeleteConfirmItem(item)}
        level={level} 
      />
    );
  };

  // Helper function to generate a unique signature for an order item
  const getItemSignature = (item: Order) => {
    return `${item.sku || ''}-${item.name || ''}-${item.quantity || ''}-${item.text || ''}-${item.price || ''}`;
  };

  // Handle deleting an order item
  const handleDeleteItem = (itemToDelete: Order) => {
    const itemToDeleteSignature = getItemSignature(itemToDelete);
    let deletedOne = false;
    
    const deleteItemFromTree = (items: OrderItemUnion[]): OrderItemUnion[] => {
      return items.reduce<OrderItemUnion[]>((acc, item) => {
        if (isOrder(item)) {
          // Skip the item to delete - only delete one instance with matching signature
          if (
            itemToDelete && 
            !deletedOne && 
            getItemSignature(item) === itemToDeleteSignature
          ) {
            deletedOne = true; // Mark as deleted to prevent multiple deletions
            return acc; // Skip this item (delete it)
          }
          acc.push(item);
        } else if (item.content) {
          // Recursively filter items in the category
          const filteredContent = deleteItemFromTree(item.content);
          // Only include categories that still have content after filtering
          if (filteredContent.length > 0) {
            acc.push({
              ...item,
              content: filteredContent,
            });
          }
        }
        return acc;
      }, []);
    };

    // Update the parsed data by removing the item
    setParsedData((prev) => {
      const updatedData = deleteItemFromTree(prev);
      // Regenerate summary with the updated data
      setTimeout(() => generateSummary(updatedData), 0);
      return updatedData;
    });
    setDeleteConfirmItem(null);
  };

  // Handle updating an order item
  const handleUpdateItem = (updatedItem: Order) => {
    const editingItemSignature = editingItem ? getItemSignature(editingItem) : '';
    let updatedOne = false;
    
    const updateItemInTree = (items: OrderItemUnion[]): OrderItemUnion[] => {
      return items.map((item) => {
        if (isOrder(item)) {
          if (
            editingItem && 
            !updatedOne && 
            getItemSignature(item) === editingItemSignature
          ) {
            // This is the item we want to update
            updatedOne = true; // Mark as updated to prevent multiple updates
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
    setParsedData((prev) => {
      const updatedData = updateItemInTree(prev);
      // Regenerate summary with the updated data
      setTimeout(() => generateSummary(updatedData), 0);
      return updatedData;
    });
  };

  // Render the summary of required Artikel
  const renderSummary = () => {
    return <OrderSummary summary={summary} title="Order Items Summary" />;
  };

  // Flatten the parsed data to get only Order items
  const flattenOrderItems = (items: OrderItemUnion[]): Order[] => {
    return items.reduce<Order[]>((acc, item) => {
      if (isOrder(item)) {
        acc.push(item);
      } else if (item.content) {
        // Recursively flatten items in categories
        acc.push(...flattenOrderItems(item.content));
      }
      return acc;
    }, []);
  };

  // Handle export functionality
  const handleExport = (config: ExportConfig) => {
    // Parse the data and copy to clipboard
    const xmlString = parse("order", config);
    navigator.clipboard
      .writeText(xmlString)
      .then(() => {
        console.log("Copied to clipboard!");
        setCopyStatus("Copied to clipboard!");
        setTimeout(() => setCopyStatus(null), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        setCopyStatus("Failed to copy!");
        setTimeout(() => setCopyStatus(null), 2000);
      });
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmItem !== null} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Order Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {deleteConfirmItem && (
              <div className="flex flex-col gap-2">
                <p><strong>Name:</strong> {deleteConfirmItem.name || "Unnamed item"}</p>
                {deleteConfirmItem.sku && <p><strong>SKU:</strong> {deleteConfirmItem.sku}</p>}
                {deleteConfirmItem.quantity && (
                  <p><strong>Quantity:</strong> {deleteConfirmItem.quantity} {deleteConfirmItem.quantityUnit || ""}</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmItem(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleDeleteItem(deleteConfirmItem!)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center mb-4 space-x-2">
        <Button
          variant={activeTab === "data" ? "indigo" : "outline"}
          size="sm"
          onClick={() => setActiveTab("data")}
          className="text-xs px-4 py-2 transition-all duration-200 hover:scale-105"
        >
          Data View
        </Button>
        {(rawMarkdown || data) && (
          <Button
            variant={activeTab === "debug" ? "indigo" : "outline"}
            size="sm"
            onClick={() => setActiveTab("debug")}
            className="text-xs px-4 py-2 transition-all duration-200 hover:scale-105"
          >
            Debug View
          </Button>
        )}
      </div>

      <Card className="flex-grow overflow-hidden shadow-lg">
        <CardContent className="p-0 h-full space-y-3">
          {isLoading ? (
            <div className="p-6 animate-pulse">
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
              <div className="h-5 w-1/2 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
              <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          ) : error || jsonError ? (
            <div className="p-6 text-red-600 dark:text-red-400 font-medium">
              {error || jsonError}
            </div>
          ) : activeTab === "debug" ? (
            <div className="p-6">
              <DebugTab
                markdown={rawMarkdown || data}
                maxHeight={maxHeight}
                preventTruncation={true}
              />
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden">
              {/* Control buttons */}
              <div className="p-4 flex justify-between sticky top-0 z-10 bg-white dark:bg-slate-950 shadow-md">
                <div className="flex items-center flex-col">
                  <ExportConfigForm 
                    items={flattenOrderItems(parsedData)}
                    onExportAction={handleExport}
                    defaultConfig={{
                      customerId: 1000,
                      type: "A",
                      shippingConditionId: 2,
                      commission: "Sägemühle"
                    }}
                  />
                  {copyStatus && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400 animate-fade-in">
                      {copyStatus}
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="indigo"
                    size="sm"
                    onClick={expandAll}
                    className="text-xs h-8 px-4 transition-all duration-200"
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="indigo"
                    size="sm"
                    onClick={collapseAll}
                    className="text-xs h-8 px-4 transition-all duration-200"
                  >
                    Collapse All
                  </Button>
                </div>
              </div>

              {/* Data content */}
              <div className="p-6 space-y-5">
                {parsedData.length > 0 ? (
                  <>
                    <div className="mb-8 space-y-5">
                      {parsedData.map((item, index) => (
                        <React.Fragment key={`root-${index}`}>
                          {isOrder(item)
                            ? renderOrderItem(item, 0)
                            : renderCategory(item, "", 0)}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Summary section */}
                    <div className="mt-8 pt-4 border-t">{renderSummary()}</div>
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
          onCloseAction={() => setEditingItem(null)}
          onSaveAction={(updatedItem) => {
            handleUpdateItem(updatedItem);
            setEditingItem(null);
          }}
          item={editingItem as Order}
        />
      )}
    </div>
  );
}
