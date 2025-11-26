import sandboxService from '../services/sandboxService.js';
import logger from '../utils/logger.js';

export const createSandbox = async (req, res, next) => {
  try {
    // Files are already validated by the Zod middleware
    const { files } = req.body;

    logger.info(`Received request to create sandbox with ${Object.keys(files).length} files.`);

    const result = await sandboxService.createAndSetupSandbox(files);

    // Use 201 Created for successful resource creation
    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    // Pass error to the centralized error handler middleware
    next(error);
  }
};
