import { JSONSchemaType } from 'ajv';
import { CreateTaskInput, UpdateTaskInput } from '../types/domain';

const ESTADOS = ['pendiente', 'en curso', 'completada'] as const;
// Formato AAAA-MM-DD (fecha simple, sin hora).
const FECHA_PATTERN = '^\\d{4}-\\d{2}-\\d{2}$';

export const createTaskSchema: JSONSchemaType<CreateTaskInput> = {
  type: 'object',
  properties: {
    titulo: { type: 'string', minLength: 1, maxLength: 200 },
    descripcion: { type: 'string', maxLength: 2000, nullable: true },
    fecha_vencimiento: { type: 'string', pattern: FECHA_PATTERN, nullable: true },
    estado: { type: 'string', enum: ESTADOS, nullable: true },
  },
  required: ['titulo'],
  additionalProperties: false,
};

export const updateTaskSchema: JSONSchemaType<UpdateTaskInput> = {
  type: 'object',
  properties: {
    titulo: { type: 'string', minLength: 1, maxLength: 200, nullable: true },
    descripcion: { type: 'string', maxLength: 2000, nullable: true },
    fecha_vencimiento: { type: 'string', pattern: FECHA_PATTERN, nullable: true },
    estado: { type: 'string', enum: ESTADOS, nullable: true },
  },
  required: [],
  additionalProperties: false,
  minProperties: 1,
} as JSONSchemaType<UpdateTaskInput>;
