import type { Business } from "../../types";
export const appearanceDefaults = {
  colorMode: "light",
  backgroundColor: "#fffcf8",
  surfaceColor: "#ffffff",
  textColor: "#272724",
  surfaceTextColor: "#272724",
  mutedColor: "#867c74",
  heroStyle: "split",
  heroTitle: "",
  contentWidth: "full",
  productColumns: 3,
  mobileColumns: 2,
  cornerStyle: "soft",
  density: "comfortable",
  showHero: true,
  showSearch: true,
  showCategories: true,
  showPrices: true,
  showContacts: true,
  showLocation: true,
} as const;
export const appearanceOf = (b: Business) => ({ ...appearanceDefaults, ...b });
export const palettes: {
  name: string;
  colors: Partial<Business>;
}[] = [
  {
    name: "Yorug‘",
    colors: {
      colorMode: "light",
      backgroundColor: "#f5f7fb",
      surfaceColor: "#ffffff",
      textColor: "#162033",
      surfaceTextColor: "#162033",
      mutedColor: "#617087",
      primary: "#315bea",
      secondary: "#e6edff",
    },
  },
  {
    name: "Tungi",
    colors: {
      colorMode: "dark",
      backgroundColor: "#0d1424",
      surfaceColor: "#182237",
      textColor: "#f2f5fc",
      surfaceTextColor: "#f2f5fc",
      mutedColor: "#afbdd5",
      primary: "#6d8cff",
      secondary: "#1c2b49",
    },
  },
  {
    name: "Oq va qora",
    colors: {
      colorMode: "contrast",
      backgroundColor: "#ffffff",
      surfaceColor: "#f2f2f2",
      textColor: "#111111",
      surfaceTextColor: "#111111",
      mutedColor: "#5c5c5c",
      primary: "#111111",
      secondary: "#eeeeee",
    },
  },
  {
    name: "Zumrad",
    colors: {
      colorMode: "dark",
      backgroundColor: "#0c211d",
      surfaceColor: "#14372e",
      textColor: "#edfff6",
      surfaceTextColor: "#edfff6",
      mutedColor: "#acd5c4",
      primary: "#1b9870",
      secondary: "#17483b",
    },
  },
  {
    name: "Qum va oltin",
    colors: {
      colorMode: "light",
      backgroundColor: "#fffaf2",
      surfaceColor: "#ffffff",
      textColor: "#36281d",
      surfaceTextColor: "#36281d",
      mutedColor: "#876d58",
      primary: "#9c642e",
      secondary: "#f1e6d5",
    },
  },
  {
    name: "Binafsha",
    colors: {
      colorMode: "light",
      backgroundColor: "#fbf7ff",
      surfaceColor: "#ffffff",
      textColor: "#2f2044",
      surfaceTextColor: "#2f2044",
      mutedColor: "#7b698f",
      primary: "#8146c4",
      secondary: "#efe4fc",
    },
  },
];
export const businessFonts: Record<string, string> = {
  sans: "Inter, Arial, sans-serif",
  serif: "Georgia, serif",
  rounded: '"Trebuchet MS", sans-serif',
  system: "system-ui, sans-serif",
};
export const factoryDesign = {
  ...appearanceDefaults,
  theme: "modern",
  primary: "#315bea",
  secondary: "#f1f4ff",
  font: "sans",
  layout: "grid",
  card: "rounded",
  header: "center",
  buttons: "solid",
} as const;
export const resetDesign = (business: Business): Business => ({
  ...business,
  ...factoryDesign,
});
