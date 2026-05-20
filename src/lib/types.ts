export type ImageFeedback = {
  sampleId: string;
  label: string;
  prompt: string;
  imageUrl: string;
  like: boolean;
  isDemo?: boolean;
};

export type Submission = {
  id: string;
  createdAt: string;
  birthYear: number;
  cityScale: string;
  geoRegion: string;
  geoRegionCities: string;
  dreamcoreFamiliarity: string;
  generation: string;
  fillBlank: {
    place: string;
    space: string;
    object: string;
    light: string;
    sense: string;
    sentence: string;
  };
  firstPlace: string;
  millenniumItems: string[];
  millenniumCustom: string;
  sensory: {
    colors: string;
    light: string;
    sounds: string;
  };
  dreamcoreKeywords: string;
  dreamDescription: string;
  imageFeedback: ImageFeedback[];
  feedbackNote: string;
};

export type StatsResult = {
  totalSubmissions: number;
  generationBreakdown: Record<string, number>;
  topKeywords: { word: string; count: number }[];
  topMillenniumItems: { word: string; count: number }[];
  feedbackSummary: {
    sampleId: string;
    label: string;
    likeCount: number;
    dislikeCount: number;
    likeRate: number;
  }[];
};
