import { Session } from "../types/session.interface.js";

import { readJsonFile, writeJsonFile } from "../utils/json-file.js";

import { SESSIONS_FILE } from "../constants/file-paths.js";

/**
 * Handles all persistence operations
 * for sessions.json.
 */
export class SessionRepository {
  /**
   * Returns every stored session.
   */
  async findAll(): Promise<Session[]> {
    return readJsonFile<Session[]>(SESSIONS_FILE);
  }

  /**
   * Finds a session by token.
   */
  async findByToken(token: string): Promise<Session | undefined> {
    const sessions = await this.findAll();

    return sessions.find((session) => session.token === token);
  }

  /**
   * Persists the complete session collection.
   */
  async saveAll(sessions: Session[]): Promise<void> {
    await writeJsonFile(SESSIONS_FILE, sessions);
  }

  /**
   * Creates a new session.
   */
  async create(session: Session): Promise<void> {
    const sessions = await this.findAll();

    sessions.push(session);

    await this.saveAll(sessions);
  }

  /**
   * Removes a session by token.
   */
  async deleteByToken(token: string): Promise<void> {
    const sessions = await this.findAll();

    const remainingSessions = sessions.filter(
      (session) => session.token !== token,
    );

    await this.saveAll(remainingSessions);
  }

  /**
   * Deletes all sessions belonging
   * to the specified user.
   */
  async deleteByUserId(userId: string): Promise<void> {
    const sessions = await this.findAll();

    const remainingSessions = sessions.filter(
      (session) => session.userId !== userId,
    );

    await this.saveAll(remainingSessions);
  }
}
