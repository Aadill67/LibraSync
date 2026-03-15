import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    userFullName: {
      type: String,
      required: true,
      trim: true,
    },
    admissionId: {
      type: String,
      minlength: 3,
      maxlength: 15,
      unique: true,
      sparse: true,
      index: true,
    },
    employeeId: {
      type: String,
      minlength: 3,
      maxlength: 15,
      unique: true,
      sparse: true,
      index: true,
    },
    age: {
      type: Number,
      min: 10,
      max: 100,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    dob: {
      type: Date,
    },
    address: {
      type: String,
      default: "",
    },
    mobileNumber: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },
    photo: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      maxlength: 50,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // exclude password by default
    },
    role: {
      type: String,
      enum: ["admin", "librarian", "member"],
      default: "member",
    },
    accountStatus: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    points: {
      type: Number,
      default: 0,
    },
    activeTransactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BookTransaction",
      },
    ],
    prevTransactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BookTransaction",
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
  },
  { timestamps: true }
);

// Virtual: isAdmin check
UserSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export default mongoose.model("User", UserSchema);