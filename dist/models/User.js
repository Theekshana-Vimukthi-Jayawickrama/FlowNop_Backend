"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        select: false,
    },
    role: {
        type: String,
        enum: {
            values: ['admin', 'user'],
            message: '{VALUE} is not a valid role',
        },
        default: 'user',
    },
    address: {
        type: String,
        trim: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    birthday: {
        type: Date,
    },
    eid: {
        type: String,
        trim: true,
    },
    refreshTokens: {
        type: [String],
        default: [],
    },
    isDisabled: {
        type: Boolean,
        default: false,
    },
    disabledReason: {
        type: String,
        trim: true,
    },
    disabledBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    disabledAt: {
        type: Date,
    },
    reactivationRequested: {
        type: Boolean,
        default: false,
    },
    reactivationRequestReason: {
        type: String,
        trim: true,
    },
    reactivationRequestedAt: {
        type: Date,
    },
    reactivationReason: {
        type: String,
        trim: true,
    },
    reactivatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    reactivatedAt: {
        type: Date,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
}, {
    timestamps: true,
    toJSON: {
        transform(doc, ret) {
            delete ret.password;
            delete ret.refreshTokens;
            delete ret.resetPasswordToken;
            delete ret.resetPasswordExpires;
            return ret;
        },
    },
});
// Pre-save hook to hash password
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, salt);
});
// Compare password method
UserSchema.methods.comparePassword = async function (plain) {
    // If the user was retrieved without the password field, password will be undefined
    if (!this.password) {
        return false;
    }
    return bcryptjs_1.default.compare(plain, this.password);
};
exports.User = mongoose_1.default.model('User', UserSchema);
exports.default = exports.User;
