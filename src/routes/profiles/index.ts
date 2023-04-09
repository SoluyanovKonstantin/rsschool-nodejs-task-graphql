import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    ProfileEntity[]
  > {
    return fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity | null> {
      const profile = await fastify.db.profiles.findOne({key: 'id', equals: request.params.id});
      if(!profile) reply.notFound();
      return profile;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { userId, memberTypeId } = request.body;
      const user = await fastify.db.users.findOne({key: 'id', equals: userId});
      const memberType = await fastify.db.memberTypes.findOne({key: 'id', equals: memberTypeId});
      const profile = await fastify.db.profiles.findOne({key: 'userId', equals: userId});
      if (!user || !memberType || profile) throw this.httpErrors.badRequest();
      try {
        return await fastify.db.profiles.create(request.body);
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
    async function (request, reply): Promise<ProfileEntity | null> {
      try {
        return await fastify.db.profiles.delete(request.params.id);
      } catch {
        throw this.httpErrors.badRequest();
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        return await fastify.db.profiles.change(request.params.id, request.body);
      } catch {
        throw this.httpErrors.badRequest();
      }
    }
  );
};

export default plugin;
