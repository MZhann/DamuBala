// api/src/models/User.ts
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ["parent"],
        default: "parent",
    },
    language: {
        type: String,
        enum: ["kz", "ru"],
        default: "ru",
    },
}, {
    timestamps: true,
});
// Hash password before saving
userSchema.pre("save", async function () {
    if (!this.isModified("passwordHash")) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});
// Compare password method
userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.passwordHash);
};
export const User = mongoose.model("User", userSchema);
//# sourceMappingURL=User.js.map