import React from "react";
import { AlertCircle, Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "./types";

interface OrderItemDisplayProps {
  item: Order;
  onEdit: (item: Order) => void;
  level?: number;
}

export function OrderItemDisplay({ item, onEdit, level = 0 }: OrderItemDisplayProps) {
  // Calculate left padding based on level - match the category indentation pattern
  const paddingLeft = `${(level * 24) + 12}px`;
  
  return (
    <div 
      className="flex items-start py-3 pr-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/50 text-sm mb-2 transition-all duration-200 transform hover:translate-x-1"
      style={{ paddingLeft }}
    >
      <Package className="h-5 w-5 mr-3 text-slate-500 flex-shrink-0 mt-0.5" />
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
                  <AlertCircle className="h-4.5 w-4.5 ml-2 text-amber-500 flex-shrink-0 cursor-help transition-transform duration-200 group-hover:scale-125" />
                  <div className="absolute z-50 invisible group-hover:visible top-full mt-1 left-0 overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-950 shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                  <p>This item has some uncertainty in the data</p>
                </div>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            <Pencil className="h-4 w-4 text-slate-500" />
            <span className="sr-only">Edit item</span>
          </Button>
        </div>

        <div className="text-slate-700 dark:text-slate-300 mt-2">
          {item.text && (
            <p className="text-xs mt-2 text-slate-600 dark:text-slate-400">
              {item.text}
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
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
}