"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const emailService_1 = require("../services/emailService");
const router = (0, express_1.Router)();
router.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'ok' });
});
router.get('/health/email', (req, res) => {
    const smtpStatus = (0, emailService_1.getSmtpStatus)();
    // ready or simulated counts as healthy
    const isHealthy = smtpStatus.status === 'ready' || smtpStatus.status === 'simulated';
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json({
        success: isHealthy,
        ...smtpStatus,
    });
});
exports.default = router;
