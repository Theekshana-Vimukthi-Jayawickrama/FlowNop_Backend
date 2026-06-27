import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  address?: string;
  phoneNumber?: string;
  birthday?: Date;
  eid?: string;
  refreshTokens?: string[];
  isDisabled?: boolean;
  disabledReason?: string;
  disabledBy?: any;
  disabledAt?: Date;
  reactivationRequested?: boolean;
  reactivationRequestReason?: string;
  reactivationRequestedAt?: Date;
  reactivationReason?: string;
  reactivatedBy?: any;
  reactivatedAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(plain: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
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
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
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
  },
  {
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
  }
);

// Pre-save hook to hash password
UserSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
});


// Compare password method
UserSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
  // If the user was retrieved without the password field, password will be undefined
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(plain, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);

export default User;
