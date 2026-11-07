export const preferenceApi = {
  load: () =>
    JSON.parse(
      localStorage.getItem("vitrix.preferences") ??
        '{"language":"uz","dark":false}',
    ) as {
      language: "uz" | "ru" | "en";
      dark: boolean;
    },
  save: (v: { language: string; dark: boolean }) =>
    localStorage.setItem("vitrix.preferences", JSON.stringify(v)),
};
