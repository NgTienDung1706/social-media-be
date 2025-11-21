import mongoose from "mongoose";

const relationshipSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Người thực hiện
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Người bị tác động
    type: {
      type: String,
      enum: ["follow", "friend"],
      required: true,
    },
  },
  { timestamps: true }
);

// Tạo index đơn giản cho from và to
relationshipSchema.index({ from: 1 });
relationshipSchema.index({ to: 1 });

const Relationship = mongoose.model("Relationship", relationshipSchema);

export default Relationship;
