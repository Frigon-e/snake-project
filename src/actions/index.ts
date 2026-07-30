import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { createDb } from '../db/client';
import { inquiries, snakes, traitChips } from '../db/schema';
import { isAdminRole } from '../lib/auth';
import { inquiryFormSchema, specimenFormSchema } from '../lib/forms';
import {
  hasImageSignature,
  isSpecimenImageKey,
  isSpecimenImageType,
  r2Key,
} from '../lib/r2';
import { isAvailable } from '../lib/specimens';

async function requireAdmin(context: App.Locals): Promise<void> {
  const user = await context.currentUser();
  if (!isAdminRole(user)) {
    throw new ActionError({
      code: 'UNAUTHORIZED',
      message: 'Administrator access is required.',
    });
  }
}

function getDb() {
  return createDb((env as unknown as Env).DB);
}

async function requireStoredImage(key: string | undefined): Promise<void> {
  if (!key) return;

  if (!isSpecimenImageKey(key)) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: 'Use an image key created by the specimen media uploader.',
    });
  }

  const object = await (env as unknown as Env).ASSETS_BUCKET.head(key);
  if (!object || !isSpecimenImageType(object.httpMetadata?.contentType)) {
    throw new ActionError({
      code: 'BAD_REQUEST',
      message: 'That specimen image was not found or is not a supported image.',
    });
  }
}

function specimenValues(input: z.infer<typeof specimenFormSchema>) {
  const {
    priceDollars,
    primaryImageKey,
    sex,
    hatchDate,
    personality,
    feedingNotes,
    diet,
    shedFrequency,
    temperature,
    humidity,
    weightGrams,
    complementaryGenetics,
    ...rest
  } = input;

  return {
    ...rest,
    priceInCents: priceDollars,
    available: isAvailable(input.status),
    primaryImageKey: primaryImageKey ?? null,
    sex: sex === 'unknown' ? null : (sex ?? null),
    hatchDate: hatchDate ?? null,
    personality: personality ?? null,
    feedingNotes: feedingNotes ?? null,
    diet: diet ?? null,
    shedFrequency: shedFrequency ?? null,
    temperature: temperature ?? null,
    humidity: humidity ?? null,
    weightGrams: weightGrams ?? null,
    complementaryGenetics: complementaryGenetics ?? null,
  };
}

function mutationError(error: unknown): never {
  if (error instanceof ActionError) throw error;

  if (error instanceof Error && /unique|constraint/i.test(error.message)) {
    throw new ActionError({
      code: 'CONFLICT',
      message: 'That URL slug is already used by another specimen.',
    });
  }

  throw new ActionError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'The specimen could not be saved. Please try again.',
  });
}

export const server = {
  submitInquiry: defineAction({
    accept: 'form',
    input: inquiryFormSchema,
    handler: async ({ website: _website, ...input }, context) => {
      const clientKey = context.request.headers.get('cf-connecting-ip')
        ?? context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? 'local-client';
      const rateLimit = await (env as unknown as Env).INQUIRY_RATE_LIMITER.limit({
        key: `inquiry:${clientKey}`,
      });
      if (!rateLimit.success) {
        throw new ActionError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Please wait a minute before sending another inquiry.',
        });
      }

      const db = getDb();
      const [specimen] = await db
        .select({ id: snakes.id })
        .from(snakes)
        .where(eq(snakes.id, input.snakeId));

      if (!specimen) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'That specimen is no longer in the collection.',
        });
      }

      await db.insert(inquiries).values(input);
      return { success: true };
    },
  }),

  createSnake: defineAction({
    accept: 'form',
    input: specimenFormSchema,
    handler: async (input, context) => {
      await requireAdmin(context.locals);
      await requireStoredImage(input.primaryImageKey);
      const db = getDb();

      try {
        const [snake] = await db
          .insert(snakes)
          .values(specimenValues(input))
          .returning();
        return { snake };
      } catch (error) {
        mutationError(error);
      }
    },
  }),

  updateSnake: defineAction({
    accept: 'form',
    input: specimenFormSchema.extend({ id: z.string().min(1) }),
    handler: async ({ id, ...input }, context) => {
      await requireAdmin(context.locals);
      await requireStoredImage(input.primaryImageKey);
      const db = getDb();

      try {
        const [snake] = await db
          .update(snakes)
          .set({ ...specimenValues(input), updatedAt: new Date() })
          .where(eq(snakes.id, id))
          .returning();

        if (!snake) {
          throw new ActionError({
            code: 'NOT_FOUND',
            message: 'That specimen no longer exists.',
          });
        }

        return { snake };
      } catch (error) {
        mutationError(error);
      }
    },
  }),

  deleteSnake: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().min(1),
      confirm: z.literal('delete'),
    }),
    handler: async ({ id }, context) => {
      await requireAdmin(context.locals);
      const db = getDb();
      const [deleted] = await db.delete(snakes).where(eq(snakes.id, id)).returning();

      if (!deleted) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'That specimen was already removed.',
        });
      }

      return { success: true };
    },
  }),

  addTrait: defineAction({
    accept: 'form',
    input: z.object({
      snakeId: z.string().min(1),
      label: z.string().trim().min(1, 'Trait name is required').max(60),
      type: z.enum(['dominant', 'recessive', 'codominant']).default('dominant'),
    }),
    handler: async (input, context) => {
      await requireAdmin(context.locals);
      const db = getDb();
      const [trait] = await db.insert(traitChips).values(input).returning();
      return { trait };
    },
  }),

  deleteTrait: defineAction({
    accept: 'form',
    input: z.object({ id: z.string().min(1) }),
    handler: async ({ id }, context) => {
      await requireAdmin(context.locals);
      const db = getDb();
      await db.delete(traitChips).where(eq(traitChips.id, id));
      return { success: true };
    },
  }),

  uploadMedia: defineAction({
    accept: 'form',
    input: z.object({
      file: z
        .instanceof(File)
        .refine((file) => file.size > 0, 'Choose an image')
        .refine((file) => file.size <= 10 * 1024 * 1024, 'Image must be 10 MB or smaller')
        .refine(
          (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
          'Use a JPG, PNG, or WebP image',
        ),
    }),
    handler: async ({ file }, context) => {
      await requireAdmin(context.locals);
      if (!isSpecimenImageType(file.type)) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Use a JPG, PNG, or WebP image.',
        });
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!hasImageSignature(bytes, file.type)) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'The selected file does not contain a valid image.',
        });
      }

      const key = r2Key(file.name);
      await (env as unknown as Env).ASSETS_BUCKET.put(key, bytes, {
        httpMetadata: { contentType: file.type },
      });
      return { key };
    },
  }),
};
