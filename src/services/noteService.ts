import { api } from "./api";
import type { Note, NoteCategory } from "../types/note";

const BASE = "/notes";

export const noteService = {
  // for note

  /**
   * GET /notes?categoryId=...&search=...&isPinned=...&skip=...&take=...
   * @param params
   * @returns
   */
  getAll: (params?: {
    categoryId?: string;
    search?: string;
    isPinned?: boolean;
    skip?: number;
    take?: number;
  }) => {
    const query = new URLSearchParams();

    if (params?.categoryId) query.set("categoryId", params.categoryId);
    if (params?.search) query.set("search", params.search);
    if (params?.isPinned !== undefined)
      query.set("isPinned", String(params.isPinned));
    if (params?.skip !== undefined) query.set("skip", String(params.skip));
    if (params?.take !== undefined) query.set("take", String(params.take));

    const qs = query.toString();
    return api.get<{ notes: Note[]; total: number }>(
      `${BASE}${qs ? `?${qs}` : ""}`,
    );
  },

  /**
   * GET /notes/:noteId
   * @param noteId
   * @returns
   */
  getOne: (noteId: string) => api.get<Note>(`${BASE}/${noteId}`),

  /**
   * POST /notes
   * @param data
   * @returns
   */
  create: (data: {
    title: string;
    content: string;
    categoryId: string;
    isPinned?: boolean;
    folderId?: string;
  }) => api.post<Note>(`${BASE}`, data),

  /**
   * PUT /notes/:noteId
   * @param noteId
   * @param data
   * @returns
   */
  update: (
    noteId: string,
    data: {
      title?: string;
      content?: string;
      categoryId?: string;
      isPinned?: boolean;
      folderId?: string;
    },
  ) => api.put<Note>(`${BASE}/${noteId}`, data),

  /**
   * DELETE /notes/:noteId
   * @param noteId
   * @returns
   */
  delete: (noteId: string) =>
    api.delete<{ message: string }>(`${BASE}/${noteId}`),

  /**
   * POST /notes/:noteId/toggle-pin
   * @param noteId
   * @returns
   */
  togglePin: (noteId: string) =>
    api.post<Note>(`${BASE}/${noteId}/toggle-pin`, {}),

  // for category

  /**
   * GET /notes/categories
   * @returns
   */
  getCategories: () => api.get<NoteCategory[]>(`${BASE}/categories`),

  /**
   * POST /notes/categories
   * @param data
   * @returns
   */
  createCategory: (data: { name: string; color?: string; icon?: string }) =>
    api.post<NoteCategory>(`${BASE}/categories`, data),

  /**
   * PUT /notes/categories/:categoryId
   * @param categoryId
   * @param data
   * @returns
   */
  updateCategory: (
    categoryId: string,
    data: {
      name?: string;
      color?: string;
      icon?: string;
    },
  ) => api.put<NoteCategory>(`${BASE}/categories/${categoryId}`, data),

  /**
   * DELETE /notes/categories/:categoryId
   * @param categoryId
   * @returns
   */
  deleteCategory: (categoryId: string) =>
    api.delete<{ message: string }>(`${BASE}/categories/${categoryId}`),
};
