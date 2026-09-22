import { JSONSchemaType } from 'ajv';
import { LoginInput, RegisterInput } from '../types/domain';

export const registerSchema: JSONSchemaType<RegisterInput> = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 150 },
    email: { type: 'string', format: 'email', maxLength: 255 },
    password: { type: 'string', minLength: 8, maxLength: 100 },
  },
  required: ['name', 'email', 'password'],
  additionalProperties: false,
};

export const loginSchema: JSONSchemaType<LoginInput> = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', maxLength: 255 },
    password: { type: 'string', minLength: 1, maxLength: 100 },
  },
  required: ['email', 'password'],
  additionalProperties: false,
};
