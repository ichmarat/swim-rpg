// Светлая тема 100JUZ — по референсам дизайна: чистый светлый фон,
// синий как основной акцент, бирюза для активных состояний, оранжевый
// зарезервирован под бренд Strava.

export const COLORS = {
  // Поверхности
  page: '#EEF2F8',
  card: '#FFFFFF',
  cardMuted: '#F5F8FC',
  heroFrom: '#0E2A52',
  heroTo: '#1E5FA8',

  // Основные акценты
  blue: '#2F63E0',
  blueDark: '#16233D',
  teal: '#17C3A2',
  strava: '#FC4C02',
  danger: '#E2574C',

  // Медали
  gold: '#F2B400',
  silver: '#AEB7C4',
  bronze: '#D9793B',

  // Текст
  textPrimary: '#16233D',
  textSecondary: '#7C8AA0',
  textMuted: '#A6B0C1',
  textOnDark: '#EAF1FF',
  textOnDarkMuted: '#9DB8E0',

  // Границы
  border: '#E7ECF3',
  borderStrong: '#D6DEEA',
};

export const FONTS = {
  display: "'Poppins', sans-serif",
  body: "'Inter', sans-serif",
};

// Цвет по стадии — используется для подсветки узлов пути и акцентов
export const STAGE_COLORS = [
  '#2F63E0', // novice
  '#2F63E0', // swimmer
  '#2F63E0', // athlete
  '#17C3A2', // champion
  '#17C3A2', // legend
  '#F2B400', // neptune — золото
];
