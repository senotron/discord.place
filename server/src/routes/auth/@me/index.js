const Profile = require('@/schemas/Profile');
const checkAuthentication = require('@/utils/middlewares/checkAuthentication');
const useRateLimiter = require('@/utils/useRateLimiter');
const premiumCodeValidation = require('@/utils/validations/premiumCodeValidation');
const { body, validationResult, matchedData } = require('express-validator');
const Premium = require('@/schemas/Premium');
const PremiumCode = require('@/schemas/PremiumCode');
const bodyParser = require('body-parser');

module.exports = {
  get: [
    useRateLimiter({ maxRequests: 20, perMinutes: 1 }),
    checkAuthentication,
    async (request, response) => {
      const user = client.users.cache.get(request.user.id) || await client.users.fetch(request.user.id).catch(() => null);
      if (!user) return response.sendError('User not found.', 404);

      const profile = await Profile.findOne({ 'user.id': user.id });
      const premium = await Premium.findOne({ 'user.id': user.id });

      return response.json({
        id: user.id,
        username: user.username,
        global_name: user.globalName,
        discriminator: user.discriminator,
        avatar_hash: user.avatar,
        avatar_url: user.displayAvatarURL({ size: 512 }),
        profile: typeof profile === 'object' ? profile : null,
        premium: premium ? {
          created_at: new Date(premium.createdAt)
        } : null
      });
    }
  ],
  patch: [
    useRateLimiter({ maxRequests: 5, perMinutes: 1 }),
    checkAuthentication,
    bodyParser.json(),
    body('premium_code')
      .isString().withMessage('Premium code should be a string.')
      .custom(premiumCodeValidation),
    async (request, response) => {
      const errors = validationResult(request);
      if (!errors.isEmpty()) return response.sendError(errors.array()[0].msg, 400);

      const foundPremium = await Premium.findOne({ 'user.id': request.user.id });
      if (foundPremium) return response.sendError('You already have a premium.', 400);

      const { premium_code } = matchedData(request);

      const profile = await Profile.findOne({ 'user.id': request.user.id });
      if (profile) await profile.updateOne({ premium: true });

      await new Premium({
        used_code: premium_code,
        user: {
          id: request.user.id
        }
      }).save();
      
      await PremiumCode.findOneAndDelete({ code: premium_code });

      return response.sendStatus(204).end();
    }
  ]
};