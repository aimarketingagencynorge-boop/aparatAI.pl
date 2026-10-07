import { auth } from '../firebaseAuth';
import { FoodAnalysis, MenuDish, StudioItem, StudioSettings, SocialCopyResults, SocialStyle, AspectRatio } from '../types';
const apiOrigin = ['localhost','127.0.0.1'].includes(location.hostname) ? '' : 'https://m-j-aparat-ai-profesjonalna-fotografia-produktowa-301238981720.us-west1.run.app';
export async function studioApi(path: string, body: unknown) {
 const user = auth.currentUser;
 const response = await fetch(apiOrigin+path,{method:'POST',headers:{'Content-Type':'application/json',...(user ? {Authorization:`Bearer ${await user.getIdToken()}`} : {})},body:JSON.stringify(body)});
 const data = await response.json();
 if(!response.ok) throw new Error(`${data.error?.message || 'Nie udało się dokończyć operacji.'}${data.error?.requestId ? ` Numer zgłoszenia: ${data.error.requestId}` : ''}`);
 window.dispatchEvent(new Event('aparatai-account-refresh'));
 return data;
}
export const analyzeFoodImage = async (image: string): Promise<FoodAnalysis> => {
 if(!auth.currentUser) return null as any;
 return (await studioApi('/api/studio/analyze',{image:image.includes(',') ? image : 'data:image/jpeg;base64,'+image})).analysis;
};
export const generateStudioBackground = async (item: StudioItem, settings: StudioSettings, forceFlash=false): Promise<string> =>
 (await studioApi(auth.currentUser ? '/api/studio' : '/api/trial',{image:item.originalImage,settings,productName:item.analysis?.productName,isRefresh:!!item.transformedImage,forceFlash})).image;
export const analyzeErrorWithAI = async (_error: string, _context: string): Promise<string> => 'Zachowaj numer zgłoszenia. W przypadku przeciążenia silnika możesz wybrać tryb Flash i uruchomić nowe ujęcie.';
export const generateStudioVideo = async (_item: StudioItem, _settings: StudioSettings): Promise<string> => { throw new Error('Animacje są jeszcze w przygotowaniu.'); };
const unavailable = async (): Promise<any> => { throw new Error('Ten moduł nie został jeszcze podłączony do publicznej wersji.'); };
export const generateDishImageFromMenu = async (_dish: MenuDish,_settings:StudioSettings,_refinement:string,_force=false,_refresh=false):Promise<string> => unavailable();
export const generateSocialAsset = async (_item:StudioItem,_style:SocialStyle,_prompt:string,_ratio:AspectRatio):Promise<string> => unavailable();
export const generateSocialCopy = async (_name:string,_characteristics:string,_style:string):Promise<SocialCopyResults> => unavailable();
export const parseMenuText = async (_text:string):Promise<MenuDish[]> => unavailable();
export const extractMenuFromImage = async (_image:string):Promise<string> => unavailable();
export const runDiagnosticAudit = async (_report:any):Promise<string> => unavailable();
export const runAutoFixEngine = async (_error:string,_context:string):Promise<{action:string;explanation:string}> => unavailable();
