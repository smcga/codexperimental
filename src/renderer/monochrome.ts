export const MONOCHROME_UNTIL_SECONDS = 54.1;

export const isMonochromeTime = (time: number): boolean => time < MONOCHROME_UNTIL_SECONDS;
