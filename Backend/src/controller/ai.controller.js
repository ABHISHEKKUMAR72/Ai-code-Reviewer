const aiService = require('../services/ai.service');

/**
 * @description Handles the request to get a code review from the AI.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
module.exports.getReview = async (req, res) => {
  const { code } = req.body;

  // Validate the input
  if (!code) {
    return res.status(400).json({ error: "Code is required for review." });
  }

  try {
    // Generate the review using the AI service
    const review = await aiService.generateContent(code);
    res.status(200).json({ review });
  } catch (error) {
    console.error("Error generating AI response:", error);
    res.status(500).json({ error: "An error occurred while generating the review." });
  }
};