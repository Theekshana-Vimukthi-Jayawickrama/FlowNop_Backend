import mongoose, { Schema, Document } from 'mongoose';

export interface IStatusHistoryEntry {
  status: string;
  changedBy: mongoose.Types.ObjectId;
  changedAt: Date;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'testing' | 'done' | 'Super Admin Approved';
  dueDate?: Date;
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  subAssignedTo: mongoose.Types.ObjectId[];
  approved: boolean;
  approvedByAdmin?: string;
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const StatusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: {
      type: String,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITask>(
  {
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
        values: ['open', 'in_progress', 'testing', 'done', 'Super Admin Approved'],
        message: '{VALUE} is not a valid status',
      },
      default: 'open',
    },
    dueDate: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by user reference is required'],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    subAssignedTo: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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
  },
  {
    timestamps: true,
  }
);

export const Task = mongoose.model<ITask>('Task', TaskSchema);

export default Task;
