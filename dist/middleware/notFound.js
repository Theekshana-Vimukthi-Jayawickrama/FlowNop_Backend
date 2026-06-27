"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const notFound = (req, res, next) => {
    next(new ApiError_1.default(404, `Route not found - ${req.originalUrl}`));
};
exports.notFound = notFound;
exports.default = exports.notFound;
