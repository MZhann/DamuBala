import mongoose, { Document, Types } from "mongoose";
export interface IChild extends Document {
    _id: Types.ObjectId;
    parentId: Types.ObjectId;
    name: string;
    age: number;
    avatar: string;
    language: "kz" | "ru";
    pin?: string;
    totalPoints: number;
    level: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Child: mongoose.Model<IChild, {}, {}, {}, mongoose.Document<unknown, {}, IChild, {}, mongoose.DefaultSchemaOptions> & IChild & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IChild>;
