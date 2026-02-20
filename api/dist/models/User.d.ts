import mongoose, { Document, Types } from "mongoose";
export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    passwordHash: string;
    name: string;
    role: "parent";
    language: "kz" | "ru";
    createdAt: Date;
    updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
}
export declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, mongoose.DefaultSchemaOptions> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IUser>;
