"use server";

import dbConnect from "@/lib/db";
import User from "@/models/User";
import Product from "@/models/Product";
import RawMaterial from "@/models/RawMaterial";
import Inventory from "@/models/Inventory";
import BOM from "@/models/BOM";
import PurchaseOrder from "@/models/PurchaseOrder";
import SalesOrder from "@/models/SalesOrder";
import Finance from "@/models/Finance";
import Notification from "@/models/Notification";

/**
 * Verify database models and check collection counts
 * Only available in development environment
 */
export async function verifyDatabase() {
  try {
    // Only allow access in development environment
    const isDevMode = process.env.NODE_ENV === 'development';
    
    if (!isDevMode) {
      return {
        success: false,
        message: "This action is only available in development environment",
      };
    }
    
    // Connect to database
    await dbConnect();
    
    // Check if models exist/register models
    const modelResults = {
      User: !!User,
      Product: !!Product,
      RawMaterial: !!RawMaterial,
      Inventory: !!Inventory,
      BOM: !!BOM,
      PurchaseOrder: !!PurchaseOrder,
      SalesOrder: !!SalesOrder,
      Finance: !!Finance,
      Notification: !!Notification,
    };
    
    // Get model counts to verify tables exist in the database
    const userCount = await User.countDocuments();
    const productCount = await Product.estimatedDocumentCount();
    const rawMaterialCount = await RawMaterial.estimatedDocumentCount();
    const inventoryCount = await Inventory.estimatedDocumentCount();
    const bomCount = await BOM.estimatedDocumentCount();
    const purchaseOrderCount = await PurchaseOrder.estimatedDocumentCount();
    const salesOrderCount = await SalesOrder.estimatedDocumentCount();
    const financeCount = await Finance.estimatedDocumentCount();
    const notificationCount = await Notification.estimatedDocumentCount();
    
    return {
      success: true,
      message: "Database models verified",
      modelResults,
      counts: {
        users: userCount,
        products: productCount,
        rawMaterials: rawMaterialCount,
        inventory: inventoryCount,
        boms: bomCount,
        purchaseOrders: purchaseOrderCount,
        salesOrders: salesOrderCount,
        finance: financeCount,
        notifications: notificationCount,
      }
    };
  } catch (error) {
    console.error("Database verification error:", error);
    return {
      success: false,
      message: "Failed to verify database models",
      error: error.message,
    };
  }
}

/**
 * Seed the database with initial data (for development only)
 */
