import React from "react";
import { AlertCircle, Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Order } from "./types";

interface OrderItemDisplayProps {
  item: Order;
  onEdit: (item: Order) => void;
  level?: number;
  isHovered?: boolean;
  onHover: (isHovering: boolean) => void;
}

export function OrderItemDisplay({ 
  item, 
  onEdit, 
  level = 0,
  isHovered = false,
  onHover 
}: OrderItemDisplayProps) {
  // Calculate left padding based on level - match the category indentation pattern
  const paddingLeft = `${(level * 24) + 12}px`;
  
  return (
    <div 
      className={`flex items-start py-3 pr-3 rounded-md transition-all duration-200 transform hover:translate-x-1 ${
        isHovered 
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800' 
          : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
      }`}
      style={{ paddingLeft }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <Package className={`h-5 w-5 mr-3 flex-shrink-0 mt-0.5 ${
        isHovered ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
      }`} />
      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className={`font-medium ${isHovered ? 'text-indigo-900 dark:text-indigo-100' : ''}`}>
              {item.name || "Unnamed item"}
            </span>
            {item.relevant === false && (
              <div className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                isHovered 
                  ? 'bg-indigo-100 dark:bg-indigo-800/50' 
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                Optional
              </div>
            )}
            {item.unsure && (
              <div className="relative group">
                <AlertCircle className={`h-4.5 w-4.5 ml-2 flex-shrink-0 cursor-help transition-transform duration-200 group-hover:scale-125 ${
                  isHovered ? 'text-amber-600 dark:text-amber-400' : 'text-amber-500'
                }`} />
                <div className="absolute z-50 invisible group-hover:visible top-full mt-1 left-0 overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-950 shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
                  <p>This item has some uncertainty in the data</p>
                </div>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 w-7 p-0 rounded-full transition-all duration-200 ${
              isHovered 
                ? 'hover:bg-indigo-200 dark:hover:bg-indigo-800' 
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            <Pencil className={`h-4 w-4 ${isHovered ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
            <span className="sr-only">Edit item</span>
          </Button>
        </div>

        <div className={`mt-2 ${isHovered ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>
          {item.text && (
            <p className={`text-xs mt-2 ${
              isHovered 
                ? 'text-indigo-700 dark:text-indigo-300' 
                : 'text-slate-600 dark:text-slate-400'
            }`}>
              {item.text}
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
            {item.sku && (
              <div className="text-xs">
                <span className={`${
                  isHovered 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  SKU:
                </span>{" "}
                {item.sku}
              </div>
            )}

            {item.quantity && (
              <div className="text-xs">
                <span className={`${
                  isHovered 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  Quantity:
                </span>{" "}
                {item.quantity} {item.quantityUnit || ""}
              </div>
            )}

            {item.price && (
              <div className="text-xs">
                <span className={`${
                  isHovered 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  Price:
                </span>{" "}
                {item.price} {item.priceUnit || "€"}
              </div>
            )}

            {item.commission && (
              <div className="text-xs">
                <span className={`${
                  isHovered 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  Commission:
                </span>{" "}
                <span className={isHovered ? 'font-medium' : ''}>
                  {item.commission}
                </span>
              </div>
            )}

            {item.purchasePrice && (
              <div className="text-xs">
                <span className={`${
                  isHovered 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
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