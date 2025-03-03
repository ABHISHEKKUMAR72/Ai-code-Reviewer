const express = require('express');
const aiController = require("../controller/ai.controller");

const router = express.Router();

/**
 * @route POST /ai/get-review
 * @description Get a code review from the AI.
 * @access Public
 */
router.post("/get-review", aiController.getReview);

module.exports = router;