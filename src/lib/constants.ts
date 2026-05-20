export const MILLENNIUM_ITEMS = [
  "老式 CRT 电视",
  "VHS 录像带",
  "复读机",
  "小灵通",
  "QQ 秀",
  "网吧",
  "磁带",
  "红白机",
  "MP3",
  "大头贴",
  "校门口小卖部",
  "老式居民楼走廊",
  "绿皮火车",
  "dvd 影碟",
  "复古健身录像带",
];

export const BIRTH_YEARS = Array.from({ length: 21 }, (_, i) => 1990 + i);

export const CITY_SCALES = [
  { id: "tier1", label: "一线城市（北上广深）" },
  { id: "tier23", label: "二三线城市" },
  { id: "county", label: "县城或小城镇" },
  { id: "rural", label: "农村" },
] as const;

export const GEO_REGIONS = [
  {
    id: "华北",
    cities: "北京、天津、河北、山西、内蒙古",
  },
  {
    id: "东北",
    cities: "辽宁、吉林、黑龙江",
  },
  {
    id: "华东",
    cities: "上海、江苏、浙江、安徽、福建、江西、山东",
  },
  {
    id: "华中",
    cities: "河南、湖北、湖南",
  },
  {
    id: "华南",
    cities: "广东、广西、海南",
  },
  {
    id: "西南",
    cities: "重庆、四川、贵州、云南、西藏",
  },
  {
    id: "西北",
    cities: "陕西、甘肃、青海、宁夏、新疆",
  },
] as const;

export const DREAMCORE_FAMILIARITY = [
  { id: "expert", label: "非常了解，能准确描述梦核画面" },
  { id: "familiar", label: "有所了解，见过类似图片或视频" },
  { id: "heard", label: "听说过，但不太确定是什么" },
  { id: "new", label: "完全不了解，想试试看" },
] as const;

export function getGeneration(birthYear: number): string {
  if (birthYear >= 1997 && birthYear <= 2010) return "Z 世代";
  if (birthYear >= 1990 && birthYear <= 1996) return "千禧一代";
  return "其他";
}

export function getCityScaleLabel(id: string): string {
  return CITY_SCALES.find((c) => c.id === id)?.label ?? id;
}

export function getGeoRegionCities(id: string): string {
  return GEO_REGIONS.find((r) => r.id === id)?.cities ?? "";
}
