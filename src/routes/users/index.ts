import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({key: 'id', equals: request.params.id})
      if(!user) throw this.httpErrors.notFound();
      return user;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        return await fastify.db.users.create(request.body);
      } catch {
        throw this.httpErrors.badRequest();
      }
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        const profile = await fastify.db.profiles.findOne({key: 'userId', equals: request.params.id});
        const posts = await fastify.db.posts.findMany({key: 'userId', equals: request.params.id});
        const users = await fastify.db.users.findMany({key: 'subscribedToUserIds', inArrayAnyOf: [request.params.id]})

        if(users.length) {
          users.forEach(user => {
            user.subscribedToUserIds = user.subscribedToUserIds.filter(id => id !== request.params.id)
            fastify.db.users.change(user.id, user);
          })
        }

        if(profile) {
          await fastify.db.profiles.delete(profile.id);
        }

        if(posts.length) {
          posts.forEach(post => {
            fastify.db.posts.delete(post.id);
          })
        }

        return await fastify.db.users.delete(request.params.id);
      } catch {
        throw this.httpErrors.badRequest();
      }
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | null> {
      const user = await fastify.db.users.findOne({key: 'id', equals: request.body.userId});
      if(!user) {
        reply.notFound();
        return null;
      }
      user?.subscribedToUserIds.push(request.params.id);
      return fastify.db.users.change(request.body.userId, user);
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity | null> {
      const user = await fastify.db.users.findOne({key: 'id', equals: request.body.userId});

      if(!user) {
        throw this.httpErrors.notFound();
      }
      if (!user.subscribedToUserIds.includes(request.params.id)) {
        throw this.httpErrors.badRequest();
      }
      
      user.subscribedToUserIds = user?.subscribedToUserIds.filter((val) => val !== request.params.id);
      return fastify.db.users.change(request.body.userId, user);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        return await fastify.db.users.change(request.params.id, request.body);
      } catch {
        throw this.httpErrors.badRequest();
      }
    }
  );
};

export default plugin;
