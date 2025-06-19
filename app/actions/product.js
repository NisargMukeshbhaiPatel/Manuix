"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import BOM from "@/models/BOM";
import { createCollectionRBAC } from "@/lib/rbac";

const { withCreate, withRead, withUpdate, withDelete } = createCollectionRBAC("products");

/**
 * Get all products with pagination and filtering
 */
export const getProducts = withRead(async ({ page = 1, limit = 10, name = null } = {}) => {
  try {
    // Connect to the database
    await dbConnect();

    // Create the query
    const query = {};

    // Apply name filter if provided
    if (name) {
      query.name = { $regex: name, $options: "i" }; // Case-insensitive search
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Count total products for pagination
    const totalProducts = await Product.countDocuments(query);

    // Retrieve products with pagination
    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by newest first

    return {
      success: true,
      data: products.map((p) => p.toJSON()),
      pagination: {
        total: totalProducts,
        page,
        limit,
        pages: Math.ceil(totalProducts / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * Get a single product by ID
 */
export const getProductById = withRead(async (id) => {
  try {
    // Connect to the database
    await dbConnect();

    // Find the product by ID
    const product = await Product.findById(id);

    if (!product) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    // Additionally, get the inventory level if needed
    const inventoryLevel = await product.getInventoryLevel();

    return {
      success: true,
      data: {
        ...product.toJSON(),
        inventoryLevel,
      },
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    };
  }
});

/**
 * Create a new product
 */
export const createProduct = withCreate(async (productData) => {
  try {
    // Connect to the database
    await dbConnect();

    // Add the user ID who created the product
    const session = await getServerSession(authOptions);
    productData.created_by = session.user.id;

    // Create a new product
    const product = await Product.create(productData);

    return {
      success: true,
      data: product.toJSON(),
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

/**
 * Update an existing product
 */
export const updateProduct = withUpdate(async (id, productData) => {
  try {
    // Connect to the database
    await dbConnect();

    // Find the product by ID and update it
    const product = await Product.findByIdAndUpdate(id, productData, {
      new: true, // Return the updated document
      runValidators: true, // Run mongoose validation
    });

    if (!product) {
      return {
        success: false,
        message: "Product not found",
      };
    }
    return {
      success: true,
      product: product.toJSON(),
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      message: "Failed to update product",
      error: error.message,
    };
  }
});

/**
 * Delete a product
 */
export const deleteProduct = withDelete(async (id) => {
  try {
    // Connect to the database
    await dbConnect();

    // Get the product before deletion to check if it's in use
    const product = await Product.findById(id);

    if (!product) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    // Check if the product is used in any BOM or SalesOrder
    const isInUse = await product.isInInventory();

    if (isInUse) {
      return {
        success: false,
        message:
          "Cannot delete product that is in use by inventory, sales orders, or BOMs",
      };
    }

    // Delete the product
    await Product.findByIdAndDelete(id);

    return {
      success: true,
      message: "Product deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      message: "Failed to delete product",
      error: error.message,
    };
  }
});

export const getProductsWithoutBOM = withRead(async ({ name = null } = {}) => {
  try {
    // Connect to the database
    await dbConnect();
    
    // First, get all product IDs that have BOMs
    const productsWithBOMs = await BOM.distinct('product_id');
    
    // Create the query to exclude products that have BOMs
    const query = {
      _id: { $nin: productsWithBOMs }
    };
    
    // Apply name filter if provided
    if (name) {
      query.name = { $regex: name, $options: "i" }; // Case-insensitive search
    }
    
    // Retrieve all products without BOMs
    const products = await Product.find(query)
      .sort({ createdAt: -1 }); // Sort by newest first
    
    return {
      success: true,
      data: products.map((p) => p.toJSON()),
    };
  } catch (error) {
    console.error("Error fetching products without BOMs:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});
