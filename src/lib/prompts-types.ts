export type GenerateContext = {
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
  sensory: { colors: string; light: string; sounds: string };
  dreamcoreKeywords: string;
  dreamDescription: string;
  birthYear?: number;
  cityScale?: string;
  geoRegion?: string;
  geoRegionCities?: string;
  dreamcoreFamiliarity?: string;
};
