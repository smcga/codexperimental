import { TextSpan } from "../../config/loadConfig";

export type LayoutSpan = {
  text: string;
  color: string;
  size: number;
  weight: string;
  font: string;
  width: number;
  x: number;
};

export type LayoutResult = {
  totalWidth: number;
  startX: number;
  spans: LayoutSpan[];
};

export type MeasureText = (text: string, span: TextSpan) => number;

export function layoutSpans(
  spans: TextSpan[],
  align: "left" | "center" | "right",
  measureText: MeasureText
): LayoutResult {
  const widths = spans.map((span) => measureText(span.text, span));
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  let startX = 0;
  if (align === "center") {
    startX = -totalWidth / 2;
  } else if (align === "right") {
    startX = -totalWidth;
  }

  let cursor = startX;
  const layoutSpans = spans.map((span, index) => {
    const width = widths[index];
    const layoutSpan: LayoutSpan = {
      ...span,
      width,
      x: cursor
    };
    cursor += width;
    return layoutSpan;
  });

  return {
    totalWidth,
    startX,
    spans: layoutSpans
  };
}
