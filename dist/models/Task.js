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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Task = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const StatusHistorySchema = new mongoose_1.Schema({
    status: {
        type: String,
        required: true,
    },
    changedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    changedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });
const TaskSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [120, 'Title cannot exceed 120 characters'],
        trim: true,
    },
    description: {
        type: String,
        maxlength: [2000, 'Description cannot exceed 2000 characters'],
        trim: true,
    },
    priority: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high'],
            message: '{VALUE} is not a valid priority',
        },
        default: 'medium',
    },
    status: {
        type: String,
        enum: {
            values: ['open', 'in_progress', 'testing', 'done'],
            message: '{VALUE} is not a valid status',
        },
        default: 'open',
    },
    dueDate: {
        type: Date,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by user reference is required'],
    },
    assignedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    subAssignedTo: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
        default: [],
    },
    approved: {
        type: Boolean,
        default: false,
    },
    approvedByAdmin: {
        type: String,
        default: null,
    },
    statusHistory: {
        type: [StatusHistorySchema],
        default: [],
    },
}, {
    timestamps: true,
});
exports.Task = mongoose_1.default.model('Task', TaskSchema);
exports.default = exports.Task;
