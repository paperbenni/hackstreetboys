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
  streaming = false
}: PDFDataListProps) {
  const [activeTab, setActiveTab] = useState<"data" | "debug">("data");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [parsedData, setParsedData] = useState<OrderItemUnion[]>([]);
  const [summary, setSummary] = useState<{
    [key: string]: { count: number; item: string };
  }>({});
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Order | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isJsonData, setIsJsonData] = useState(false);

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
        // First try to parse as JSON directly
        try {
          const parsedJson = JSON.parse(data);
          handleJsonData(parsedJson);
          setIsJsonData(true);
          return;
        } catch (e) {
          // Not JSON, continue to try extracting from markdown
        }

        // Try to extract JSON from markdown
        const extractedJson = extractJsonFromMarkdown(data);
        if (extractedJson) {
          try {
            const parsedJson = JSON.parse(extractedJson);
            handleJsonData(parsedJson);
            setIsJsonData(true);
            return;
          } catch (e) {
            console.error("Failed to parse extracted JSON:", e);
          }
        }

        // If we get here, it's not JSON data
        setIsJsonData(false);
        setParsedData([]);
        setJsonError(null);
      } catch (err) {
        console.error("Error processing data:", err);
        setJsonError(
          `Error processing data: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        setIsJsonData(false);
      }
    }
  }, [data]);

  const handleJsonData = (parsedJson: any) => {
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
  };

  // Generate a summary of article quantities for the required Artikel
  const generateSummary = (items: OrderItemUnion[]) => {
    const summary: { [key: string]: { count: number; item: string } } = {};

    const processItem = (item: OrderItemUnion, path: string = "") => {
      if (isOrder(item)) {
        const sku = item.sku;
        const quantity = parseInt(item.quantity) || 1;
        const itemName = item.name;

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
      <OrderItemDisplay item={item} onEdit={setEditingItem} level={level} />
    );
  };

  // Handle updating an order item
  const handleUpdateItem = (updatedItem: Order) => {
    const updateItemInTree = (items: OrderItemUnion[]): OrderItemUnion[] => {
      return items.map((item) => {
        if (isOrder(item)) {
          if (
            editingItem &&
            item.sku === editingItem.sku &&
            item.name === editingItem.name
          ) {
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
    setParsedData((prev) => updateItemInTree(prev));

    // Regenerate summary
    generateSummary(parsedData);
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
          ) : isJsonData ? (
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
          ) : (
            <div className="p-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="py-4 px-6 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                  {data.split('\n').map((paragraph, index) => (
                    <p 
                      key={`paragraph-${index}`}
                      className="my-2 text-slate-800 dark:text-slate-300"
                    >
                      {paragraph}
                      {streaming && index === data.split('\n').length - 1 && (
                        <span className="inline-block animate-pulse">▋</span>
                      )}
                    </p>
                  ))}
                </div>
                {streaming && (
                  <div className="text-center mt-4 text-sm text-slate-500">
                    Processing... this may take a while for large documents
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
