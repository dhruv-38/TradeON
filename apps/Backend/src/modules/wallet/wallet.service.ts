import { DepositInput, ReserveInput, WithdrawInput } from "@repo/schemas-types";
import {
  depositFunds,
  findWalletByUserId,
  getLedgerEntries,
  releaseFunds,
  reserveFunds,
  withdrawFunds,
} from "./wallet.repository.js";

export const getWalletService = async (userId: number) => {
  return findWalletByUserId(userId);
};

export const depositFundsService = async(userId:number,data:DepositInput)=>{
    const {amount} = data;
    const wallet = await depositFunds(userId,amount);
    return {wallet};

};

export const withdrawFundsService = async(userId:number,data:WithdrawInput)=>{
    const {amount} = data;
    const wallet = await withdrawFunds(userId,amount);
    
    return {wallet};

};
export const reserveFundsService = async(userId:number, data:ReserveInput)=>{
    const {amount}=data;
    const wallet = await reserveFunds(userId,amount);
    return {wallet};
};

export const releaseFundsService = async(userId:number, data:ReserveInput)=>{
    const {amount}=data;
    const wallet = await releaseFunds(userId,amount);
    return {wallet};
};

export const getLedgerService = async (userId: number) => {
    return getLedgerEntries(userId);
  };
