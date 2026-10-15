import { ApiError } from './trial-store.mjs';
import { STUDIO_STYLES } from './legacy-types.mjs';
export function validateLegacyRequest(body) {
  if (!body.settings) return null;
  const s = body.settings;
  const valid = s && typeof s === 'object' && STUDIO_STYLES.some(x => x.id === s.backgroundStyle)
    && ['golden-hour','studio-soft','dramatic-noir','window-light'].includes(s.lightingType)
    && ['table-level','flatlay','macro-focus'].includes(s.angle)
    && ['standard','hd','4k'].includes(s.quality)
    && ['1:1','3:4','4:3','9:16','16:9','3:2','2:3','1:4','4:1','1:8','8:1'].includes(s.aspectRatio)
    && ['model','mannequin','hanger_standing','hanger_hanging','flat','table'].includes(s.presentationType)
    && ['pro','flash'].includes(s.modelPreference)
    && typeof s.refinementText === 'string' && s.refinementText.length <= 2000;
  if (!valid) throw new ApiError(400,'INVALID_SETTINGS','Sprawdź ustawienia studia.');
  const settings = Object.fromEntries(['backgroundStyle','lightingType','angle','quality','aspectRatio','presentationType','refinementText','modelPreference'].map(key => [key,s[key]]));
  if (s.brandProfile != null) {
    const p = s.brandProfile;
    if (!p || typeof p !== 'object' || Array.isArray(p)
      || !['name','description','alwaysRules','neverRules'].every(k => typeof p[k] === 'string' && p[k].length <= (k === 'name' ? 80 : 800))
      || !Array.isArray(p.styleTags) || p.styleTags.length > 12 || !p.styleTags.every(tag => typeof tag === 'string' && tag.length <= 40)) {
      throw new ApiError(400,'INVALID_SETTINGS','Sprawdź opis i reguły profilu marki.');
    }
    settings.brandProfile = { name:p.name, description:p.description, styleTags:[...p.styleTags], alwaysRules:p.alwaysRules, neverRules:p.neverRules };
  }
  const productName = body.productName;
  if (productName !== undefined && (typeof productName !== 'string' || productName.length > 200)) throw new ApiError(400,'INVALID_SETTINGS','Nieprawidłowa nazwa produktu.');
  return { settings, productName, isRefresh: body.isRefresh === true, forceFlash: body.forceFlash === true };
}
