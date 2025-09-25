import mongoose, { Schema } from "mongoose";
import { IUrl } from "../types/index";

const urlSchema = new Schema<IUrl>(
  {
    original_url: {
      type: String,
      required: [true, "Original URL is required"],
      validate: {
        validator: function (v: string) {
          return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
        },
        message: "Please provide a valid URL",
      },
    },
    custom_url: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value: string) {
          if (!value) return true;
          return /^[a-zA-Z0-9_-]+$/.test(value);
        },
        message:
          "Custom URL can only contain letters, numbers, hyphens, and underscores",
      },
    },
    short_url: {
      type: String,
      required: [true, "Short URL is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: [true, "User ID is required"],
    } as any,
    title: {
      type: String,
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    qr: {
      type: String, // Base64 encoded QR code
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      trim: true,
      maxlength: [10, "Source cannot exceed 100 characters"],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    expires_at: {
      type: Date,
      default: null, // null means never expires
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

(urlSchema.methods as any).isExpired = function (): boolean {
  return this["expires_at"] ? new Date() > this["expires_at"] : false;
};

urlSchema.set("toJSON", { virtuals: true });

export const URL = mongoose.model<IUrl>("urls", urlSchema);
