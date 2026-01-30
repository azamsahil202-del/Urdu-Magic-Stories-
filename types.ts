
export enum AppState {
  HOME = 'HOME',
  LOADING = 'LOADING',
  STORY_PLAYER = 'STORY_PLAYER'
}

export interface StoryTheme {
  id: string;
  titleUrdu: string;
  titleEnglish: string;
  icon: string;
  prompt: string;
}

export interface StoryContent {
  title: string;
  pages: string[];
}
