import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: [
        "login",
        "register",
        "issue_book",
        "return_book",
        "reserve_book",
        "cancel_reservation",
        "add_book",
        "edit_book",
        "delete_book",
        "add_member",
        "delete_member",
        "approve_user",
        "suspend_user",
        "upload_photo",
        "import_books",
        "export_books",
        "backup",
        "restore",
        "generate_card",
        "change_password",
        "collect_fine",
      ],
      required: true,
    },
    details: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Auto-delete logs older than 90 days
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model("ActivityLog", ActivityLogSchema);
