export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  expiry_date: string;
  location: string;
}

const STORAGE_KEY = "warung_inventory";

// Initialize with default inventory if none exists
const getDefaultInventory = (): InventoryItem[] => [
  {
    id: "1",
    sku: "NG-001",
    name: "Nasi Goreng",
    quantity: 45,
    expiry_date: "2024-02-15",
    location: "Aisle 1, Shelf A",
  },
  {
    id: "2",
    sku: "MA-001",
    name: "Mie Ayam",
    quantity: 32,
    expiry_date: "2024-02-20",
    location: "Aisle 1, Shelf B",
  },
  {
    id: "3",
    sku: "ETM-001",
    name: "Es Teh Manis",
    quantity: 15,
    expiry_date: "2024-01-25",
    location: "Aisle 2, Shelf C",
  },
  {
    id: "4",
    sku: "EJ-001",
    name: "Es Jeruk",
    quantity: 8,
    expiry_date: "2024-01-22",
    location: "Aisle 2, Shelf C",
  },
  {
    id: "5",
    sku: "AG-001",
    name: "Ayam Goreng",
    quantity: 28,
    expiry_date: "2024-02-10",
    location: "Aisle 1, Shelf A",
  },
  {
    id: "6",
    sku: "NG-002",
    name: "Nasi Goreng",
    quantity: 0,
    expiry_date: "2024-01-10",
    location: "Aisle 1, Shelf A",
  },
  {
    id: "7",
    sku: "SG-001",
    name: "Sate Ayam",
    quantity: 12,
    expiry_date: "2024-01-18",
    location: "Aisle 3, Shelf D",
  },
];

export const getInventory = (): InventoryItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    } else {
      // Initialize with default inventory
      const defaultInventory = getDefaultInventory();
      saveInventory(defaultInventory);
      return defaultInventory;
    }
  } catch {
    return [];
  }
};

export const saveInventory = (inventory: InventoryItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  } catch (error) {
    console.error("Failed to save inventory:", error);
  }
};

export const updateInventoryQuantity = (sku: string, quantityToDeduct: number): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const inventory = getInventory();
    const itemIndex = inventory.findIndex((item) => item.sku === sku);
    
    if (itemIndex === -1) {
      console.warn(`Inventory item with SKU ${sku} not found`);
      return false;
    }
    
    const item = inventory[itemIndex];
    const newQuantity = item.quantity - quantityToDeduct;
    
    if (newQuantity < 0) {
      console.warn(`Insufficient inventory for SKU ${sku}. Available: ${item.quantity}, Requested: ${quantityToDeduct}`);
      return false;
    }
    
    inventory[itemIndex] = {
      ...item,
      quantity: newQuantity,
    };
    
    saveInventory(inventory);
    return true;
  } catch (error) {
    console.error("Failed to update inventory:", error);
    return false;
  }
};

export const deductInventoryFromOrder = (orderItems: Array<{ sku: string; quantity: number }>): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const inventory = getInventory();
    const updatedInventory = [...inventory];
    let allDeducted = true;
    
    // First, validate that all items have sufficient quantity
    for (const orderItem of orderItems) {
      const inventoryItem = updatedInventory.find((item) => item.sku === orderItem.sku);
      if (!inventoryItem) {
        console.warn(`Inventory item with SKU ${orderItem.sku} not found`);
        allDeducted = false;
        break;
      }
      if (inventoryItem.quantity < orderItem.quantity) {
        console.warn(`Insufficient inventory for SKU ${orderItem.sku}. Available: ${inventoryItem.quantity}, Requested: ${orderItem.quantity}`);
        allDeducted = false;
        break;
      }
    }
    
    // If validation passed, deduct quantities
    if (allDeducted) {
      for (const orderItem of orderItems) {
        const itemIndex = updatedInventory.findIndex((item) => item.sku === orderItem.sku);
        if (itemIndex !== -1) {
          updatedInventory[itemIndex] = {
            ...updatedInventory[itemIndex],
            quantity: updatedInventory[itemIndex].quantity - orderItem.quantity,
          };
        }
      }
      saveInventory(updatedInventory);
    }
    
    return allDeducted;
  } catch (error) {
    console.error("Failed to deduct inventory from order:", error);
    return false;
  }
};

