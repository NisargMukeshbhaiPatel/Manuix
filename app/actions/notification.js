"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { authOptions } from "@/api/auth/[...nextauth]/route";

/**
 * Get all notifications with pagination and filtering
 */
export async function getNotifications({ 
  page = 1, 
  limit = 10, 
  read = null, 
  priority = null,
  type = null
} = {}) {
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
    
    // Create the query - include user_id to get only notifications for current user
    const query = { user_id: session.user.id };
    
    // Apply read status filter if provided
    if (read !== null) {
      query.read = read;
    }

    // Apply priority filter if provided
    if (priority !== null) {
      query.priority = priority;
    }

    // Apply notification type filter if provided
    if (type) {
      query.notification_type = type;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Count total notifications for pagination
    const totalItems = await Notification.countDocuments(query);

    // Retrieve notifications with pagination
    const notifications = await Notification.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by creation date (newest first)

    return {
      success: true,
      data: notifications,
      pagination: {
        total: totalItems,
        page,
        limit,
        pages: Math.ceil(totalItems / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    };
  }
}

/**
 * Get notification count (unread, by priority, etc.)
 */
export async function getNotificationCount({ read = false, priority = null } = {}) {
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
    
    // Create the query - include user_id to get only count for current user
    const query = { 
      user_id: session.user.id,
      read: read
    };

    // Add priority filter if specified
    if (priority !== null) {
      query.priority = priority;
    }

    // Count notifications matching the query
    const count = await Notification.countDocuments(query);

    return {
      success: true,
      data: { count }
    };
  } catch (error) {
    console.error("Error counting notifications:", error);
    return {
      success: false,
      message: "Failed to count notifications",
      error: error.message,
    };
  }
}

/**
 * Get a single notification by ID
 */
export async function getNotificationById(id) {
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

    // Find the notification by ID and ensure it belongs to the current user
    const notification = await Notification.findOne({
      _id: id,
      user_id: session.user.id
    });

    if (!notification) {
      return {
        success: false,
        message: "Notification not found",
      };
    }

    return {
      success: true,
      data: notification,
    };
  } catch (error) {
    console.error("Error fetching notification:", error);
    return {
      success: false,
      message: "Failed to fetch notification",
      error: error.message,
    };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id) {
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

    // Find the notification by ID, ensure it belongs to the user, and update it
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user_id: session.user.id },
      { read: true, read_at: new Date() },
      { new: true }
    );

    if (!notification) {
      return {
        success: false,
        message: "Notification not found",
      };
    }

    // Revalidate notifications cache
    revalidatePath('/notifications');

    return {
      success: true,
      data: notification,
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead({ type = null } = {}) {
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

    // Create query for unread notifications for this user
    const query = { 
      user_id: session.user.id,
      read: false
    };

    // Add type filter if specified
    if (type) {
      query.notification_type = type;
    }

    // Update all matching notifications
    const result = await Notification.updateMany(
      query,
      { 
        read: true, 
        read_at: new Date() 
      }
    );

    // Revalidate notifications cache
    revalidatePath('/notifications');

    return {
      success: true,
      data: {
        count: result.modifiedCount,
        message: `${result.modifiedCount} notifications marked as read`
      },
    };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    };
  }
}

/**
 * Create a new notification
 */
export async function createNotification(notificationData) {
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
    
    // If user_id is not provided, use the current user's ID
    if (!notificationData.user_id) {
      notificationData.user_id = session.user.id;
    }

    // Create a new notification
    const notification = await Notification.create(notificationData);

    // Revalidate notifications cache
    revalidatePath('/notifications');

    return {
      success: true,
      data: notification,
    };
  } catch (error) {
    console.error("Error creating notification:", error);
    return {
      success: false,
      message: "Failed to create notification",
      error: error.message,
    };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(id) {
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

    // Find the notification by ID, ensure it belongs to the user, and delete it
    const notification = await Notification.findOneAndDelete({
      _id: id,
      user_id: session.user.id
    });
    
    if (!notification) {
      return {
        success: false,
        message: "Notification not found",
      };
    }

    // Revalidate notifications cache
    revalidatePath('/notifications');

    return {
      success: true,
      message: "Notification deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return {
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    };
  }
}
