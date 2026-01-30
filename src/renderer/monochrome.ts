export const MONOCHROME_UNTIL_SECONDS = 54.1;

export const isMonochromeTime = (time: number): boolean => time < MONOCHROME_UNTIL_SECONDS;

export const resolveMonochrome = (time: number, override?: boolean | null): boolean => {
  if (override === undefined || override === null) {
    return isMonochromeTime(time);
  }
  return override;
};
