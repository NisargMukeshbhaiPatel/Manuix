"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import { authOptions } from "@/api/auth/[...nextauth]/route";

/**
 * Get all products with pagination and filtering
 */
export async function getProducts({ page = 1, limit = 10, name = null } = {}) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return { 
        success: false, 
        message: "Unauthorized" 
      };
    }

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
      data: products,
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
      message: "Failed to fetch products",
      error: error.message,
    };
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(id) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return { 
        success: false, 
        message: "Unauthorized" 
      };
    }

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
}

/**
 * Create a new product
 */
export async function createProduct(productData) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return { 
        success: false, 
        message: "Unauthorized" 
      };
    }

    // Connect to the database
    await dbConnect();

    // Add the user ID who created the product
    productData.created_by = session.user.id;

    // Create a new product
    const product = await Product.create(productData);

    // Revalidate the products cache
    revalidatePath('/products');

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      message: "Failed to create product",
      error: error.message,
    };
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(id, productData) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return { 
        success: false, 
        message: "Unauthorized" 
      };
    }

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

    // Revalidate the product and products cache
    revalidatePath(`/products/${id}`);
    revalidatePath('/products');

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      message: "Failed to update product",
      error: error.message,
    };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return { 
        success: false, 
        message: "Unauthorized" 
      };
    }

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
        message: "Cannot delete product that is in use by inventory, sales orders, or BOMs",
      };
    }

    // Delete the product
    await Product.findByIdAndDelete(id);

    // Revalidate the products cache
    revalidatePath('/products');

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
}
