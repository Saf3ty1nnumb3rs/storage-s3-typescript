import { hashPassword } from "../auth";
import { createUser } from "../db/users";
import type { ApiConfig } from "../types/api";
import { BadRequestError } from "./errors";
import { respondWithJSON } from "./json";

export async function handlerUsersCreate(cfg: ApiConfig, req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    throw new BadRequestError("Email and password are required");
  }

  const hashedPassword = await hashPassword(password);
  const user = createUser(cfg.db, {
    email: email,
    password: hashedPassword,
  });

  return respondWithJSON(201, user);
}
