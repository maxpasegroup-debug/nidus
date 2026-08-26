import { env } from "../../../config/env.js";
import { fetchProviderJson, imageSource } from "./provider-http.js";

export type MathpixLine = {
  text?: string;
  type?: string;
  confidence?: number;
  cnt?: Array<[number, number]>;
};

export type MathpixResponse = Record<string, unknown> & {
  text?: string;
  latex_styled?: string;
  confidence?: number;
  confidence_rate?: number;
  line_data?: MathpixLine[];
  image_width?: number;
  image_height?: number;
  version?: string;
};

export function mathpixConfigured() {
  return env.MATHPIX_ENABLED && Boolean(env.MATHPIX_APP_ID && env.MATHPIX_APP_KEY);
}

export async function callMathpix(input: { imageUrl?: string | null; imageBuffer?: Buffer }) {
  const src = await imageSource(input);
  const { payload } = await fetchProviderJson("formula.mathpix", "https://api.mathpix.com/v3/text", {
    method: "POST",
    headers: {
      app_id: env.MATHPIX_APP_ID,
      app_key: env.MATHPIX_APP_KEY,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      src,
      formats: ["text", "latex_styled", "mathml", "data"],
      data_options: { include_latex: true, include_mathml: true, include_asciimath: true },
      include_line_data: true,
      include_word_data: true,
      enable_document_layout: true,
      rm_spaces: false
    })
  });
  return payload as MathpixResponse;
}
