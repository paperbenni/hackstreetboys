"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Order } from "./types";
import { Download } from "lucide-react";

// Interface for the configuration of XML export
export interface ExportConfig {
  customerId: number;
  type: string;
  shippingConditionId: number;
  commission: string;
  items: Order[];
}

interface ExportConfigFormProps {
  items: Order[];
  onExportAction: (config: ExportConfig) => void;
  defaultConfig?: Partial<ExportConfig>;
}

export function ExportConfigForm({
  items,
  onExportAction,
  defaultConfig = {},
}: ExportConfigFormProps) {
  const [config, setConfig] = useState<Omit<ExportConfig, "items">>({
    customerId: defaultConfig.customerId || 1000,
    type: defaultConfig.type || "A",
    shippingConditionId: defaultConfig.shippingConditionId || 2,
    commission: defaultConfig.commission || "Sägemühle",
  });

  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof Omit<ExportConfig, "items">
  ) => {
    const value = e.target.value;
    
    setConfig((prev) => ({
      ...prev,
      [field]: field === "customerId" || field === "shippingConditionId" 
        ? parseInt(value) || 0 
        : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create complete config with items
    const completeConfig: ExportConfig = {
      ...config,
      items,
    };
    
    onExportAction(completeConfig);
    setIsFormOpen(false);
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Button 
          variant="default" 
          onClick={() => {
            // Export with current configuration
            const completeConfig: ExportConfig = {
              ...config,
              items,
            };
            onExportAction(completeConfig);
          }}
          size="sm"
          className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setIsFormOpen(!isFormOpen)}
          size="sm"
        >
          {isFormOpen ? "Hide Options" : "Configure"}
        </Button>
      </div>

      {isFormOpen && (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Export Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer ID</Label>
                  <Input
                    id="customerId"
                    type="number"
                    value={config.customerId}
                    onChange={(e) => handleInputChange(e, "customerId")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={config.type}
                    onChange={(e) => handleInputChange(e, "type")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="shippingConditionId">Shipping Condition ID</Label>
                  <Input
                    id="shippingConditionId"
                    type="number" 
                    value={config.shippingConditionId}
                    onChange={(e) => handleInputChange(e, "shippingConditionId")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission</Label>
                  <Input
                    id="commission"
                    value={config.commission}
                    onChange={(e) => handleInputChange(e, "commission")}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" size="sm">
                  Apply Configuration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}