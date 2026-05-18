import { DepositInput } from "@repo/schemas-types";
import { depositFunds } from "./wallet.repository.js";

export const depositFundsService = async(userId:number,data:DepositInput)=>{
    const {amount} = data;
    const wallet = await depositFunds(userId,amount);
    return {wallet};

};