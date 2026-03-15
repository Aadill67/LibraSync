import mongoose from "mongoose";

const BookSchema = new mongoose.Schema(
  {
    bookName: {
      type: String,
      required: true,
      trim: true,
    },
    alternateTitle: {
      type: String,
      default: "",
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true, // allows multiple docs without isbn
      trim: true,
    },
    publisher: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "English",
    },
    bookCountAvailable: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    bookStatus: {
      type: String,
      enum: ["available", "not available"],
      default: "available",
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BookCategory",
      },
    ],
    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BookTransaction",
      },
    ],
    coverImage: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    avgRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Text index for search functionality
BookSchema.index({ bookName: "text", author: "text", isbn: "text" });

export default mongoose.model("Book", BookSchema);
