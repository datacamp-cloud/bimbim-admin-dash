import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getVerifiedAdminSession } from "@/lib/admin-auth"
export const dynamic = "force-dynamic"
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
 const session=await getVerifiedAdminSession(); if(!session)return NextResponse.json({error:"Non autorisé."},{status:401})
 try { const id=Number((await params).id); if(!Number.isInteger(id))return NextResponse.json({error:"Identifiant invalide."},{status:400})
  const o=await prisma.commande.findUnique({where:{id},include:{client:{select:{id:true,nom:true,telephone:true,email:true}},livraisons:{orderBy:{date_creation:"asc"},select:{id:true,statut:true,adresse_ramassage:true,adresse_livraison:true,prix:true,date_creation:true,segments:{orderBy:{ordre_segment:"asc"},take:1,select:{livreur_source:{select:{nom:true,prenom:true}},livreur_destinataire:{select:{nom:true,prenom:true}}}}}}}})
  if(!o)return NextResponse.json({error:"Commande introuvable."},{status:404})
  return NextResponse.json({id:o.id,status:o.statut,type:o.type_commande,createdAt:o.date_creation.toISOString(),client:o.client,from:o.livraisons[0]?.adresse_ramassage??o.adresse_enlevement??"—",to:o.livraisons[0]?.adresse_livraison??o.adresse_livraison??"—",totalDeliveries:o.total_livraisons,totalAmount:Number(o.total_montant),deliveries:o.livraisons.map(d=>{const s=d.segments[0];const c=s?.livreur_destinataire??s?.livreur_source;return{id:d.id,status:d.statut,from:d.adresse_ramassage,to:d.adresse_livraison,price:Number(d.prix),courier:c?c.prenom+" "+c.nom:null}})})
 }catch(error){console.error("GET /api/admin/orders/[id]",error);return NextResponse.json({error:"Impossible de charger la commande."},{status:500})}
}