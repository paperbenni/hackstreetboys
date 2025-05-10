"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Order } from "./types";

interface OrderItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: Order) => void;
  item: Order;
}

export function OrderItemDialog({
  isOpen,
  onClose,
  onSave,
  item,
}: OrderItemDialogProps) {
  // Create state for each field
  const [sku, setSku] = useState(item.sku || "");
  const [name, setName] = useState(item.name || "");
  const [text, setText] = useState(item.text || "");
  const [quantity, setQuantity] = useState(item.quantity || "");
  const [quantityUnit, setQuantityUnit] = useState(item.quantityUnit || "");
  const [price, setPrice] = useState(item.price || "");
  const [priceUnit, setPriceUnit] = useState(item.priceUnit || "€");
  const [commission, setCommission] = useState(item.commission || "");
  const [purchasePrice, setPurchasePrice] = useState(item.purchasePrice || "");
  const [relevant, setRelevant] = useState(item.relevant !== false); // true by default
  const [unsure, setUnsure] = useState(item.unsure || false);

  // Using the 'on' prefix to indicate these are event handlers
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      sku,
      name,
      text,
      quantity,
      quantityUnit,
      price,
      priceUnit,
      commission,
      purchasePrice,
      relevant: relevant ? undefined : false,
      unsure: unsure || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Order Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">Description</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Quantity"
                type="text"
                inputMode="decimal"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantityUnit">Unit</Label>
              <Input
                id="quantityUnit"
                value={quantityUnit}
                onChange={(e) => setQuantityUnit(e.target.value)}
                placeholder="Unit (e.g., pcs)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price"
                type="text"
                inputMode="decimal"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <RadioGroup 
                value={priceUnit} 
                onValueChange={setPriceUnit}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="€" id="euro" />
                  <Label htmlFor="euro">€</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="$" id="dollar" />
                  <Label htmlFor="dollar">$</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commission">Commission</Label>
              <Input
                id="commission"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="Commission"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                id="purchasePrice"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="Purchase Price"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="relevant"
                checked={relevant}
                onCheckedChange={(checked) => setRelevant(checked as boolean)}
              />
              <Label htmlFor="relevant" className="font-normal">
                Required item (uncheck for optional items)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="unsure"
                checked={unsure}
                onCheckedChange={(checked) => setUnsure(checked as boolean)}
              />
              <Label htmlFor="unsure" className="font-normal">
                Mark as uncertain data
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="indigo">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}