import mongoose from "mongoose";
import User from "@/models/User";

const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
      index: true,
    },
    category: {
      type: String,
      enum: [
        'inventory', // For stock levels, expiry alerts
        'order',     // For order status changes
        'finance',   // For payment status, overdue invoices
        'production', // For production issues
        'system',    // For system-wide announcements
        'other'      // For miscellaneous notifications
      ],
      default: 'system',
      index: true,
    },
    priority: {
      type: Number, // 1 = highest, 5 = lowest
      min: 1,
      max: 5,
      default: 3,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      required: true, // Every notification is assigned to a user
      index: true,
    },
    // Optional fields for linking to related entities
    source_type: {
      type: String,
      enum: ['Product', 'RawMaterial', 'SalesOrder', 'PurchaseOrder', 'Inventory', 'BOM', 'Finance', 'Other'],
      default: 'Other',
    },
    source_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'source_type',
      default: null,
    },
    action_url: {
      type: String, // URL for direct navigation to related entity
      default: null,
    },
    expiry: {
      type: Date, // When this notification becomes irrelevant
      default: null, 
    },
    dismissed: {
      type: Boolean, // User explicitly dismissed this notification
      default: false,
      index: true,
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common query patterns
NotificationSchema.index({ user_id: 1, read: 1 });
NotificationSchema.index({ user_id: 1, dismissed: 1 });
NotificationSchema.index({ user_id: 1, category: 1 });
NotificationSchema.index({ createdAt: 1 });

// Virtual to determine if the notification is expired
NotificationSchema.virtual('isExpired').get(function() {
  if (!this.expiry) return false;
  return new Date() > this.expiry;
});

// Static methods for creating common types of notifications

// Inventory Alert Notification
NotificationSchema.statics.createInventoryAlert = async function(options) {
  const {
    user_id,
    item_type, // 'product' or 'raw_material'
    item_id,
    item_name,
    current_level,
    threshold_level,
    action_url,
    priority = 2, // Default higher priority for inventory alerts
  } = options;
  
  if (!user_id || !item_type || !item_id || !item_name) {
    throw new Error('Missing required fields for inventory alert');
  }
  
  const title = `Low Stock Alert: ${item_name}`;
  const message = `Inventory level for ${item_name} is ${current_level}, which is below the threshold of ${threshold_level}. Please restock soon.`;
  
  return await this.create({
    title,
    message,
    type: 'warning',
    category: 'inventory',
    priority,
    user_id,
    source_type: item_type === 'product' ? 'Product' : 'RawMaterial',
    source_id: item_id,
    action_url
  });
};

// Order Status Notification
NotificationSchema.statics.createOrderStatusNotification = async function(options) {
  const {
    user_id,
    order_type, // 'sales' or 'purchase'
    order_id,
    order_reference,
    status,
    action_url,
    customer_or_supplier,
    priority = 3,
  } = options;
  
  if (!user_id || !order_type || !order_id || !status) {
    throw new Error('Missing required fields for order status notification');
  }
  
  const orderTypeLabel = order_type === 'sales' ? 'Sales Order' : 'Purchase Order';
  const title = `${orderTypeLabel} Status Update: ${status.toUpperCase()}`;
  
  let message = '';
  if (order_type === 'sales') {
    message = `Sales order ${order_reference || order_id} for ${customer_or_supplier || 'customer'} has been ${status}.`;
  } else {
    message = `Purchase order ${order_reference || order_id} from ${customer_or_supplier || 'supplier'} has been ${status}.`;
  }
  
  return await this.create({
    title,
    message,
    type: status === 'cancelled' ? 'error' : (status === 'completed' || status === 'received' ? 'success' : 'info'),
    category: 'order',
    priority,
    user_id,
    source_type: order_type === 'sales' ? 'SalesOrder' : 'PurchaseOrder',
    source_id: order_id,
    action_url
  });
};

// Production Issue Notification
NotificationSchema.statics.createProductionIssue = async function(options) {
  const {
    user_id,
    product_id,
    product_name,
    issue_type, // 'material_shortage', 'quality_control', etc.
    details,
    action_url,
    priority = 2,
  } = options;
  
  if (!user_id || !product_id || !product_name || !issue_type) {
    throw new Error('Missing required fields for production issue notification');
  }
  
  const title = `Production Issue: ${product_name}`;
  let message = `There is a production issue with ${product_name}: `;
  
  switch(issue_type) {
    case 'material_shortage':
      message += `Insufficient raw materials to complete production.`;
      break;
    case 'quality_control':
      message += `Quality control check failed.`;
      break;
    default:
      message += details || 'Issue requires attention.';
  }
  
  return await this.create({
    title,
    message,
    type: 'error',
    category: 'production',
    priority,
    user_id,
    source_type: 'Product',
    source_id: product_id,
    action_url
  });
};

// Finance Notification
NotificationSchema.statics.createFinanceAlert = async function(options) {
  const {
    user_id,
    finance_type, // 'payment', 'invoice', etc.
    entity_id,
    entity_type, // 'SalesOrder', 'PurchaseOrder', etc.
    amount,
    details,
    action_url,
    priority = 3,
  } = options;
  
  if (!user_id || !finance_type || !entity_id) {
    throw new Error('Missing required fields for finance notification');
  }
  
  const title = `Finance Alert: ${finance_type.charAt(0).toUpperCase() + finance_type.slice(1)}`;
  let message = details || `Financial update regarding ${finance_type}`;
  
  if (amount) {
    message += ` for ${amount}`;
  }
  
  return await this.create({
    title,
    message,
    type: 'info',
    category: 'finance',
    priority,
    user_id,
    source_type: entity_type || 'Finance',
    source_id: entity_id,
    action_url
  });
};

// System Notification (for all users)
NotificationSchema.statics.createSystemNotification = async function(options) {
  const {
    users, // Array of user IDs
    title,
    message,
    type = 'info',
    priority = 3,
    action_url,
    expiry,
  } = options;
  
  if (!users || !users.length || !title || !message) {
    throw new Error('Missing required fields for system notification');
  }
  
  const notifications = [];
  
  // Create a notification for each user
  for (const user_id of users) {
    notifications.push({
      title,
      message,
      type,
      category: 'system',
      priority,
      user_id,
      action_url,
      expiry
    });
  }
  
  return await this.insertMany(notifications);
};

// Instance methods

// Mark notification as read
NotificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return this.save();
};

// Dismiss notification
NotificationSchema.methods.dismiss = async function() {
  this.dismissed = true;
  return this.save();
};

// Static methods for querying

// Get unread notifications for user
NotificationSchema.statics.getUnreadForUser = async function(userId, limit = 10) {
  return this.find({
    user_id: userId,
    read: false,
    dismissed: false,
    $or: [
      { expiry: null },
      { expiry: { $gt: new Date() } }
    ]
  })
  .sort({ priority: 1, createdAt: -1 })
  .limit(limit)
  .populate('source_id')
  .exec();
};

// Mark all notifications as read for a user
NotificationSchema.statics.markAllAsReadForUser = async function(userId) {
  return this.updateMany(
    { 
      user_id: userId, 
      read: false,
      dismissed: false
    },
    { 
      $set: { read: true } 
    }
  );
};

// Auto-populate references
NotificationSchema.pre(/^find/, function(next) {
  if (this.options && !this.options.lean) {
    this.populate('user_id', 'name email');
    
    // Only populate source_id if it exists and is not null
    if (this._conditions.source_id) {
      this.populate('source_id');
    }
  }
  next();
});

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
