export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export type SafeUser = Omit<User, 'password_hash'>;

export type TaskStatus = 'pendiente' | 'en curso' | 'completada';

export interface Task {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_vencimiento: string | null;
  estado: TaskStatus;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskInput {
  titulo: string;
  descripcion?: string;
  fecha_vencimiento?: string;
  estado?: TaskStatus;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
