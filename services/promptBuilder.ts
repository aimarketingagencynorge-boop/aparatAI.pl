
import { BrandVersion, BrandAsset } from '../types';

export function buildPrompt(
  productDescription: string,
  brandVersion: BrandVersion,
  settings: any
): string {
  const defaultBg = brandVersion.assets.find(a => a.type === 'background' && a.isDefault)?.url;
  
  let prompt = `PROFESSIONAL PRODUCT PHOTOGRAPHY: ${productDescription}. `;
  
  // Style Tags
  if (brandVersion.styleTags.length > 0) {
    prompt += `Style: ${brandVersion.styleTags.join(', ')}. `;
  }

  // Camera & Lighting
  prompt += `Camera Angle: ${brandVersion.cameraAngle}. `;
  prompt += `Lighting: ${brandVersion.lighting} lighting. `;
  prompt += `Shadows: ${brandVersion.shadowMode} shadows. `;
  
  // Hard Rules
  if (brandVersion.alwaysRules) {
    prompt += `ALWAYS follow these rules: ${brandVersion.alwaysRules}. `;
  }
  
  if (brandVersion.neverRules) {
    prompt += `NEVER include: ${brandVersion.neverRules}. `;
  }

  if (brandVersion.noText) {
    prompt += `IMPORTANT: No text, no typography, no letters, no captions, no writing on image. `;
  }

  // Quality & Retouch
  prompt += `Retouch quality: ${brandVersion.retouchLevel}/100. Ultra-realistic, 8k resolution. `;

  return prompt;
}