export async function seedDatabase() {
  try {
    // Only allow access in development environment
    const isDevMode = process.env.NODE_ENV === 'development';
    
    if (!isDevMode) {
      return {
        success: false,
        message: "This action is only available in development environment",
      };
    }
      // Connect to database
    await dbConnect();
    
    // Check if we already have data in any of the primary tables
    const existingData = {
      users: await User.countDocuments(),
      products: await Product.countDocuments(),
      rawMaterials: await RawMaterial.countDocuments(),
      inventory: await Inventory.countDocuments(),
      boms: await BOM.countDocuments(),
      purchaseOrders: await PurchaseOrder.countDocuments(),
      salesOrders: await SalesOrder.countDocuments(),
      finance: await Finance.countDocuments(),
      notifications: await Notification.countDocuments(),
    };
    
    // Calculate the total number of documents across all collections
    const totalDocuments = Object.values(existingData).reduce((sum, count) => sum + count, 0);
    
    // If any table has data, show which ones and ask for confirmation
    if (totalDocuments > 0) {
      const tablesWithData = Object.entries(existingData)
        .filter(([_, count]) => count > 0)
        .map(([name, count]) => `${name}: ${count} documents`)
        .join('\n- ');
        
      return {
        success: true,
        message: "Database already contains data, skipping seed",
        existingData,
        tablesWithDataDetails: `The following tables already have data:\n- ${tablesWithData}`,
        needsConfirmation: true
      };    }
    
    // Create different types of users with various roles
    const password = "12345678";
    const users = await User.create([
      {
        name: "Admin User",
        email: "admin@example.com",
        password: password,
        role: "admin",
      },
      {
        name: "John Smith",
        email: "test1@example.com",
        password: password,
        role: "production",
      },
      {
        name: "Sarah Johnson",
        email: "test2@example.com",
        password: password,
        role: "procurement",
      },
      {
        name: "Mike Davis",
        email: "test3@example.com",
        password: password,
        role: "sales",
      },
      {
        name: "Emily Chen",
        email: "test4@example.com",
        password: password,
        role: "finance",
      },
      {
        name: "Regular User",
        email: "test5@example.com",
        password: password,
        role: "user",
      }
    ]);
    
    const adminUser = users[0];
    const productionUser = users[1];
    const procurementUser = users[2];
    const salesUser = users[3];
    const financeUser = users[4];
    const regularUser = users[5];
      // Add some sample raw materials
    const rawMaterials = await RawMaterial.create([
      {
        name: "Steel Sheet",
        description: "High quality steel sheet, 1mm thickness",
        unit: "sheet",
        price: 25.50,
        supplier: "Metal Supplies Ltd",
        created_by: adminUser._id
      },
      {        name: "Aluminum Rod",
        description: "Aluminum rod, 10mm diameter",
        unit: "meter",
        price: 8.75,
        supplier: "Metal Supplies Ltd",
        created_by: adminUser._id
      },
      {
        name: "Plastic Granules",
        description: "High-density polyethylene granules",
        unit: "kg",
        price: 3.20,
        supplier: "Plastics International",
        created_by: adminUser._id
      }
    ]);
    
    // Add inventory for raw materials
    for (const material of rawMaterials) {
      await Inventory.updateStock('raw_material', material._id, 100, { userId: adminUser._id });
    }
    
    // Add some sample products
    const products = await Product.create([
      {
        name: "Metal Chair",
        description: "Durable metal chair with ergonomic design",
        sku: "CHAIR-001",
        unit: "piece", // Added unit
        price: 75.00, // Changed selling_price to price
        created_by: adminUser._id
      },
      {
        name: "Metal Table",
        description: "Sturdy metal table for industrial use",
        sku: "TABLE-001",
        unit: "piece", // Added unit
        price: 120.00, // Changed selling_price to price
        created_by: adminUser._id
      }
    ]);
    
    // Add inventory for products
    for (const product of products) {
      await Inventory.updateStock('product', product._id, 20, { userId: adminUser._id });
    }
    
    // Create BOMs for products
    const chairBOM = await BOM.create({
      product_id: products[0]._id,
      description: "BOM for Metal Chair",
      items: [
        {
          raw_material_id: rawMaterials[0]._id,
          quantity: 2,
          unit: "sheet"
        },
        {
          raw_material_id: rawMaterials[1]._id,
          quantity: 4,
          unit: "meter"
        }
      ],
      created_by: adminUser._id
    });
      const tableBOM = await BOM.create({
      product_id: products[1]._id,
      description: "BOM for Metal Table",
      items: [
        {
          raw_material_id: rawMaterials[0]._id,
          quantity: 4,
          unit: "sheet"
        },
        {
          raw_material_id: rawMaterials[1]._id,
          quantity: 8,
          unit: "meter"
        }
      ],
      created_by: adminUser._id
    });
      // Create sample purchase orders
    const purchaseOrders = await PurchaseOrder.create([
      {
        supplier_name: "Metal Supplies Ltd",
        status: "received",
        items: [
          {
            raw_material_id: rawMaterials[0]._id,
            quantity: 50,
            price: 25.50
          },
          {
            raw_material_id: rawMaterials[1]._id,
            quantity: 100,
            price: 8.75
          }
        ],
        created_by: procurementUser._id
      },
      {
        supplier_name: "Plastics International",
        status: "placed",
        items: [
          {
            raw_material_id: rawMaterials[2]._id,
            quantity: 200,
            price: 3.20
          }
        ],
        created_by: procurementUser._id
      }
    ]);
    
    // Create sample sales orders
    const salesOrders = await SalesOrder.create([
      {
        customer_name: "ABC Manufacturing",
        status: "completed",
        payment_status: "paid",
        payment_amount: 300.00,
        items: [
          {
            product_id: products[0]._id,
            quantity: 2,
            price: 75.00
          },
          {
            product_id: products[1]._id,
            quantity: 1,
            price: 120.00
          }
        ],
        created_by: salesUser._id
      },
      {
        customer_name: "XYZ Corporation",
        status: "draft",
        payment_status: "unpaid",
        payment_amount: 0,
        items: [
          {
            product_id: products[0]._id,
            quantity: 5,
            price: 75.00
          }
        ],
        created_by: salesUser._id
      }
    ]);
    
    // Create sample finance entries
    const financeEntries = await Finance.create([
      {
        type: "income",
        source_type: "SalesOrder",
        source_id: salesOrders[0]._id,
        amount: 270.00,
        description: "Sales to ABC Manufacturing - Completed Order",
        category: "Sales",
        payment_method: "Bank Transfer",
        reference_number: "TXN-001",        created_by: financeUser._id
      },
      {
        type: "expense",
        source_type: "PurchaseOrder", 
        source_id: purchaseOrders[0]._id,
        amount: 1150.00,
        description: "Raw Material Purchase from Metal Supplies Ltd",
        category: "Raw Materials",
        payment_method: "Credit Card",
        reference_number: "PO-001",
        created_by: financeUser._id
      },
      {
        type: "expense",
        source_type: "Other",
        amount: 500.00,
        description: "Office rent payment",
        category: "Operating Expenses",
        payment_method: "Bank Transfer",
        reference_number: "RENT-001",
        created_by: financeUser._id
      },
      {
        type: "income",
        source_type: "Other",
        amount: 1000.00,
        description: "Initial capital investment",
        category: "Capital",
        payment_method: "Cash",
        reference_number: "CAP-001",
        created_by: adminUser._id
      }    ]);
    
    // Create sample notifications
    const notifications = await Notification.create([
      // Inventory alert for low stock
      {
        title: "Low Stock Alert: Steel Sheet",
        message: "Inventory level for Steel Sheet is 15, which is below the threshold of 20. Please restock soon.",
        type: "warning",        category: "inventory",
        priority: 2,
        user_id: procurementUser._id,
        source_type: "RawMaterial",
        source_id: rawMaterials[0]._id,
        action_url: `/inventory/raw-materials/${rawMaterials[0]._id}`
      },
      // Order status notification
      {
        title: "Sales Order Status Update: COMPLETED",
        message: "Sales order for ABC Manufacturing has been completed.",
        type: "success",
        category: "order",
        priority: 3,
        user_id: salesUser._id,
        source_type: "SalesOrder",
        source_id: salesOrders[0]._id,
        action_url: `/sales-orders/${salesOrders[0]._id}`
      },
      // Purchase order notification
      {
        title: "Purchase Order Status Update: RECEIVED",
        message: "Purchase order from Metal Supplies Ltd has been received.",
        type: "success",
        category: "order",
        priority: 3,
        user_id: procurementUser._id,
        source_type: "PurchaseOrder",
        source_id: purchaseOrders[0]._id,
        action_url: `/purchase-orders/${purchaseOrders[0]._id}`
      },
      // Production issue notification
      {
        title: "Production Issue: Metal Chair",
        message: "There is a production issue with Metal Chair: Quality control check failed.",
        type: "error",
        category: "production",
        priority: 1,
        user_id: productionUser._id,
        source_type: "Product",
        source_id: products[0]._id,
        action_url: `/products/${products[0]._id}`
      },
      // Finance alert
      {
        title: "Finance Alert: Payment",
        message: "Payment received from ABC Manufacturing for $270.00",
        type: "success",
        category: "finance",
        priority: 3,
        user_id: financeUser._id,
        source_type: "Finance",
        source_id: financeEntries[0]._id,
        action_url: `/finance/${financeEntries[0]._id}`
      },
      // System notification
      {
        title: "System Maintenance Scheduled",
        message: "System maintenance is scheduled for this weekend. Please save your work regularly.",
        type: "info",
        category: "system",
        priority: 4,
        user_id: adminUser._id,
        action_url: "/system/maintenance",
        expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
      },
      // Unread notification for testing
      {
        title: "New Feature Available",
        message: "New inventory tracking features are now available. Check out the updated dashboard!",
        type: "info",
        category: "system",
        priority: 4,
        read: false,
        user_id: adminUser._id,
        action_url: "/dashboard"
      },
      // Overdue payment notification
      {
        title: "Finance Alert: Overdue Payment",
        message: "Payment from XYZ Corporation is overdue. Please follow up on sales order.",        type: "warning",
        category: "finance",
        priority: 2,
        user_id: financeUser._id,
        source_type: "SalesOrder",
        source_id: salesOrders[1]._id,
        action_url: `/sales-orders/${salesOrders[1]._id}`
      }
    ]);
      return {
      success: true,
      message: "Database successfully seeded with initial data",
      data: {
        users: users.length,
        rawMaterials: rawMaterials.length,
        products: products.length,
        boms: 2,
        purchaseOrders: purchaseOrders.length,
        salesOrders: salesOrders.length,
        financeEntries: financeEntries.length,
        notifications: notifications.length
      }
    };
  } catch (error) {
    console.error("Database seed error:", error);
    return {
      success: false,
      message: "Failed to seed database",
      error: error.message,
    };
  }
}

/**
 * Clear all data from the database (for development only)
 * This is destructive and will delete all data
 */
export async function clearDatabase() {
  try {
    // Only allow access in development environment
    const isDevMode = process.env.NODE_ENV === 'development';
    
    if (!isDevMode) {
      return {
        success: false,
        message: "This action is only available in development environment",
      };
    }
    
    // Connect to database
    await dbConnect();
    
    // Drop all collections
    const collections = {
      notifications: await Notification.deleteMany({}),
      finance: await Finance.deleteMany({}), 
      salesOrders: await SalesOrder.deleteMany({}),
      purchaseOrders: await PurchaseOrder.deleteMany({}),
      inventory: await Inventory.deleteMany({}),
      boms: await BOM.deleteMany({}),
      products: await Product.deleteMany({}),
      rawMaterials: await RawMaterial.deleteMany({}),
      users: await User.deleteMany({})
    };
    
    const results = {};
    Object.entries(collections).forEach(([name, result]) => {
      results[name] = result.deletedCount;
    });
    
    return {
      success: true,
      message: "Database successfully cleared",
      deletedCounts: results
    };
  } catch (error) {
    console.error("Database clear error:", error);
    return {
      success: false,
      message: "Failed to clear database",
      error: error.message,
    };
  }
}
