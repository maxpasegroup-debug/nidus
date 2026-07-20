import type { TopRankAuthLoginDto, TopRankAuthRegisterDto, TopRankUser } from "@/types/toprank";

export async function loginTopRankUser(_payload: TopRankAuthLoginDto): Promise<{ user: TopRankUser | null }> {
  return { user: null };
}

export async function registerTopRankUser(_payload: TopRankAuthRegisterDto): Promise<{ user: TopRankUser | null }> {
  return { user: null };
}

export async function requestTopRankPasswordReset(_email: string): Promise<{ message: string }> {
  return { message: "Password reset is not active in TopRank RC1." };
}
