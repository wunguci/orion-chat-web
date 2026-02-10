export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  timestamp: string;
  isPinned: boolean;
  folder?: string;
}
