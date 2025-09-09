import { useState } from "react";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Button } from "@/components/button";

export default function MaterialForm({
  material,
  onSubmit,
  onCancel,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    name: material?.name || "",
    unit: material?.unit || "",
    price: material?.price || 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter material name"
          required
        />
      </div>
      <div>
        <Label htmlFor="unit">Unit</Label>
        <Input
          id="unit"
          value={formData.unit}
          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          placeholder="e.g., kg, lbs, pieces"
          required
        />
      </div>
      <div>
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          type="number"
          min="0"
          value={formData.price}
          onChange={(e) =>
            setFormData({
              ...formData,
              price: parseInt(e.target.value) || 0,
            })
          }
          placeholder="Enter price"
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : material ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
