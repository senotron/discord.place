const useRateLimiter = require('@/utils/useRateLimiter');
const { param, validationResult, matchedData } = require('express-validator');
const Sound = require('@/schemas/Sound');
const idValidation = require('@/utils/validations/sounds/id');
const getUserHashes = require('@/utils/getUserHashes');

module.exports = {
  get: [
    useRateLimiter({ maxRequests: 20, perMinutes: 1 }),
    param('id')
      .isString().withMessage('ID must be a string.')
      .custom(idValidation),
    async (request, response) => {
      const errors = validationResult(request);
      if (!errors.isEmpty()) return response.sendError(errors.array()[0].msg, 400);

      const { id } = matchedData(request);
      
      const sound = await Sound.findOne({ id });
      if (!sound) return response.sendError('Sound not found.', 404);

      const hashes = await getUserHashes(sound.publisher.id);

      return response.json({
        name: sound.name,
        username: sound.publisher.username,
        avatar_url: `https://cdn.discordapp.com/avatars/${sound.publisher.id}/${hashes.avatar}.png?size=64`,
        likes: sound.likers.length,
        downloads: sound.downloads,
        created_at: new Date(sound.createdAt).getTime(),
        categories: sound.categories
      });
    }
  ]
};