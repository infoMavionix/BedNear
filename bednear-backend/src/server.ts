import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

import { z, ZodError } from "zod";
import authRoutes from "./routes/auth.routes";
import listingRoutes from "./routes/listing.routes";
import roomRoutes from "./routes/room.routes";
import bedRoutes from "./routes/bed.routes";
import enquiryRoutes from "./routes/enquiry.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import profileRoutes from "./routes/profile.routes";
import prisma from "./config/prisma";


const app = express();
const PORT = Number(process.env.PORT || 5000);
const SECRET = process.env.JWT_SECRET || "development-only-change-this-secret-123456";
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",") }));
app.use(express.json({ limit: "1mb" }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/beds", bedRoutes);
app.use("/api/v1/enquiries", enquiryRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

type AuthedRequest = Request & { userId?: string };
const wrap = (fn: (req: AuthedRequest, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(fn(req as AuthedRequest, res)).catch(next);
const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  try {
    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
    if (typeof payload.sub !== "string") throw new Error("Invalid token");
    (req as AuthedRequest).userId = payload.sub;
    next();
  } catch { res.status(401).json({ message: "Please log in again." }); }
};

app.get("/health", (_req,res)=>res.json({status:"ok",service:"BedNear API"}));
app.post("/api/v1/auth/register", wrap(async(req,res)=>{
  const v=z.object({name:z.string().trim().min(2),email:z.string().email().transform(s=>s.toLowerCase()),password:z.string().min(8),phone:z.string().optional(),businessName:z.string().optional()}).parse(req.body);
  const exists=await prisma.user.findUnique({where:{email:v.email}});
  if(exists)return res.status(409).json({message:"Email already registered."});
  const user=await prisma.user.create({data:{name:v.name,email:v.email,passwordHash:await bcrypt.hash(v.password,12),phone:v.phone,businessName:v.businessName},select:{id:true,name:true,email:true,phone:true,businessName:true}});
  return res.status(201).json({user,token:jwt.sign({},SECRET,{subject:user.id,expiresIn:"7d"})});
}));
app.post("/api/v1/auth/login", wrap(async(req,res)=>{
  const v=z.object({email:z.string().email().transform(s=>s.toLowerCase()),password:z.string().min(1)}).parse(req.body);
  const user=await prisma.user.findUnique({where:{email:v.email}});
  if(!user||!(await bcrypt.compare(v.password,user.passwordHash)))return res.status(401).json({message:"Email or password is incorrect."});
  const {passwordHash,...safeUser}=user;
  return res.json({user:safeUser,token:jwt.sign({},SECRET,{subject:user.id,expiresIn:"7d"})});
}));
app.get("/api/v1/auth/me",auth,wrap(async(req,res)=>{
  const user=await prisma.user.findUnique({where:{id:req.userId},select:{id:true,name:true,email:true,phone:true,businessName:true}});
  if(!user)return res.status(404).json({message:"User not found."}); return res.json({user});
}));




app.get("/api/v1/profile",auth,wrap(async(req,res)=>{const user=await prisma.user.findUnique({where:{id:req.userId},select:{id:true,name:true,email:true,phone:true,businessName:true,createdAt:true}});if(!user)return res.status(404).json({message:"Profile not found."});return res.json({user});}));
app.patch("/api/v1/profile",auth,wrap(async(req,res)=>{const v=z.object({name:z.string().min(2).optional(),phone:z.string().nullable().optional(),businessName:z.string().nullable().optional()}).parse(req.body);const user=await prisma.user.update({where:{id:req.userId},data:v,select:{id:true,name:true,email:true,phone:true,businessName:true}});return res.json({user});}));
app.patch("/api/v1/profile/password",auth,wrap(async(req,res)=>{const v=z.object({currentPassword:z.string().min(1),newPassword:z.string().min(8)}).parse(req.body);const user=await prisma.user.findUnique({where:{id:req.userId}});if(!user||!(await bcrypt.compare(v.currentPassword,user.passwordHash)))return res.status(400).json({message:"Current password is incorrect."});await prisma.user.update({where:{id:user.id},data:{passwordHash:await bcrypt.hash(v.newPassword,12)}});return res.json({message:"Password updated."});}));

app.get("/api/v1/public/listings",wrap(async(req,res)=>{
 const city=typeof req.query.city==="string"?req.query.city:undefined;const locality=typeof req.query.locality==="string"?req.query.locality:undefined;const search=typeof req.query.search==="string"?req.query.search:undefined;
 const listings=await prisma.listing.findMany({where:{status:"PUBLISHED",...(city?{city:{contains:city,mode:"insensitive"}}:{}),...(locality?{locality:{contains:locality,mode:"insensitive"}}:{}),...(search?{OR:[{name:{contains:search,mode:"insensitive"}},{locality:{contains:search,mode:"insensitive"}}]}:{})},include:{rooms:{include:{beds:{where:{status:"AVAILABLE"}}}}},take:100,orderBy:{createdAt:"desc"}});return res.json({listings});
}));
app.get("/api/v1/public/listings/:id",wrap(async(req,res)=>{const listing=await prisma.listing.findFirst({where:{id:req.params.id,status:"PUBLISHED"},include:{rooms:{include:{beds:{where:{status:"AVAILABLE"}}}}}});if(!listing)return res.status(404).json({message:"PG not found."});return res.json({listing});}));

app.use((_req,res)=>res.status(404).json({message:"API endpoint not found."}));
app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{
 if(error instanceof ZodError)return res.status(400).json({message:"Validation failed.",errors:error.issues.map(i=>({field:i.path.join("."),message:i.message}))});
 if(error instanceof Prisma.PrismaClientKnownRequestError){if(error.code==="P2002")return res.status(409).json({message:"A record with these details already exists."});if(error.code==="P2003")return res.status(400).json({message:"Related record does not exist."});}
 console.error(error);return res.status(500).json({message:"Internal server error."});
});
app.listen(PORT,()=>console.log(`BedNear API running at http://localhost:${PORT}`));
