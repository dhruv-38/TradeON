import { prisma } from "@repo/db"


export const userExist = async (email:string) => {
     return await prisma.user.findUnique({
        where: {
            email
        }
    })
}

export const createUser = async(name:string, email:string, password:string)=>{
    return await prisma.user.create({
            data: {
                name,
                email,
                password
            }
        })
}