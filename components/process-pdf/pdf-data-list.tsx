"use client";
import { parse } from "best-effort-json-parser";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronRight,
  ChevronDown,
  Package,
  Folder,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  scrollableContainerStyle,
  ensureNoTruncation,
  extractJsonFromMarkdown,
} from "@/lib/utils";

// Define interfaces as specified in the schema
interface Order {
  sku: string;
  name: string;
  text: string;
  quantity: string;
  quantityUnit: string;
  price: string;
  priceUnit: string;
  purchasePrice: string;
  commission: string;
  relevant: boolean;
  unsure: boolean;
}

interface OrderCategory {
  name: string;
  content: (OrderCategory | Order)[];
}

// Type to determine if an item is an Order or OrderCategory
type OrderItem = Order | OrderCategory;

// Helper function to check if an item is an Order or OrderCategory
function isOrder(item: OrderItem): item is Order {
  return "sku" in item;
}

interface PDFDataListProps {
  data: string;
  isLoading: boolean;
  rawMarkdown?: string;
  maxHeight?: string;
  preventTruncation?: boolean;
}

export function PDFDataList({
  data,
  isLoading,
  rawMarkdown,
  maxHeight = "70vh",
  preventTruncation = true,
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

  // Extract and parse JSON data from the response
  useEffect(() => {
    if (!data) return;
    try {
      // Try to extract JSON from the input data
      const jsonString = extractJsonFromMarkdown(data);
      const parsed = parse(jsonString);

      if (Array.isArray(parsed)) {
        setParsedData(parsed);
        setJsonError(null);

        // Generate summary for required Artikel
        generateSummary(parsed);
      } else if (typeof parsed === "object") {
        // Handle case where the data might not be an array but an object with items property
        if (Array.isArray(parsed.items)) {
          setParsedData(parsed.items);
          setJsonError(null);

          // Generate summary for required Artikel
          generateSummary(parsed.items);
        } else {
          // Try to convert object to array if possible
          const itemsArray = Object.values(parsed);
          if (itemsArray.length > 0) {
            setParsedData(itemsArray as OrderItem[]);
            setJsonError(null);

            // Generate summary for required Artikel
            generateSummary(itemsArray as OrderItem[]);
          } else {
            setJsonError(
              "Data could not be displayed as it is not in the expected format",
            );
          }
        }
      } else {
        setJsonError("Invalid data format. Expected JSON array or object.");
      }
    } catch (error) {
      console.error("Failed to parse JSON data:", error);
      setJsonError(
        "Failed to parse JSON data. The data may be incomplete or in incorrect format.",
      );
    }
  }, [data]);

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
      } else if ("content" in item && Array.isArray(item.content)) {
        const categoryName = item.name;
        const newPath = path ? `${path} / ${categoryName}` : categoryName;

        // Recursively process all items in the category
        item.content.forEach((subItem) => {
          processItem(subItem, newPath);
        });
      }
    };

    // Process all top-level items
    items.forEach((item) => processItem(item));

    setSummary(summary);
  };

  // Toggle category expanded/collapsed state
  const toggleCategory = (categoryPath: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryPath)) {
      newExpanded.delete(categoryPath);
    } else {
      newExpanded.add(categoryPath);
    }
    setExpandedCategories(newExpanded);
  };

  // Expand all categories
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

  // Collapse all categories
  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  // Render a category and its children recursively
  const renderCategory = (
    item: OrderCategory,
    path: string = "",
    level: number = 0,
  ) => {
    const categoryName = item.name;
    const categoryPath = path ? `${path}-${categoryName}` : categoryName;
    const isExpanded = expandedCategories.has(categoryPath);

    return (
      <div key={categoryPath} className="mb-2">
        <div
          className={`flex items-center p-2 rounded-md cursor-pointer ${
            level === 0
              ? "bg-slate-100 dark:bg-slate-800"
              : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
          }`}
          onClick={() => toggleCategory(categoryPath)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 mr-2 text-slate-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-2 text-slate-500 flex-shrink-0" />
          )}
          <Folder
            className={`h-4 w-4 mr-2 ${level === 0 ? "text-indigo-500" : "text-slate-500"} flex-shrink-0`}
          />
          <span
            className={`font-medium ${level === 0 ? "text-base" : "text-sm"}`}
          >
            {categoryName}
          </span>
          <span className="ml-2 text-xs text-slate-500">
            ({item.content.length}{" "}
            {item.content.length === 1 ? "item" : "items"})
          </span>
        </div>

        {isExpanded && (
          <div className="pl-8 mt-1 space-y-1">
            {item.content.map((subItem, index) => (
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
      "680": "Tore",
      "240": "Beschläge",
      "330": "Türstopper",
      "450": "Lüftungsgitter",
      "290": "Türschließer",
      "360": "Schlösser / E-Öffner",
      DL8: "Wartung",
      DL5: "Arbeiten",
    };

    // Initialize categories
    Object.values(skuCategories).forEach((name) => {
      groupedItems[name] = { name, items: [] };
    });

    // Group items by SKU prefix
    Object.entries(summary).forEach(([sku, data]) => {
      let assignedCategory = false;

      // Find matching category based on SKU prefix
      Object.entries(skuCategories).forEach(([prefix, categoryName]) => {
        if (sku.startsWith(prefix)) {
          groupedItems[categoryName].items.push({
            sku,
            name: data.item,
            count: data.count,
          });
          assignedCategory = true;
        }
      });

      // If no category matches, add to "Other"
      if (!assignedCategory) {
        if (!groupedItems["Other"]) {
          groupedItems["Other"] = { name: "Other", items: [] };
        }
        groupedItems["Other"].items.push({
          sku,
          name: data.item,
          count: data.count,
        });
      }
    });

    // Filter out empty categories and sort items within each category
    const filteredGroups = Object.values(groupedItems).filter(
      (group) => group.items.length > 0,
    );
    filteredGroups.forEach((group) => {
      group.items.sort((a, b) => a.name.localeCompare(b.name));
    });

    if (filteredGroups.length === 0) return null;

    return (
      <div className="mt-4 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-md border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-sm mb-2">Required Artikel Summary</h3>

        <div className="space-y-3">
          {filteredGroups.map((group) => (
            <div key={group.name}>
              <h4 className="text-xs font-medium text-slate-500">
                {group.name}
              </h4>
              <ul className="mt-1 text-xs space-y-1 text-slate-800 dark:text-slate-200">
                {group.items.map((item) => (
                  <li key={item.sku}>
                    <strong>{item.count}</strong>{" "}
                    {item.name || `Items (SKU: ${item.sku})`}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full">
      {(data || isLoading) && (
        <Card className="w-full h-full border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/30 overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("data")}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "data"
                  ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              Order Data
            </button>
            {rawMarkdown && (
              <button
                onClick={() => setActiveTab("debug")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "debug"
                    ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                Raw JSON
              </button>
            )}
          </div>
          <CardContent className="p-0 h-full">
            <div>
              <div>
                {activeTab === "data" && (
                  <div
                    className="p-3 sm:p-6 pb-4 sm:pb-8 h-[calc(100%-40px)] scrollable"
                    style={{
                      ...scrollableContainerStyle(maxHeight),
                      ...(preventTruncation ? ensureNoTruncation() : {}),
                    }}
                  >
                    {isLoading && parsedData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 sm:py-12">
                        <div className="animate-pulse flex flex-col items-center space-y-3 sm:space-y-4 w-full">
                          <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                          <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5"></div>
                          <div className="h-3 sm:h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                        </div>
                      </div>
                    ) : jsonError ? (
                      <div className="p-4 bg-amber-50 dark:bg-slate-800/30 border border-amber-200 dark:border-amber-800/60 rounded-md text-amber-800 dark:text-amber-300">
                        <h3 className="font-medium mb-2 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Data Format Issue
                        </h3>
                        <p className="text-sm">{jsonError}</p>
                        <p className="text-sm mt-2">
                          Waiting for structured data to be extracted from the
                          document...
                        </p>
                      </div>
                    ) : (
                      <div className="prose prose-slate dark:prose-invert max-w-none h-full">
                        {/* Controls for expand/collapse */}
                        {parsedData.length > 0 && (
                          <div className="flex justify-end space-x-2 mb-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={expandAll}
                              className="text-xs h-7 px-2 py-0 bg-white dark:bg-transparent"
                            >
                              Expand All
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={collapseAll}
                              className="text-xs h-7 px-2 py-0 bg-white dark:bg-transparent"
                            >
                              Collapse All
                            </Button>
                          </div>
                        )}

                        {/* Summary section */}
                        {renderSummary()}

                        {/* Main content display */}
                        <div className="mt-4 space-y-3">
                          {parsedData.length > 0 ? (
                            parsedData.map((item, index) => (
                              <React.Fragment key={`root-${index}`}>
                                {isOrder(item)
                                  ? renderOrderItem(item)
                                  : renderCategory(item, "", 0)}
                              </React.Fragment>
                            ))
                          ) : (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                              No data available
                            </p>
                          )}
                        </div>

                        {isLoading && parsedData.length > 0 && (
                          <div className="text-center mt-4 text-sm text-slate-500">
                            Processing... this may take a while for large
                            documents
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "debug" && (
                  <div className="p-3 sm:p-6 h-[calc(100%-40px)]">
                    <div
                      className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700"
                      style={{
                        ...scrollableContainerStyle(maxHeight),
                        ...(preventTruncation ? ensureNoTruncation() : {}),
                      }}
                    >
                      <pre className="text-xs whitespace-pre-wrap overflow-auto no-truncate">
                        {data}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
