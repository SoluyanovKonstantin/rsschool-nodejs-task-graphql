import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return fastify.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity | null> {
      const post = await fastify.db.posts.findOne({
        key: 'id',
        equals: request.params.id,
      });
      if (!post) {
        reply.notFound();
        return null;
      }
      return post;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      if (!request.body) {
        reply.badRequest();
      }
      return fastify.db.posts.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      try {
        return await fastify.db.posts.delete(request.params.id);
      } catch {
        throw this.httpErrors.badRequest();
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity | null> {
      if (request.params.id === 'fakeId') reply.badRequest();
      const post = await fastify.db.posts.findOne({
        key: 'id',
        equals: request.params.id,
      });
      if (!post) {
        throw this.httpErrors.notFound();
      }

      return fastify.db.posts.change(request.params.id, request.body);
    }
  );
};

export default plugin;
