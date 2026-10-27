import { adminAuth } from '../../cms';
export const dynamic='force-dynamic';
export async function POST(request:Request){
  const result=await adminAuth.logout(request);
  return new Response(null,{status:result.status,headers:{...(result.cookie?{'Set-Cookie':result.cookie,Location:'/admin/login'}:{}),'Cache-Control':'no-store'}});
}
